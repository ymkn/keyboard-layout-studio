/**
 * 描画関連の定数
 */
export const RENDERING = {
  /** 1u = 54px（キーキャップの基準サイズ） */
  KEY_UNIT: 54,

  /** ISO Enterの保存座標から描画左端までのオフセット（u単位） */
  ISO_ENTER_OFFSET_X: 0.5,

  /** グリッドサイズ（u単位） */
  GRID_SIZE: 0.25,

  /** 回転中心マーカーの半径（px） */
  ROTATION_CENTER_MARKER_SIZE: 8,

  /** キー内部のパディング（px） */
  KEY_PADDING: 4,

  /** 1uキーの基準フォントサイズ（px） */
  BASE_FONT_SIZE: 10.8,

  /** SVGキャンバスの余白（u単位） */
  SVG_PADDING: 2,

  /** キートップの凹み幅（px） */
  KEY_TOP_INSET: 4,
} as const

export type RenderingConstants = typeof RENDERING

export const LAYOUT_OPTION_PREVIEW = {
  PADDING: 0.25,
  REGION_GAP: 0.25,
  EMPTY_WIDTH: 4,
  EMPTY_HEIGHT: 2,
  MARKER_FONT_SIZE: 10,
  MARKER_OFFSET: 0.125,
} as const
