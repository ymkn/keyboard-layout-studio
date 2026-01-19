/**
 * LocalStorage / SessionStorage のキー定数
 */
export const STORAGE_KEYS = {
  /** GitHub認証情報（LocalStorage） */
  GITHUB_AUTH: 'kls-github-auth',

  /** レイアウト保存のプレフィックス（LocalStorage） */
  LAYOUT_PREFIX: 'kls-layout-',

  /** OAuth state（SessionStorage） */
  OAUTH_STATE: 'kls-oauth-state',

  /** OAuth redirect URI（SessionStorage） */
  OAUTH_REDIRECT_URI: 'kls-oauth-redirect-uri',
} as const

export type StorageKeys = typeof STORAGE_KEYS
