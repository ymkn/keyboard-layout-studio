# Cloudflare Workersへのデプロイ手順

## 概要

Cloudflare Workersを使用してGitHub OAuthのCORS問題を回避します。

GitHub OAuthのトークン交換エンドポイント（`https://github.com/login/oauth/access_token`）はCORSに対応していないため、ブラウザから直接呼び出すことができません。このWorkerがプロキシとして動作し、SPAからのリクエストを受けてGitHubにトークン交換を行います。

## 環境について

Workerは開発環境と本番環境で分かれています：

| 環境 | Worker名 | 用途 |
|-----|---------|------|
| 本番 | `kls-oauth-worker` | 本番サイト用 |
| 開発 | `kls-oauth-worker-development` | ローカル開発用 |

それぞれ別のGitHub OAuth Appを使用するため、環境ごとに異なるClient ID/Secretを設定します。

## 前提条件

1. Cloudflareアカウント（無料枠で十分）
2. GitHub OAuth App（環境ごとに別々に作成）

### GitHub OAuth Appの作成

GitHub OAuth Appは1つのCallback URLしか設定できないため、**開発用と本番用で別々のOAuth Appを作成**してください。

**重要**: Callback URLには `/callback` のような別パスではなく、アプリのルートURL（末尾スラッシュ付き）を指定してください。GitHub PagesなどのSPAホスティングでは、ルート以外のパスへの直接アクセスが404になるためです。

#### 開発用OAuth App

1. https://github.com/settings/applications/new にアクセス
2. 以下を設定：
   - **Application name**: Keyboard Layout Studio (Dev)
   - **Homepage URL**: `http://localhost:5173/keyboard-layout-studio/`
   - **Authorization callback URL**: `http://localhost:5173/keyboard-layout-studio/`
3. 作成後、**Client ID**と**Client Secret**をメモ

**注意**: Viteの`base`設定が`/keyboard-layout-studio/`のため、開発環境でもこのパスが必要です。

#### 本番用OAuth App

1. https://github.com/settings/applications/new にアクセス
2. 以下を設定：
   - **Application name**: Keyboard Layout Studio
   - **Homepage URL**: `https://your-domain.com`（本番サイトのURL）
   - **Authorization callback URL**: `https://your-domain.com/`（末尾のスラッシュ必須）
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
```

#### 本番環境のデプロイ

```bash
npx wrangler deploy
```

デプロイ成功後、以下のようなURLが表示されます：
```
https://kls-oauth-worker.your-subdomain.workers.dev
```

#### 開発環境のデプロイ

```bash
npx wrangler deploy --env development
```

デプロイ成功後、以下のようなURLが表示されます：
```
https://kls-oauth-worker-development.your-subdomain.workers.dev
```

### 3. 環境変数（Secrets）の設定

WorkerにはGitHub OAuth AppのClient IDとClient Secretを設定する必要があります。
**環境ごとに異なるOAuth AppのCredentialを設定してください。**

#### 本番環境のSecrets設定

```bash
cd workers/oauth-token-exchange
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

または、Cloudflare Dashboardから設定：
1. 「Workers & Pages」→「kls-oauth-worker」→「Settings」→「Variables and Secrets」
2. 「Add」をクリックし、本番用OAuth Appの値を追加

#### 開発環境のSecrets設定

```bash
cd workers/oauth-token-exchange
npx wrangler secret put GITHUB_CLIENT_ID --env development
npx wrangler secret put GITHUB_CLIENT_SECRET --env development
```

または、Cloudflare Dashboardから設定：
1. 「Workers & Pages」→「kls-oauth-worker-development」→「Settings」→「Variables and Secrets」
2. 「Add」をクリックし、開発用OAuth Appの値を追加

### 4. 動作確認

デプロイしたWorkerのルートURLにアクセスして動作確認：

```bash
# 本番環境
curl https://kls-oauth-worker.your-subdomain.workers.dev/

# 開発環境
curl https://kls-oauth-worker-development.your-subdomain.workers.dev/
```

正常な場合、以下のレスポンスが返ります：
```json
{"status":"ok","message":"KLS Token Exchange Worker"}
```

### 5. SPAの環境変数設定

**重要**: 開発環境と本番環境で異なるWorker URL・Client IDを使用してください。

| 環境変数 | 開発環境 | 本番環境 |
|---------|---------|---------|
| `VITE_GITHUB_CLIENT_ID` | 開発用OAuth AppのClient ID | 本番用OAuth AppのClient ID |
| `VITE_OAUTH_WORKER_URL` | `kls-oauth-worker-development`のURL | `kls-oauth-worker`のURL |

#### ローカル開発環境

`.env.development`を作成し、**開発用OAuth App**の値を設定：

```env
# 開発用GitHub OAuth AppのClient ID
VITE_GITHUB_CLIENT_ID=your_dev_github_client_id

# 開発用Cloudflare Worker URL
VITE_OAUTH_WORKER_URL=https://kls-oauth-worker-development.your-subdomain.workers.dev
```

サンプルファイル（`.env.development.example`）を参考にしてください。

#### 本番環境（GitHub Pages等へのデプロイ）

本番ビルド時は、デプロイ先プラットフォームの環境変数（Secrets）機能を使用します。
`.env.production`ファイルをリポジトリにコミットする必要はありません（秘密情報の漏洩防止のため）。

**GitHub Actions（GitHub Pages）の場合:**

1. リポジトリの「Settings」→「Secrets and variables」→「Actions」
2. 「New repository secret」で以下を追加：
   - `VITE_GITHUB_CLIENT_ID`: **本番用**OAuth AppのClient ID
   - `VITE_OAUTH_WORKER_URL`: **本番用**Cloudflare WorkerのURL（`kls-oauth-worker`）

これらのSecretsはビルド時に自動的に環境変数として注入されます（`.github/workflows/deploy.yml`で設定済み）。

**その他のプラットフォーム:**

| プラットフォーム | 環境変数の設定場所 |
|----------------|-------------------|
| Vercel | Project Settings → Environment Variables |
| Netlify | Site settings → Environment variables |
| Cloudflare Pages | Settings → Environment variables |

各プラットフォームで**本番用**の`VITE_GITHUB_CLIENT_ID`と`VITE_OAUTH_WORKER_URL`を設定してください。

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
  "redirect_uri": "http://localhost:5173/"
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
