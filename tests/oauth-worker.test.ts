import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../workers/oauth-token-exchange/src/env'
import worker from '../workers/oauth-token-exchange/src/index'

const ORIGIN = 'https://studio.example'
const REDIRECT_URI = `${ORIGIN}/app/`
const TOKEN_URL = 'https://worker.example/api/oauth/token'
const VALID_BODY = {
  code: 'test-authorization-code',
  redirect_uri: REDIRECT_URI,
  code_verifier: 'v'.repeat(43),
}
const TOKEN = { access_token: 'test-only-token', token_type: 'bearer', scope: 'gist' }

function post(body: unknown = VALID_BODY, extraHeaders: Record<string, string> = {}): Request {
  return new Request(TOKEN_URL, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.0.2.1',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  })
}

function streamingPost(body: ReadableStream<Uint8Array>): Request {
  const init: RequestInit & { duplex: 'half' } = {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
    body,
    duplex: 'half',
  }
  return new Request(TOKEN_URL, init)
}

describe('OAuth token Worker', () => {
  let env: Env
  const fetchMock = vi.fn<typeof fetch>()
  const limitMock = vi.fn<Env['OAUTH_RATE_LIMITER']['limit']>()

  beforeEach(() => {
    fetchMock.mockReset().mockImplementation(async () => Response.json(TOKEN))
    limitMock.mockReset().mockResolvedValue({ success: true })
    vi.stubGlobal('fetch', fetchMock)
    env = {
      GITHUB_CLIENT_ID: 'test-client',
      GITHUB_CLIENT_SECRET: 'test-secret-never-return',
      ALLOWED_REDIRECT_URIS: `${REDIRECT_URI},https://other.example/app/,http://localhost:5173/app/`,
      OAUTH_RATE_LIMITER: { limit: limitMock },
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('許可した接続元だけにトークンを返し、PKCEをGitHubへ渡す', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ...TOKEN, refresh_token: 'must-not-return', extra: 'ignored' }))
    const response = await worker.fetch(post(), env)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(TOKEN)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull()
    expect(limitMock).toHaveBeenCalledWith({ key: 'kls:oauth:token:192.0.2.1' })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://github.com/login/oauth/access_token')
    expect(init?.redirect).toBe('manual')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(Object.fromEntries(init?.body as URLSearchParams)).toEqual({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      ...VALID_BODY,
    })
  })

  it.each(['https://untrusted.example', `${ORIGIN}.untrusted.example`, 'null', ''])('不正なOriginを拒否する: %s', async origin => {
    const response = await worker.fetch(post(VALID_BODY, { Origin: origin }), env)
    expect(response.status).toBe(403)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Originのない直接呼び出しを拒否する', async () => {
    const request = post()
    request.headers.delete('Origin')
    expect((await worker.fetch(request, env)).status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    'https://untrusted.example/app/',
    `${ORIGIN}/app/subdirectory/`,
    `${REDIRECT_URI}?extra=1`,
    `${REDIRECT_URI}#fragment`,
    'https://other.example/app/',
  ])('redirect URIは接続元と対になる完全一致だけ許可する: %s', async redirect_uri => {
    expect((await worker.fetch(post({ ...VALID_BODY, redirect_uri }), env)).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    null, [], {}, 'text',
    { ...VALID_BODY, code: 1 },
    { ...VALID_BODY, code: '' },
    { ...VALID_BODY, code: 'x'.repeat(513) },
    { ...VALID_BODY, redirect_uri: {} },
    { ...VALID_BODY, code_verifier: undefined },
    { ...VALID_BODY, code_verifier: 123 },
    { ...VALID_BODY, code_verifier: 'x'.repeat(42) },
    { ...VALID_BODY, code_verifier: 'x'.repeat(129) },
    { ...VALID_BODY, code_verifier: '/'.repeat(43) },
  ])('不正な入力やPKCEなしの旧クライアントを拒否する: %j', async body => {
    expect((await worker.fetch(post(body), env)).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('許可した開発用のloopback URLで交換できる', async () => {
    const response = await worker.fetch(post(
      { ...VALID_BODY, redirect_uri: 'http://localhost:5173/app/' },
      { Origin: 'http://localhost:5173' },
    ), env)
    expect(response.status).toBe(200)
  })

  it('JSON以外のContent-Typeを拒否する', async () => {
    expect((await worker.fetch(post(VALID_BODY, { 'Content-Type': 'text/plain' }), env)).status).toBe(415)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('壊れたJSONは内部エラーではなく400にする', async () => {
    const request = new Request(post(), { body: '{' })
    expect((await worker.fetch(request, env)).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Content-Lengthが大きすぎる場合は読み込まず拒否する', async () => {
    expect((await worker.fetch(post(VALID_BODY, { 'Content-Length': '4097' }), env)).status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Content-Lengthなしでも受信サイズの上限を超えたら拒否する', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(2048))
        controller.enqueue(new Uint8Array(2049))
        controller.close()
      },
    })
    expect((await worker.fetch(streamingPost(stream), env)).status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('本文が届かない場合はタイムアウトする', async () => {
    vi.useFakeTimers()
    const responsePromise = worker.fetch(streamingPost(new ReadableStream<Uint8Array>()), env)
    await vi.advanceTimersByTimeAsync(5001)
    expect((await responsePromise).status).toBe(408)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('回数制限時はGitHubを呼ばず429とRetry-Afterを返す', async () => {
    limitMock.mockResolvedValueOnce({ success: false })
    const response = await worker.fetch(post(), env)
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('CloudflareのクライアントIPがなければ拒否する', async () => {
    const request = post()
    request.headers.delete('CF-Connecting-IP')
    expect((await worker.fetch(request, env)).status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    { ALLOWED_REDIRECT_URIS: '' },
    { ALLOWED_REDIRECT_URIS: '*' },
    { ALLOWED_REDIRECT_URIS: 'https://*.example/app/' },
    { ALLOWED_REDIRECT_URIS: 'http://public.example/app/' },
    { ALLOWED_REDIRECT_URIS: `${REDIRECT_URI}?query=1` },
    { GITHUB_CLIENT_SECRET: '' },
    { OAUTH_RATE_LIMITER: undefined },
  ])('設定不足・不正時は許可しない: %j', async override => {
    const response = await worker.fetch(post(), { ...env, ...override } as Env)
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('test-secret')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('レート制限の障害時にも迂回を許さず、例外内容を漏らさない', async () => {
    limitMock.mockRejectedValueOnce(new Error('private-internal-details'))
    const response = await worker.fetch(post(), env)
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('private-internal-details')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('GitHubのHTTP 200のOAuthエラーを成功として扱わない', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'bad_verification_code', error_description: 'private-details' }))
    const response = await worker.fetch(post(), env)
    expect(response.status).toBe(400)
    expect(await response.text()).not.toContain('private-details')
  })

  it.each([
    {}, null, [],
    { ...TOKEN, access_token: '' },
    { ...TOKEN, token_type: 'not-bearer' },
    { ...TOKEN, scope: 'repo,gist' },
    { ...TOKEN, scope: '' },
  ])('不正または過剰権限のGitHub応答を転送しない: %j', async data => {
    fetchMock.mockResolvedValueOnce(Response.json(data))
    const response = await worker.fetch(post(), env)
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain(TOKEN.access_token)
  })

  it('GitHubのHTTPエラーの本文を転送しない', async () => {
    fetchMock.mockResolvedValueOnce(new Response('upstream-private-details', { status: 503 }))
    const response = await worker.fetch(post(), env)
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('upstream-private-details')
  })

  it.each([301, 302, 303, 307, 308])('GitHubのHTTP %iを追従せず拒否する', async status => {
    fetchMock.mockResolvedValueOnce(new Response(null, {
      status,
      headers: { Location: 'https://untrusted.example/collect' },
    }))
    const response = await worker.fetch(post(), env)
    expect(response.status).toBe(502)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[1]?.redirect).toBe('manual')
    expect(response.headers.get('Location')).toBeNull()
  })

  it('GitHubの壊れたJSONを502にする', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{', { headers: { 'Content-Type': 'application/json' } }))
    expect((await worker.fetch(post(), env)).status).toBe(502)
  })

  it('GitHub通信のタイムアウトは504にする', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('private-details', 'TimeoutError'))
    const response = await worker.fetch(post(), env)
    expect(response.status).toBe(504)
    expect(await response.text()).not.toContain('private-details')
  })

  it('正常なpreflightだけ許可し、GitHubとレート制限を呼ばない', async () => {
    const request = new Request(TOKEN_URL, {
      method: 'OPTIONS',
      headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    })
    const response = await worker.fetch(request, env)
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(limitMock).not.toHaveBeenCalled()
  })

  it('余分なヘッダーのpreflightを拒否する', async () => {
    const request = new Request(TOKEN_URL, {
      method: 'OPTIONS',
      headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization' },
    })
    expect((await worker.fetch(request, env)).status).toBe(403)
  })

  it('未知のパスや未対応のメソッドを拒否する', async () => {
    expect((await worker.fetch(new Request('https://worker.example/unknown', { method: 'OPTIONS' }), env)).status).toBe(404)
    expect((await worker.fetch(new Request(TOKEN_URL), env)).status).toBe(405)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
