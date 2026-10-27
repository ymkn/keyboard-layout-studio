import type { KeyShape } from '../types/keyboard'
import { RENDERING } from '../constants/rendering'

/**
 * 形状プリセットの定義
 */
export interface ShapePreset {
  name: string
  defaultWidth: number
  defaultHeight: number
  isResizable: boolean
  description: string
}

/**
 * 各形状のメタデータ
 */
export const SHAPE_PRESETS: Record<KeyShape, ShapePreset> = {
  rectangle: {
    name: '長方形',
    defaultWidth: 1,
    defaultHeight: 1,
    isResizable: true,
    description: '標準の長方形キー'
  },
  'iso-enter': {
    name: 'ISO Enter',
    defaultWidth: 1.5,
    defaultHeight: 2,
    isResizable: false,
    description: 'L字型のEnterキー（欧州配列）'
  },
  'big-ass-enter': {
    name: 'Big Ass Enter',
    defaultWidth: 2.25,
    defaultHeight: 2,
    isResizable: false,
    description: '逆L字型の大型Enterキー（レトロ配列）'
  },
  circle: {
    name: '円形',
    defaultWidth: 1,
    defaultHeight: 1,
    isResizable: true,
    description: '円形キー（ロータリーエンコーダなど）'
  }
}

/**
 * SVGパス生成結果
 */
export interface ShapePath {
  bodyPath: string
  topPath: string
}

/**
 * 形状に応じたSVGパスを生成
 * @param shape 形状タイプ
 * @param width 幅（ピクセル）
 * @param height 高さ（ピクセル）
 * @param padding 内側のパディング（ピクセル）
 * @returns body（外側）とtop（内側）のSVGパス
 */
export function generateShapePath(
  shape: KeyShape,
  _width: number,
  _height: number,
  padding: number = 4
): ShapePath {
  const p = padding

  switch (shape) {
    case 'rectangle':
    case 'circle':
      // 長方形と円形はrect/ellipse要素を使うので空文字を返す
      return {
        bodyPath: '',
        topPath: ''
      }

    case 'iso-enter': {
      // ISO Enter: L字型
      // バウンディングボックス: width=1.5u (81px), height=2u (108px)
      // 上部左端は保存座標から0.5u右に描画する
      const offset = RENDERING.ISO_ENTER_OFFSET_X * RENDERING.KEY_UNIT
      const r = 4 // 角丸半径

      // 頂点座標（元の座標 + 0.5u オフセット）
      const x1 = 0 + offset, y1 = 0          // 1点目（上部左上）
      const x2 = 81 + offset, y2 = 0         // 2点目（上部右上）
      const x3 = 81 + offset, y3 = 108       // 3点目（右下）
      const x4 = 13.5 + offset, y4 = 108     // 4点目（下部左）
      const x5 = 13.5 + offset, y5 = 54      // 5点目（中間左）
      const x6 = 0 + offset, y6 = 54         // 6点目（左中）

      // Body path（角丸付きポリライン）
      const bodyPath = `
        M ${x1 + r},${y1}
        L ${x2 - r},${y2}
        Q ${x2},${y2} ${x2},${y2 + r}
        L ${x3},${y3 - r}
        Q ${x3},${y3} ${x3 - r},${y3}
        L ${x4 + r},${y4}
        Q ${x4},${y4} ${x4},${y4 - r}
        L ${x5},${y5 + r}
        Q ${x5},${y5} ${x5 - r},${y5}
        L ${x6 + r},${y6}
        Q ${x6},${y6} ${x6},${y6 - r}
        L ${x1},${y1 + r}
        Q ${x1},${y1} ${x1 + r},${y1}
        Z
      `.trim().replace(/\s+/g, ' ')

      // Top path（内側、padding分小さい、角丸付き）
      const r2 = 3 // 内側の角丸半径
      const topPath = `
        M ${x1 + p + r2},${y1 + p}
        L ${x2 - p - r2},${y2 + p}
        Q ${x2 - p},${y2 + p} ${x2 - p},${y2 + p + r2}
        L ${x3 - p},${y3 - p - r2}
        Q ${x3 - p},${y3 - p} ${x3 - p - r2},${y3 - p}
        L ${x4 + p + r2},${y4 - p}
        Q ${x4 + p},${y4 - p} ${x4 + p},${y4 - p - r2}
        L ${x5 + p},${y5 - p + r2}
        Q ${x5 + p},${y5 - p} ${x5 + p - r2},${y5 - p}
        L ${x6 + p + r2},${y6 - p}
        Q ${x6 + p},${y6 - p} ${x6 + p},${y6 - p - r2}
        L ${x1 + p},${y1 + p + r2}
        Q ${x1 + p},${y1 + p} ${x1 + p + r2},${y1 + p}
        Z
      `.trim().replace(/\s+/g, ' ')

      return { bodyPath, topPath }
    }

    case 'big-ass-enter': {
      // Big Ass Enter: 逆L字型
      // バウンディングボックス: width=2.25u (121.5px), height=2u (108px)
      // 基準点: x=1.25u (67.5px), y=0
      const r = 4 // 角丸半径

      // 頂点座標（ユニット単位からピクセルに変換）
      // 1. (x-0.5u, y) = (40.5, 0)
      // 2. (x+1u, y) = (121.5, 0)
      // 3. (x+1u, y+2u) = (121.5, 108)
      // 4. (x-1.25u, y+2u) = (0, 108)
      // 5. (x-1.25u, y+1u) = (0, 54)
      // 6. (x-0.5u, y+1u) = (40.5, 54)
      const x1 = 40.5, y1 = 0       // 1点目
      const x2 = 121.5, y2 = 0      // 2点目
      const x3 = 121.5, y3 = 108    // 3点目
      const x4 = 0, y4 = 108        // 4点目
      const x5 = 0, y5 = 54         // 5点目
      const x6 = 40.5, y6 = 54      // 6点目

      // Body path（角丸付きポリライン）
      const bodyPath = `
        M ${x1 + r},${y1}
        L ${x2 - r},${y2}
        Q ${x2},${y2} ${x2},${y2 + r}
        L ${x3},${y3 - r}
        Q ${x3},${y3} ${x3 - r},${y3}
        L ${x4 + r},${y4}
        Q ${x4},${y4} ${x4},${y4 - r}
        L ${x5},${y5 + r}
        Q ${x5},${y5} ${x5 + r},${y5}
        L ${x6 - r},${y6}
        Q ${x6},${y6} ${x6},${y6 - r}
        L ${x1},${y1 + r}
        Q ${x1},${y1} ${x1 + r},${y1}
        Z
      `.trim().replace(/\s+/g, ' ')

      // Top path（内側、padding分小さい - 単純なポリライン）
      const topPath = `
        M ${x1 + p},${y1 + p}
        L ${x2 - p},${y2 + p}
        L ${x3 - p},${y3 - p}
        L ${x4 + p},${y4 - p}
        L ${x5 + p},${y5 + p}
        L ${x6 + p},${y6 + p}
        Z
      `.trim().replace(/\s+/g, ' ')

      return { bodyPath, topPath }
    }

    default:
      return {
        bodyPath: '',
        topPath: ''
      }
  }
}

/**
 * レジェンドオフセットの定義
 */
export interface LegendOffset {
  centerX: number
  centerY: number
  offsetX?: number  // SVGパスのオフセット（レジェンド配置用）
  offsetY?: number
}

/**
 * 形状に応じたレジェンド中央位置の調整
 * @param shape 形状タイプ
 * @param width 幅（ピクセル）
 * @param height 高さ（ピクセル）
 * @returns 中央レジェンドの位置
 */
export function getLegendOffset(
  shape: KeyShape,
  width: number,
  height: number
): LegendOffset {
  switch (shape) {
    case 'iso-enter':
      // L字型キーの場合、下部寄りに配置、+0.5uオフセット
      return {
        centerX: width / 2,
        centerY: height * 0.6,
        offsetX: RENDERING.ISO_ENTER_OFFSET_X * RENDERING.KEY_UNIT,
        offsetY: 0
      }

    case 'big-ass-enter':
      // 逆L字型キーの場合、下部寄りに配置
      return {
        centerX: width / 2,
        centerY: height * 0.6
      }

    case 'circle':
    case 'rectangle':
    default:
      // 円形と長方形は中央
      return {
        centerX: width / 2,
        centerY: height / 2
      }
  }
}
