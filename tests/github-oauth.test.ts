import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../src/constants/storage'
import { OAUTH_CONFIG } from '../src/constants/oauth'
import { exchangeCodeForToken, startOAuthFlow } from '../src/services/github'
import { MemoryStorage } from './helpers/storage'

const REDIRECT_URI = 'https://studio.example/app/'
const WORKER_URL = 'https://worker.example'
const TOKEN = { access_token: 'test-only-token', token_type: 'bearer', scope: 'gist' }
const OAUTH_KEYS = [
  STORAGE_KEYS.OAUTH_STATE, STORAGE_KEYS.OAUTH_REDIRECT_URI,
  STORAGE_KEYS.OAUTH_CODE_VERIFIER, STORAGE_KEYS.OAUTH_STARTED_AT,
]

async function callback(): Promise<URLSearchParams> {
  const url = new URL(await startOAuthFlow('test-client', REDIRECT_URI))
  return new URLSearchParams({ code: 'test-code', state: url.searchParams.get('state')! })
}

function expectSessionConsumed(): void {
  for (const key of OAUTH_KEYS) expect(sessionStorage.getItem(key)).toBeNull()
}

describe('GitHub OAuth browser flow', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('sessionStorage', new MemoryStorage())
    vi.stubGlobal('localStorage', new MemoryStorage())
    vi.stubGlobal('window', { location: { origin: 'https://studio.example', pathname: '/app/' } })
    vi.stubEnv('VITE_OAUTH_WORKER_URL', WORKER_URL)
    fetchMock.mockReset().mockImplementation(async () => Response.json(TOKEN))
    vi.stubGlobal('fetch', fetchMock)
  })

  it('ランダムなstateとS256 PKCEを使い、verifierを認証URLへ含めない', async () => {
    const url = new URL(await startOAuthFlow('test-client', REDIRECT_URI))
    const verifier = sessionStorage.getItem(STORAGE_KEYS.OAUTH_CODE_VERIFIER)!
    expect(verifier).toMatch(/^[A-Za-z0-9._~-]{43,128}$/)
    expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update(verifier).digest('base64url'))
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('state')).toBe(sessionStorage.getItem(STORAGE_KEYS.OAUTH_STATE))
    expect(url.searchParams.get('state')!.length).toBeGreaterThanOrEqual(43)
    expect(url.searchParams.get('scope')).toBe('gist')
    expect(url.searchParams.has('code_verifier')).toBe(false)
    expect(localStorage.length).toBe(0)
    const previousState = url.searchParams.get('state')
    await startOAuthFlow('test-client', REDIRECT_URI)
    expect(sessionStorage.getItem(STORAGE_KEYS.OAUTH_STATE)).not.toBe(previousState)
    expect(sessionStorage.getItem(STORAGE_KEYS.OAUTH_CODE_VERIFIER)).not.toBe(verifier)
  })

  it('stateを検証してPKCE付きで交換し、セッションを消費する', async () => {
    const params = await callback()
    const verifier = sessionStorage.getItem(STORAGE_KEYS.OAUTH_CODE_VERIFIER)
    expect(await exchangeCodeForToken(params)).toEqual(TOKEN)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${WORKER_URL}/api/oauth/token`)
    expect(JSON.parse(init?.body as string)).toEqual({ code: 'test-code', redirect_uri: REDIRECT_URI, code_verifier: verifier })
    expect(init).toMatchObject({ credentials: 'omit', redirect: 'error', cache: 'no-store', referrerPolicy: 'no-referrer' })
    expectSessionConsumed()
    await expect(exchangeCodeForToken(params)).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each(['missing', 'mismatched', 'duplicate'])('不正なstateは交換前に拒否する: %s', async kind => {
    const params = await callback()
    if (kind === 'missing') params.delete('state')
    if (kind === 'mismatched') params.set('state', 'attacker-state')
    if (kind === 'duplicate') params.append('state', params.get('state')!)
    await expect(exchangeCodeForToken(params)).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
    expectSessionConsumed()
  })

  it('開始していない認証は受け入れない', async () => {
    await expect(exchangeCodeForToken(new URLSearchParams({ code: 'code', state: 'state' }))).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each(['expired', 'future', 'invalid', 'missing'])('開始時刻の不備や期限切れを拒否する: %s', async kind => {
    const params = await callback()
    const timestamps: Record<string, string> = {
      expired: String(Date.now() - OAUTH_CONFIG.SESSION_TTL_MS - 1000),
      future: String(Date.now() + 60_000),
      invalid: 'invalid',
    }
    if (kind === 'missing') sessionStorage.removeItem(STORAGE_KEYS.OAUTH_STARTED_AT)
    else sessionStorage.setItem(STORAGE_KEYS.OAUTH_STARTED_AT, timestamps[kind]!)
    await expect(exchangeCodeForToken(params)).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
    expectSessionConsumed()
  })

  it.each([STORAGE_KEYS.OAUTH_CODE_VERIFIER, STORAGE_KEYS.OAUTH_REDIRECT_URI])('セッション情報の欠落を拒否する: %s', async key => {
    const params = await callback()
    sessionStorage.removeItem(key)
    await expect(exchangeCodeForToken(params)).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
    expectSessionConsumed()
  })

  it('別のコールバックパスでの交換を拒否する', async () => {
    const params = await callback()
    window.location.pathname = '/other/'
    await expect(exchangeCodeForToken(params)).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each(['missing', 'duplicate', 'invalid'])('不正なcodeを拒否する: %s', async kind => {
    const params = await callback()
    if (kind === 'missing') params.delete('code')
    if (kind === 'duplicate') params.append('code', 'other-code')
    if (kind === 'invalid') params.set('code', '<invalid>')
    await expect(exchangeCodeForToken(params)).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
    expectSessionConsumed()
  })

  it('認証拒否時もstateを検証し、URLのエラー文を信用しない', async () => {
    const params = await callback()
    params.delete('code')
    params.set('error', 'access_denied')
    params.set('error_description', 'attacker-controlled-description')
    await expect(exchangeCodeForToken(params)).rejects.not.toThrow('attacker-controlled-description')
    expect(fetchMock).not.toHaveBeenCalled()
    expectSessionConsumed()
  })

  it('通信失敗時もセッションを再利用させない', async () => {
    const params = await callback()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(exchangeCodeForToken(params)).rejects.toThrow()
    expectSessionConsumed()
    await expect(exchangeCodeForToken(params)).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([{}, { error: 'authorization_failed' }, { ...TOKEN, scope: 'repo,gist' }, { ...TOKEN, access_token: '' }])(
    '不正な成功レスポンスを認証情報として返さない: %j', async data => {
      const params = await callback()
      fetchMock.mockResolvedValueOnce(Response.json(data))
      await expect(exchangeCodeForToken(params)).rejects.toThrow()
      expectSessionConsumed()
    },
  )

  it('ストレージへの保存が失敗したら途中の認証情報も削除する', async () => {
    const originalSetItem = sessionStorage.setItem.bind(sessionStorage)
    vi.spyOn(sessionStorage, 'setItem').mockImplementation((key, value) => {
      if (key === STORAGE_KEYS.OAUTH_CODE_VERIFIER) throw new Error('storage blocked')
      originalSetItem(key, value)
    })
    await expect(startOAuthFlow('test-client', REDIRECT_URI)).rejects.toThrow()
    expectSessionConsumed()
  })
})
