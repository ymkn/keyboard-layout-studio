# Cloudflare Workersへのデプロイ手順

## 概要

Cloudflare Workersを使用してGitHub OAuthのCORS問題を回避します。

GitHub OAuthのトークン交換エンドポイント（`https://github.com/login/oauth/access_token`）はCORSに対応していないため、ブラウザから直接呼び出すことができません。このWorkerがプロキシとして動作し、SPAからのリクエストを受けてGitHubにトークン交換を行います。

## 前提条件

1. Cloudflareアカウント（無料枠で十分）
2. GitHub OAuth App（Client IDとClient Secretが必要）

### GitHub OAuth Appの作成

1. https://github.com/settings/applications/new にアクセス
2. 以下を設定：
   - **Application name**: 任意（例: Keyboard Layout Studio）
   - **Homepage URL**: アプリケーションのURL
   - **Authorization callback URL**:
     - 開発用: `http://localhost:5173/callback`
     - 本番用: `https://your-domain.com/callback`
3. 作成後、**Client ID**と**Client Secret**をメモ

## デプロイ手順

### 1. Cloudflare Workersにサインアップ

https://dash.cloudflare.com/sign-up からアカウントを作成（無料枠で十分です）

### 2. Workerのデプロイ

```bash
# Wrangler CLIをインストール（未インストールの場合）
npm install -g wrangler

# Cloudflareにログイン
npx wrangler login

# Workerをデプロイ（wrangler.tomlがあるディレクトリから）
cd workers/oauth-token-exchange
npx wrangler deploy

# または、プロジェクトルートから--configオプションで指定
npx wrangler deploy --config=workers/oauth-token-exchange/wrangler.toml
```

デプロイ成功後、以下のようなURLが表示されます：
```
https://kls-oauth-worker.your-subdomain.workers.dev
```

### 3. 環境変数（Secrets）の設定

WorkerにはGitHub OAuth AppのClient IDとClient Secretを設定する必要があります。

```bash
# CLIから設定（プロンプトで値を入力）
cd workers/oauth-token-exchange
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

または、Cloudflare Dashboardから設定：
1. 「Workers & Pages」→「kls-oauth-worker」→「Settings」→「Variables and Secrets」
2. 「Add」をクリックし、以下を追加：
   - `GITHUB_CLIENT_ID`: GitHub OAuth AppのClient ID
   - `GITHUB_CLIENT_SECRET`: GitHub OAuth AppのClient Secret

### 4. 動作確認

デプロイしたWorkerのルートURLにアクセスして動作確認：

```bash
curl https://kls-oauth-worker.your-subdomain.workers.dev/
```

正常な場合、以下のレスポンスが返ります：
```json
{"status":"ok","message":"KLS Token Exchange Worker"}
```

### 5. SPAの環境変数設定

#### ローカル開発環境

`.env.development`を作成し、以下を設定：

```env
# GitHub OAuth AppのClient ID
VITE_GITHUB_CLIENT_ID=your_github_client_id

# Cloudflare Worker URL
VITE_OAUTH_WORKER_URL=https://kls-oauth-worker.your-subdomain.workers.dev
```

サンプルファイル（`.env.development.example`）を参考にしてください。

#### 本番環境（GitHub Pages等へのデプロイ）

本番ビルド時は、デプロイ先プラットフォームの環境変数（Secrets）機能を使用します。
`.env.production`ファイルをリポジトリにコミットする必要はありません（秘密情報の漏洩防止のため）。

**GitHub Actions（GitHub Pages）の場合:**

1. リポジトリの「Settings」→「Secrets and variables」→「Actions」
2. 「New repository secret」で以下を追加：
   - `VITE_GITHUB_CLIENT_ID`: GitHub OAuth AppのClient ID
   - `VITE_OAUTH_WORKER_URL`: Cloudflare WorkerのURL

これらのSecretsはビルド時に自動的に環境変数として注入されます（`.github/workflows/deploy.yml`で設定済み）。

**その他のプラットフォーム:**

| プラットフォーム | 環境変数の設定場所 |
|----------------|-------------------|
| Vercel | Project Settings → Environment Variables |
| Netlify | Site settings → Environment variables |
| Cloudflare Pages | Settings → Environment variables |

各プラットフォームで`VITE_GITHUB_CLIENT_ID`と`VITE_OAUTH_WORKER_URL`を設定してください。

## APIエンドポイント

### `GET /`
ヘルスチェック用エンドポイント。

**レスポンス:**
```json
{"status":"ok","message":"KLS Token Exchange Worker"}
```

### `POST /api/oauth/token`
OAuthトークン交換エンドポイント。

**リクエストボディ:**
```json
{
  "code": "github_oauth_code",
  "redirect_uri": "http://localhost:5173/callback"
}
```

**成功レスポンス:**
```json
{
  "access_token": "gho_xxxx",
  "token_type": "bearer",
  "scope": "gist"
}
```

**エラーレスポンス:**
```json
{
  "error": "error_code",
  "error_description": "Error message"
}
```

## 動作原理

1. SPAからGitHubのOAuth認証を開始
2. ユーザーがGitHubで承認
3. GitHubからコールバックURLにリダイレクト（認証コード付き）
4. SPAがCloudflare Workerの`/api/oauth/token`エンドポイントに認証コードをPOST
5. WorkerがGitHubのOAuthトークンエンドポイントを呼び出してアクセストークンを取得
6. WorkerがアクセストークンをSPAに返す

Workerがサーバーサイドを経由するため、CORS問題が回避されます。

## トラブルシューティング

### 「GitHub credentials not configured」エラー
Workerに`GITHUB_CLIENT_ID`と`GITHUB_CLIENT_SECRET`が設定されていません。「環境変数の設定」の手順を確認してください。

### 「token_exchange_failed」エラー
- GitHub OAuth Appの設定を確認
- Callback URLが正しく設定されているか確認
- Client SecretがWorkerに正しく設定されているか確認

### CORSエラー
WorkerのURLが正しく`VITE_OAUTH_WORKER_URL`に設定されているか確認してください。

## 料金

- Cloudflare Workersの無料枠：1日あたり100,000リクエスト
- GitHub OAuth認証は1セッションあたり1回のみ使用するため、無料枠で十分です
