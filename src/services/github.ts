import type { Gist, GitHubUser, SavedLayoutItem } from '../types/github'
import { STORAGE_KEYS } from '../constants/storage'

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

function generateRandomState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

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

export function startOAuthFlow(
  clientId: string,
  redirectUri: string,
  scope = 'gist'
): string {
  const state = generateRandomState()

  const params = new URLSearchParams({
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    state
  })

  sessionStorage.setItem(STORAGE_KEYS.OAUTH_STATE, state)
  sessionStorage.setItem(STORAGE_KEYS.OAUTH_REDIRECT_URI, redirectUri)

  return `${GITHUB_OAUTH_BASE}/authorize?${params.toString()}`
}

export async function exchangeCodeForToken(
  code: string,
  workerUrl?: string
): Promise<{ access_token: string; scope: string; token_type: string }> {
  const redirectUri = sessionStorage.getItem(STORAGE_KEYS.OAUTH_REDIRECT_URI)

  if (!redirectUri) {
    throw new Error('OAuth redirect URI not found in session storage')
  }

  const url = workerUrl || import.meta.env.VITE_OAUTH_WORKER_URL
  if (!url) {
    throw new Error(GITHUB_NOT_CONFIGURED_MESSAGE)
  }

  const response = await fetch(`${url}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new GitHubAPIError(
      response.status,
      error.error_description || error.error || 'Token exchange failed'
    )
  }

  // クリーンアップ
  sessionStorage.removeItem(STORAGE_KEYS.OAUTH_STATE)
  sessionStorage.removeItem(STORAGE_KEYS.OAUTH_REDIRECT_URI)

  return response.json()
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
      default:
        return `APIエラーが発生しました: ${error.message}`
    }
  }
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      return 'ネットワークエラーが発生しました。接続を確認してください。'
    }
    return error.message
  }
  return '予期しないエラーが発生しました。'
}
