/**
 * キーの形状タイプ
 */
export type KeyShape = 'rectangle' | 'iso-enter' | 'big-ass-enter' | 'circle'

/**
 * キーレジェンドの位置定義
 */
export interface KeyLegend {
  topLeft?: string
  topCenter?: string
  topRight?: string
  centerLeft?: string
  center?: string
  centerRight?: string
  bottomLeft?: string
  bottomCenter?: string
  bottomRight?: string
}

/**
 * キーマトリクスのピンアサイン
 */
export interface KeyMatrix {
  row?: number
  col?: number
}

/**
 * キーの定義
 */
export interface Key {
  id: string
  x: number // u単位の位置
  y: number // u単位の位置
  width: number // u単位の幅
  height: number // u単位の高さ
  legend: KeyLegend
  matrix: KeyMatrix
  keycodes?: Record<number, string> // レイヤー番号 → QMKキーコード
  rotation?: number // 回転角度（度）
  rotationX?: number // 回転の中心点X
  rotationY?: number // 回転の中心点Y
  shape?: KeyShape // キーの形状（未定義の場合はrectangle）
}

/**
 * レジェンドフォントの定義
 */
export type LegendFont =
  // ゴシック系
  | 'Noto Sans JP'
  | 'M PLUS 1p'
  | 'M PLUS 2'
  | 'Zen Kaku Gothic New'
  // 丸ゴシック系
  | 'M PLUS Rounded 1c'
  | 'Zen Maru Gothic'
  | 'Kosugi Maru'
  // 明朝系
  | 'Noto Serif JP'
  | 'Zen Old Mincho'
  | 'Shippori Mincho'

/**
 * キーボードレイアウト全体の定義
 */
export interface KeyboardLayout {
  name: string
  keys: Key[]
  layerCount: number // レイヤー総数（1-16）
  legendFont?: LegendFont // レジェンドのフォント
  metadata?: {
    author?: string
    description?: string
    created?: string
    modified?: string
  }
}
