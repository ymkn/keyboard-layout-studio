/** GitHub OAuthのセッション・通信制限 */
export const OAUTH_CONFIG = {
  SESSION_TTL_MS: 10 * 60 * 1000,
  REQUEST_TIMEOUT_MS: 15 * 1000,
} as const
