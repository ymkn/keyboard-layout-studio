# Architecture

## Tech Stack

- **Vue 3** - Progressive JavaScript framework (Composition API)
- **TypeScript** - Type-safe development (strict mode)
- **Pinia** - State management
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool

## Directory Structure

```
src/
├── components/        # Vue components
├── composables/       # Reusable composition functions
├── constants/         # Application constants
├── data/              # Static data (keycodes, presets)
├── services/          # External services (GitHub API)
├── stores/            # Pinia stores
├── templates/         # Export templates (QMK, Vial)
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Data Model

All coordinates and dimensions use **"u" units** (1u = standard keycap size = 54px).

### Key

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
  rotation?: number      // Rotation angle (degrees)
  shape?: KeyShape       // 'rectangle' | 'iso-enter' | 'big-ass-enter' | 'circle'
}
```

### KeyboardLayout

```typescript
interface KeyboardLayout {
  name: string
  keys: Key[]
  layerCount: number     // Total layers (1-16)
  legendFont?: LegendFont
  metadata?: {
    author?: string
    description?: string
    created?: string
    modified?: string
  }
}
```

### Supporting Types

- **KeyLegend**: 9 positions in 3x3 grid (topLeft, topCenter, topRight, centerLeft, center, centerRight, bottomLeft, bottomCenter, bottomRight)
- **KeyMatrix**: Optional `row` and `col` numbers for physical matrix pin assignments
- **KeyShape**: Visual rendering type - special shapes have fixed dimensions
- **LegendFont**: 10 Google Fonts (Gothic, Rounded, Mincho families)

## State Management

Stores are split by responsibility. `keyboard.ts` serves as a unified facade for backward compatibility.

### Store Structure

```
stores/
├── keyboard.ts   # Unified facade (backward compatibility)
├── layout.ts     # Persisted layout data and key operations
├── editor.ts     # Selection, display mode, clipboard (session-only)
├── history.ts    # Undo/Redo history (session-only)
└── auth.ts       # GitHub auth, source/destination management
```

### useLayoutStore (`layout.ts`)

Manages persisted layout data.

**State**: `layout`

**Getters**: `keys`, `layerCount`, `layoutName`, `legendFont`, `metadata`

**Actions**:
- `updateKey`, `moveKeys`, `resizeKeys`, `rotateKeys`
- `addKey`, `deleteKeys`, `addKeys`
- `loadLayout`, `setLayout`, `createNewLayout`
- `updateMetadata`, `setLegendFont`
- `incrementLayerCount`, `decrementLayerCount`
- `getKeyById`, `getKeysByIds`

### useEditorStore (`editor.ts`)

Manages UI state (discarded on session end).

**State**: `selectedKeyIds`, `displayMode`, `keyboardLayout`, `copiedKeys`, `currentLayer`

**Getters**: `selectedKey`, `selectedKeys`, `hasSelection`, `hasSingleSelection`, `hasMultipleSelection`

**Actions**:
- `selectKey`, `toggleKeySelection`, `selectMultipleKeys`, `clearSelection`, `selectNextKey`
- `toggleDisplayMode`, `setKeyboardLayout`
- `copySelectedKeys`, `getCopiedKeys`, `hasCopiedKeys`
- `setCurrentLayer`, `resetCurrentLayerIfNeeded`, `resetState`

### useHistoryStore (`history.ts`)

Manages Undo/Redo history.

**State**: `snapshots`, `currentIndex`

**Getters**: `canUndo`, `canRedo`

**Actions**: `saveSnapshot`, `undo`, `redo`, `clearHistory`, `initializeHistory`, `setupLayoutWatcher`

### useAuthStore (`auth.ts`)

Manages GitHub authentication and layout source/destination.

**State**: `githubAuth`, `layoutSource`, `layoutGistId`, `layoutGistFileKey`, `saveDestination`

**Getters**: `isLoggedIn`, `username`, `avatarUrl`, `token`

**Actions**: `setGitHubAuth`, `loadGitHubAuth`, `logoutGitHub`, `setLayoutSource`, `clearLayoutSource`, `setSaveDestination`, `resetToNew`

### Store Usage

New code should use individual stores directly:

```typescript
import { useLayoutStore } from '@/stores/layout'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { useAuthStore } from '@/stores/auth'
```

Existing code can continue using the unified facade:

```typescript
import { useKeyboardStore } from '@/stores/keyboard'
```

## Constants

### app-config.ts

Application settings:

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_HISTORY_STATES` | 20 | Maximum undo/redo history |
| `MAX_LAYER_COUNT` | 16 | Maximum layers |
| `MIN_LAYER_COUNT` | 1 | Minimum layers |
| `MIN_KEY_SIZE` | 0.25 | Minimum key size (u) |
| `DEFAULT_KEY_SIZE` | 1 | Default key size (u) |
| `MAX_KEY_X` | 50 | Maximum X coordinate (u) |
| `MAX_KEY_Y` | 20 | Maximum Y coordinate (u) |
| `MAX_KEY_WIDTH` | 15 | Maximum width (u) |
| `MAX_KEY_HEIGHT` | 5 | Maximum height (u) |
| `MAX_MATRIX_ROW` | 32 | Maximum matrix row |
| `MAX_MATRIX_COL` | 32 | Maximum matrix col |
| `ROTATION_STEP` | 3 | Rotation step (degrees) |
| `MOVE_STEP` | 0.25 | Move/resize step (u) |
| `MAX_LEGEND_LENGTH` | 10 | Maximum legend characters |
| `MAX_LAYOUT_NAME_LENGTH` | 50 | Maximum layout name length |
| `MAX_AUTHOR_LENGTH` | 50 | Maximum author name length |
| `MAX_DESCRIPTION_LENGTH` | 200 | Maximum description length |

### rendering.ts

Rendering constants:

| Constant | Value | Description |
|----------|-------|-------------|
| `KEY_UNIT` | 54 | 1u = 54px |
| `GRID_SIZE` | 0.25 | Grid size (u) |
| `KEY_PADDING` | 4 | Internal key padding (px) |
| `BASE_FONT_SIZE` | 10.8 | Base font size for 1u key (px) |
| `SVG_PADDING` | 2 | SVG canvas margin (u) |
| `KEY_TOP_INSET` | 4 | Key top inset width (px) |

### storage.ts

Storage keys:

| Constant | Value | Description |
|----------|-------|-------------|
| `GITHUB_AUTH` | `kls-github-auth` | GitHub auth (localStorage) |
| `LAYOUT_PREFIX` | `kls-layout-` | Layout save prefix |
| `OAUTH_STATE` | `kls-oauth-state` | OAuth state (sessionStorage) |
| `OAUTH_REDIRECT_URI` | `kls-oauth-redirect-uri` | OAuth redirect URI |

## Composables

### useDragSelection.ts

Drag selection for rectangle selection:

- `isDragging` - Dragging flag
- `selectionRect` - Selection rectangle (pixel coordinates)
- `justFinishedDrag` - Just finished drag flag (for click suppression)
- `handleMouseDown/Move/Up` - Mouse event handlers
- `resetDrag` - State reset

### useKeyboardShortcuts.ts

Keyboard shortcuts with map-based management:

- `createShortcuts(actions)` - Generate shortcut definitions
- `handleKeyboardEvent(event, shortcuts, hasSelection)` - Event handling
- `useKeyboardShortcuts(actions, hasSelection)` - Composable main

### useKeyPropertyFields.ts

Property field validation using `key-sanitizer.ts`:

- `NUMERIC_FIELD_DEFINITIONS` - Numeric field definitions
- `processNumericField(fieldName, rawValue)` - Process input value
- `getNumericFieldUpdate/getMatrixFieldUpdate/getLegendFieldUpdate/getKeycodeFieldUpdate` - Generate update data

### useToast.ts

Toast notification (singleton pattern):

- `showToast(message, type, duration)` - Show toast
- `hideToast()` - Hide toast
- `useToast()` - Composable main

## Component Structure

### App.vue

Main application layout with header and tab system. Handles LocalStorage save/load operations.

### KeyboardCanvas.vue

- SVG canvas with 0.25u grid lines
- Keyboard shortcuts handling
- Multi-select support (Ctrl+click)
- Auto-expanding SVG size based on key positions

### KeyComponent.vue

- Individual key rendering as SVG group
- Multiple shapes support
- Key rotation (SVG transform)
- Legend text in 3x3 grid with configurable font
- Matrix info or keycode display based on display mode

### PropertyPanel.vue

- No selection: Layout metadata editor
- Single key: Key property editors (shape, position, size, rotation, legend, matrix, keycode)
- Multiple keys: Info message only

### JsonEditor.vue

- Direct JSON editing
- Import from KLE format
- Export to QMK/Vial formats
- Download KLS native format

### Dialog Components

- **KeycodePickerDialog**: QMK keycode selection
- **ConfirmDialog**: Confirmation for destructive actions
- **SavedListDialog**: Saved layouts from LocalStorage/Gist
- **GitHubLoginDialog**: GitHub OAuth authentication
- **AboutDialog**: Application information
- **ScreenshotDialog**: Screenshot capture mode

## Services

### github.ts

GitHub API operations:

- `isGitHubIntegrationConfigured()` - Check env vars
- `GitHubService` class - Gist CRUD operations
- `startOAuthFlow()` - Start OAuth flow
- `exchangeCodeForToken()` - Exchange code for token via Worker
- `filterKLSGists()` - Filter `.kls.json` gists
- `getGitHubErrorMessage()` - Error message conversion (Japanese)

## Utilities

### key-sanitizer.ts

Centralized validation/sanitization:

- `KEY_FIELD_CONSTRAINTS` - x, y, width, height constraints
- `MATRIX_FIELD_CONSTRAINTS` - row, col constraints
- `TEXT_FIELD_CONSTRAINTS` - legend, layoutName, author, description constraints
- `validateNumericField/sanitizeNumericField` - Numeric field handling
- `validateTextField/sanitizeTextField` - Text field handling
- `normalizeRotation` - Rotation normalization (-180 to 180)
- `sanitizeKeyGeometry` - Full key sanitization (used in loadLayout)
- `getFieldErrorMessage/getTextFieldErrorMessage` - Error messages

### export.ts

Export utilities:

- `exportToQMK()` - Convert to QMK keyboard.json
- `exportToVial()` - Convert to Vial vial.json
- `downloadJSON()` - Trigger browser download

### kle-import.ts

KLE format import:

- `parseKLEJson()` - Parse KLE JSON string
- `convertKLEToKLS()` - Convert KLE to KLS format
- `parseKLELabel()` - Map KLE positions to KLS positions

## Persistence

### Persisted Data (LocalStorage/Gist)

```typescript
interface PersistedLayout {
  name: string
  keys: Key[]
  layerCount: number
  legendFont?: LegendFont
  metadata?: LayoutMetadata
}
```

### Runtime-only State (Session-scoped)

- `EditorState` - Selection, display mode, clipboard, current layer
- `HistoryState` - Undo/Redo snapshots
- `AuthState` - GitHub auth, layout source (except githubAuth which is separately persisted)

## Design Principles

1. **Primarily client-side** - Main app is static, only OAuth token exchange uses Cloudflare Worker
2. **Minimal dependencies** - Only Vue 3, Pinia, Tailwind CSS, TypeScript
3. **Type safety** - Strict TypeScript mode, no `any` types
4. **Simple over clever** - Avoid premature abstractions
5. **Keyboard-first** - Efficient keyboard shortcuts for all common operations
6. **Centralized validation** - All validation/sanitization in `key-sanitizer.ts`
7. **Clear state separation** - Persisted vs runtime-only state clearly distinguished
