import { calculatePKCECodeChallenge, generateRandomCodeVerifier, generateRandomState } from 'oauth4webapi'
import type { Gist, GitHubUser, SavedLayoutItem } from '../types/github'
import { STORAGE_KEYS } from '../constants/storage'
import { OAUTH_CONFIG } from '../constants/oauth'

/**
 * GitHub連携が設定されているかチェック
 */
export function isGitHubIntegrationConfigured(): boolean {
  return !!(import.meta.env.VITE_GITHUB_CLIENT_ID && import.meta.env.VITE_OAUTH_WORKER_URL)
}

/**
 * GitHub連携未設定時のエラーメッセージ
 */
export const GITHUB_NOT_CONFIGURED_MESSAGE =
  'GitHub連携機能はこのインスタンスでは利用できません。' +
  'ご自身でデプロイする場合は、環境変数（VITE_GITHUB_CLIENT_ID, VITE_OAUTH_WORKER_URL）を設定してください。'

const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_OAUTH_BASE = 'https://github.com/login/oauth'

/**
 * GitHub APIエラー
 */
export class GitHubAPIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'GitHubAPIError'
  }
}

/**
 * GitHub APIサービス
 */
export class GitHubService {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      ...options,
      cache: 'no-store', // ブラウザキャッシュを無効化して常に最新データを取得
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new GitHubAPIError(
        response.status,
        error.message || `API request failed: ${response.status}`
      )
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async validateToken(): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user')
  }

  async listGists(): Promise<Gist[]> {
    return this.request<Gist[]>('/gists?per_page=100')
  }

  async getGist(gistId: string): Promise<Gist> {
    return this.request<Gist>(`/gists/${gistId}`)
  }

  async createGist(
    filename: string,
    content: string,
    description: string,
    isPublic = false
  ): Promise<Gist> {
    return this.request<Gist>('/gists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        public: isPublic,
        files: { [filename]: { content } },
      }),
    })
  }

  async updateGist(
    gistId: string,
    filename: string,
    content: string,
    description?: string
  ): Promise<Gist> {
    const body: Record<string, unknown> = {
      files: { [filename]: { content } },
    }
    if (description !== undefined) {
      body.description = description
    }
    return this.request<Gist>(`/gists/${gistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async deleteGist(gistId: string): Promise<void> {
    return this.request<void>(`/gists/${gistId}`, {
      method: 'DELETE',
    })
  }
}

export function clearOAuthSession(): void {
  sessionStorage.removeItem(STORAGE_KEYS.OAUTH_STATE)
  sessionStorage.removeItem(STORAGE_KEYS.OAUTH_REDIRECT_URI)
  sessionStorage.removeItem(STORAGE_KEYS.OAUTH_CODE_VERIFIER)
  sessionStorage.removeItem(STORAGE_KEYS.OAUTH_STARTED_AT)
}

export async function startOAuthFlow(
  clientId: string,
  redirectUri: string
): Promise<string> {
  clearOAuthSession()
  const state = generateRandomState()
  const codeVerifier = generateRandomCodeVerifier()
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'gist',
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })

  try {
    sessionStorage.setItem(STORAGE_KEYS.OAUTH_STATE, state)
    sessionStorage.setItem(STORAGE_KEYS.OAUTH_REDIRECT_URI, redirectUri)
    sessionStorage.setItem(STORAGE_KEYS.OAUTH_CODE_VERIFIER, codeVerifier)
    sessionStorage.setItem(STORAGE_KEYS.OAUTH_STARTED_AT, String(Date.now()))
  } catch (error) {
    clearOAuthSession()
    throw error
  }

  return `${GITHUB_OAUTH_BASE}/authorize?${params.toString()}`
}

interface OAuthTokenResponse {
  access_token: string
  scope: string
  token_type: string
}

export async function exchangeCodeForToken(
  params: URLSearchParams,
  workerUrl?: string
): Promise<OAuthTokenResponse> {
  let redirectUri: string | null
  let codeVerifier: string | null

  // 成否を問わず一度だけ消費し、再送・並行した交換を拒否する
  try {
    const expectedState = sessionStorage.getItem(STORAGE_KEYS.OAUTH_STATE)
    redirectUri = sessionStorage.getItem(STORAGE_KEYS.OAUTH_REDIRECT_URI)
    codeVerifier = sessionStorage.getItem(STORAGE_KEYS.OAUTH_CODE_VERIFIER)
    const startedAt = Number(sessionStorage.getItem(STORAGE_KEYS.OAUTH_STARTED_AT))

    if (!expectedState || params.getAll('state').length !== 1 || params.get('state') !== expectedState) {
      throw new Error('認証状態を確認できませんでした。GitHubへのログインをやり直してください。')
    }
    const age = Date.now() - startedAt
    if (!Number.isFinite(startedAt) || startedAt <= 0 || age < 0 || age > OAUTH_CONFIG.SESSION_TTL_MS) {
      throw new Error('認証の有効期限が切れました。GitHubへのログインをやり直してください。')
    }
    if (!redirectUri || redirectUri !== `${window.location.origin}${window.location.pathname}` ||
        !codeVerifier || !/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier)) {
      throw new Error('認証セッションが無効です。GitHubへのログインをやり直してください。')
    }
    if (params.has('error')) {
      throw new Error('GitHubでの認証が許可されませんでした。ログインをやり直してください。')
    }
    if (params.getAll('code').length !== 1 || !/^[A-Za-z0-9_-]{1,512}$/.test(params.get('code') || '')) {
      throw new Error('認証コードが無効です。GitHubへのログインをやり直してください。')
    }
  } finally {
    clearOAuthSession()
  }

  const url = workerUrl || import.meta.env.VITE_OAUTH_WORKER_URL
  if (!url) {
    throw new Error(GITHUB_NOT_CONFIGURED_MESSAGE)
  }

  const response = await fetch(`${url}/api/oauth/token`, {
    method: 'POST',
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(OAUTH_CONFIG.REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: params.get('code'),
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  })

  if (!response.ok) {
    const error: unknown = await response.json().catch(() => null)
    const description = error && typeof error === 'object' &&
      'error_description' in error && typeof error.error_description === 'string'
      ? error.error_description : 'Token exchange failed'
    throw new GitHubAPIError(
      response.status,
      description
    )
  }

  const data: unknown = await response.json()
  if (!data || typeof data !== 'object' ||
      !('access_token' in data) || typeof data.access_token !== 'string' || !data.access_token ||
      !('token_type' in data) || data.token_type !== 'bearer' ||
      !('scope' in data) || data.scope !== 'gist') {
    throw new Error('認証サーバーからの応答が不正です。GitHubへのログインをやり直してください。')
  }
  return { access_token: data.access_token, scope: data.scope, token_type: data.token_type }
}

export function filterKLSGists(gists: Gist[]): SavedLayoutItem[] {
  const items: SavedLayoutItem[] = []

  for (const gist of gists) {
    for (const fileKey of Object.keys(gist.files)) {
      if (fileKey.endsWith('.kls.json')) {
        items.push({
          id: gist.id,
          filename: fileKey,
          description: gist.description || '',
          updatedAt: gist.updated_at,
          source: 'gist',
          gistFileKey: fileKey,
        })
      }
    }
  }

  return items
}

export function getGitHubErrorMessage(error: unknown): string {
  if (error instanceof GitHubAPIError) {
    switch (error.status) {
      case 401:
        return 'トークンが無効です。正しいトークンを入力してください。'
      case 403:
        return 'アクセスが拒否されました。トークンの権限を確認してください。'
      case 404:
        return 'リソースが見つかりません。'
      case 422:
        return '無効なデータです。'
      case 429:
        return '認証の試行回数が上限に達しました。しばらく待ってからログインをやり直してください。'
      default:
        return `APIエラーが発生しました: ${error.message}`
    }
  }
  if (error instanceof Error) {
    if (['TimeoutError', 'AbortError'].includes(error.name)) {
      return '通信がタイムアウトしました。GitHubへのログインをやり直してください。'
    }
    if (error.message.includes('Failed to fetch')) {
      return 'ネットワークエラーが発生しました。接続を確認してください。'
    }
    return error.message
  }
  return '予期しないエラーが発生しました。'
}
