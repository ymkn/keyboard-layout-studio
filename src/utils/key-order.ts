import type { Key } from '../types/keyboard'

/**
 * 画面上の物理配置順でキーを並べる
 *
 * エクスポート時のLAYOUT引数順と、プロパティ入力時の次キー移動順を揃えるために使用します。
 */
export function sortKeysByPhysicalPosition(keys: readonly Key[]): Key[] {
  return [...keys].sort(compareKeysByPhysicalPosition)
}

/**
 * 画面上の物理配置順でキーを比較する
 */
export function compareKeysByPhysicalPosition(a: Key, b: Key): number {
  if (a.y !== b.y) {
    return a.y - b.y
  }

  if (a.x !== b.x) {
    return a.x - b.x
  }

  return a.id.localeCompare(b.id, undefined, { numeric: true })
}
