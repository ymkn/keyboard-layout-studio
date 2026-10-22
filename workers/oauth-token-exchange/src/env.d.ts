export interface Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  ALLOWED_REDIRECT_URIS: string
  OAUTH_RATE_LIMITER: {
    limit(options: { key: string }): Promise<{ success: boolean }>
  }
}
