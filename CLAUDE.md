# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keyboard Layout Studio is a web-based keyboard layout editor designed as an alternative to keyboard-layout-editor.com, specifically focused on features for keyboard developers. The app is built with Vue 3, TypeScript, and SVG-based rendering.

The app supports saving layouts to LocalStorage or GitHub Gist. For Gist integration, a Cloudflare Worker is used to handle OAuth token exchange (avoiding CORS issues with GitHub's OAuth endpoint).

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production (runs TypeScript check first)
npm run build

# Preview production build
npm run preview
```

## Architecture

詳細なアーキテクチャドキュメントは `doc/architecture.md` を参照。

### State Management (Pinia)

ストアは責務ごとに分割されており、`keyboard.ts`は後方互換性のための統合ファサードとして機能します。

**ストア構成**:
- `src/stores/keyboard.ts` - 統合ファサード（後方互換性、既存コードはこれを使用）
- `src/stores/layout.ts` - 永続化対象のレイアウトデータとキー操作
- `src/stores/editor.ts` - 選択状態、表示モード、クリップボード（セッション限定）
- `src/stores/history.ts` - Undo/Redo履歴（セッション限定）
- `src/stores/auth.ts` - GitHub認証、ソース/保存先管理

新規コードでは個別のストアを直接使用することを推奨:
```typescript
import { useLayoutStore } from '@/stores/layout'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { useAuthStore } from '@/stores/auth'
```

**useLayoutStore** (`src/stores/layout.ts`):
- 永続化対象のレイアウトデータを管理
- State: `layout`, `keys`, `layerCount`, `layoutName`, `legendFont`, `metadata`
- Actions: `updateKey`, `moveKeys`, `resizeKeys`, `rotateKeys`, `addKey`, `deleteKeys`, `addKeys`, `loadLayout`, `setLayout`, `updateMetadata`, `setLegendFont`, `incrementLayerCount`, `decrementLayerCount`, `createNewLayout`, `getKeyById`, `getKeysByIds`

**useEditorStore** (`src/stores/editor.ts`):
- UI状態を管理（セッション終了時に破棄）
- State: `selectedKeyIds`, `displayMode`, `keyboardLayout`, `copiedKeys`, `currentLayer`
- Getters: `selectedKey`, `selectedKeys`, `hasSelection`, `hasSingleSelection`, `hasMultipleSelection`
- Actions: `selectKey`, `toggleKeySelection`, `selectMultipleKeys`, `clearSelection`, `selectNextKey`, `toggleDisplayMode`, `setKeyboardLayout`, `copySelectedKeys`, `getCopiedKeys`, `hasCopiedKeys`, `setCurrentLayer`, `resetCurrentLayerIfNeeded`, `resetState`

**useHistoryStore** (`src/stores/history.ts`):
- Undo/Redo履歴を管理
- State: `snapshots`, `currentIndex`
- Getters: `canUndo`, `canRedo`
- Actions: `saveSnapshot`, `undo`, `redo`, `clearHistory`, `initializeHistory`, `setupLayoutWatcher`

**useAuthStore** (`src/stores/auth.ts`):
- GitHub認証情報とレイアウトソース/保存先を管理
- State: `githubAuth`, `layoutSource`, `layoutGistId`, `layoutGistFileKey`, `saveDestination`
- Getters: `isLoggedIn`, `username`, `avatarUrl`, `token`
- Actions: `setGitHubAuth`, `loadGitHubAuth`, `logoutGitHub`, `setLayoutSource`, `clearLayoutSource`, `setSaveDestination`, `resetToNew`

**useKeyboardStore** (`src/stores/keyboard.ts`) - 統合ファサード:
- 後方互換性のため、全ストアのState/Actionsをプロキシ
- 内部で分割ストアを使用
- すべてのState/Actionsを従来通りのAPIで提供

All mutations update `metadata.modified` timestamp and save to history automatically.

### Constants (`src/constants/`)

マジックナンバーや設定値は定数ファイルに集約:

**`app-config.ts`** - アプリケーション設定:
```typescript
APP_CONFIG.MAX_HISTORY_STATES  // 20 - 履歴の最大保持数
APP_CONFIG.MAX_LAYER_COUNT     // 16 - レイヤー数上限
APP_CONFIG.MIN_LAYER_COUNT     // 1 - レイヤー数下限
APP_CONFIG.MIN_KEY_SIZE        // 0.25 - キーサイズ最小値(u)
APP_CONFIG.DEFAULT_KEY_SIZE    // 1 - キーサイズデフォルト(u)
APP_CONFIG.MAX_KEY_X           // 50 - X座標最大値(u)
APP_CONFIG.MAX_KEY_Y           // 20 - Y座標最大値(u)
APP_CONFIG.MAX_KEY_WIDTH       // 15 - 幅の最大値(u)
APP_CONFIG.MAX_KEY_HEIGHT      // 5 - 高さの最大値(u)
APP_CONFIG.MAX_MATRIX_ROW      // 32 - マトリクスROW最大値
APP_CONFIG.MAX_MATRIX_COL      // 32 - マトリクスCOL最大値
APP_CONFIG.ROTATION_STEP           // 3 - 回転刻み(度)
APP_CONFIG.MOVE_STEP               // 0.25 - 移動/リサイズ刻み(u)
APP_CONFIG.MAX_LEGEND_LENGTH       // 10 - レジェンド最大文字数
APP_CONFIG.MAX_LAYOUT_NAME_LENGTH  // 50 - レイアウト名最大文字数
APP_CONFIG.MAX_AUTHOR_LENGTH       // 50 - 作者名最大文字数
APP_CONFIG.MAX_DESCRIPTION_LENGTH  // 200 - 説明最大文字数
```

**`rendering.ts`** - 描画関連定数:
```typescript
RENDERING.KEY_UNIT       // 54 - 1u = 54px
RENDERING.GRID_SIZE      // 0.25 - グリッドサイズ(u)
RENDERING.KEY_PADDING    // 4 - キー内部パディング(px)
RENDERING.BASE_FONT_SIZE // 10.8 - 1uキーの基準フォントサイズ(px)
RENDERING.SVG_PADDING    // 2 - SVGキャンバス余白(u)
RENDERING.KEY_TOP_INSET  // 4 - キートップ凹み幅(px)
```

**`storage.ts`** - ストレージキー:
```typescript
STORAGE_KEYS.GITHUB_AUTH       // 'kls-github-auth' - GitHub認証(localStorage)
STORAGE_KEYS.LAYOUT_PREFIX     // 'kls-layout-' - レイアウト保存プレフィックス
STORAGE_KEYS.OAUTH_STATE       // 'kls-oauth-state' - OAuth state(sessionStorage)
STORAGE_KEYS.OAUTH_REDIRECT_URI // 'kls-oauth-redirect-uri' - OAuth redirect URI
```

### Composables (`src/composables/`)

再利用可能なロジックをComposableに抽出:

**`useDragSelection.ts`** - ドラッグによる矩形選択:
- `isDragging` - ドラッグ中フラグ
- `selectionRect` - 選択矩形（ピクセル座標）
- `justFinishedDrag` - ドラッグ直後フラグ（クリック抑制用）
- `handleMouseDown/Move/Up` - マウスイベントハンドラ
- `resetDrag` - 状態リセット

**`useKeyboardShortcuts.ts`** - キーボードショートカット:
- マップベースでショートカットを管理（if/switch文排除）
- `createShortcuts(actions)` - ショートカット定義を生成
- `handleKeyboardEvent(event, shortcuts, hasSelection)` - イベント処理
- `useKeyboardShortcuts(actions, hasSelection)` - Composable本体

**`useKeyPropertyFields.ts`** - プロパティフィールドのバリデーション:
- `key-sanitizer.ts`のバリデーション/サニタイズロジックを使用
- `NUMERIC_FIELD_DEFINITIONS` - 数値フィールドの定義（parse, validate, transform）
- `processNumericField(fieldName, rawValue)` - 入力値の処理
- `getNumericFieldUpdate/getMatrixFieldUpdate/getLegendFieldUpdate/getKeycodeFieldUpdate` - 更新データ生成

**`useToast.ts`** - トースト通知:
- シングルトンパターンでアプリ全体で共有
- `showToast(message, type, duration)` - トースト表示
- `hideToast()` - トースト非表示
- `useToast()` - Composable本体（状態とメソッドを返す）

### Data Model (`src/types/keyboard.ts`)

**Key coordinates and dimensions use "u" units** (1u = standard keycap size = 54px):

```typescript
interface Key {
  id: string
  x: number              // Position in u units (min: 0)
  y: number              // Position in u units (min: 0)
  width: number          // Size in u units (min: 0.25)
  height: number         // Size in u units (min: 0.25)
  legend: KeyLegend      // 9 text positions on keycap
  matrix: KeyMatrix      // Row/Col pin assignment
  keycodes?: Record<number, string>  // Layer number → QMK keycode
  rotation?: number      // Rotation angle (degrees) - rotates around key center
  shape?: KeyShape       // 'rectangle' | 'iso-enter' | 'big-ass-enter' | 'circle'
}

interface KeyboardLayout {
  name: string
  keys: Key[]
  layerCount: number     // Total layers (1-16)
  legendFont?: LegendFont // Font for legend text (Google Fonts)
  metadata?: {
    author?: string
    description?: string
    created?: string
    modified?: string
  }
}

type LegendFont =
  // Gothic
  | 'Noto Sans JP' | 'M PLUS 1p' | 'M PLUS 2' | 'Zen Kaku Gothic New'
  // Rounded
  | 'M PLUS Rounded 1c' | 'Zen Maru Gothic' | 'Kosugi Maru'
  // Mincho
  | 'Noto Serif JP' | 'Zen Old Mincho' | 'Shippori Mincho'
```

**KeyLegend** supports 9 positions in a 3x3 grid: topLeft, topCenter, topRight, centerLeft, center, centerRight, bottomLeft, bottomCenter, bottomRight.

**KeyMatrix** contains optional `row` and `col` numbers for physical matrix pin assignments.

**KeyShape** determines visual rendering. Special shapes (iso-enter, big-ass-enter, circle) have fixed dimensions and cannot be resized.

### GitHub Types (`src/types/github.ts`)

```typescript
type StorageSource = 'new' | 'local' | 'gist'  // Layout source tracking

interface GitHubAuth {
  token: string
  username: string
  avatarUrl?: string
}

interface GistFile {
  filename: string
  type: string
  language: string | null
  raw_url: string
  size: number
  content?: string
}

interface Gist {
  id: string
  url: string
  html_url: string
  description: string | null
  files: Record<string, GistFile>
  public: boolean
  created_at: string
  updated_at: string
}

interface SavedLayoutItem {
  id: string             // localStorage key or gist ID
  filename: string       // Display name
  description: string
  updatedAt: string      // ISO timestamp
  source: StorageSource
  gistFileKey?: string   // File key within Gist
}

interface GitHubUser {
  login: string
  avatar_url: string
  html_url: string
}
```

### Persistence Types (`src/types/persistence.ts`)

永続化対象とランタイム専用の状態を型レベルで区別:

```typescript
// 永続化対象（LocalStorage/Gistに保存）
interface PersistedLayout {
  name: string
  keys: Key[]
  layerCount: number
  legendFont?: LegendFont
  metadata?: LayoutMetadata
}

// ランタイム専用（セッション終了時に破棄）
interface EditorState {
  selectedKeyIds: string[]
  displayMode: 'legend' | 'matrix'
  keyboardLayout: 'ANSI' | 'JIS'
  copiedKeys: Key[]
  currentLayer: number
}

interface HistoryState {
  snapshots: PersistedLayout[]
  currentIndex: number
}

interface AuthState {
  githubAuth: GitHubAuth | null
  layoutSource: StorageSource
  layoutGistId: string | null
  layoutGistFileKey: string | null
  saveDestination: 'local' | 'gist'
}
```

ユーティリティ関数:
- `extractPersistedLayout(layout)` - KeyboardLayoutから永続化データを抽出
- `isValidPersistedLayout(data)` - 型ガード
- `createInitialEditorState/HistoryState/AuthState()` - 初期値生成

### Component Structure

**App.vue**:
- Main application layout with header and tab system
- Handles LocalStorage save/load operations (prefix: `kls-layout-`)
- Layout/JSON tabs with dialog management (new layout, open, delete confirmation)
- Save notification toast

**KeyboardCanvas** (`src/components/KeyboardCanvas.vue`):
- Renders SVG canvas with 0.25u grid lines
- Handles keyboard shortcuts (arrow keys, R for rotation, Ctrl+C/V/Z/Y, Tab, Delete)
- Multi-select support (Ctrl+click to toggle, click empty space to clear)
- Canvas click deselects, key click selects
- SVG size auto-expands based on key positions + 2u padding
- Screenshot mode button (opens ScreenshotDialog)

**KeyComponent** (`src/components/KeyComponent.vue`):
- Renders individual key as SVG group
- Supports multiple shapes: rectangle (default), iso-enter, big-ass-enter, circle
- Supports key rotation (SVG transform around key center)
- Displays legend text in 3x3 grid positions with configurable font
- Shows matrix info (R{row}C{col}) or keycode based on display mode
- Visual state changes when selected (blue stroke)

**PropertyPanel** (`src/components/PropertyPanel.vue`):
- When no selection: Shows layout metadata editor (name, author, description, stats, legend font selector)
- When single key selected: Shows key property editors
  - Shape selector (with fixed-size warning for special shapes)
  - Position (x, y) and size (width, height) inputs with Enter→next field navigation
  - Rotation input (degrees, step 3°)
  - Legend inputs (9 positions in 3x3 grid) with font preview
  - Matrix assignment (ROW, COL)
  - Keycode input with picker dialog button (per current layer)
  - Layer switcher (tabs) with ±buttons
- When multiple keys selected: Shows info message only

**JsonEditor** (`src/components/JsonEditor.vue`):
- Direct JSON editing of layout data
- Import/Export buttons:
  - Import from KLE JSON (keyboard-layout-editor.com format)
  - Export to QMK keyboard.json format (with keymap layers)
  - Export to Vial vial.json format
  - Download KLS native format (.kls.json)
- Real-time validation with error display

**MetadataEditor** (`src/components/MetadataEditor.vue`):
- Standalone component for editing layout name, author, description

**KeycodePickerDialog** (`src/components/KeycodePickerDialog.vue`):
- Modal dialog for selecting QMK keycodes
- Categories: Basic, Modifiers, Functions, Layers, etc.
- Search/filter functionality

**ConfirmDialog** (`src/components/ConfirmDialog.vue`):
- Reusable confirmation dialog for destructive actions

**SavedListDialog** (`src/components/SavedListDialog.vue`):
- Displays saved layouts from LocalStorage and GitHub Gist (tabbed UI)
- Shows local vs Gist source indicator
- Delete and select actions
- Login prompt for Gist tab when not authenticated

**GitHubLoginDialog** (`src/components/GitHubLoginDialog.vue`):
- Modal dialog for GitHub authentication
- Initiates GitHub OAuth flow via `startOAuthFlow()`
- Checks if GitHub integration is configured before starting flow
- Shows loading state during authentication
- Displays error messages on failure

**GitHubUserBadge** (`src/components/GitHubUserBadge.vue`):
- Shows authenticated GitHub user info in header
- Displays avatar image, username
- Logout button emits event to parent

**AboutDialog** (`src/components/AboutDialog.vue`):
- Application information dialog
- Displays version number (auto-loaded from package.json via Vite define) and GitHub link

**ScreenshotDialog** (`src/components/ScreenshotDialog.vue`):
- Screenshot mode for capturing keyboard layout images
- Full-size SVG rendering without grid lines or selection
- Optional title/author display below keyboard
- Dark background optimized for screenshots

### Services

**`src/services/github.ts`**:
- `isGitHubIntegrationConfigured()` - Check if GitHub integration env vars are set
- `GITHUB_NOT_CONFIGURED_MESSAGE` - Error message for unconfigured GitHub integration
- `GitHubAPIError` class - Custom error class with HTTP status code
- `GitHubService` class - GitHub API wrapper for Gist operations
  - `validateToken()` - Validate token and get user info
  - `listGists()` - List user's gists
  - `getGist(gistId)` - Get single gist with content
  - `createGist(filename, content, description, isPublic)` - Create new gist
  - `updateGist(gistId, filename, content, description?)` - Update existing gist
  - `deleteGist(gistId)` - Delete gist
- `startOAuthFlow(clientId, redirectUri, scope)` - Start GitHub OAuth flow
- `exchangeCodeForToken(code, workerUrl?)` - Exchange OAuth code for token via Worker
- `filterKLSGists(gists)` - Filter gists containing `.kls.json` files
- `getGitHubErrorMessage(error)` - Convert errors to user-friendly messages (Japanese)

### Utilities

**`src/utils/key-sanitizer.ts`** - キーのバリデーション/サニタイズ:
- `KEY_FIELD_CONSTRAINTS` - x, y, width, heightの制約定義
- `MATRIX_FIELD_CONSTRAINTS` - row, colの制約定義
- `TEXT_FIELD_CONSTRAINTS` - legend, layoutName, author, descriptionの制約定義
- `validateNumericField(fieldName, value)` - 数値フィールドのバリデーション
- `sanitizeNumericField(fieldName, value)` - 数値フィールドのサニタイズ（範囲内にクランプ）
- `validateTextField(fieldName, value)` - テキストフィールドのバリデーション
- `sanitizeTextField(fieldName, value)` - テキストフィールドのサニタイズ（最大長で切り詰め）
- `normalizeRotation(value)` - 回転角度の正規化（-180〜180度）
- `sanitizeKeyGeometry(key)` - キー全体のサニタイズ（loadLayoutで使用）
- `getFieldErrorMessage(fieldName)` - 数値フィールドのエラーメッセージ取得
- `getTextFieldErrorMessage(fieldName)` - テキストフィールドのエラーメッセージ取得

**`src/utils/export.ts`**:
- `exportToQMK(layout)` - Convert to QMK keyboard.json with keymap layers
- `exportToVial(layout)` - Convert to Vial vial.json format
- `downloadJSON(content, filename)` - Trigger browser download

**`src/utils/kle-import.ts`**:
- `parseKLEJson(jsonString)` - Parse KLE JSON string
- `convertKLEToKLS(kleData)` - Convert KLE array format to KLS layout
- `parseKLELabel(label, alignment)` - Map KLE label positions (12 positions) to KLS (9 positions)
- Supports KLE metadata extraction (name, author, notes)
- **Note**: KLE alignment values other than 4 are not fully supported

**`src/data/keycodes.ts`**:
- QMK keycode definitions organized by category

**`src/data/keycode-labels.ts`**:
- Keycode display labels for ANSI/JIS layouts
- `getKeycodeLabel(keycode, layoutType)` - Convert QMK keycode to display label
- Maps keycodes to appropriate symbols based on keyboard layout type

**`src/data/shape-presets.ts`**:
- Predefined shape configurations for special keys

**`src/templates/`**:
- Template JSON files for QMK, Vial, and default layouts
- Used for export functionality and initial layout generation

### Rendering Constants

See `src/constants/rendering.ts` for all rendering constants:
- **1u = 54px** (`RENDERING.KEY_UNIT`)
- **Grid = 0.25u** (13.5px) - minimum movement/resize increment (`RENDERING.GRID_SIZE`)
- **Padding = 4px** - internal key padding for top surface (`RENDERING.KEY_PADDING`)

### Keyboard Shortcuts

When canvas has focus:
- **Arrow keys**: Move selected keys by 0.25u
- **Shift + Arrow keys**: Resize selected keys by 0.25u
- **R**: Rotate selected keys by +3°
- **Shift + R**: Rotate selected keys by -3°
- **Ctrl + C**: Copy selected keys
- **Ctrl + V**: Paste copied keys
- **Ctrl + Z**: Undo
- **Ctrl + Y / Ctrl + Shift + Z**: Redo
- **Tab**: Select next key
- **Delete / Backspace**: Delete selected keys
- **Ctrl + Click**: Toggle key selection (multi-select)

## Current Features

✅ SVG-based keyboard layout editor
✅ Key selection, movement (grid-based), resizing, rotation
✅ Multi-select support (Ctrl+click)
✅ Copy/paste (Ctrl+C/V) with relative positioning
✅ Undo/redo (Ctrl+Z/Y) with 20-state history
✅ Key legends (9 positions in 3x3 grid) with font selection (10 Google Fonts)
✅ Key matrix assignment (ROW/COL)
✅ Multi-layer support (1-16 layers) with per-layer keycodes
✅ QMK keycode picker dialog
✅ Display mode toggle (legend/matrix)
✅ Keyboard layout type selection (ANSI/JIS) with appropriate keycode labels
✅ Key shapes: rectangle, iso-enter, big-ass-enter, circle
✅ LocalStorage persistence with save/load/delete
✅ GitHub Gist integration (OAuth authentication)
✅ Save destination toggle (Local/Gist)
✅ JSON editor with live validation
✅ Import from KLE (keyboard-layout-editor.com) format
✅ Export to QMK keyboard.json, Vial vial.json, and QMK keymap.c formats
✅ Layout metadata (name, author, description, timestamps)
✅ Screenshot mode for capturing layout images
✅ Dark theme UI with Tailwind CSS

## Design Principles

1. **Primarily client-side**: Main app is static, only OAuth token exchange uses Cloudflare Worker
2. **Minimal dependencies**: Only Vue 3, Pinia, Tailwind CSS, TypeScript
3. **Type safety**: Strict TypeScript mode, no `any` types
4. **Simple over clever**: Avoid premature abstractions
5. **Keyboard-first**: Efficient keyboard shortcuts for all common operations

## Future Considerations

See design.md for rationale and technical decisions.

Potential enhancements (not prioritized):
- Drag-and-drop key positioning (currently keyboard/input only)
- Zoom and pan for large layouts
- Ruler and measurement tools
- Snap-to-grid toggle
- Light/dark theme toggle
- Export to other firmware formats (ZMK, etc.)

## Important Notes

- All position/size values in the data model are in **u units**, converted to pixels only during rendering
- **バリデーション/サニタイズは`key-sanitizer.ts`に一元化**:
  - `loadLayout`時に自動でサニタイズ（JSON編集、KLEインポート、LocalStorage/Gist読み込みすべてに適用）
  - キーの座標・サイズ、メタデータ（レイアウト名、作者名、説明）が対象
  - 不正な値は有効範囲にクランプ/切り詰めされ、修正があった場合はトースト通知で表示
  - PropertyPanelの入力バリデーションも同じロジックを使用
- Key IDs are generated using `Date.now() + index` - sufficient for single-user editing
- The store uses deep cloning for history snapshots to prevent reference sharing
- Special shapes (iso-enter, big-ass-enter, circle) have fixed dimensions and cannot be resized via UI
- SVG rendering uses Tailwind classes where possible, with inline styles for dynamic properties (transform, dimensions)
- History is cleared when loading a new layout to prevent memory leaks
- LocalStorage keys use prefix `kls-layout-` + layout name
- GitHub auth is stored in localStorage with key `kls-github-auth`
- OAuth state and redirect URI stored in sessionStorage during OAuth flow
- Gist files use `.kls.json` extension for identification

## Cloudflare Worker (OAuth Token Exchange)

Located in `workers/oauth-token-exchange/`:
- Handles GitHub OAuth code-to-token exchange (required due to CORS restrictions)
- Endpoints:
  - `GET /` - Health check, returns `{"status":"ok","message":"KLS Token Exchange Worker"}`
  - `POST /api/oauth/token` - Token exchange, expects `{ code, redirect_uri }`
- Environment secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- See `doc/WORKERS_DEPLOY.md` for detailed deployment instructions

**Environments:**
GitHub OAuth Appは1つのRedirect URLしか設定できないため、開発用と本番用で別々のOAuth Appが必要。
Workerも環境ごとに分離されている:
- 本番環境: `kls-oauth-worker` (`npx wrangler deploy`)
- 開発環境: `kls-oauth-worker-development` (`npx wrangler deploy --env development`)

**Deploy commands:**
```bash
cd workers/oauth-token-exchange

# 本番環境（本番用OAuth AppのCredentialを使用）
npx wrangler deploy
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET

# 開発環境（開発用OAuth AppのCredentialを使用）
npx wrangler deploy --env development
npx wrangler secret put GITHUB_CLIENT_ID --env development
npx wrangler secret put GITHUB_CLIENT_SECRET --env development
```

**Environment variables for the SPA** (in `.env.development` and `.env.production`):
- `VITE_GITHUB_CLIENT_ID` - GitHub OAuth App client ID (環境ごとに異なる)
- `VITE_OAUTH_WORKER_URL` - URL of the deployed Cloudflare Worker (環境ごとに異なる)

**Note**: If these environment variables are not set, GitHub integration features are disabled gracefully. The `isGitHubIntegrationConfigured()` function checks for their presence.
