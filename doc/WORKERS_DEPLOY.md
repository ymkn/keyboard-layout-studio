# Cloudflare Workersへのデプロイ手順

## 概要

Cloudflare Workersを使用してGitHub OAuthのCORS問題を回避します。

GitHub OAuthのトークン交換エンドポイント（`https://github.com/login/oauth/access_token`）はCORSに対応していないため、ブラウザから直接呼び出すことができません。このWorkerがプロキシとして動作し、SPAからのリクエストを受けてGitHubにトークン交換を行います。

認証には一度限りの `state` 照合とPKCE（S256）を使用します。Workerは許可された接続元・完全一致のコールバックURLだけを受け付け、入力サイズ・形式・利用回数を制限します。

## セキュリティ更新時の反映順序

SPAとWorkerの両方を更新してください。旧SPAはPKCEを送らないため、新Workerに拒否されます。

1. `wrangler.toml` の `ALLOWED_REDIRECT_URIS` を実際の公開URLに合わせ、GitHub OAuth AppのCallback URLも一致させる。
2. Rate Limitingの `namespace_id`（本番 `1001`、開発 `1002`）が、同じCloudflareアカウント内の別用途と重複しないことを確認する。
3. Workerを先にデプロイし、その直後に新SPAを公開する。この間、旧SPAでのログインは失敗するため、更新後にページを再読み込みする。
4. 実際のGitHubログイン、Gistの読み書き、ログアウトを確認する。旧localStorageの認証情報は復元せず削除されるので、再ログインが必要。

コード更新だけでは稼働中のWorkerは更新されません。Cloudflareの設定・GitHub OAuth Appの設定と合わせて反映してください。

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
3. Node.js 22以上とnpm。リポジトリのルートで `npm ci` を実行し、lockfileに固定されたWranglerを使用する。

### GitHub OAuth Appの作成

資格情報と許可先を環境ごとに分離するため、**開発用と本番用で別々のOAuth Appを作成**してください。

**重要**: Callback URLには `/callback` のような別パスではなく、アプリのルートURL（末尾スラッシュ付き）を指定してください。GitHub PagesなどのSPAホスティングでは、ルート以外のパスへの直接アクセスが404になるためです。

Callback URLのワイルドカード一致を設定できる場合は無効にしてください。特にGitHub Pagesのような共有オリジンでは、他のパスを認証先として許可しないよう、完全一致のURLを使用します。

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
   - **Homepage URL**: `https://your-domain.com/keyboard-layout-studio/`（実際の本番サイトのURL）
   - **Authorization callback URL**: `https://your-domain.com/keyboard-layout-studio/`（末尾のスラッシュ必須）
3. 作成後、**Client ID**と**Client Secret**をメモ

## デプロイ手順

### 1. Cloudflare Workersにサインアップ

https://dash.cloudflare.com/sign-up からアカウントを作成（無料枠で十分です）

### 2. Workerのデプロイ

```bash
# リポジトリのルートで開発・デプロイ用依存関係をインストール
npm ci

# Cloudflareにログイン
npx wrangler login

# Workerをデプロイ（wrangler.tomlがあるディレクトリから）
cd workers/oauth-token-exchange
```

デプロイ前に `wrangler.toml` の許可リストを確認してください。

```toml
[vars]
ALLOWED_REDIRECT_URIS = "https://your-domain.com/keyboard-layout-studio/"
```

既定値は `https://ymkn.github.io/keyboard-layout-studio/` です。ホストだけでなくパス・末尾スラッシュも一致させます。複数URLはカンマ区切りで指定でき、接続元OriginはそのURLから導出されます。`*`、クエリ、フラグメント、資格情報付きURLは使用できません。HTTPは開発用のloopback URLに限ります。

開発用の値とRate Limiting bindingも `[env.development.vars]`、`[[env.development.ratelimits]]` に明示してあります。許可リスト・資格情報・Rate Limiting bindingが不足した場合、トークン交換は許可されません。Rate Limiting APIを使うため、Wrangler 4.36.0以降が必要です（このプロジェクトでは対応版を固定しています）。

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

実際に公開せず、両環境の設定とバンドルを確認する場合：

```bash
npx wrangler deploy --dry-run
npx wrangler deploy --dry-run --env development
```

デプロイ成功後、以下のようなURLが表示されます：
```
https://kls-oauth-worker-development.your-subdomain.workers.dev
```

### 3. 環境変数（Secrets）の設定

WorkerにはGitHub OAuth AppのClient IDとClient Secretを設定する必要があります。
**環境ごとに異なるOAuth AppのCredentialを設定してください。**

`GITHUB_CLIENT_SECRET` はWorkerのSecretsにだけ設定します。`VITE_` 環境変数はビルド成果物に含まれるため、Client Secretを渡してはいけません。Client IDとWorker URLは公開情報です。

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
`.env.production`ファイルをリポジトリにコミットする必要はありません。ただし、ここに設定するClient IDとWorker URLはブラウザへ配布される公開情報であり、Secretsに保存しても機密にはなりません。

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
  "redirect_uri": "http://localhost:5173/keyboard-layout-studio/",
  "code_verifier": "the_original_PKCE_verifier_43_to_128_characters"
}
```

`Origin` が必須で、`redirect_uri` のOriginとも一致しなければなりません。本文は `application/json`、最大4 KiBです。PKCE verifierはRFC 7636の形式（43〜128文字）を検証します。GitHub側でも認証要求時のchallengeとの一致が検証されます。

主なエラー：`400` 不正な認証要求、`403` 未許可の接続元、`408` 本文受信のタイムアウト、`413` サイズ超過、`415` 不正なContent-Type、`429` 試行回数超過、`500` 設定不足など、`502` GitHubの応答異常、`504` GitHub通信のタイムアウト。トークンを含む応答には `Cache-Control: no-store` を付与します。

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

1. SPAがランダムなstateとPKCE verifierを生成し、S256 challenge付きでGitHubのOAuth認証を開始
2. ユーザーがGitHubで承認
3. GitHubからコールバックURLにリダイレクト（認証コード付き）
4. SPAがstate・開始時刻（10分以内）・戻り先を検証し、セッションを一度だけ消費して認証コードとverifierをWorkerへPOST
5. Workerが接続元・コールバックURL・入力・利用回数を検証し、GitHubのOAuthトークンエンドポイントへ固定された通信先で交換要求
6. Workerが必要なフィールドだけをSPAに返す。SPAはGitHubで利用者情報を確認し、認証情報をsessionStorageに保存

Workerがサーバーサイドを経由するため、CORS問題が回避されます。

## 保護の範囲と運用上の注意

- **CORSは認証ではありません。** 非ブラウザの呼び出し元はOriginを偽装できます。有効なコードとPKCE verifierの検証はGitHubに委ね、回数制限を別に実施しています。
- Rate LimitingはクライアントIPごとに20回/60秒です。認証前で利用者IDを確定できないためIPを使用し、共有IPでは他の利用者も制限に達する場合があります。Cloudflare拠点ごとの概算制限であり、世界全体の厳密な上限や分散攻撃の完全な防止ではありません。Worker起動前のリクエスト抑制や課金上限を保証するものでもありません。
- 認証情報はlocalStorageには保存しません。ただしsessionStorageも同一オリジンのJavaScriptから読めるので、**XSS耐性が得られるわけではありません**。同じオリジンで公開する他のアプリにも注意が必要です。
- ログアウトは端末内の認証情報を削除しますが、GitHub側のトークンを失効させません。漏洩が疑われる場合や既存トークンを無効にする場合は、GitHubの **Settings → Applications → Authorized OAuth Apps** でこのアプリの認可を取り消してください。Secretの交換だけで既発行の利用者トークンが無効になると考えないでください。
- `gist` 権限はこのアプリの `.kls.json` だけでなく、その利用者のGist全体に及びます。Workerは `gist` 以外の権限を持つトークンや、refresh tokenなどの余分なフィールドをブラウザに返しません。有効期限付きトークンをGitHub側で有効にした場合、期限切れ後は再ログインが必要です（自動refreshは実装していません）。
- コード・verifier・アクセストークン・Client Secretをアクセスログやデバッグログに記録しないでください。ブラウザの認証URLは受信後すぐに除去し、外部リソースへのReferer送信も抑止しています。

### 検証と依存関係

リポジトリのルートで実行します。

```bash
npm test
npm run build
npm audit --omit=dev
npm audit
```

テストはGitHub通信・Cloudflare Rate Limiting bindingを模擬します。実環境でのGitHubログインやCloudflare側設定の確認を置き換えるものではありません。

2026-10-22時点の更新後、実行時依存の `npm audit --omit=dev` は警告0件です。全依存の監査にはTailwind CSS 3系の開発・ビルド専用依存に7パッケージ分（high 5、moderate 2）の警告が残ります。主因は修正版未公開の `braces`（[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)）と旧 `postcss-selector-parser` です。これらはWorkerにバンドルされず、公開APIから呼び出す経路はありません。不審なソース・ビルド設定をビルドしないでください。警告解消にはTailwind CSS 4系への移行など、表示互換性の検証を伴う別の更新が必要です。監査結果は随時変わるため、上記コマンドで再確認してください。

## トラブルシューティング

### 「token_exchange_failed」エラー
- GitHub OAuth Appの設定を確認
- Callback URLが正しく設定されているか確認
- Client SecretがWorkerに正しく設定されているか確認

### CORSエラー
WorkerのURLが正しく`VITE_OAUTH_WORKER_URL`に設定されているか確認してください。
加えて、Workerの `ALLOWED_REDIRECT_URIS` が実際のSPAのURLと完全一致すること、開発用SPAを本番Workerに向けていないことを確認してください。

### 「Token exchange is unavailable」エラー
Secrets・許可リスト・`OAUTH_RATE_LIMITER` bindingを確認してください。ルートのヘルスチェック成功だけでは、トークン交換用の設定がすべて揃っているとは限りません。

## 料金

- Cloudflare Workersの無料枠：1日あたり100,000リクエスト
- 通常の少数利用では無料枠内に収まる想定ですが、攻撃による大量アクセスまで保証するものではありません。Cloudflare側の利用状況・予算通知も確認してください。
