/**
 * 永続化関連の型定義
 *
 * このファイルでは永続化対象のデータとランタイム専用の状態を
 * 型レベルで明確に区別するための定義を提供します。
 */

import type { Key, KeyboardLayout, LegendFont } from './keyboard'
import type { StorageSource, GitHubAuth } from './github'

// ============================================================================
// 永続化対象のデータモデル
// ============================================================================

/**
 * レイアウトメタデータ（永続化対象）
 */
export interface LayoutMetadata {
  author?: string
  description?: string
  created?: string
  modified?: string
}

/**
 * 永続化対象のレイアウトデータ
 *
 * LocalStorage/Gistに保存されるデータはこの型に準拠します。
 * KeyboardLayoutと同一構造ですが、明示的に永続化対象であることを示します。
 */
export interface PersistedLayout {
  name: string
  keys: Key[]
  layerCount: number
  legendFont?: LegendFont
  metadata?: LayoutMetadata
}

// ============================================================================
// ランタイム専用の状態（永続化されない）
// ============================================================================

/**
 * エディタのUI状態
 * セッション終了時に破棄される一時的な状態
 */
export interface EditorState {
  /** 選択中のキーID配列 */
  selectedKeyIds: string[]
  /** 表示モード（legend/matrix） */
  displayMode: 'legend' | 'matrix'
  /** キーボードレイアウトタイプ（ANSI/JIS） */
  keyboardLayout: 'ANSI' | 'JIS'
  /** クリップボードにコピーされたキー */
  copiedKeys: Key[]
  /** 現在編集中のレイヤー番号 */
  currentLayer: number
}

/**
 * undo/redo履歴の状態
 * セッション内でのみ有効
 */
export interface HistoryState {
  /** 履歴のスナップショット配列 */
  snapshots: PersistedLayout[]
  /** 現在の履歴位置 */
  currentIndex: number
}

/**
 * 認証・保存先の状態
 * GitHubAuthは別途LocalStorageに永続化されるが、
 * layoutSourceなどはセッション内でのみ有効
 */
export interface AuthState {
  /** GitHub認証情報（別途永続化） */
  githubAuth: GitHubAuth | null
  /** レイアウトの読み込み元 */
  layoutSource: StorageSource
  /** GistのID（Gistから読み込んだ場合） */
  layoutGistId: string | null
  /** Gist内のファイルキー */
  layoutGistFileKey: string | null
  /** 保存先設定 */
  saveDestination: 'local' | 'gist'
}

// ============================================================================
// ユーティリティ関数
// ============================================================================

/**
 * KeyboardLayoutからPersistedLayoutを抽出
 * 永続化時に使用
 */
export function extractPersistedLayout(layout: KeyboardLayout): PersistedLayout {
  return {
    name: layout.name,
    keys: layout.keys,
    layerCount: layout.layerCount,
    legendFont: layout.legendFont,
    metadata: layout.metadata
  }
}

/**
 * PersistedLayoutがKeyboardLayoutと互換性があることを検証
 * TypeScriptの型チェックで保証
 */
export function isValidPersistedLayout(data: unknown): data is PersistedLayout {
  if (typeof data !== 'object' || data === null) return false

  const layout = data as Record<string, unknown>

  return (
    typeof layout.name === 'string' &&
    Array.isArray(layout.keys) &&
    typeof layout.layerCount === 'number'
  )
}

/**
 * EditorStateの初期値を生成
 */
export function createInitialEditorState(): EditorState {
  return {
    selectedKeyIds: [],
    displayMode: 'matrix',
    keyboardLayout: 'ANSI',
    copiedKeys: [],
    currentLayer: 0
  }
}

/**
 * HistoryStateの初期値を生成
 */
export function createInitialHistoryState(): HistoryState {
  return {
    snapshots: [],
    currentIndex: -1
  }
}

/**
 * AuthStateの初期値を生成
 */
export function createInitialAuthState(): AuthState {
  return {
    githubAuth: null,
    layoutSource: 'new',
    layoutGistId: null,
    layoutGistFileKey: null,
    saveDestination: 'local'
  }
}
