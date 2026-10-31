/**
 * キーコードの言語別表示ラベル
 * キーボードレイアウト（ANSI/JIS）に応じてキーコードの表示文字列を変換
 */

import type { KeyboardLayoutType } from '../stores/keyboard'

/**
 * ANSIとJISで表示が異なるキーコードのマッピング
 */
export const keycodeLabels: Record<KeyboardLayoutType, Record<string, string>> = {
  ANSI: {
    // 基本文字キー（ANSI）
    KC_MINS: '-',
    KC_EQL: '=',
    KC_LBRC: '[',
    KC_RBRC: ']',
    KC_BSLS: '\\',
    KC_SCLN: ';',
    KC_QUOT: "'",
    KC_GRV: '`',
    KC_COMM: ',',
    KC_DOT: '.',
    KC_SLSH: '/',
    KC_LNG1: 'ImeOn',
    KC_LNG2: 'ImeOff',
    KC_LANGUAGE_1: 'ImeOn',
    KC_LANGUAGE_2: 'ImeOff',
  },
  JIS: {
    // 基本文字キー（JIS）
    KC_MINS: '-',
    KC_EQL: '^',
    KC_LBRC: '@',
    KC_RBRC: '[',
    KC_BSLS: ']',
    KC_SCLN: ';',
    KC_QUOT: ':',
    KC_GRV: '半角/全角',
    KC_COMM: ',',
    KC_DOT: '.',
    KC_SLSH: '/',
    // JIS固有のキー
    KC_INT1: '\\',
    KC_INT2: 'かな',
    KC_INT3: '¥',
    KC_INT4: '変換',
    KC_INT5: '無変換',
    KC_LNG1: 'ImeOn',
    KC_LNG2: 'ImeOff',
    KC_LANGUAGE_1: 'ImeOn',
    KC_LANGUAGE_2: 'ImeOff',
  },
}

/**
 * キーコードから表示ラベルを取得する
 * @param keycode QMKキーコード（例: "KC_EQL"）
 * @param layoutType キーボードレイアウトタイプ（"ANSI" | "JIS"）
 * @returns 表示用ラベル文字列
 */
export function getKeycodeLabel(keycode: string, layoutType: KeyboardLayoutType): string {
  // 言語別マッピングから検索
  const layoutLabels = keycodeLabels[layoutType]
  if (layoutLabels[keycode]) {
    return layoutLabels[keycode]
  }

  // KC_プレフィックスを除去してデフォルトラベルを返す
  // 例: "KC_A" → "A", "KC_ENT" → "ENT"
  if (keycode.startsWith('KC_')) {
    return keycode.substring(3)
  }

  // その他のキーコード（レイヤーキーなど）はそのまま返す
  return keycode
}
