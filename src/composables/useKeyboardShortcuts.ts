/**
 * キーボードショートカット機能のComposable
 *
 * キーボードショートカットをマップベースで管理し、
 * if/switch文の連鎖を排除します。
 */
import { APP_CONFIG } from '../constants/app-config'

/**
 * キーボードショートカットハンドラーの型
 */
export type ShortcutHandler = () => void

/**
 * ショートカットの条件を表す型
 */
export interface ShortcutCondition {
  key: string
  ctrl?: boolean
  shift?: boolean
  meta?: boolean
  /** 選択が必要かどうか */
  requiresSelection?: boolean
}

/**
 * ショートカット定義
 */
export interface ShortcutDefinition {
  condition: ShortcutCondition
  handler: ShortcutHandler
  preventDefault?: boolean
}

/**
 * ストアのアクション型
 */
export interface KeyboardActions {
  undo: () => void
  redo: () => void
  moveSelectedKeys: (dx: number, dy: number) => void
  resizeSelectedKeys: (dw: number, dh: number) => void
  deleteSelectedKeys: () => void
  copySelectedKeys: () => void
  pasteKeys: () => void
  rotateSelectedKeys: (angle: number) => void
}

/**
 * ショートカット条件がイベントにマッチするか確認
 */
function matchesCondition(event: KeyboardEvent, condition: ShortcutCondition): boolean {
  // キーの比較（大文字小文字を区別しない）
  if (event.key.toLowerCase() !== condition.key.toLowerCase()) {
    return false
  }

  // 修飾キーの確認
  const ctrlOrMeta = event.ctrlKey || event.metaKey
  if (condition.ctrl && !ctrlOrMeta) return false
  if (condition.ctrl === false && ctrlOrMeta) return false

  if (condition.shift !== undefined) {
    if (condition.shift && !event.shiftKey) return false
    if (!condition.shift && event.shiftKey) return false
  }

  return true
}

/**
 * キーボードショートカットの定義を作成
 */
export function createShortcuts(
  actions: KeyboardActions
): ShortcutDefinition[] {
  const step = APP_CONFIG.MOVE_STEP
  const rotationStep = APP_CONFIG.ROTATION_STEP

  return [
    // Undo/Redo（選択不要）
    {
      condition: { key: 'z', ctrl: true, shift: false },
      handler: actions.undo,
      preventDefault: true
    },
    {
      condition: { key: 'y', ctrl: true },
      handler: actions.redo,
      preventDefault: true
    },
    {
      condition: { key: 'z', ctrl: true, shift: true },
      handler: actions.redo,
      preventDefault: true
    },

    // 移動（選択必要）
    {
      condition: { key: 'ArrowUp', shift: false, requiresSelection: true },
      handler: () => actions.moveSelectedKeys(0, -step),
      preventDefault: true
    },
    {
      condition: { key: 'ArrowDown', shift: false, requiresSelection: true },
      handler: () => actions.moveSelectedKeys(0, step),
      preventDefault: true
    },
    {
      condition: { key: 'ArrowLeft', shift: false, requiresSelection: true },
      handler: () => actions.moveSelectedKeys(-step, 0),
      preventDefault: true
    },
    {
      condition: { key: 'ArrowRight', shift: false, requiresSelection: true },
      handler: () => actions.moveSelectedKeys(step, 0),
      preventDefault: true
    },

    // サイズ変更（選択必要）
    {
      condition: { key: 'ArrowUp', shift: true, requiresSelection: true },
      handler: () => actions.resizeSelectedKeys(0, -step),
      preventDefault: true
    },
    {
      condition: { key: 'ArrowDown', shift: true, requiresSelection: true },
      handler: () => actions.resizeSelectedKeys(0, step),
      preventDefault: true
    },
    {
      condition: { key: 'ArrowLeft', shift: true, requiresSelection: true },
      handler: () => actions.resizeSelectedKeys(-step, 0),
      preventDefault: true
    },
    {
      condition: { key: 'ArrowRight', shift: true, requiresSelection: true },
      handler: () => actions.resizeSelectedKeys(step, 0),
      preventDefault: true
    },

    // 削除（選択必要）
    {
      condition: { key: 'Delete', requiresSelection: true },
      handler: actions.deleteSelectedKeys,
      preventDefault: true
    },
    {
      condition: { key: 'Backspace', requiresSelection: true },
      handler: actions.deleteSelectedKeys,
      preventDefault: true
    },

    // コピー/ペースト（選択必要）
    {
      condition: { key: 'c', ctrl: true, requiresSelection: true },
      handler: actions.copySelectedKeys,
      preventDefault: true
    },
    {
      condition: { key: 'v', ctrl: true, requiresSelection: true },
      handler: actions.pasteKeys,
      preventDefault: true
    },

    // 回転（選択必要）
    {
      condition: { key: 'r', shift: false, requiresSelection: true },
      handler: () => actions.rotateSelectedKeys(rotationStep),
      preventDefault: true
    },
    {
      condition: { key: 'r', shift: true, requiresSelection: true },
      handler: () => actions.rotateSelectedKeys(-rotationStep),
      preventDefault: true
    }
  ]
}

/**
 * キーボードイベントを処理
 */
export function handleKeyboardEvent(
  event: KeyboardEvent,
  shortcuts: ShortcutDefinition[],
  hasSelection: boolean
): boolean {
  for (const shortcut of shortcuts) {
    // 選択が必要なショートカットで選択がない場合はスキップ
    if (shortcut.condition.requiresSelection && !hasSelection) {
      continue
    }

    if (matchesCondition(event, shortcut.condition)) {
      if (shortcut.preventDefault) {
        event.preventDefault()
      }
      shortcut.handler()
      return true
    }
  }

  return false
}

/**
 * キーボードショートカット機能を提供するComposable
 */
export function useKeyboardShortcuts(
  actions: KeyboardActions,
  hasSelection: () => boolean
) {
  const shortcuts = createShortcuts(actions)

  function handleKeyDown(event: KeyboardEvent): void {
    handleKeyboardEvent(event, shortcuts, hasSelection())
  }

  return {
    handleKeyDown,
    shortcuts
  }
}
