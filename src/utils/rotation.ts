import type { Key, RotationCenter } from '../types/keyboard'
import { APP_CONFIG } from '../constants/app-config'
import { normalizeRotation } from './key-sanitizer'

const COORDINATE_EPSILON = 1e-9

/** 回転中心を有効なu座標に補正する。未設定の座標は原点とする。 */
export function sanitizeRotationCenter(value: unknown): RotationCenter {
  const center = typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : {}
  const sanitize = (coordinate: unknown, max: number): number =>
    typeof coordinate === 'number' && Number.isFinite(coordinate)
      ? Math.min(max, Math.max(0, coordinate))
      : 0

  return {
    x: sanitize(center.x, APP_CONFIG.MAX_KEY_X),
    y: sanitize(center.y, APP_CONFIG.MAX_KEY_Y)
  }
}

/**
 * 共通の中心を基準にキーの位置と向きを回転する。
 * 座標範囲を超える場合は、配置を変形させずに呼び出し元で中止できるようnullを返す。
 */
export function rotateKeyAroundPoint(key: Key, center: RotationCenter, deltaAngle: number): Key | null {
  if (![key.x, key.y, key.width, key.height, key.rotation ?? 0, center.x, center.y, deltaAngle]
    .every(Number.isFinite)) return null

  const angle = deltaAngle % 360
  const radians = angle * Math.PI / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const offsetX = key.x + key.width / 2 - center.x
  const offsetY = key.y + key.height / 2 - center.y
  const x = center.x + offsetX * cos - offsetY * sin - key.width / 2
  const y = center.y + offsetX * sin + offsetY * cos - key.height / 2

  if (!Number.isFinite(x) || !Number.isFinite(y) ||
      x < -COORDINATE_EPSILON || x > APP_CONFIG.MAX_KEY_X + COORDINATE_EPSILON ||
      y < -COORDINATE_EPSILON || y > APP_CONFIG.MAX_KEY_Y + COORDINATE_EPSILON) return null

  return {
    ...key,
    x: Math.min(APP_CONFIG.MAX_KEY_X, Math.max(0, x)),
    y: Math.min(APP_CONFIG.MAX_KEY_Y, Math.max(0, y)),
    rotation: normalizeRotation(((key.rotation ?? 0) % 360) + angle)
  }
}
