import { readFileSync } from 'node:fs'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import ts from 'typescript'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const ORIGIN = 'https://studio.example'
const REDIRECT_URI = `${ORIGIN}/app/`
const TOKEN_URL = 'https://worker.example/api/oauth/token'

// 外部通信はすべてこのローカルWorkerへ向け、実際のGitHubや資格情報を使用しない
const UPSTREAM_SCRIPT = `
let calls = 0
let redirectedRequests = 0
export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.origin === 'https://fixture.internal') {
      if (url.pathname === '/reset') {
        calls = 0
        redirectedRequests = 0
      }
      return Response.json({ calls, redirectedRequests })
    }
    calls++
    if (request.url !== 'https://github.com/login/oauth/access_token') {
      redirectedRequests++
      return Response.json({ error: 'unexpected_destination' }, { status: 400 })
    }
    const body = new URLSearchParams(await request.text())
    if (body.get('client_id') !== 'test-client' || body.get('client_secret') !== 'test-secret' ||
        body.get('code_verifier') !== 'v'.repeat(43) ||
        body.get('redirect_uri') !== '${REDIRECT_URI}') {
      return Response.json({ error: 'invalid_forwarded_request' })
    }
    const code = body.get('code')
    if (code.startsWith('redirect-')) {
      return new Response(null, {
        status: Number(code.slice('redirect-'.length)),
        headers: { Location: 'https://untrusted.example/collect' },
      })
    }
    if (code === 'invalid-code') {
      return Response.json({ error: 'bad_verification_code' })
    }
    return Response.json({
      access_token: 'runtime-test-only-token', token_type: 'bearer', scope: 'gist',
      refresh_token: 'must-not-be-returned',
    })
  },
}
`

describe('OAuth Workerのworkerd実行時互換性', () => {
  let runtime: Miniflare

  beforeAll(async () => {
    const source = readFileSync(new URL('../workers/oauth-token-exchange/src/index.ts', import.meta.url), 'utf8')
    const config = readFileSync(new URL('../workers/oauth-token-exchange/wrangler.toml', import.meta.url), 'utf8')
    const compatibilityDate = config.match(/^compatibility_date\s*=\s*"([^"]+)"/m)?.[1]
    if (!compatibilityDate) throw new Error('Worker compatibility_date is missing')
    const script = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText

    runtime = new Miniflare(convertV4MiniflareOptions({
      workers: [
        {
          name: 'oauth-worker',
          routes: ['worker.example/*'],
          modules: true,
          script,
          compatibilityDate,
          bindings: {
            GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-secret',
            ALLOWED_REDIRECT_URIS: REDIRECT_URI,
          },
          ratelimits: { OAUTH_RATE_LIMITER: { namespace_id: '9001', simple: { limit: 20, period: 60 } } },
          outboundService: 'github-mock',
        },
        {
          name: 'github-mock', routes: ['fixture.internal/*'],
          modules: true, script: UPSTREAM_SCRIPT, compatibilityDate,
        },
      ],
    }))
    await runtime.ready
  }, 30_000)

  beforeEach(async () => {
    await runtime.dispatchFetch('https://fixture.internal/reset')
  })

  afterAll(async () => {
    await runtime?.dispose()
  }, 30_000)

  function exchange(code: string) {
    return runtime.dispatchFetch(TOKEN_URL, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI, code_verifier: 'v'.repeat(43) }),
    })
  }

  it('実際のfetchでPKCEと資格情報を転送し、必要なトークン情報だけ返す', async () => {
    const response = await exchange('valid-code')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({
      access_token: 'runtime-test-only-token', token_type: 'bearer', scope: 'gist',
    })
    expect(await (await runtime.dispatchFetch('https://fixture.internal/stats')).json()).toEqual({ calls: 1, redirectedRequests: 0 })
  })

  it('無効コードでも実際にGitHub相当の通信を行い、500ではなく認証エラーにする', async () => {
    const response = await exchange('invalid-code')
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'authorization_failed' })
  })

  it.each([301, 302, 303, 307, 308])('HTTP %iのリダイレクト先へ資格情報を送らない', async status => {
    const response = await exchange(`redirect-${status}`)
    expect(response.status).toBe(502)
    expect(await (await runtime.dispatchFetch('https://fixture.internal/stats')).json()).toEqual({ calls: 1, redirectedRequests: 0 })
  })
})
