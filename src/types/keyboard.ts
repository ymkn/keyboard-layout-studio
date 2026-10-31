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
 * Vial Layout Options におけるキーの割り当て
 * グループ番号・チョイス番号はいずれも0始まり。
 * 未割り当て（undefined）のキーは常時表示される。
 */
export interface KeyLayoutOption {
  group: number
  choice: number
}

/**
 * Vial Layout Options のグループ定義（vial.json の layouts.labels の要素）
 * 文字列の場合はトグル型グループ（choice 0=off / 1=on）、
 * 配列の場合は [見出し, ...選択肢名] のフラット形式で、先頭が見出し、
 * 残りが choice 0 からの選択肢名を表す（vial-gui の解釈に準拠）。
 */
export type LayoutOptionDefinition = string | string[]

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
  rotation?: number // 回転角度（度）- キーの中心を基準に回転
  shape?: KeyShape // キーの形状（未定義の場合はrectangle）
  layoutOption?: KeyLayoutOption // Vial Layout Options の割り当て（未定義の場合は常時表示）
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
 * 選択キーをまとめて回転させる中心座標（u単位）
 */
export interface RotationCenter {
  x: number
  y: number
}

/**
 * キーボードレイアウト全体の定義
 */
export interface KeyboardLayout {
  name: string
  keys: Key[]
  layerCount: number // レイヤー総数（1-16）
  legendFont?: LegendFont // レジェンドのフォント
  rotationCenter?: RotationCenter
  layoutOptions?: LayoutOptionDefinition[] // Vial Layout Options の定義（layouts.labels）
  metadata?: {
    author?: string
    description?: string
    created?: string
    modified?: string
  }
}
