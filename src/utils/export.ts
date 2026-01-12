import type { KeyboardLayout, Key } from '../types/keyboard'
import qmkTemplate from '../templates/qmk-keyboard-template.json'
import vialTemplate from '../templates/vial-template.json'

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
  const qmkLayout = layout.keys.map(key => convertToQMKLayout(key))
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

  return JSON.stringify(vialData, null, 2)
}

/**
 * KeyをQMKのレイアウト形式に変換
 */
function convertToQMKLayout(key: Key) {
  const qmkKey: any = {
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
 */
function convertToVialLayout(keys: Key[]) {
  // y座標でグループ化して行に分ける
  const rowMap = new Map<number, Key[]>()

  keys.forEach(key => {
    const rowKeys = rowMap.get(key.y) || []
    rowKeys.push(key)
    rowMap.set(key.y, rowKeys)
  })

  // y座標でソートして行の配列を作成
  const sortedRows = Array.from(rowMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, rowKeys]) => rowKeys.sort((a, b) => a.x - b.x))

  // 各行を変換
  const vialLayout: any[][] = []

  sortedRows.forEach(rowKeys => {
    const row: any[] = []
    let lastX = 0

    rowKeys.forEach(key => {
      // マトリクス情報が必要
      if (key.matrix.row === undefined || key.matrix.col === undefined) {
        return // マトリクス情報がないキーはスキップ
      }

      // x座標の差分を計算（前のキーとの間隔）
      const xGap = key.x - lastX

      // メタデータオブジェクトを作成（デフォルト値以外のみ）
      const metadata: any = {}

      // ISO Enterなどの特殊形状の場合
      if (key.shape === 'iso-enter') {
        // ISO Enterは常にx: 0.25を出力（Vial向けの特別対応）
        metadata.x = 0.25
        metadata.w = 1.25
        metadata.h = 2
        metadata.w2 = 1.5
        metadata.h2 = 1
        metadata.x2 = -0.25
      } else {
        // 通常のキーの場合
        if (xGap > 0) {
          metadata.x = xGap
        }
        if (key.width !== 1) {
          metadata.w = key.width
        }
        if (key.height !== 1) {
          metadata.h = key.height
        }
      }

      // メタデータがある場合は追加
      if (Object.keys(metadata).length > 0) {
        row.push(metadata)
      }

      // キーのマトリクス位置を"row,col"形式で追加
      row.push(`${key.matrix.row},${key.matrix.col}`)

      // 次のキーの基準位置を更新
      lastX = key.x + key.width
    })

    if (row.length > 0) {
      vialLayout.push(row)
    }
  })

  return vialLayout
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
  const sortedKeys = [...keysWithMatrix].sort((a, b) => {
    if (a.y !== b.y) {
      return a.y - b.y
    }
    return a.x - b.x
  })

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
