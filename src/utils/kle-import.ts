import type { KeyboardLayout, Key, KeyLegend } from '../types/keyboard'

/**
 * KLEメタデータの型定義
 */
interface KLEMetadata {
  name?: string
  author?: string
  notes?: string
  [key: string]: unknown
}

/**
 * KLEキープロパティの型定義
 */
interface KLEKeyProps {
  x?: number
  y?: number
  w?: number
  h?: number
  a?: number
  [key: string]: unknown
}

/**
 * KLE行要素の型（プロパティオブジェクトまたはラベル文字列）
 */
type KLERowElement = KLEKeyProps | string

/**
 * KLE行の型
 */
type KLERow = KLERowElement[]

/**
 * KLEデータの型（メタデータまたは行の配列）
 */
type KLEData = (KLEMetadata | KLERow)[]

/**
 * KLEメタデータかどうかを判定する型ガード
 */
function isKLEMetadata(item: unknown): item is KLEMetadata {
  return typeof item === 'object' && item !== null && !Array.isArray(item)
}

/**
 * KLEキープロパティかどうかを判定する型ガード
 */
function isKLEKeyProps(item: unknown): item is KLEKeyProps {
  return typeof item === 'object' && item !== null && !Array.isArray(item)
}

/**
 * KLE JSON 文字列をパースして KeyboardLayout に変換
 */
export function parseKLEJson(jsonString: string): KeyboardLayout {
  try {
    const kleData = JSON.parse(jsonString)

    if (!Array.isArray(kleData)) {
      throw new Error('KLE data must be an array')
    }

    return convertKLEToKLS(kleData)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON syntax')
    }
    throw error
  }
}

/**
 * KLE データ配列を Keyboard Layout Studio の KeyboardLayout に変換
 */
export function convertKLEToKLS(kleData: KLEData): KeyboardLayout {
  const layout: KeyboardLayout = {
    name: 'Imported from KLE',
    keys: [],
    layerCount: 1,
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }
  }

  // メタデータの抽出（最初の要素がオブジェクトの場合）
  let startIndex = 0
  if (kleData.length > 0 && isKLEMetadata(kleData[0])) {
    const meta = kleData[0]
    if (meta.name) layout.name = meta.name
    if (meta.author) layout.metadata!.author = meta.author
    if (meta.notes) layout.metadata!.description = meta.notes
    startIndex = 1
  }

  // 行の処理
  let currentY = 0
  let keyIdCounter = Date.now()

  for (let i = startIndex; i < kleData.length; i++) {
    const row = kleData[i]

    if (!Array.isArray(row)) {
      console.warn(`Row ${i} is not an array, skipping`)
      continue
    }

    let currentX = 0
    let keyProps = getDefaultKeyProps()

    for (const element of row) {
      if (isKLEKeyProps(element)) {
        // プロパティオブジェクト
        if (typeof element.x === 'number') {
          currentX += element.x
        }
        if (typeof element.y === 'number') {
          currentY += element.y
        }
        if (typeof element.w === 'number') {
          keyProps.width = element.w
        }
        if (typeof element.h === 'number') {
          keyProps.height = element.h
        }
        if (typeof element.a === 'number') {
          keyProps.alignment = element.a
        }

        // 警告: alignment が 4 以外の場合
        if (element.a !== 4 && element.a !== undefined) {
          console.warn(`Alignment ${element.a} is not fully supported. Using best-effort mapping.`)
        }

      } else if (typeof element === 'string') {
        // キーラベル - 実際のキーを作成
        // 注: 座標・サイズのサニタイズは loadLayout で行われる
        const key: Key = {
          id: String(keyIdCounter++),
          x: currentX,
          y: currentY,
          width: keyProps.width,
          height: keyProps.height,
          legend: parseKLELabel(element),
          matrix: {}
        }

        layout.keys.push(key)

        // X 座標をキーの幅分進める
        currentX += keyProps.width

        // 幅と高さをリセット（KLE の仕様）
        keyProps.width = 1
        keyProps.height = 1
      }
    }

    // 次の行へ移動
    currentY += 1
  }

  return layout
}

/**
 * KLE のラベル文字列（改行区切り）を KeyLegend オブジェクトに変換
 */
export function parseKLELabel(label: string): KeyLegend {
  const parts = label.split('\n')
  const legend: KeyLegend = {}

  // Alignment a=4 (デフォルト) のマッピング
  // KLE の12ポジション → Keyboard Layout Studio の12ポジション
  // KLE の12ポジション → KLS の9ポジションへのマッピング
  // KLE の front* ポジション(4,5,6)は KLS には存在しないため、bottom* にマッピング
  const positionMap: (keyof KeyLegend | null)[] = [
    'topLeft',      // 0
    'bottomLeft',   // 1
    'topRight',     // 2
    'bottomRight',  // 3
    null,           // 4 - KLE frontLeft (KLS では未サポート)
    null,           // 5 - KLE frontCenter (KLS では未サポート)
    null,           // 6 - KLE frontRight (KLS では未サポート)
    'centerLeft',   // 7
    'center',       // 8
    'centerRight',  // 9
    'topCenter',    // 10
    'bottomCenter'  // 11
  ]

  // 各ラベルを対応する位置にマッピング
  parts.forEach((text, index) => {
    if (text && text.trim() !== '' && index < positionMap.length) {
      const position = positionMap[index]
      if (position) {
        legend[position] = text
      }
    }
  })

  return legend
}

/**
 * デフォルトのキープロパティを取得
 */
function getDefaultKeyProps() {
  return {
    width: 1,
    height: 1,
    alignment: 4
  }
}
