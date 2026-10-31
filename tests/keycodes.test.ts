import { describe, expect, it } from 'vitest'
import { findKeycode, getKeycodeLabel, keycodeCategories, searchKeycodes } from '../src/data/keycodes'
import { getKeycodeLabel as getCanvasLabel } from '../src/data/keycode-labels'
import { exportToQMKKeymapC } from '../src/utils/export'

describe('IMEキーの検索・表示', () => {
  it.each(['ImeOn', 'IME ON', 'ime_on', 'ime-on', 'KC_LNG1', 'KC_LANGUAGE_1', '日本語入力オン'])(
    '%sでImeOnを検索できる', query => {
      expect(searchKeycodes(query).map(key => key.code)).toEqual(['KC_LNG1'])
    }
  )

  it.each(['ImeOff', 'IME OFF', 'ime_off', 'ime-off', 'KC_LNG2', 'KC_LANGUAGE_2', '日本語入力オフ'])(
    '%sでImeOffを検索できる', query => {
      expect(searchKeycodes(query).map(key => key.code)).toEqual(['KC_LNG2'])
    }
  )

  it('IMEで両方を検索でき、候補には短いQMKコードを一つずつ返す', () => {
    expect(searchKeycodes('IME').map(key => key.code)).toEqual(['KC_LNG1', 'KC_LNG2'])
    expect(keycodeCategories.find(category => category.name === 'international')?.keycodes.map(key => key.code))
      .toEqual(expect.arrayContaining(['KC_LNG1', 'KC_LNG2']))
  })

  it.each([
    ['KC_LNG1', 'KC_LANGUAGE_1', 'ImeOn'],
    ['KC_LNG2', 'KC_LANGUAGE_2', 'ImeOff']
  ])('正式名・別名の検索とANSI/JIS表示が一致する: %s', (code, alias, label) => {
    expect(findKeycode(alias)).toBe(findKeycode(code))
    for (const value of [code, alias]) {
      expect(getKeycodeLabel(value)).toBe(label)
      expect(getCanvasLabel(value, 'ANSI')).toBe(label)
      expect(getCanvasLabel(value, 'JIS')).toBe(label)
    }
  })

  it('検索で選んだIMEキーはQMK用のコードで出力する', () => {
    const codes = ['ImeOn', 'ImeOff'].map(query => searchKeycodes(query)[0].code)
    const output = exportToQMKKeymapC({
      name: 'IME keys', layerCount: 1,
      keys: codes.map((code, index) => ({
        id: String(index), x: index, y: 0, width: 1, height: 1,
        legend: {}, matrix: { row: 0, col: index }, keycodes: { 0: code }
      }))
    })
    expect(output).toContain('KC_LNG1, KC_LNG2')
    expect(output).not.toContain('KC_LANG1')
    expect(output).not.toContain('ImeOn')
  })

  it('空検索や記号の検索、既存の表示を維持する', () => {
    expect(searchKeycodes('')).toEqual([])
    expect(searchKeycodes('   ')).toEqual([])
    expect(searchKeycodes('-').map(key => key.code)).toContain('KC_MINS')
    expect(searchKeycodes('-').map(key => key.code)).not.toContain('KC_A')
    expect(getCanvasLabel('KC_P1', 'ANSI')).toBe('P1')
    expect(getCanvasLabel('KC_INT2', 'JIS')).toBe('かな')
    expect(findKeycode('KC_LANG1')).toBeUndefined()
  })
})
