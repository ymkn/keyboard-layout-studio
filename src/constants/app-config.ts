/**
 * アプリケーション設定の定数
 */
export const APP_CONFIG = {
  /** undo/redo履歴の最大保持数 */
  MAX_HISTORY_STATES: 20,

  /** レイヤー数の上限 */
  MAX_LAYER_COUNT: 16,

  /** レイヤー数の下限 */
  MIN_LAYER_COUNT: 1,

  /** キーサイズの最小値（u単位） */
  MIN_KEY_SIZE: 0.25,

  /** キーサイズのデフォルト値（u単位） */
  DEFAULT_KEY_SIZE: 1,

  /** X座標の最大値（u単位） */
  MAX_KEY_X: 50,

  /** Y座標の最大値（u単位） */
  MAX_KEY_Y: 20,

  /** 幅の最大値（u単位） */
  MAX_KEY_WIDTH: 15,

  /** 高さの最大値（u単位） */
  MAX_KEY_HEIGHT: 5,

  /** マトリクスROWの最大値 */
  MAX_MATRIX_ROW: 32,

  /** マトリクスCOLの最大値 */
  MAX_MATRIX_COL: 32,

  /** 回転の刻み（度） */
  ROTATION_STEP: 3,

  /** 移動/リサイズの刻み（u単位） */
  MOVE_STEP: 0.25,

  /** レジェンドの最大文字数 */
  MAX_LEGEND_LENGTH: 10,

  /** レイアウト名の最大文字数 */
  MAX_LAYOUT_NAME_LENGTH: 50,

  /** 作者名の最大文字数 */
  MAX_AUTHOR_LENGTH: 50,

  /** 説明の最大文字数 */
  MAX_DESCRIPTION_LENGTH: 200,
} as const

export type AppConfig = typeof APP_CONFIG
