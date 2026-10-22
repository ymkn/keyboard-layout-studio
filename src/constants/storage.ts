/**
 * LocalStorage / SessionStorage のキー定数
 */
export const STORAGE_KEYS = {
  /** GitHub認証情報（SessionStorage。旧LocalStorageの削除にも使用） */
  GITHUB_AUTH: 'kls-github-auth',

  /** レイアウト保存のプレフィックス（LocalStorage） */
  LAYOUT_PREFIX: 'kls-layout-',

  /** OAuth state（SessionStorage） */
  OAUTH_STATE: 'kls-oauth-state',

  /** OAuth redirect URI（SessionStorage） */
  OAUTH_REDIRECT_URI: 'kls-oauth-redirect-uri',

  /** PKCE code verifier（SessionStorage） */
  OAUTH_CODE_VERIFIER: 'kls-oauth-code-verifier',

  /** OAuth開始時刻（SessionStorage） */
  OAUTH_STARTED_AT: 'kls-oauth-started-at',

  /** 言語設定（LocalStorage） */
  LOCALE: 'kls-locale',
} as const

export type StorageKeys = typeof STORAGE_KEYS
