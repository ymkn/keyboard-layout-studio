/**
 * キープロパティフィールドのバリデーションと更新ロジック
 *
 * PropertyPanelで使用される各フィールドのバリデーション、変換、
 * 更新ロジックを提供します。
 * バリデーション/サニタイズの実ロジックはkey-sanitizer.tsに集約されています。
 */
import { showToast } from './useToast'
import {
  MATRIX_FIELD_CONSTRAINTS,
  validateNumericField,
  sanitizeNumericField,
  normalizeRotation,
  getFieldErrorMessage,
  validateTextField,
  getTextFieldErrorMessage
} from '../utils/key-sanitizer'
import type { Key, KeyMatrix, KeyLegend } from '../types/keyboard'

/**
 * 数値フィールドの定義
 */
export interface NumericFieldDefinition {
  /** 文字列から数値への変換関数 */
  parse: (value: string) => number
  /** バリデーション関数 */
  validate: (value: number) => boolean
  /** バリデーションエラー時のメッセージ */
  errorMessage: string
  /** 値の変換関数（例: 負の値を0にクランプ） */
  transform?: (value: number) => number
}

/**
 * テキストフィールドの定義
 */
export interface TextFieldDefinition {
  /** バリデーション関数 */
  validate: (value: string) => boolean
  /** バリデーションエラー時のメッセージ */
  errorMessage: string
}

/**
 * 数値フィールドの定義
 * key-sanitizer.tsの制約を使用してバリデーション/サニタイズを行う
 */
export const NUMERIC_FIELD_DEFINITIONS: Record<string, NumericFieldDefinition> = {
  x: {
    parse: parseFloat,
    validate: (v) => validateNumericField('x', v),
    errorMessage: getFieldErrorMessage('x'),
    transform: (v) => sanitizeNumericField('x', v)
  },
  y: {
    parse: parseFloat,
    validate: (v) => validateNumericField('y', v),
    errorMessage: getFieldErrorMessage('y'),
    transform: (v) => sanitizeNumericField('y', v)
  },
  width: {
    parse: parseFloat,
    validate: (v) => validateNumericField('width', v),
    errorMessage: getFieldErrorMessage('width'),
    transform: (v) => sanitizeNumericField('width', v)
  },
  height: {
    parse: parseFloat,
    validate: (v) => validateNumericField('height', v),
    errorMessage: getFieldErrorMessage('height'),
    transform: (v) => sanitizeNumericField('height', v)
  },
  rotation: {
    parse: parseFloat,
    validate: (v) => !isNaN(v),
    errorMessage: '回転角度は数値である必要があります',
    transform: normalizeRotation
  },
  // row/colは空入力を許可（parseInt → NaN → isNaN(v)でtrue）
  row: {
    parse: parseInt,
    validate: (v) => isNaN(v) || validateNumericField('row', v, MATRIX_FIELD_CONSTRAINTS),
    errorMessage: getFieldErrorMessage('row', MATRIX_FIELD_CONSTRAINTS),
    transform: (v) => isNaN(v) ? v : sanitizeNumericField('row', v, MATRIX_FIELD_CONSTRAINTS)
  },
  col: {
    parse: parseInt,
    validate: (v) => isNaN(v) || validateNumericField('col', v, MATRIX_FIELD_CONSTRAINTS),
    errorMessage: getFieldErrorMessage('col', MATRIX_FIELD_CONSTRAINTS),
    transform: (v) => isNaN(v) ? v : sanitizeNumericField('col', v, MATRIX_FIELD_CONSTRAINTS)
  }
}

/**
 * テキストフィールドの定義
 * key-sanitizer.tsの制約を使用してバリデーションを行う
 */
export const TEXT_FIELD_DEFINITIONS: Record<string, TextFieldDefinition> = {
  legend: {
    validate: (v) => validateTextField('legend', v),
    errorMessage: getTextFieldErrorMessage('legend')
  },
  layoutName: {
    validate: (v) => validateTextField('layoutName', v),
    errorMessage: getTextFieldErrorMessage('layoutName')
  },
  author: {
    validate: (v) => validateTextField('author', v),
    errorMessage: getTextFieldErrorMessage('author')
  },
  description: {
    validate: (v) => validateTextField('description', v),
    errorMessage: getTextFieldErrorMessage('description')
  }
}

/**
 * フィールド値の処理結果
 */
export interface FieldProcessResult {
  isValid: boolean
  value?: number | string
  errorMessage?: string
}

/**
 * 数値フィールドの値を処理する
 * @param fieldName フィールド名
 * @param rawValue 生の入力値（文字列）
 * @param options オプション
 * @returns 処理結果
 */
export function processNumericField(
  fieldName: string,
  rawValue: string,
  options: { showError?: boolean } = {}
): FieldProcessResult {
  const definition = NUMERIC_FIELD_DEFINITIONS[fieldName]
  if (!definition) {
    return { isValid: false, errorMessage: `Unknown field: ${fieldName}` }
  }

  const parsed = definition.parse(rawValue)

  if (!definition.validate(parsed)) {
    if (options.showError) {
      showToast(definition.errorMessage, 'error')
    }
    return { isValid: false, errorMessage: definition.errorMessage }
  }

  const transformed = definition.transform ? definition.transform(parsed) : parsed

  return { isValid: true, value: transformed }
}

/**
 * テキストフィールドの値を処理する
 * @param fieldName フィールド名
 * @param rawValue 生の入力値（文字列）
 * @param options オプション
 * @returns 処理結果
 */
export function processTextField(
  fieldName: string,
  rawValue: string,
  options: { showError?: boolean } = {}
): FieldProcessResult {
  const definition = TEXT_FIELD_DEFINITIONS[fieldName]
  if (!definition) {
    return { isValid: false, errorMessage: `Unknown field: ${fieldName}` }
  }

  if (!definition.validate(rawValue)) {
    if (options.showError) {
      showToast(definition.errorMessage, 'error')
    }
    return { isValid: false, errorMessage: definition.errorMessage }
  }

  return { isValid: true, value: rawValue }
}

/**
 * キーの数値プロパティを更新する
 * @param key 更新対象のキー
 * @param fieldName フィールド名
 * @param rawValue 生の入力値
 * @returns 更新データまたはnull（バリデーション失敗時）
 */
export function getNumericFieldUpdate(
  fieldName: string,
  rawValue: string
): Partial<Key> | null {
  const result = processNumericField(fieldName, rawValue)

  if (!result.isValid || result.value === undefined) {
    return null
  }

  switch (fieldName) {
    case 'x':
    case 'y':
    case 'width':
    case 'height':
    case 'rotation':
      return { [fieldName]: result.value }
    default:
      return null
  }
}

/**
 * マトリクスフィールドの更新データを取得
 * @param currentMatrix 現在のマトリクス値
 * @param field 更新するフィールド（row/col）
 * @param rawValue 生の入力値
 * @param options オプション（showError: trueでエラー時にトースト表示）
 * @returns 更新データ
 */
export function getMatrixFieldUpdate(
  currentMatrix: KeyMatrix,
  field: 'row' | 'col',
  rawValue: string,
  options: { showError?: boolean } = {}
): { matrix: KeyMatrix } {
  const result = processNumericField(field, rawValue, options)
  const value = result.isValid && typeof result.value === 'number' && !isNaN(result.value)
    ? result.value
    : undefined

  return {
    matrix: {
      ...currentMatrix,
      [field]: value
    }
  }
}

/**
 * レジェンドフィールドの更新データを取得
 * @param currentLegend 現在のレジェンド値
 * @param position 更新する位置
 * @param value 新しい値
 * @returns 更新データ
 */
export function getLegendFieldUpdate(
  currentLegend: KeyLegend,
  position: keyof KeyLegend,
  value: string
): { legend: KeyLegend } | null {
  const result = processTextField('legend', value)

  if (!result.isValid) {
    return null
  }

  return {
    legend: {
      ...currentLegend,
      [position]: result.value || undefined
    }
  }
}

/**
 * キーコードフィールドの更新データを取得
 * @param currentKeycodes 現在のキーコード
 * @param layer レイヤー番号
 * @param value 新しいキーコード
 * @returns 更新データ
 */
export function getKeycodeFieldUpdate(
  currentKeycodes: Record<number, string> | undefined,
  layer: number,
  value: string
): { keycodes: Record<number, string> } {
  const newKeycodes = { ...currentKeycodes }
  if (value) {
    newKeycodes[layer] = value
  } else {
    delete newKeycodes[layer]
  }
  return { keycodes: newKeycodes }
}

/**
 * レジェンドフィールド名の一覧
 */
export const LEGEND_FIELD_NAMES: (keyof KeyLegend)[] = [
  'topLeft', 'topCenter', 'topRight',
  'centerLeft', 'center', 'centerRight',
  'bottomLeft', 'bottomCenter', 'bottomRight'
]

/**
 * レジェンドフィールドかどうかを判定
 */
export function isLegendField(fieldName: string): fieldName is keyof KeyLegend {
  return LEGEND_FIELD_NAMES.includes(fieldName as keyof KeyLegend)
}
