/**
 * 保存元のストレージタイプ
 * - 'new': 新規作成（まだどこにも保存されていない）
 * - 'local': ローカルストレージ
 * - 'gist': GitHub Gist
 */
export type StorageSource = 'new' | 'local' | 'gist'

/**
 * GitHub認証情報
 */
export interface GitHubAuth {
  token: string
  username: string
  avatarUrl?: string
}

/**
 * Gistファイル情報
 */
export interface GistFile {
  filename: string
  type: string
  language: string | null
  raw_url: string
  size: number
  content?: string
}

/**
 * GitHub Gist
 */
export interface Gist {
  id: string
  url: string
  html_url: string
  description: string | null
  files: Record<string, GistFile>
  public: boolean
  created_at: string
  updated_at: string
}

/**
 * 保存済みレイアウトアイテム（ローカル/Gist共通）
 */
export interface SavedLayoutItem {
  id: string // localStorage key or gist ID
  filename: string // 表示名
  description: string // 説明
  updatedAt: string // ISO timestamp
  source: StorageSource // 'local' | 'gist'
  gistFileKey?: string // Gist内のファイルキー（複数ファイルがある場合）
}

/**
 * GitHub APIエラー
 */
export interface GitHubAPIErrorResponse {
  message: string
  documentation_url?: string
}

/**
 * GitHub ユーザー情報
 */
export interface GitHubUser {
  login: string
  avatar_url: string
  html_url: string
}
