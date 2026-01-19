/**
 * キーボードストア（統合ファサード）
 *
 * 後方互換性のため、既存のuseKeyboardStore APIを維持しつつ、
 * 内部では分割されたストア（layout, editor, history, auth）を使用
 *
 * 新規コードでは個別のストアを直接使用することを推奨:
 * - useLayoutStore: レイアウトデータとキー操作
 * - useEditorStore: 選択状態、表示モード、クリップボード
 * - useHistoryStore: Undo/Redo履歴
 * - useAuthStore: GitHub認証、ソース/保存先
 */
import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { Key, KeyboardLayout, LegendFont } from '../types/keyboard'
import type { StorageSource, GitHubAuth } from '../types/github'
import { useLayoutStore } from './layout'
import { useEditorStore } from './editor'
import type { KeyboardLayoutType } from './editor'
import { useHistoryStore } from './history'
import { useAuthStore } from './auth'

// 型のre-export
export type { DisplayMode, KeyboardLayoutType } from './editor'

// 個別ストアのre-export
export { useLayoutStore } from './layout'
export { useEditorStore } from './editor'
export { useHistoryStore } from './history'
export { useAuthStore } from './auth'

export const useKeyboardStore = defineStore('keyboard', () => {
  // 分割されたストアを取得
  const layoutStore = useLayoutStore()
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()
  const authStore = useAuthStore()

  // 履歴監視をセットアップ
  historyStore.setupLayoutWatcher()

  // ========================================
  // State（後方互換性のためのプロキシ）
  // ========================================
  const layout = computed(() => layoutStore.layout)
  const selectedKeyIds = computed(() => editorStore.selectedKeyIds)
  const displayMode = computed(() => editorStore.displayMode)
  const keyboardLayout = computed(() => editorStore.keyboardLayout)
  const copiedKeys = computed(() => editorStore.copiedKeys)
  const currentLayer = computed(() => editorStore.currentLayer)
  const history = computed(() => historyStore.snapshots)
  const historyIndex = computed(() => historyStore.currentIndex)
  const layoutSource = computed(() => authStore.layoutSource)
  const layoutGistId = computed(() => authStore.layoutGistId)
  const layoutGistFileKey = computed(() => authStore.layoutGistFileKey)
  const saveDestination = computed(() => authStore.saveDestination)
  const githubAuth = computed(() => authStore.githubAuth)

  // ========================================
  // Getters
  // ========================================
  const selectedKey = computed(() => editorStore.selectedKey)
  const selectedKeys = computed(() => editorStore.selectedKeys)
  const keys = computed(() => layoutStore.keys)
  const canUndo = computed(() => historyStore.canUndo)
  const canRedo = computed(() => historyStore.canRedo)
  const isLoggedIn = computed(() => authStore.isLoggedIn)

  // ========================================
  // Actions（後方互換性のためのラッパー）
  // ========================================

  // Selection actions
  function selectKey(keyId: string | null) {
    editorStore.selectKey(keyId)
  }

  function toggleKeySelection(keyId: string) {
    editorStore.toggleKeySelection(keyId)
  }

  function selectMultipleKeys(keyIds: string[]) {
    editorStore.selectMultipleKeys(keyIds)
  }

  function clearSelection() {
    editorStore.clearSelection()
  }

  function selectNextKey() {
    return editorStore.selectNextKey()
  }

  // Key manipulation actions
  function updateKey(keyId: string, updates: Partial<Key>) {
    layoutStore.updateKey(keyId, updates)
  }

  function moveSelectedKeys(deltaX: number, deltaY: number) {
    layoutStore.moveKeys(editorStore.selectedKeyIds, deltaX, deltaY)
  }

  function resizeSelectedKeys(deltaWidth: number, deltaHeight: number) {
    layoutStore.resizeKeys(editorStore.selectedKeyIds, deltaWidth, deltaHeight)
  }

  function rotateSelectedKeys(deltaAngle: number) {
    layoutStore.rotateKeys(editorStore.selectedKeyIds, deltaAngle)
  }

  function addKey() {
    // 選択中のキーがある場合、その右隣に配置
    let x = 0
    let y = 0
    const selected = editorStore.selectedKey
    if (selected) {
      x = selected.x + selected.width
      y = selected.y
    }

    const newId = layoutStore.addKey(x, y)
    editorStore.selectKey(newId)
  }

  function deleteSelectedKeys() {
    layoutStore.deleteKeys(editorStore.selectedKeyIds)
    editorStore.clearSelection()
  }

  // Layout actions
  function loadLayout(newLayout: KeyboardLayout): boolean {
    const hasCorrectedValues = layoutStore.loadLayout(newLayout)
    editorStore.resetState()
    editorStore.resetCurrentLayerIfNeeded(newLayout.layerCount)
    historyStore.initializeHistory()
    return hasCorrectedValues
  }

  function toggleDisplayMode() {
    editorStore.toggleDisplayMode()
  }

  function setKeyboardLayout(layoutType: KeyboardLayoutType) {
    editorStore.setKeyboardLayout(layoutType)
  }

  // Copy/paste actions
  function copySelectedKeys() {
    editorStore.copySelectedKeys()
  }

  function pasteKeys() {
    const copied = editorStore.getCopiedKeys()
    if (copied.length === 0) return

    const newKeyIds: string[] = []
    const baseTime = Date.now()

    // 選択中のキーがある場合、最初のキーの右隣を基準に配置
    let baseX = 0
    let baseY = 0
    const selectedKeysList = editorStore.selectedKeys
    if (selectedKeysList.length > 0) {
      const firstSelected = selectedKeysList[0]
      baseX = firstSelected.x + firstSelected.width
      baseY = firstSelected.y
    }

    // コピーしたキーの最小座標を取得
    const minX = Math.min(...copied.map(k => k.x))
    const minY = Math.min(...copied.map(k => k.y))

    const newKeys: Key[] = copied.map((copiedKey, index) => {
      const newId = String(baseTime + index)
      newKeyIds.push(newId)
      return {
        ...copiedKey,
        id: newId,
        x: baseX + (copiedKey.x - minX),
        y: baseY + (copiedKey.y - minY)
      }
    })

    layoutStore.addKeys(newKeys)
    editorStore.selectMultipleKeys(newKeyIds)

    return newKeyIds
  }

  // Metadata actions
  function updateMetadata(updates: { name?: string; author?: string; description?: string }) {
    layoutStore.updateMetadata(updates)
  }

  function setLegendFont(font: LegendFont | undefined) {
    layoutStore.setLegendFont(font)
  }

  // Layer actions
  function setCurrentLayer(layer: number) {
    editorStore.setCurrentLayer(layer)
  }

  function incrementLayerCount() {
    layoutStore.incrementLayerCount()
  }

  function decrementLayerCount(layerToDelete?: number) {
    const newCount = layoutStore.decrementLayerCount(layerToDelete)
    // 削除したレイヤーが現在選択中のレイヤーより小さい場合、現在のレイヤーを1減らす
    if (layerToDelete !== undefined && layerToDelete < editorStore.currentLayer) {
      editorStore.setCurrentLayer(editorStore.currentLayer - 1)
    }
    editorStore.resetCurrentLayerIfNeeded(newCount)
  }

  // History actions
  function undo() {
    if (historyStore.undo()) {
      editorStore.clearSelection()
    }
  }

  function redo() {
    if (historyStore.redo()) {
      editorStore.clearSelection()
    }
  }

  // New layout action
  function createNewLayout() {
    layoutStore.createNewLayout()
    editorStore.resetState()
    authStore.resetToNew()
    historyStore.initializeHistory()
  }

  // Auth actions
  function setLayoutSource(source: StorageSource, gistId?: string, fileKey?: string) {
    authStore.setLayoutSource(source, gistId, fileKey)
  }

  function clearLayoutSource() {
    authStore.clearLayoutSource()
  }

  function setSaveDestination(dest: 'local' | 'gist') {
    authStore.setSaveDestination(dest)
  }

  function setGitHubAuth(auth: GitHubAuth | null) {
    authStore.setGitHubAuth(auth)
  }

  function loadGitHubAuth() {
    authStore.loadGitHubAuth()
  }

  function logoutGitHub() {
    authStore.logoutGitHub()
  }

  return {
    // State
    layout,
    selectedKeyIds,
    selectedKey,
    selectedKeys,
    keys,
    displayMode,
    keyboardLayout,
    copiedKeys,
    currentLayer,
    history,
    historyIndex,
    canUndo,
    canRedo,
    isLoggedIn,
    layoutSource,
    layoutGistId,
    layoutGistFileKey,
    saveDestination,
    githubAuth,
    // Actions
    selectKey,
    toggleKeySelection,
    selectMultipleKeys,
    clearSelection,
    selectNextKey,
    updateKey,
    moveSelectedKeys,
    resizeSelectedKeys,
    rotateSelectedKeys,
    addKey,
    deleteSelectedKeys,
    loadLayout,
    toggleDisplayMode,
    setKeyboardLayout,
    copySelectedKeys,
    pasteKeys,
    updateMetadata,
    setLegendFont,
    setCurrentLayer,
    incrementLayerCount,
    decrementLayerCount,
    undo,
    redo,
    createNewLayout,
    setLayoutSource,
    clearLayoutSource,
    setSaveDestination,
    setGitHubAuth,
    loadGitHubAuth,
    logoutGitHub
  }
})
