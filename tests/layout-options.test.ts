import { describe, expect, it } from 'vitest'
import type { Key, KeyboardLayout } from '../src/types/keyboard'
import { extractPersistedLayout } from '../src/types/persistence'
import { exportToVial, vialKeyLabel } from '../src/utils/export'
import { convertKLEToKLS, parseKLELayoutOption } from '../src/utils/kle-import'
import {
  sanitizeKeyLayoutOption,
  sanitizeLayoutOptionDefinitions
} from '../src/utils/key-sanitizer'

function makeKey(id: string, overrides: Partial<Key> = {}): Key {
  return {
    id, x: 0, y: 0, width: 1, height: 1, legend: {},
    matrix: { row: 0, col: Number(id) }, ...overrides
  }
}

function makeLayout(keys: Key[], overrides: Partial<KeyboardLayout> = {}): KeyboardLayout {
  return { name: 'Layout Options Test', layerCount: 1, keys, ...overrides }
}

interface ExportedVial {
  layouts: {
    keymap: (Record<string, number> | string)[][]
    labels?: unknown
  }
}

function exportLayout(layout: KeyboardLayout): ExportedVial {
  return JSON.parse(exportToVial(layout)) as ExportedVial
}

describe('Vial Layout Optionsの出力（Issue #5）', () => {
  it('labels定義を layouts.labels にそのまま出力する', () => {
    const data = exportLayout(makeLayout([makeKey('0')], {
      layoutOptions: ['Bootmagic', ['Backspace', 'Split Backspace', 'Full Backspace']]
    }))
    expect(data.layouts.labels).toEqual([
      'Bootmagic',
      ['Backspace', 'Split Backspace', 'Full Backspace']
    ])
  })

  it('定義がない場合は labels を出力しない', () => {
    const data = exportLayout(makeLayout([makeKey('0')]))
    expect(data.layouts).not.toHaveProperty('labels')
  })

  it('割り当てたキーはラベルの4行目に "グループ,チョイス" を符号化する', () => {
    expect(vialKeyLabel(makeKey('0'))).toBe('0,0')
    expect(vialKeyLabel(makeKey('0', { layoutOption: { group: 0, choice: 0 } }))).toBe('0,0\n\n\n0,0')
    expect(vialKeyLabel(makeKey('0', { layoutOption: { group: 2, choice: 1 } }))).toBe('0,0\n\n\n2,1')
  })

  it('keymap内でも割り当てが符号化され、未割り当てキーは従来どおりになる', () => {
    const data = exportLayout(makeLayout([
      makeKey('0', { layoutOption: { group: 1, choice: 0 } }),
      makeKey('1', { x: 1 })
    ]))
    const labels = data.layouts.keymap.flat().filter(item => typeof item === 'string')
    expect(labels).toEqual(['0,0\n\n\n1,0', '0,1'])
  })
})

describe('KLE読み込みでのLayout Options保持（Issue #5）', () => {
  it('4行目の "グループ,チョイス" を割り当てとして取り出す', () => {
    expect(parseKLELayoutOption('0,0\n\n\n0,0')).toEqual({ group: 0, choice: 0 })
    expect(parseKLELayoutOption('0,0\n\n\n2,1')).toEqual({ group: 2, choice: 1 })
    expect(parseKLELayoutOption('0,0')).toBeUndefined()
    expect(parseKLELayoutOption('Esc\n\n\nfoo')).toBeUndefined()
  })

  it('KLE変換で割り当てが保持され、レジェンドには混入しない', () => {
    const layout = convertKLEToKLS([['0,0\n\n\n1,2', '1,0']])
    expect(layout.keys).toHaveLength(2)
    expect(layout.keys[0].layoutOption).toEqual({ group: 1, choice: 2 })
    expect(layout.keys[0].legend.bottomRight).toBeUndefined()
    expect(layout.keys[1].layoutOption).toBeUndefined()
  })
})

describe('Layout Optionsの永続化とサニタイズ（Issue #5）', () => {
  it('永続化抽出で定義と割り当てが保持される（後方互換）', () => {
    const layout = makeLayout(
      [makeKey('0', { layoutOption: { group: 0, choice: 1 } })],
      { layoutOptions: [['Space', 'Split', 'Full']] }
    )
    const persisted = extractPersistedLayout(layout)
    expect(persisted.layoutOptions).toEqual([['Space', 'Split', 'Full']])
    expect(persisted.keys[0].layoutOption).toEqual({ group: 0, choice: 1 })

    // 未使用のレイアウトでは余分な項目が増えない
    const plain = extractPersistedLayout(makeLayout([makeKey('0')]))
    expect(plain.layoutOptions).toBeUndefined()
    expect(plain.keys[0].layoutOption).toBeUndefined()
  })

  it('不正な割り当て・定義はサニタイズで落とす', () => {
    expect(sanitizeKeyLayoutOption({ group: 0, choice: 0 })).toEqual({ group: 0, choice: 0 })
    expect(sanitizeKeyLayoutOption({ group: -1, choice: 0 })).toBeUndefined()
    expect(sanitizeKeyLayoutOption({ group: 0.5, choice: 0 })).toBeUndefined()
    expect(sanitizeKeyLayoutOption(undefined)).toBeUndefined()

    expect(sanitizeLayoutOptionDefinitions(['A', ['B', 'x', 'y']])).toEqual(['A', ['B', 'x', 'y']])
    expect(sanitizeLayoutOptionDefinitions([42, ['B', 7]])).toBeUndefined()
    expect(sanitizeLayoutOptionDefinitions(undefined)).toBeUndefined()
    expect(sanitizeLayoutOptionDefinitions([])).toBeUndefined()
  })
})
