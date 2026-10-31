import { describe, expect, it } from 'vitest'
import type { Key, LayoutOptionDefinition } from '../src/types/keyboard'
import type { PreviewBounds } from '../src/utils/layout-options-preview'
import { getLayoutOptionGroups } from '../src/utils/layout-options'
import { buildLayoutOptionsComparison, getKeyPreviewBounds } from '../src/utils/layout-options-preview'
import { exportToVial } from '../src/utils/export'

function key(id: string, overrides: Partial<Key> = {}): Key {
  return { id, x: 0, y: 0, width: 1, height: 1, matrix: { row: 0, col: 0 }, legend: {}, ...overrides }
}

function compare(keys: Key[], definitions: LayoutOptionDefinition[], choices: Record<number, number> = {}) {
  return buildLayoutOptionsComparison(keys, getLayoutOptionGroups(definitions, keys), choices)
}

function expectContains(outer: PreviewBounds, inner: PreviewBounds) {
  expect(outer.x).toBeLessThanOrEqual(inner.x)
  expect(outer.y).toBeLessThanOrEqual(inner.y)
  expect(outer.x + outer.width).toBeGreaterThanOrEqual(inner.x + inner.width)
  expect(outer.y + outer.height).toBeGreaterThanOrEqual(inner.y + inner.height)
}

describe('レイアウトオプションの切り出し比較', () => {
  it('固定キーと各オプションの先頭の選択肢を基準にする', () => {
    const keys = [key('fixed'),
      key('backspace', { x: 3, width: 2, layoutOption: { group: 0, choice: 0 } }),
      key('split1', { x: 3, layoutOption: { group: 0, choice: 1 } }),
      key('split2', { x: 4, layoutOption: { group: 0, choice: 1 } }),
      key('space', { y: 3, width: 6, layoutOption: { group: 1, choice: 0 } }),
      key('space7', { y: 3, width: 7, layoutOption: { group: 1, choice: 1 } })]
    const result = compare(keys, ['Backspace', ['Space', '6u', '7u']])
    expect(result.referenceKeys.map(item => item.id)).toEqual(['fixed', 'backspace', 'space'])
    expect(result.groups).toHaveLength(2)
    expect(result.groups[0].choices.map(choice => choice.keys.map(item => item.id))).toEqual([['backspace'], ['split1', 'split2']])
    expect(result.groups[1].choices.map(choice => choice.keys.map(item => item.id))).toEqual([['space'], ['space7']])
  })

  it('一つの選択肢を基準にしても、他のオプションの選択と全選択肢の一覧は保つ', () => {
    const keys = [key('a', { layoutOption: { group: 0, choice: 0 } }),
      key('b', { layoutOption: { group: 0, choice: 1 } }),
      key('c', { x: 4, layoutOption: { group: 1, choice: 0 } }),
      key('d', { x: 4, layoutOption: { group: 1, choice: 1 } })]
    const result = compare(keys, ['A', 'B'], { 0: 1 })
    expect(result.referenceKeys.map(item => item.id)).toEqual(['b', 'c'])
    expect(result.groups.map(group => group.selectedChoice)).toEqual([1, 0])
    expect(result.groups.flatMap(group => group.choices)).toHaveLength(4)
  })

  it('選択肢数の合計だけを比較し、組み合わせの直積には展開しない', () => {
    const definitions = Array.from({ length: 8 }, (_, group) => [`Option ${group}`, 'A', 'B', 'C'])
    const keys = definitions.flatMap((_, group) => [0, 1, 2].map(choice =>
      key(`${group}:${choice}`, { x: group * 2, layoutOption: { group, choice } })))
    const result = compare(keys, definitions)
    expect(result.groups).toHaveLength(8)
    expect(result.groups.flatMap(group => group.choices)).toHaveLength(24)
    expect(result.referenceKeys).toHaveLength(8)
  })

  it('通常キーと分割キーを同じ範囲で比較する', () => {
    const keys = [key('whole', { x: 3, y: 2, width: 2, layoutOption: { group: 0, choice: 0 } }),
      key('left', { x: 3, y: 2, layoutOption: { group: 0, choice: 1 } }),
      key('right', { x: 4, y: 2, layoutOption: { group: 0, choice: 1 } })]
    const result = compare(keys, ['Backspace'])
    expect(result.groups[0].regions).toHaveLength(1)
    expect(result.groups[0].regions[0].bounds).toEqual({ x: 2.75, y: 1.75, width: 2.5, height: 1.5 })
    for (const item of keys) expectContains(result.groups[0].regions[0].bounds, getKeyPreviewBounds(item))
  })

  it('同じオプションの離れた部分は別々に切り出す', () => {
    const keys = [key('left', { layoutOption: { group: 0, choice: 0 } }),
      key('right', { x: 20, layoutOption: { group: 0, choice: 1 } }), key('middle', { x: 10 })]
    const result = compare(keys, ['Multi-layout'])
    expect(result.groups[0].regions.map(region => region.id)).toEqual(['1', '1.2'])
    expect(result.groups[0].regions.map(region => region.bounds.width)).toEqual([1.5, 1.5])
    expect(result.groups[0].regions.flatMap(region => region.contextKeys)).toEqual([])
  })

  it('隣接関係を推移的にたどり、連続した複数キーを一つの範囲にする', () => {
    const keys = [0, 1, 2].map(x => key(String(x), { x, layoutOption: { group: 0, choice: 0 } }))
    expect(compare(keys, ['Row']).groups[0].regions).toHaveLength(1)
  })

  it('周囲の固定キーや他オプションの基準キーだけを薄い文脈として含める', () => {
    const keys = [key('fixed', { x: 2 }), key('far', { x: 20 }),
      key('a', { x: 3, layoutOption: { group: 0, choice: 0 } }),
      key('b', { x: 3, layoutOption: { group: 0, choice: 1 } }),
      key('c', { x: 4, layoutOption: { group: 1, choice: 0 } }),
      key('d', { x: 4, layoutOption: { group: 1, choice: 1 } })]
    const result = compare(keys, ['A', 'B'], { 1: 1 })
    expect(result.groups[0].regions[0].contextKeys.map(item => item.id)).toEqual(['fixed', 'd'])
  })

  it('キーのない選択肢や空のオプションも消さない', () => {
    const keys = [key('fixed'), key('on', { x: 3, layoutOption: { group: 0, choice: 1 } })]
    const result = compare(keys, ['Toggle', ['Empty', 'A', 'B']])
    expect(result.referenceKeys.map(item => item.id)).toEqual(['fixed'])
    expect(result.groups[0].choices[0].keys).toEqual([])
    expect(result.groups[1].choices).toHaveLength(2)
    expect(result.groups[1].regions).toEqual([])
  })

  it('存在しない基準選択は先頭へ戻し、未定義の所属も表示に含める', () => {
    const keys = [key('orphan', { layoutOption: { group: 7, choice: 9 } })]
    const result = compare(keys, [], { 7: 99 })
    expect(result.referenceKeys.map(item => item.id)).toEqual(['orphan'])
    expect(result.groups[0].selectedChoice).toBe(9)
  })

  it('全キーが空でも描画範囲は有限で正の大きさになる', () => {
    const result = compare([], [])
    expect(result.groups).toEqual([])
    expect(result.referenceBounds.width).toBeGreaterThan(0)
    expect(result.referenceBounds.height).toBeGreaterThan(0)
    Object.values(result.referenceBounds).forEach(value => expect(Number.isFinite(value)).toBe(true))
  })

  it('回転・ISO形状を含む選択肢も切り落とさない', () => {
    const keys = [key('iso', { x: 3, width: 1.5, height: 2, shape: 'iso-enter', rotation: 45, layoutOption: { group: 0, choice: 0 } }),
      key('wide', { x: 5, width: 3, rotation: -30, layoutOption: { group: 0, choice: 1 } })]
    const result = compare(keys, ['Enter'])
    for (const item of keys) {
      const bounds = getKeyPreviewBounds(item)
      expectContains(result.referenceBounds, bounds)
      const region = result.groups[0].regions.find(region =>
        region.bounds.x <= bounds.x && region.bounds.x + region.bounds.width >= bounds.x + bounds.width)!
      expectContains(region.bounds, bounds)
    }
  })

  it('描画と同じISO Enterの0.5uオフセット・キー中心回転を使う', () => {
    const iso = key('iso', { x: 3, y: 2, width: 1.5, height: 2, shape: 'iso-enter' })
    expect(getKeyPreviewBounds(iso)).toEqual({ x: 3.5, y: 2, width: 1.5, height: 2 })
    const rotated = getKeyPreviewBounds({ ...iso, rotation: 90 })
    expect(rotated.x).toBeCloseTo(2.75)
    expect(rotated.y).toBeCloseTo(2.75)
    expect(rotated.width).toBeCloseTo(2)
    expect(rotated.height).toBeCloseTo(1.5)
  })

  it('比較の生成や基準の切り替えは保存データとVial出力を変えない', () => {
    const keys = [key('a', { layoutOption: { group: 0, choice: 0 } }), key('b', { layoutOption: { group: 0, choice: 1 } })]
    const definitions = ['A']
    const original = structuredClone({ keys, definitions })
    const data = { name: 'Comparison', keys, layoutOptions: definitions, layerCount: 1 }
    const output = exportToVial(data)
    compare(keys, definitions, { 0: 1 })
    expect({ keys, definitions }).toEqual(original)
    expect(exportToVial(data)).toBe(output)
  })
})
