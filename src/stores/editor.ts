/**
 * エディタストア
 *
 * 選択状態、表示モード、クリップボード、レイヤーなどのUI状態を管理
 * これらはセッション内でのみ有効で永続化されない
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Key } from '../types/keyboard'
import { useLayoutStore } from './layout'

export type DisplayMode = 'legend' | 'matrix'
export type KeyboardLayoutType = 'ANSI' | 'JIS'

export const useEditorStore = defineStore('editor', () => {
  const layoutStore = useLayoutStore()

  // State
  const selectedKeyIds = ref<string[]>([])
  const displayMode = ref<DisplayMode>('matrix')
  const keyboardLayout = ref<KeyboardLayoutType>('ANSI')
  const copiedKeys = ref<Key[]>([])
  const currentLayer = ref<number>(0)

  // Getters
  const selectedKey = computed(() => {
    if (selectedKeyIds.value.length !== 1) return null
    return layoutStore.getKeyById(selectedKeyIds.value[0]) || null
  })

  const selectedKeys = computed(() => {
    return layoutStore.getKeysByIds(selectedKeyIds.value)
  })

  const hasSelection = computed(() => selectedKeyIds.value.length > 0)
  const hasSingleSelection = computed(() => selectedKeyIds.value.length === 1)
  const hasMultipleSelection = computed(() => selectedKeyIds.value.length > 1)

  // Actions
  function selectKey(keyId: string | null) {
    if (keyId === null) {
      selectedKeyIds.value = []
    } else {
      selectedKeyIds.value = [keyId]
    }
  }

  function toggleKeySelection(keyId: string) {
    const index = selectedKeyIds.value.indexOf(keyId)
    if (index === -1) {
      selectedKeyIds.value.push(keyId)
    } else {
      selectedKeyIds.value.splice(index, 1)
    }
  }

  function selectMultipleKeys(keyIds: string[]) {
    selectedKeyIds.value = keyIds
  }

  function clearSelection() {
    selectedKeyIds.value = []
  }

  function selectNextKey(): boolean {
    if (selectedKeyIds.value.length !== 1) return false

    const currentId = selectedKeyIds.value[0]
    const keys = layoutStore.keys
    const currentIndex = keys.findIndex(k => k.id === currentId)

    if (currentIndex === -1) return false

    if (currentIndex < keys.length - 1) {
      selectedKeyIds.value = [keys[currentIndex + 1].id]
      return true
    }

    return false
  }

  function toggleDisplayMode() {
    displayMode.value = displayMode.value === 'legend' ? 'matrix' : 'legend'
  }

  function setKeyboardLayout(layoutType: KeyboardLayoutType) {
    keyboardLayout.value = layoutType
  }

  function copySelectedKeys() {
    if (selectedKeys.value.length === 0) return

    copiedKeys.value = selectedKeys.value.map(key => ({
      ...key,
      legend: { ...key.legend },
      matrix: { ...key.matrix },
      keycodes: { ...key.keycodes }
    }))
  }

  function getCopiedKeys(): Key[] {
    return copiedKeys.value
  }

  function hasCopiedKeys(): boolean {
    return copiedKeys.value.length > 0
  }

  function setCurrentLayer(layer: number) {
    if (layer >= 0 && layer < layoutStore.layerCount) {
      currentLayer.value = layer
    }
  }

  function resetCurrentLayerIfNeeded(maxLayer: number) {
    if (currentLayer.value >= maxLayer) {
      currentLayer.value = 0
    }
  }

  function resetState() {
    selectedKeyIds.value = []
    currentLayer.value = 0
  }

  return {
    // State
    selectedKeyIds,
    displayMode,
    keyboardLayout,
    copiedKeys,
    currentLayer,
    // Getters
    selectedKey,
    selectedKeys,
    hasSelection,
    hasSingleSelection,
    hasMultipleSelection,
    // Actions
    selectKey,
    toggleKeySelection,
    selectMultipleKeys,
    clearSelection,
    selectNextKey,
    toggleDisplayMode,
    setKeyboardLayout,
    copySelectedKeys,
    getCopiedKeys,
    hasCopiedKeys,
    setCurrentLayer,
    resetCurrentLayerIfNeeded,
    resetState
  }
})
