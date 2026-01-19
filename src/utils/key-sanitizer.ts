/**
 * キーのバリデーション・サニタイズロジック
 *
 * キーの各プロパティに対するバリデーションとサニタイズを一元管理します。
 * PropertyPanelの入力バリデーションとloadLayout時のサニタイズで共通使用されます。
 */
import { APP_CONFIG } from '../constants/app-config'
import type { Key } from '../types/keyboard'

/**
 * 数値を指定範囲にクランプする
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * 数値フィールド制約
 */
export interface FieldConstraints {
  min: number
  max: number
  /** バリデーションエラー時のメッセージ */
  errorMessage: string
}

/**
 * テキストフィールド制約
 */
export interface TextFieldConstraints {
  maxLength: number
  /** バリデーションエラー時のメッセージ */
  errorMessage: string
}

/**
 * キーの数値フィールド制約
 */
export const KEY_FIELD_CONSTRAINTS: Record<string, FieldConstraints> = {
  x: {
    min: 0,
    max: APP_CONFIG.MAX_KEY_X,
    errorMessage: `X座標は0〜${APP_CONFIG.MAX_KEY_X}の範囲である必要があります`
  },
  y: {
    min: 0,
    max: APP_CONFIG.MAX_KEY_Y,
    errorMessage: `Y座標は0〜${APP_CONFIG.MAX_KEY_Y}の範囲である必要があります`
  },
  width: {
    min: APP_CONFIG.MIN_KEY_SIZE,
    max: APP_CONFIG.MAX_KEY_WIDTH,
    errorMessage: `幅は${APP_CONFIG.MIN_KEY_SIZE}〜${APP_CONFIG.MAX_KEY_WIDTH}の範囲である必要があります`
  },
  height: {
    min: APP_CONFIG.MIN_KEY_SIZE,
    max: APP_CONFIG.MAX_KEY_HEIGHT,
    errorMessage: `高さは${APP_CONFIG.MIN_KEY_SIZE}〜${APP_CONFIG.MAX_KEY_HEIGHT}の範囲である必要があります`
  }
}

/**
 * マトリクスフィールド制約
 */
export const MATRIX_FIELD_CONSTRAINTS: Record<string, FieldConstraints> = {
  row: {
    min: 0,
    max: APP_CONFIG.MAX_MATRIX_ROW,
    errorMessage: `ROWは0〜${APP_CONFIG.MAX_MATRIX_ROW}の範囲である必要があります`
  },
  col: {
    min: 0,
    max: APP_CONFIG.MAX_MATRIX_COL,
    errorMessage: `COLは0〜${APP_CONFIG.MAX_MATRIX_COL}の範囲である必要があります`
  }
}

/**
 * テキストフィールド制約
 */
export const TEXT_FIELD_CONSTRAINTS: Record<string, TextFieldConstraints> = {
  legend: {
    maxLength: APP_CONFIG.MAX_LEGEND_LENGTH,
    errorMessage: `レジェンドは${APP_CONFIG.MAX_LEGEND_LENGTH}文字以内である必要があります`
  },
  layoutName: {
    maxLength: APP_CONFIG.MAX_LAYOUT_NAME_LENGTH,
    errorMessage: `レイアウト名は${APP_CONFIG.MAX_LAYOUT_NAME_LENGTH}文字以内である必要があります`
  },
  author: {
    maxLength: APP_CONFIG.MAX_AUTHOR_LENGTH,
    errorMessage: `作者名は${APP_CONFIG.MAX_AUTHOR_LENGTH}文字以内である必要があります`
  },
  description: {
    maxLength: APP_CONFIG.MAX_DESCRIPTION_LENGTH,
    errorMessage: `説明は${APP_CONFIG.MAX_DESCRIPTION_LENGTH}文字以内である必要があります`
  }
}

/**
 * 数値フィールドをバリデート
 * @returns バリデーション成功時はtrue
 */
export function validateNumericField(
  fieldName: string,
  value: number,
  constraints: Record<string, FieldConstraints> = KEY_FIELD_CONSTRAINTS
): boolean {
  const constraint = constraints[fieldName]
  if (!constraint) return true

  return !isNaN(value) && value >= constraint.min && value <= constraint.max
}

/**
 * 数値フィールドをサニタイズ（範囲内にクランプ）
 */
export function sanitizeNumericField(
  fieldName: string,
  value: number,
  constraints: Record<string, FieldConstraints> = KEY_FIELD_CONSTRAINTS
): number {
  const constraint = constraints[fieldName]
  if (!constraint) return value

  return clamp(value, constraint.min, constraint.max)
}

/**
 * 回転角度を正規化（-180〜180度の範囲に）
 */
export function normalizeRotation(value: number): number {
  if (isNaN(value)) return 0
  let normalized = value
  while (normalized > 180) normalized -= 360
  while (normalized <= -180) normalized += 360
  return normalized
}

/**
 * キーの座標・サイズをサニタイズ
 * @returns サニタイズされたキーと、修正があったかどうか
 */
export function sanitizeKeyGeometry(key: Key): { sanitized: Key; hasCorrected: boolean } {
  const sanitizedX = sanitizeNumericField('x', key.x)
  const sanitizedY = sanitizeNumericField('y', key.y)
  const sanitizedWidth = sanitizeNumericField('width', key.width)
  const sanitizedHeight = sanitizeNumericField('height', key.height)

  const hasCorrected =
    sanitizedX !== key.x ||
    sanitizedY !== key.y ||
    sanitizedWidth !== key.width ||
    sanitizedHeight !== key.height

  return {
    sanitized: {
      ...key,
      x: sanitizedX,
      y: sanitizedY,
      width: sanitizedWidth,
      height: sanitizedHeight
    },
    hasCorrected
  }
}

/**
 * テキストフィールドをバリデート
 * @returns バリデーション成功時はtrue
 */
export function validateTextField(
  fieldName: string,
  value: string,
  constraints: Record<string, TextFieldConstraints> = TEXT_FIELD_CONSTRAINTS
): boolean {
  const constraint = constraints[fieldName]
  if (!constraint) return true

  return value.length <= constraint.maxLength
}

/**
 * テキストフィールドをサニタイズ（最大長で切り詰め）
 */
export function sanitizeTextField(
  fieldName: string,
  value: string,
  constraints: Record<string, TextFieldConstraints> = TEXT_FIELD_CONSTRAINTS
): string {
  const constraint = constraints[fieldName]
  if (!constraint) return value

  return value.slice(0, constraint.maxLength)
}

/**
 * 数値フィールドのエラーメッセージを取得
 */
export function getFieldErrorMessage(
  fieldName: string,
  constraints: Record<string, FieldConstraints> = KEY_FIELD_CONSTRAINTS
): string {
  return constraints[fieldName]?.errorMessage ?? `${fieldName}の値が不正です`
}

/**
 * テキストフィールドのエラーメッセージを取得
 */
export function getTextFieldErrorMessage(
  fieldName: string,
  constraints: Record<string, TextFieldConstraints> = TEXT_FIELD_CONSTRAINTS
): string {
  return constraints[fieldName]?.errorMessage ?? `${fieldName}の値が不正です`
}
