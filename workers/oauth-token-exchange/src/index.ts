import type { Env } from './env'

const TOKEN_PATH = '/api/oauth/token'
const MAX_BODY_BYTES = 4096
const BODY_TIMEOUT_MS = 5000
const UPSTREAM_TIMEOUT_MS = 10000
const RETRY_AFTER_SECONDS = 60
const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  Vary: 'Origin',
}

class RequestError extends Error {
  constructor(public status: number, public errorCode: string, message: string) {
    super(message)
  }
}

function jsonResponse(data: object, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json', ...headers },
  })
}

function errorResponse(error: RequestError, headers: Record<string, string>): Response {
  return jsonResponse({ error: error.errorCode, error_description: error.message }, error.status, headers)
}

function getAllowedRedirects(env: Env): URL[] {
  if (!env.ALLOWED_REDIRECT_URIS) {
    throw new Error('Missing redirect configuration')
  }
  return env.ALLOWED_REDIRECT_URIS.split(',').map(value => {
    const url = new URL(value.trim())
    const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback)) ||
        url.hostname.includes('*') || url.username || url.password ||
        value.includes('?') || value.includes('#')) {
      throw new Error('Invalid redirect configuration')
    }
    return url
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

async function readJsonBody(request: Request): Promise<unknown> {
  if (request.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    throw new RequestError(415, 'invalid_request', 'Content-Type must be application/json')
  }
  const contentLength = request.headers.get('Content-Length')
  if (contentLength !== null && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_BODY_BYTES)) {
    throw new RequestError(413, 'invalid_request', 'Request body is too large')
  }
  if (!request.body) {
    throw new RequestError(400, 'invalid_request', 'JSON body is required')
  }

  // Content-Lengthのないストリームも、実際の受信バイト数で制限する
  const reader = request.body.getReader()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new RequestError(408, 'invalid_request', 'Request body timed out'))
    }, BODY_TIMEOUT_MS)
  })
  try {
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline])
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        throw new RequestError(413, 'invalid_request', 'Request body is too large')
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    try {
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown
    } catch {
      throw new RequestError(400, 'invalid_request', 'Invalid JSON body')
    }
  } finally {
    clearTimeout(timeout)
    void reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

async function exchangeToken(request: Request, env: Env, allowedRedirects: URL[]): Promise<object> {
  const body = await readJsonBody(request)
  if (!isRecord(body) ||
      typeof body.code !== 'string' || !/^[A-Za-z0-9_-]{1,512}$/.test(body.code) ||
      typeof body.redirect_uri !== 'string' || body.redirect_uri.length > 2048 ||
      typeof body.code_verifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(body.code_verifier)) {
    throw new RequestError(400, 'invalid_request', 'Valid code, redirect_uri and code_verifier are required')
  }
  const redirect = allowedRedirects.find(url => url.href === body.redirect_uri)
  if (!redirect || redirect.origin !== request.headers.get('Origin')) {
    throw new RequestError(400, 'invalid_request', 'redirect_uri is not allowed for this origin')
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: body.code,
      redirect_uri: redirect.href,
      code_verifier: body.code_verifier,
    }),
  })

  if (!response.ok) {
    throw new RequestError(502, 'token_exchange_failed', 'GitHub token exchange failed')
  }
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new RequestError(502, 'invalid_response', 'Unexpected GitHub token response')
  }
  // GitHubはOAuthエラーをHTTP 200で返す場合がある
  if (isRecord(data) && typeof data.error === 'string') {
    throw new RequestError(400, 'authorization_failed', 'GitHub authorization failed. Please sign in again.')
  }
  if (!isRecord(data) ||
      typeof data.access_token !== 'string' || !data.access_token || data.access_token.length > 4096 ||
      data.token_type !== 'bearer' || data.scope !== 'gist') {
    throw new RequestError(502, 'invalid_response', 'Unexpected GitHub token response')
  }
  // 不要なフィールドやrefresh tokenはブラウザへ返さない
  return { access_token: data.access_token, scope: data.scope, token_type: data.token_type }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/' && request.method === 'GET') {
      return jsonResponse({ status: 'ok', message: 'KLS Token Exchange Worker' })
    }
    if (url.pathname !== TOKEN_PATH) {
      return jsonResponse({ error: 'not_found' }, 404)
    }
    if (request.method !== 'POST' && request.method !== 'OPTIONS') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, { Allow: 'POST, OPTIONS' })
    }

    let corsHeaders: Record<string, string> = {}
    try {
      const allowedRedirects = getAllowedRedirects(env)
      const origin = request.headers.get('Origin')
      if (!origin || !allowedRedirects.some(redirect => redirect.origin === origin)) {
        throw new RequestError(403, 'forbidden', 'Origin is not allowed')
      }
      corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
      if (request.method === 'OPTIONS') {
        const method = request.headers.get('Access-Control-Request-Method')
        const headers = request.headers.get('Access-Control-Request-Headers')
        if (method !== 'POST' || (headers && headers.split(',').some(header => header.trim().toLowerCase() !== 'content-type'))) {
          throw new RequestError(403, 'forbidden', 'Preflight request is not allowed')
        }
        return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS, ...corsHeaders } })
      }

      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.OAUTH_RATE_LIMITER) {
        throw new Error('Missing server configuration')
      }
      // Originは偽装可能なため、CORSとは別にCloudflareが付与するIPで利用量を制限する
      const ip = request.headers.get('CF-Connecting-IP')
      if (!ip) {
        throw new RequestError(403, 'forbidden', 'Client address is unavailable')
      }
      const { success } = await env.OAUTH_RATE_LIMITER.limit({ key: `kls:oauth:token:${ip}` })
      if (!success) {
        return errorResponse(
          new RequestError(429, 'rate_limited', 'Too many attempts. Please try again later.'),
          { ...corsHeaders, 'Retry-After': String(RETRY_AFTER_SECONDS) },
        )
      }
      return jsonResponse(await exchangeToken(request, env, allowedRedirects), 200, corsHeaders)
    } catch (error) {
      if (error instanceof RequestError) {
        return errorResponse(error, corsHeaders)
      }
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
        return errorResponse(new RequestError(504, 'upstream_timeout', 'GitHub token exchange timed out'), corsHeaders)
      }
      // 例外・資格情報・GitHubの生の応答を外部やログに出さない
      return errorResponse(new RequestError(500, 'server_error', 'Token exchange is unavailable'), corsHeaders)
    }
  },
}
