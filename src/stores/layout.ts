/**
 * レイアウトストア
 *
 * 永続化対象のレイアウトデータとキー操作を管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Key, KeyboardLayout, LegendFont } from '../types/keyboard'
import { getPresets } from '../services/presets'
import { APP_CONFIG } from '../constants/app-config'
import { sanitizeKeyGeometry, sanitizeTextField } from '../utils/key-sanitizer'

/**
 * 旧形式のキーデータ（keycodeフィールドを持つ）
 * インポート時に古いファイル形式からの変換に使用
 */
interface LegacyKey {
  id: string
  x: number
  y: number
  width: number
  height: number
  legend: Key['legend']
  matrix: Key['matrix']
  keycode?: string
  rotation?: number
  shape?: Key['shape']
}

/**
 * 旧形式のキーかどうかを判定する型ガード
 */
function isLegacyKey(key: unknown): key is LegacyKey {
  return typeof key === 'object' && key !== null &&
         'keycode' in key && typeof (key as LegacyKey).keycode === 'string'
}

/**
 * 初期レイアウトとしてNumpadプリセットを取得
 */
function getInitialLayout(): KeyboardLayout {
  const presets = getPresets()
  const numpad = presets.find(p => p.id === 'numpad')
  if (numpad) {
    return structuredClone(numpad.layout)
  }
  // フォールバック
  return {
    name: 'Untitled Layout',
    keys: [],
    layerCount: 1,
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }
  }
}

/**
 * レイアウトをディープクローン
 */
export function cloneLayout(layout: KeyboardLayout): KeyboardLayout {
  return {
    name: layout.name,
    layerCount: layout.layerCount,
    legendFont: layout.legendFont,
    keys: layout.keys.map(key => ({
      ...key,
      legend: { ...key.legend },
      matrix: { ...key.matrix },
      keycodes: { ...key.keycodes }
    })),
    metadata: layout.metadata ? { ...layout.metadata } : undefined
  }
}

export const useLayoutStore = defineStore('layout', () => {
  // State
  const layout = ref<KeyboardLayout>(getInitialLayout())

  // Getters
  const keys = computed(() => layout.value.keys)
  const layerCount = computed(() => layout.value.layerCount)
  const layoutName = computed(() => layout.value.name)
  const legendFont = computed(() => layout.value.legendFont)
  const metadata = computed(() => layout.value.metadata)

  // 履歴保存コールバック（historyストアから設定される）
  let onLayoutChange: (() => void) | null = null

  function setOnLayoutChange(callback: (() => void) | null) {
    onLayoutChange = callback
  }

  function notifyChange() {
    layout.value.metadata!.modified = new Date().toISOString()
    if (onLayoutChange) {
      onLayoutChange()
    }
  }

  // Actions
  function updateKey(keyId: string, updates: Partial<Key>) {
    const index = layout.value.keys.findIndex(k => k.id === keyId)
    if (index !== -1) {
      // マイナス座標を禁止（0に制限）
      const sanitizedUpdates = { ...updates }
      if (sanitizedUpdates.x !== undefined) {
        sanitizedUpdates.x = Math.max(0, sanitizedUpdates.x)
      }
      if (sanitizedUpdates.y !== undefined) {
        sanitizedUpdates.y = Math.max(0, sanitizedUpdates.y)
      }

      layout.value.keys[index] = {
        ...layout.value.keys[index],
        ...sanitizedUpdates
      }
      notifyChange()
    }
  }

  function moveKeys(keyIds: string[], deltaX: number, deltaY: number) {
    let moved = false
    for (const keyId of keyIds) {
      const index = layout.value.keys.findIndex(k => k.id === keyId)
      if (index !== -1) {
        const key = layout.value.keys[index]
        const newX = Math.max(0, key.x + deltaX)
        const newY = Math.max(0, key.y + deltaY)

        layout.value.keys[index] = {
          ...key,
          x: newX,
          y: newY
        }
        moved = true
      }
    }
    if (moved) {
      notifyChange()
    }
  }

  function resizeKeys(keyIds: string[], deltaWidth: number, deltaHeight: number) {
    let resized = false
    for (const keyId of keyIds) {
      const index = layout.value.keys.findIndex(k => k.id === keyId)
      if (index !== -1) {
        const key = layout.value.keys[index]
        layout.value.keys[index] = {
          ...key,
          width: Math.max(APP_CONFIG.MIN_KEY_SIZE, key.width + deltaWidth),
          height: Math.max(APP_CONFIG.MIN_KEY_SIZE, key.height + deltaHeight)
        }
        resized = true
      }
    }
    if (resized) {
      notifyChange()
    }
  }

  function rotateKeys(keyIds: string[], deltaAngle: number) {
    let rotated = false
    for (const keyId of keyIds) {
      const index = layout.value.keys.findIndex(k => k.id === keyId)
      if (index !== -1) {
        const key = layout.value.keys[index]
        const currentRotation = key.rotation || 0
        let newRotation = currentRotation + deltaAngle
        while (newRotation > 180) newRotation -= 360
        while (newRotation <= -180) newRotation += 360
        layout.value.keys[index] = {
          ...key,
          rotation: newRotation
        }
        rotated = true
      }
    }
    if (rotated) {
      notifyChange()
    }
  }

  function addKey(x: number = 0, y: number = 0): string {
    const newId = String(Date.now())
    const newKey: Key = {
      id: newId,
      x,
      y,
      width: APP_CONFIG.DEFAULT_KEY_SIZE,
      height: APP_CONFIG.DEFAULT_KEY_SIZE,
      legend: {},
      matrix: {},
      keycodes: {},
      shape: 'rectangle'
    }
    layout.value.keys.push(newKey)
    notifyChange()
    return newId
  }

  function deleteKeys(keyIds: string[]) {
    if (keyIds.length === 0) return
    layout.value.keys = layout.value.keys.filter(k => !keyIds.includes(k.id))
    notifyChange()
  }

  function addKeys(newKeys: Key[]) {
    layout.value.keys.push(...newKeys)
    notifyChange()
  }

  /**
   * レイアウトをロードする
   * @param newLayout ロードするレイアウト
   * @returns 値の修正が行われた場合は true
   */
  function loadLayout(newLayout: KeyboardLayout): boolean {
    // ディープクローンを作成（プリセットなど元データの汚染を防ぐ）
    const clonedLayout = structuredClone(newLayout)

    // layerCountがない場合は1に設定
    if (!clonedLayout.layerCount) {
      clonedLayout.layerCount = 1
    }

    let hasCorrectedValues = false

    // メタデータのサニタイズ
    const sanitizedName = sanitizeTextField('layoutName', clonedLayout.name || '')
    if (sanitizedName !== clonedLayout.name) {
      clonedLayout.name = sanitizedName
      hasCorrectedValues = true
    }

    if (clonedLayout.metadata) {
      if (clonedLayout.metadata.author) {
        const sanitizedAuthor = sanitizeTextField('author', clonedLayout.metadata.author)
        if (sanitizedAuthor !== clonedLayout.metadata.author) {
          clonedLayout.metadata.author = sanitizedAuthor
          hasCorrectedValues = true
        }
      }
      if (clonedLayout.metadata.description) {
        const sanitizedDescription = sanitizeTextField('description', clonedLayout.metadata.description)
        if (sanitizedDescription !== clonedLayout.metadata.description) {
          clonedLayout.metadata.description = sanitizedDescription
          hasCorrectedValues = true
        }
      }
    }

    // 各キーの古い形式を新形式に変換し、値をサニタイズ
    clonedLayout.keys = (clonedLayout.keys as unknown[]).map((key): Key => {
      let convertedKey: Key

      if (isLegacyKey(key)) {
        const { keycode, ...rest } = key
        convertedKey = {
          ...rest,
          keycodes: keycode ? { 0: keycode } : {}
        }
      } else {
        const currentKey = key as Key
        convertedKey = currentKey.keycodes
          ? currentKey
          : { ...currentKey, keycodes: {} }
      }

      // 座標・サイズのサニタイズ
      const { sanitized, hasCorrected } = sanitizeKeyGeometry(convertedKey)
      if (hasCorrected) {
        hasCorrectedValues = true
      }

      return sanitized
    })

    layout.value = clonedLayout
    return hasCorrectedValues
  }

  function setLayout(newLayout: KeyboardLayout) {
    layout.value = newLayout
  }

  function updateMetadata(updates: { name?: string; author?: string; description?: string }) {
    if (updates.name !== undefined) {
      layout.value.name = updates.name
    }

    if (!layout.value.metadata) {
      layout.value.metadata = {}
    }

    if (updates.author !== undefined) {
      layout.value.metadata.author = updates.author
    }

    if (updates.description !== undefined) {
      layout.value.metadata.description = updates.description
    }

    notifyChange()
  }

  function setLegendFont(font: LegendFont | undefined) {
    layout.value.legendFont = font
    if (!layout.value.metadata) {
      layout.value.metadata = {}
    }
    notifyChange()
  }

  function incrementLayerCount() {
    if (layout.value.layerCount < APP_CONFIG.MAX_LAYER_COUNT) {
      const newLayerIndex = layout.value.layerCount
      layout.value.layerCount++

      layout.value.keys.forEach(key => {
        if (!key.keycodes) {
          key.keycodes = {}
        }
        key.keycodes[newLayerIndex] = 'KC_TRNS'
      })

      notifyChange()
    }
  }

  function decrementLayerCount(layerToDelete?: number): number {
    if (layout.value.layerCount > APP_CONFIG.MIN_LAYER_COUNT) {
      // パラメータが指定されていない場合は最後のレイヤーを削除（後方互換性）
      const removedLayer = layerToDelete !== undefined ? layerToDelete : layout.value.layerCount - 1

      // 削除対象レイヤーのキーコードを削除
      layout.value.keys.forEach(key => {
        if (key.keycodes && key.keycodes[removedLayer]) {
          delete key.keycodes[removedLayer]
        }
      })

      // 削除対象レイヤーより後のレイヤーのキーコードをシフト
      layout.value.keys.forEach(key => {
        if (key.keycodes) {
          const newKeycodes: Record<number, string> = {}
          for (const layer in key.keycodes) {
            const layerNum = parseInt(layer)
            if (layerNum < removedLayer) {
              newKeycodes[layerNum] = key.keycodes[layerNum]
            } else if (layerNum > removedLayer) {
              newKeycodes[layerNum - 1] = key.keycodes[layerNum]
            }
          }
          key.keycodes = newKeycodes
        }
      })

      layout.value.layerCount--
      notifyChange()
      return layout.value.layerCount
    }
    return layout.value.layerCount
  }

  function createNewLayout() {
    const newLayout: KeyboardLayout = {
      name: 'Untitled Layout',
      keys: [],
      layerCount: 1,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    }
    layout.value = newLayout
  }

  function getKeyById(keyId: string): Key | undefined {
    return layout.value.keys.find(k => k.id === keyId)
  }

  function getKeysByIds(keyIds: string[]): Key[] {
    return layout.value.keys.filter(k => keyIds.includes(k.id))
  }

  return {
    // State
    layout,
    // Getters
    keys,
    layerCount,
    layoutName,
    legendFont,
    metadata,
    // Actions
    setOnLayoutChange,
    updateKey,
    moveKeys,
    resizeKeys,
    rotateKeys,
    addKey,
    deleteKeys,
    addKeys,
    loadLayout,
    setLayout,
    updateMetadata,
    setLegendFont,
    incrementLayerCount,
    decrementLayerCount,
    createNewLayout,
    getKeyById,
    getKeysByIds
  }
})
