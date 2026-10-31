/**
 * エディタストア
 *
 * 選択状態、表示モード、クリップボード、レイヤーなどのUI状態を管理
 * これらはセッション内でのみ有効で永続化されない
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Key, KeyLayoutOption } from '../types/keyboard'
import { useLayoutStore } from './layout'
import { sortKeysByPhysicalPosition } from '../utils/key-order'
import { getLayoutOptionGroups, layoutOptionId } from '../utils/layout-options'

export type DisplayMode = 'legend' | 'matrix'
export type KeyboardLayoutType = 'ANSI' | 'JIS'
export type LayoutOptionPreviewModeType = 'single' | 'compare'
export type SidebarTabType = 'properties' | 'layoutOptions'

export const useEditorStore = defineStore('editor', () => {
  const layoutStore = useLayoutStore()

  // State
  const selectedKeyIds = ref<string[]>([])
  const displayMode = ref<DisplayMode>('matrix')
  const keyboardLayout = ref<KeyboardLayoutType>('ANSI')
  const copiedKeys = ref<Key[]>([])
  const currentLayer = ref<number>(0)
  const activeLayoutOption = ref<KeyLayoutOption | null>(null)
  const hiddenLayoutOptions = ref<string[]>([])
  const layoutOptionPreview = ref(false)
  const layoutOptionPreviewMode = ref<LayoutOptionPreviewModeType>('compare')
  const previewChoices = ref<Record<number, number>>({})
  const sidebarTab = ref<SidebarTabType>('properties')

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
  const layoutOptionGroups = computed(() => getLayoutOptionGroups(layoutStore.layoutOptions, layoutStore.keys))
  const visibleKeys = computed(() => layoutStore.keys.filter(isKeyVisible))
  const editableKeys = computed(() => visibleKeys.value.filter(key =>
    !layoutOptionPreview.value && layoutOptionId(key.layoutOption) === layoutOptionId(activeLayoutOption.value)
  ))
  const editableKeyIds = computed(() => new Set(editableKeys.value.map(key => key.id)))
  const renderedKeys = computed(() => [
    ...visibleKeys.value.filter(key => !editableKeyIds.value.has(key.id)),
    ...editableKeys.value
  ])

  watch(editableKeyIds, ids => {
    selectedKeyIds.value = selectedKeyIds.value.filter(id => ids.has(id))
  }, { flush: 'sync' })
  watch(() => layoutStore.layout, resetLayoutOptionView, { flush: 'sync' })

  function isKeyVisible(key: Key): boolean {
    if (layoutOptionPreview.value) {
      if (!key.layoutOption) return true
      const { group, choice } = key.layoutOption
      const defaultChoice = layoutOptionGroups.value.find(item => item.index === group)?.choices[0]?.index ?? 0
      return choice === (previewChoices.value[group] ?? defaultChoice)
    }
    return !hiddenLayoutOptions.value.includes(layoutOptionId(key.layoutOption))
  }

  function setActiveLayoutOption(option: KeyLayoutOption | null) {
    activeLayoutOption.value = option ? { ...option } : null
    hiddenLayoutOptions.value = hiddenLayoutOptions.value.filter(id => id !== layoutOptionId(option))
    clearSelection()
  }

  function toggleLayoutOptionVisibility(option: KeyLayoutOption | null) {
    const id = layoutOptionId(option)
    hiddenLayoutOptions.value = hiddenLayoutOptions.value.includes(id)
      ? hiddenLayoutOptions.value.filter(item => item !== id)
      : [...hiddenLayoutOptions.value, id]
  }

  function showActiveLayoutOption() {
    const id = layoutOptionId(activeLayoutOption.value)
    hiddenLayoutOptions.value = hiddenLayoutOptions.value.filter(item => item !== id)
  }

  function setLayoutOptionPreview(enabled: boolean) {
    layoutOptionPreview.value = enabled
    clearSelection()
  }

  function setPreviewChoice(group: number, choice: number) {
    previewChoices.value = { ...previewChoices.value, [group]: choice }
  }

  function setLayoutOptionPreviewMode(mode: LayoutOptionPreviewModeType) {
    layoutOptionPreviewMode.value = mode
  }

  function setSidebarTab(tab: SidebarTabType) {
    sidebarTab.value = tab
  }

  function resetLayoutOptionView() {
    activeLayoutOption.value = null
    hiddenLayoutOptions.value = []
    layoutOptionPreview.value = false
    layoutOptionPreviewMode.value = 'compare'
    previewChoices.value = {}
    clearSelection()
  }

  // Actions
  function selectKey(keyId: string | null) {
    if (keyId === null) {
      selectedKeyIds.value = []
    } else {
      selectedKeyIds.value = editableKeyIds.value.has(keyId) ? [keyId] : []
    }
  }

  function toggleKeySelection(keyId: string) {
    if (!editableKeyIds.value.has(keyId)) return
    const index = selectedKeyIds.value.indexOf(keyId)
    if (index === -1) {
      selectedKeyIds.value.push(keyId)
    } else {
      selectedKeyIds.value.splice(index, 1)
    }
  }

  function selectMultipleKeys(keyIds: string[]) {
    selectedKeyIds.value = keyIds.filter(id => editableKeyIds.value.has(id))
  }

  function clearSelection() {
    selectedKeyIds.value = []
  }

  function selectNextKey(): boolean {
    if (selectedKeyIds.value.length !== 1) return false

    const currentId = selectedKeyIds.value[0]
    const keys = sortKeysByPhysicalPosition(editableKeys.value)
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
      keycodes: { ...key.keycodes },
      layoutOption: key.layoutOption ? { ...key.layoutOption } : undefined
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
    resetLayoutOptionView()
    sidebarTab.value = 'properties'
  }

  return {
    // State
    selectedKeyIds,
    displayMode,
    keyboardLayout,
    copiedKeys,
    currentLayer,
    activeLayoutOption,
    hiddenLayoutOptions,
    layoutOptionPreview,
    layoutOptionPreviewMode,
    previewChoices,
    sidebarTab,
    layoutOptionGroups,
    visibleKeys,
    editableKeys,
    editableKeyIds,
    renderedKeys,
    setActiveLayoutOption,
    toggleLayoutOptionVisibility,
    showActiveLayoutOption,
    setLayoutOptionPreview,
    setLayoutOptionPreviewMode,
    setSidebarTab,
    setPreviewChoice,
    resetLayoutOptionView,
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
