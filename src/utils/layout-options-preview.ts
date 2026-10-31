import type { Key } from '../types/keyboard'
import type { LayoutOptionGroupView, LayoutOptionChoiceView } from './layout-options'
import { RENDERING, LAYOUT_OPTION_PREVIEW } from '../constants/rendering'
import { SHAPE_PRESETS } from '../data/shape-presets'

export interface PreviewBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface LayoutOptionPreviewRegion {
  id: string
  bounds: PreviewBounds
  contextKeys: Key[]
}

export interface LayoutOptionPreviewChoice extends LayoutOptionChoiceView {
  keys: Key[]
}

export interface LayoutOptionPreviewGroup {
  group: LayoutOptionGroupView
  selectedChoice: number
  regions: LayoutOptionPreviewRegion[]
  choices: LayoutOptionPreviewChoice[]
  side: 'left' | 'right'
}

export interface LayoutOptionsComparison {
  referenceKeys: Key[]
  referenceBounds: PreviewBounds
  groups: LayoutOptionPreviewGroup[]
}

/** SVGと同じ中心・形状オフセットを使い、回転後の外接矩形をu単位で求める。 */
export function getKeyPreviewBounds(key: Key): PreviewBounds {
  const preset = SHAPE_PRESETS[key.shape ?? 'rectangle'] ?? SHAPE_PRESETS.rectangle
  const width = preset.isResizable ? key.width : preset.defaultWidth
  const height = preset.isResizable ? key.height : preset.defaultHeight
  const x = key.x + (key.shape === 'iso-enter' ? RENDERING.ISO_ENTER_OFFSET_X : 0)
  const cx = key.x + key.width / 2
  const cy = key.y + key.height / 2
  const radians = (key.rotation ?? 0) * Math.PI / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const points = [[x, key.y], [x + width, key.y], [x + width, key.y + height], [x, key.y + height]]
    .map(([px, py]) => ({ x: cx + (px - cx) * cos - (py - cy) * sin, y: cy + (px - cx) * sin + (py - cy) * cos }))
  const minX = Math.min(...points.map(point => point.x))
  const minY = Math.min(...points.map(point => point.y))
  return {
    x: minX, y: minY,
    width: Math.max(...points.map(point => point.x)) - minX,
    height: Math.max(...points.map(point => point.y)) - minY
  }
}

function unionBounds(bounds: PreviewBounds[]): PreviewBounds {
  if (bounds.length === 0) return { x: 0, y: 0, width: LAYOUT_OPTION_PREVIEW.EMPTY_WIDTH, height: LAYOUT_OPTION_PREVIEW.EMPTY_HEIGHT }
  const x = Math.min(...bounds.map(item => item.x))
  const y = Math.min(...bounds.map(item => item.y))
  return {
    x, y,
    width: Math.max(...bounds.map(item => item.x + item.width)) - x,
    height: Math.max(...bounds.map(item => item.y + item.height)) - y
  }
}

function padBounds(bounds: PreviewBounds): PreviewBounds {
  const padding = LAYOUT_OPTION_PREVIEW.PADDING
  return { x: bounds.x - padding, y: bounds.y - padding, width: bounds.width + padding * 2, height: bounds.height + padding * 2 }
}

export function previewBoundsIntersect(a: PreviewBounds, b: PreviewBounds, gap = 0): boolean {
  return a.x <= b.x + b.width + gap && a.x + a.width + gap >= b.x &&
    a.y <= b.y + b.height + gap && a.y + a.height + gap >= b.y
}

/** 離れた可変部分は別々に切り出し、間の固定キーでサムネイルが広がるのを防ぐ。 */
function getVariableRegions(keys: Key[]): PreviewBounds[] {
  const remaining = keys.map(getKeyPreviewBounds)
  const regions: PreviewBounds[] = []
  while (remaining.length > 0) {
    const members = [remaining.shift()!]
    for (let cursor = 0; cursor < members.length; cursor++) {
      for (let index = remaining.length - 1; index >= 0; index--) {
        if (!previewBoundsIntersect(members[cursor], remaining[index], LAYOUT_OPTION_PREVIEW.REGION_GAP)) continue
        members.push(...remaining.splice(index, 1))
      }
    }
    regions.push(padBounds(unionBounds(members)))
  }
  return regions.sort((a, b) => a.y - b.y || a.x - b.x)
}

/** 組み合わせの全展開ではなく、基準配置と各オプションの局所的な差分を作る。 */
export function buildLayoutOptionsComparison(
  keys: Key[], groups: LayoutOptionGroupView[], selectedChoices: Record<number, number>
): LayoutOptionsComparison {
  const resolvedChoices = new Map(groups.map(group => [group.index,
    group.choices.some(choice => choice.index === selectedChoices[group.index])
      ? selectedChoices[group.index] : group.choices[0]?.index ?? 0
  ]))
  const referenceKeys = keys.filter(key => !key.layoutOption ||
    key.layoutOption.choice === resolvedChoices.get(key.layoutOption.group))
  const referenceBounds = padBounds(unionBounds(keys.map(getKeyPreviewBounds)))
  const centerX = referenceBounds.x + referenceBounds.width / 2
  return {
    referenceKeys, referenceBounds,
    groups: groups.map((group, index) => {
      const variableKeys = keys.filter(key => key.layoutOption?.group === group.index)
      const regions = getVariableRegions(variableKeys).map((bounds, region) => ({
        id: `${index + 1}${region === 0 ? '' : `.${region + 1}`}`, bounds,
        contextKeys: referenceKeys.filter(key => key.layoutOption?.group !== group.index &&
          previewBoundsIntersect(bounds, getKeyPreviewBounds(key)))
      }))
      const variableBounds = unionBounds(regions.map(region => region.bounds))
      return {
        group, regions, selectedChoice: resolvedChoices.get(group.index) ?? 0,
        side: regions.length === 0 ? (index % 2 === 0 ? 'left' : 'right') :
          variableBounds.x + variableBounds.width / 2 < centerX ? 'left' : 'right',
        choices: group.choices.map(choice => ({
          ...choice, keys: variableKeys.filter(key => key.layoutOption?.choice === choice.index)
        }))
      }
    })
  }
}
