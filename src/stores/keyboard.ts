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
import { layoutOptionId } from '../utils/layout-options'

// 型のre-export
export type { DisplayMode, KeyboardLayoutType } from './editor'

// 個別ストアのre-export
export { useLayoutStore } from './layout'
export { useEditorStore } from './editor'
export { useHistoryStore } from './history'
export { useAuthStore } from './auth'

/**
 * 既存IDと重複しないキーIDを作成する
 */
function createUniqueKeyId(baseId: string, usedIds: Set<string>): string {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId)
    return baseId
  }

  let suffix = 2
  let candidate = `${baseId}-${suffix}`
  while (usedIds.has(candidate)) {
    suffix++
    candidate = `${baseId}-${suffix}`
  }

  usedIds.add(candidate)
  return candidate
}

export const useKeyboardStore = defineStore('keyboard', () => {
  // 分割されたストアを取得
  const layoutStore = useLayoutStore()
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()
  const authStore = useAuthStore()

  // 履歴監視をセットアップ
  historyStore.setupLayoutWatcher()
  if (historyStore.snapshots.length === 0) historyStore.initializeHistory()

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

  function rotateSelectedKeysAroundCenter(deltaAngle: number): boolean {
    return layoutStore.rotateKeysAroundCenter(editorStore.selectedKeyIds, deltaAngle)
  }

  function addKey() {
    if (editorStore.layoutOptionPreview) return
    editorStore.showActiveLayoutOption()
    // 選択中のキーがある場合、その右隣に配置
    let x = 0
    let y = 0
    const selected = editorStore.selectedKey
    if (selected) {
      x = selected.x + selected.width
      y = selected.y
    }

    const newId = layoutStore.addKey(x, y, editorStore.activeLayoutOption ?? undefined)
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
    if (editorStore.layoutOptionPreview) return
    const copied = editorStore.getCopiedKeys()
    if (copied.length === 0) return
    editorStore.showActiveLayoutOption()

    const newKeyIds: string[] = []
    const baseTime = Date.now()
    const usedIds = new Set(layoutStore.keys.map(key => key.id))

    const minX = Math.min(...copied.map(k => k.x))
    const minY = Math.min(...copied.map(k => k.y))
    const sameTarget = copied.every(key =>
      layoutOptionId(key.layoutOption) === layoutOptionId(editorStore.activeLayoutOption)
    )

    // 別の所属先へは元の位置を保持し、同じ所属先での複製だけ右隣へ置く。
    let baseX = minX
    let baseY = minY
    const selectedKeysList = editorStore.selectedKeys
    if (sameTarget && selectedKeysList.length > 0) {
      const firstSelected = selectedKeysList[0]
      baseX = firstSelected.x + firstSelected.width
      baseY = firstSelected.y
    }

    const newKeys: Key[] = copied.map((copiedKey, index) => {
      const newId = createUniqueKeyId(String(baseTime + index), usedIds)
      newKeyIds.push(newId)
      return {
        ...copiedKey,
        id: newId,
        x: baseX + (copiedKey.x - minX),
        y: baseY + (copiedKey.y - minY),
        legend: { ...copiedKey.legend },
        matrix: { ...copiedKey.matrix },
        keycodes: { ...copiedKey.keycodes },
        layoutOption: editorStore.activeLayoutOption ? { ...editorStore.activeLayoutOption } : undefined
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
    rotateSelectedKeysAroundCenter,
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
