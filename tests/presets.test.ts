import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Key, KeyboardLayout } from '../src/types/keyboard'
import presetData from '../src/presets/60-percent.kls.json'
import { getPresets } from '../src/services/presets'
import { useLayoutStore } from '../src/stores/layout'
import { findKeycode } from '../src/data/keycodes'
import { exportToVial, vialKeyLabel } from '../src/utils/export'
import { getLayoutOptionGroups } from '../src/utils/layout-options'
import { buildLayoutOptionsComparison } from '../src/utils/layout-options-preview'

const preset: KeyboardLayout = presetData

function visibleKeys(space: number, shift: number): Key[] {
  const choices = [space, shift]
  return preset.keys.filter(key => !key.layoutOption || key.layoutOption.choice === choices[key.layoutOption.group])
}

interface VialExport {
  matrix: { rows: number; cols: number }
  layouts: { labels: string[]; keymap: (Record<string, number> | string)[][] }
}

describe('ANSI 60%マルチレイアウトプリセット', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('既存の60-percentプリセットを置き換え、重複登録しない', () => {
    const entries = getPresets().filter(entry => entry.id === '60-percent')
    expect(entries).toHaveLength(1)
    expect(entries[0].name).toBe('60% Keyboard (Multi Layout)')
    expect(entries[0].layout).toEqual(preset)
    expect(entries[0].description).toContain('split Space and right Shift')
  })

  it('66キーのIDは一意で、修正なしで読み込め、全キーコードが登録済み', () => {
    expect(preset.keys).toHaveLength(66)
    expect(new Set(preset.keys.map(key => key.id)).size).toBe(66)
    expect(useLayoutStore().loadLayout(preset)).toBe(false)
    for (const key of preset.keys) {
      expect(key.height).toBe(1)
      expect(key.rotation ?? 0).toBe(0)
      expect(key.shape ?? 'rectangle').toBe('rectangle')
      expect(Number.isInteger(key.matrix.row)).toBe(true)
      expect(Number.isInteger(key.matrix.col)).toBe(true)
      expect(findKeycode(key.keycodes![0]), key.keycodes![0]).toBeDefined()
    }
  })

  it('固定キーと、両オプションのオフ・オンへの所属が正しい', () => {
    expect(preset.layoutOptions).toEqual(['Split Space', 'Split Shift'])
    expect(preset.keys.filter(key => !key.layoutOption)).toHaveLength(59)
    expect([0, 1].map(choice => preset.keys.filter(key => key.layoutOption?.group === 0 && key.layoutOption.choice === choice).length)).toEqual([1, 3])
    expect([0, 1].map(choice => preset.keys.filter(key => key.layoutOption?.group === 1 && key.layoutOption.choice === choice).length)).toEqual([1, 2])
    for (const key of preset.keys) {
      if (!key.layoutOption) continue
      expect([0, 1]).toContain(key.layoutOption.group)
      expect([0, 1]).toContain(key.layoutOption.choice)
    }
  })

  it.each([
    { space: 0, shift: 0, count: 61 },
    { space: 0, shift: 1, count: 62 },
    { space: 1, shift: 0, count: 63 },
    { space: 1, shift: 1, count: 64 }
  ])('Space=$space・Shift=$shiftで重なり・欠け・行列競合がない', ({ space, shift, count }) => {
    const keys = visibleKeys(space, shift)
    expect(keys).toHaveLength(count)
    const positions = keys.map(key => `${key.matrix.row},${key.matrix.col}`)
    expect(new Set(positions).size, positions.join(' / ')).toBe(count)
    for (let row = 0; row < 5; row++) {
      const rowKeys = keys.filter(key => key.y === row).sort((a, b) => a.x - b.x)
      expect(rowKeys.length).toBeGreaterThan(0)
      let cursor = 0
      for (const key of rowKeys) {
        expect(key.x, `row ${row}, key ${key.id}`).toBe(cursor)
        cursor += key.width
      }
      expect(cursor).toBe(15)
    }
    expect(keys.every(key => key.y >= 0 && key.y + key.height <= 5)).toBe(true)
  })

  it('分割Spaceの追加キーが右Alt・Menuと競合せず、レジェンドもキーコードに合う', () => {
    const split = preset.keys.filter(key => key.layoutOption?.group === 0 && key.layoutOption.choice === 1).sort((a, b) => a.x - b.x)
    expect(split.map(key => key.matrix)).toEqual([{ row: 4, col: 3 }, { row: 4, col: 8 }, { row: 4, col: 9 }])
    expect(split.map(key => key.keycodes![0])).toEqual(['KC_INT5', 'KC_SPC', 'KC_INT4'])
    expect(split.map(key => key.legend.center)).toEqual(['無変換', 'Space', '変換'])
    expect(preset.keys.find(key => key.id === '58')?.matrix).toEqual({ row: 4, col: 4 })
    expect(preset.keys.find(key => key.id === '60')?.matrix).toEqual({ row: 4, col: 6 })
  })

  it('Vial出力は全オプションと66キーの所属・座標・サイズを保持する', () => {
    const data = JSON.parse(exportToVial(preset)) as VialExport
    expect(data.layouts.labels).toEqual(['Split Space', 'Split Shift'])
    expect(data.matrix).toEqual({ rows: 5, cols: 14 })
    const decoded = new Map<string, { x: number; y: number; width: number; height: number }>()
    let y = 0
    for (const row of data.layouts.keymap) {
      let x = 0, width = 1, height = 1
      for (const item of row) {
        if (typeof item === 'string') {
          decoded.set(item, { x, y, width, height })
          x += width
          width = height = 1
        } else {
          expect(item).not.toHaveProperty('r')
          x += item.x ?? 0
          y += item.y ?? 0
          width = item.w ?? width
          height = item.h ?? height
        }
      }
      y++
    }
    expect(decoded.size).toBe(66)
    for (const key of preset.keys) {
      expect(decoded.get(vialKeyLabel(key))).toEqual({ x: key.x, y: key.y, width: key.width, height: key.height })
    }
  })

  it('比較プレビューで両オプションを局所的に切り出せる', () => {
    const groups = getLayoutOptionGroups(preset.layoutOptions!, preset.keys)
    const comparison = buildLayoutOptionsComparison(preset.keys, groups, { 0: 1, 1: 1 })
    expect(comparison.referenceKeys).toHaveLength(64)
    expect(comparison.groups.map(group => group.regions.length)).toEqual([1, 1])
    expect(comparison.groups.map(group => group.choices.length)).toEqual([2, 2])
    expect(comparison.groups[0].regions[0].bounds).toEqual({ x: 3.5, y: 3.75, width: 6.75, height: 1.5 })
    expect(comparison.groups[1].regions[0].bounds).toEqual({ x: 12, y: 2.75, width: 3.25, height: 1.5 })
  })
})
