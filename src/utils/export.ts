import type { KeyboardLayout, Key } from '../types/keyboard'
import qmkTemplate from '../templates/qmk-keyboard-template.json'
import vialTemplate from '../templates/vial-template.json'
import { RENDERING } from '../constants/rendering'
import { sortKeysByPhysicalPosition } from './key-order'

/**
 * QMKレイアウトのキー形式
 */
interface QMKLayoutKey {
  x: number
  y: number
  w?: number
  h?: number
  matrix?: [number, number]
}

/**
 * Vialレイアウトのメタデータ形式
 */
interface VialKeyMetadata {
  x?: number
  y?: number
  r?: number
  rx?: number
  ry?: number
  w?: number
  h?: number
  w2?: number
  h2?: number
  x2?: number
}

/**
 * Vialレイアウトの行要素（メタデータまたはマトリクス文字列）
 */
type VialRowElement = VialKeyMetadata | string

/**
 * QMK keyboard.json形式にエクスポート
 */
export function exportToQMK(layout: KeyboardLayout): string {
  const qmkData = JSON.parse(JSON.stringify(qmkTemplate))

  // メタデータを反映
  qmkData.keyboard_name = layout.name || 'custom_keyboard'
  if (layout.metadata?.author) {
    qmkData.manufacturer = layout.metadata.author
    qmkData.maintainer = layout.metadata.author
  }

  // レイアウトデータを変換
  const qmkLayout = sortKeysByPhysicalPosition(layout.keys).map(key => convertToQMKLayout(key))
  qmkData.layouts.LAYOUT.layout = qmkLayout

  // 行列のピン数を計算（最大値+1）
  const maxRow = Math.max(...layout.keys.filter(k => k.matrix.row !== undefined).map(k => k.matrix.row!), -1)
  const maxCol = Math.max(...layout.keys.filter(k => k.matrix.col !== undefined).map(k => k.matrix.col!), -1)

  if (maxRow >= 0) {
    qmkData.matrix_pins.rows = Array(maxRow + 1).fill('NO_PIN')
  }
  if (maxCol >= 0) {
    qmkData.matrix_pins.cols = Array(maxCol + 1).fill('NO_PIN')
  }

  // レイヤーが複数ある場合、dynamic_keymap.layer_countを設定
  if (layout.layerCount > 1) {
    qmkData.dynamic_keymap = {
      layer_count: layout.layerCount
    }
  }

  return JSON.stringify(qmkData, null, 2)
}

/**
 * Vial vial.json形式にエクスポート
 */
export function exportToVial(layout: KeyboardLayout): string {
  const vialData = JSON.parse(JSON.stringify(vialTemplate))

  // メタデータを反映
  vialData.name = layout.name || 'Custom Keyboard'

  // 行列のサイズを計算
  const maxRow = Math.max(...layout.keys.filter(k => k.matrix.row !== undefined).map(k => k.matrix.row!), -1)
  const maxCol = Math.max(...layout.keys.filter(k => k.matrix.col !== undefined).map(k => k.matrix.col!), -1)

  vialData.matrix.rows = Math.max(maxRow + 1, 1)
  vialData.matrix.cols = Math.max(maxCol + 1, 1)

  // レイアウトデータを変換（Vialはネストした配列形式）
  const vialLayout = convertToVialLayout(layout.keys)
  vialData.layouts.keymap = vialLayout

  // Layout Optionsの定義を反映（未定義の場合はlabels自体を出さない）
  if (layout.layoutOptions && layout.layoutOptions.length > 0) {
    vialData.layouts.labels = layout.layoutOptions.map(definition =>
      typeof definition === 'string' ? definition : [...definition]
    )
  }

  return JSON.stringify(vialData, null, 2)
}

/**
 * Vial形式のキーラベルを生成する
 * Layout Optionsが割り当てられたキーは、物理ラベルの4行目に
 * "グループ,チョイス"（いずれも0始まり）を符号化する。
 */
export function vialKeyLabel(key: Key): string {
  const base = `${key.matrix.row},${key.matrix.col}`
  if (!key.layoutOption) {
    return base
  }
  return `${base}\n\n\n${key.layoutOption.group},${key.layoutOption.choice}`
}

/**
 * KeyをQMKのレイアウト形式に変換
 */
function convertToQMKLayout(key: Key): QMKLayoutKey {
  const qmkKey: QMKLayoutKey = {
    x: key.x,
    y: key.y
  }

  // デフォルト値(1)以外の場合のみ出力
  if (key.width !== 1) {
    qmkKey.w = key.width
  }
  if (key.height !== 1) {
    qmkKey.h = key.height
  }

  // 行列情報
  if (key.matrix.row !== undefined && key.matrix.col !== undefined) {
    qmkKey.matrix = [key.matrix.row, key.matrix.col]
  }

  return qmkKey
}

/**
 * KeysをVialのレイアウト形式に変換
 * Vialは"row,col"形式の文字列とKLE形式のメタデータを使用
 *
 * 回転キーを含む場合は状態継承を避けるため全キー明示形式とし、
 * 含まない場合は正規の行形式（プロパティは変化がある場合のみ出力）とする。
 */
function convertToVialLayout(keys: Key[]): VialRowElement[][] {
  const sortedKeys = sortKeysByPhysicalPosition(keys).filter(
    key => key.matrix.row !== undefined && key.matrix.col !== undefined
  )

  if (sortedKeys.some(key => key.rotation)) {
    return convertToVialLayoutExplicit(sortedKeys)
  }

  return convertToVialLayoutRows(sortedKeys)
}

/**
 * 回転キーを含む場合の変換（従来形式）
 * キーごとに独立したKLE行を作り、回転・行間・重なりの状態継承を避ける。
 * 位置は既に回転移動済みなので、編集用の共通中心ではなくキー自身の中心で描画する。
 */
function convertToVialLayoutExplicit(sortedKeys: Key[]): VialRowElement[][] {
  return sortedKeys.map(key => {
    const metadata: VialKeyMetadata = {
      r: key.rotation || 0,
      rx: key.x + key.width / 2,
      ry: key.y + key.height / 2,
      x: -key.width / 2,
      y: -key.height / 2
    }

    if (key.shape === 'iso-enter') {
      metadata.x = -key.width / 2 + RENDERING.ISO_ENTER_OFFSET_X + 0.25
      metadata.w = 1.25
      metadata.h = 2
      metadata.w2 = 1.5
      metadata.h2 = 1
      metadata.x2 = -0.25
    } else {
      if (key.width !== 1) metadata.w = key.width
      if (key.height !== 1) metadata.h = key.height
    }

    return [metadata, vialKeyLabel(key)]
  })
}

/**
 * 回転キーを含まない場合の変換（正規の行形式）
 * 物理行ごとにまとめ、KLEデコーダのカーソルに対する差分だけを出力する。
 * - x: 前のキー（または行頭）からの間隔がある場合のみ
 * - y: 行頭のキーで、行間が標準（1u）からずれる場合のみ
 * - w/h: 標準サイズ（1u）でない場合のみ
 * - r/rx/ry は出力しない
 */
function convertToVialLayoutRows(sortedKeys: Key[]): VialRowElement[][] {
  const rows: VialRowElement[][] = []
  let row: VialRowElement[] = []
  let cursorX = 0
  let cursorY = 0 // デコーダが行頭で想定するy座標
  let currentRowY: number | null = null

  const flushRow = () => {
    if (row.length > 0) {
      rows.push(row)
      row = []
    }
  }

  for (const key of sortedKeys) {
    if (currentRowY === null || key.y !== currentRowY) {
      // 新しい物理行。デコーダは行末でyを1進めるため、差分は行頭で補正する
      flushRow()
      currentRowY = key.y
      cursorX = 0
    }

    const isRowStart = row.length === 0
    const metadata: VialKeyMetadata = {}

    if (key.shape === 'iso-enter') {
      // KLSの描画左端は保存座標より0.5u右。KLEの主矩形（幅1.25）は
      // さらに0.25u右から始まり、副矩形（幅1.5）が上段の張り出しを表す。
      const primaryX = key.x + RENDERING.ISO_ENTER_OFFSET_X + 0.25
      const gap = primaryX - cursorX
      if (gap !== 0) metadata.x = gap
      if (isRowStart && key.y !== cursorY) metadata.y = key.y - cursorY
      metadata.w = 1.25
      metadata.h = 2
      metadata.w2 = 1.5
      metadata.h2 = 1
      metadata.x2 = -0.25

      if (Object.keys(metadata).length > 0) row.push(metadata)
      row.push(vialKeyLabel(key))
      // デコーダは主矩形の幅だけカーソルを進め、描画右端に一致する。
      cursorX = primaryX + 1.25
    } else {
      const gap = key.x - cursorX
      if (gap !== 0) metadata.x = gap
      if (isRowStart && key.y !== cursorY) metadata.y = key.y - cursorY
      if (key.width !== 1) metadata.w = key.width
      if (key.height !== 1) metadata.h = key.height

      if (Object.keys(metadata).length > 0) row.push(metadata)
      row.push(vialKeyLabel(key))
      cursorX = key.x + key.width
    }

    if (isRowStart) {
      cursorY = key.y + 1
    }
  }

  flushRow()
  return rows
}

/**
 * QMK keymap.c形式にエクスポート
 */
export function exportToQMKKeymapC(layout: KeyboardLayout): string {
  // マトリクス情報が設定されているキーのみを対象
  const keysWithMatrix = layout.keys.filter(
    k => k.matrix.row !== undefined && k.matrix.col !== undefined
  )

  if (keysWithMatrix.length === 0) {
    throw new Error('マトリクス情報が設定されているキーがありません')
  }

  // キーを物理的な位置（y座標→x座標）の順序でソート
  // LAYOUTマクロはkeyboard.jsonの物理配置順序に従う
  const sortedKeys = sortKeysByPhysicalPosition(keysWithMatrix)

  // 各レイヤーのkeymap配列を生成
  const layers: string[] = []
  for (let layer = 0; layer < layout.layerCount; layer++) {
    const keycodes = sortedKeys.map(key => {
      // キーのkeycodes配列からレイヤーのキーコードを取得
      const keycode = key.keycodes?.[layer]
      // キーコードが設定されていない場合はKC_TRNSを使用
      return keycode || 'KC_TRNS'
    })

    // LAYOUTマクロの引数として整形（12個ごとに改行）
    const lines: string[] = []
    for (let i = 0; i < keycodes.length; i += 12) {
      const chunk = keycodes.slice(i, i + 12)
      lines.push('\t\t' + chunk.join(', ') + (i + 12 < keycodes.length ? ',' : ''))
    }

    const layerContent = `\t[${layer}] = LAYOUT(\n${lines.join('\n')}\n\t)`
    layers.push(layerContent)
  }

  // keymap.cファイルを生成
  const content = `/* SPDX-License-Identifier: GPL-2.0-or-later */
#include QMK_KEYBOARD_H

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
${layers.join(',\n')}
};
`

  return content
}

/**
 * JSONデータをファイルとしてダウンロード
 */
export function downloadJSON(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * テキストデータをファイルとしてダウンロード
 */
export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
