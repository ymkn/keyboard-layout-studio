# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keyboard Layout Studio - Vue 3 + TypeScript + SVGベースのキーボードレイアウトエディタ。
keyboard-layout-editor.comの代替として、キーボード開発者向け機能に特化。

保存先: LocalStorage または GitHub Gist（OAuth認証はCloudflare Worker経由）

## Development Commands

```bash
npm install          # 依存関係インストール
npm run dev          # 開発サーバー (http://localhost:5173)
npm run build        # 本番ビルド（TypeScriptチェック含む）
```

## Architecture

詳細は `doc/architecture.md` を参照。

### ストア構成 (Pinia)

```
src/stores/
├── keyboard.ts  # 統合ファサード（後方互換性用、既存コードはこれを使用）
├── layout.ts    # 永続化対象：レイアウトデータ、キー操作
├── editor.ts    # セッション限定：選択状態、表示モード、クリップボード
├── history.ts   # セッション限定：Undo/Redo履歴
└── auth.ts      # GitHub認証、ソース/保存先管理
```

**新規コードでは個別ストアを直接使用**:
```typescript
import { useLayoutStore } from '@/stores/layout'
import { useEditorStore } from '@/stores/editor'
```

All mutations update `metadata.modified` and save to history automatically.

### 重要なファイル

| ファイル | 役割 |
|---------|------|
| `src/constants/app-config.ts` | 制限値（履歴数、レイヤー数、座標範囲など） |
| `src/constants/rendering.ts` | 描画定数（1u=54px、グリッド0.25uなど） |
| `src/utils/key-sanitizer.ts` | バリデーション/サニタイズの一元化 |
| `src/types/keyboard.ts` | Key, KeyboardLayout等の型定義 |
| `src/types/persistence.ts` | 永続化対象 vs ランタイム専用の型区別 |
| `src/data/keycodes.ts` | キーコードデータ定義・検索（`searchKeycodes()`） |

## 設計原則

1. **クライアントサイド中心**: OAuth token exchangeのみWorker使用
2. **最小依存**: Vue 3, Pinia, Tailwind CSS, TypeScript
3. **型安全**: Strict mode、`any`禁止
4. **シンプル優先**: 早すぎる抽象化を避ける
5. **キーボード操作重視**: 効率的なショートカット

## 重要な注意事項

### 単位系
- **データモデルはすべてu単位**（1u = 標準キーキャップサイズ = 54px）
- ピクセル変換は描画時のみ

### バリデーション
- **`key-sanitizer.ts`に一元化**
- `loadLayout`時に自動サニタイズ（JSON編集、KLEインポート、LocalStorage/Gist読み込みすべて）
- 不正値はクランプ/切り詰め → トースト通知
- PropertyPanelの入力バリデーションも同じロジック使用

### 特殊形状
- `iso-enter`, `big-ass-enter`, `circle`は**固定サイズ、リサイズ不可**

### Key ID生成
- `Date.now() + index` - シングルユーザー編集では十分

### 履歴管理
- Deep cloneでスナップショット保存（参照共有防止）
- 新レイアウト読み込み時にクリア（メモリリーク防止）

### i18n
- **アプリの言語設定（`locale.value`）が優先** - ブラウザ設定は初期値決定のみ
- 規約ベースキー命名: `shapes.${shape}` のように識別子をキーに使用

## ストレージキー

| キー | 用途 | ストレージ |
|-----|------|-----------|
| `kls-layout-{name}` | レイアウト保存 | localStorage |
| `kls-github-auth` | GitHub認証 | localStorage |
| `kls-oauth-state` | OAuth state | sessionStorage |
| `kls-locale` | 言語設定 | localStorage |

## GitHub OAuth / Cloudflare Worker

**OAuth Appは開発・本番で別々に必要**（Redirect URLが1つしか設定できないため）

**Callback URL設定（重要）**: `/callback`ではなくアプリのベースURL（末尾スラッシュ付き）
- 開発: `http://localhost:5173/keyboard-layout-studio/`
- 本番: `https://your-domain.com/keyboard-layout-studio/`

Worker環境:
- 本番: `kls-oauth-worker` (`npx wrangler deploy`)
- 開発: `kls-oauth-worker-development` (`npx wrangler deploy --env development`)

環境変数（`.env.development` / `.env.production`）:
- `VITE_GITHUB_CLIENT_ID` - OAuth App client ID
- `VITE_OAUTH_WORKER_URL` - Worker URL

未設定時はGitHub機能が無効化（`isGitHubIntegrationConfigured()`でチェック）

詳細は `doc/WORKERS_DEPLOY.md` を参照。

## やってはいけないこと

- バリデーションロジックを`key-sanitizer.ts`以外に書く
- u単位とpx単位を混同する
- ストアの状態を直接変更する（必ずAction経由）
- 特殊形状キーのサイズを変更しようとする
- OAuth Callback URLを`/callback`などの別パスにする
