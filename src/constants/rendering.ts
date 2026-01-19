/**
 * 描画関連の定数
 */
export const RENDERING = {
  /** 1u = 54px（キーキャップの基準サイズ） */
  KEY_UNIT: 54,

  /** グリッドサイズ（u単位） */
  GRID_SIZE: 0.25,

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
