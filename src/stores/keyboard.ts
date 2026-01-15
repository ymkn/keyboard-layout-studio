import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Key, KeyboardLayout, LegendFont } from '../types/keyboard'
import type { StorageSource, GitHubAuth } from '../types/github'
import { getPresets } from '../services/presets'

// 初期レイアウトとしてNumpadプリセットを取得
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

export type DisplayMode = 'legend' | 'matrix'
export type KeyboardLayoutType = 'ANSI' | 'JIS'

const GITHUB_AUTH_KEY = 'kls-github-auth'

export const useKeyboardStore = defineStore('keyboard', () => {
  // State
  const layout = ref<KeyboardLayout>(getInitialLayout())

  const selectedKeyIds = ref<string[]>([])
  const displayMode = ref<DisplayMode>('matrix')
  const keyboardLayout = ref<KeyboardLayoutType>('ANSI')
  const copiedKeys = ref<Key[]>([])
  const currentLayer = ref<number>(0)

  // History management (max 20 generations)
  const history = ref<KeyboardLayout[]>([])
  const historyIndex = ref<number>(-1)
  const MAX_HISTORY = 20

  // Layout source tracking
  const layoutSource = ref<StorageSource>('new')
  const layoutGistId = ref<string | null>(null)
  const layoutGistFileKey = ref<string | null>(null)

  // Save destination (user-selectable, 'local' or 'gist')
  const saveDestination = ref<'local' | 'gist'>('local')

  // GitHub authentication
  const githubAuth = ref<GitHubAuth | null>(null)

  // Getters
  const selectedKey = computed(() => {
    if (selectedKeyIds.value.length !== 1) return null
    return layout.value.keys.find(k => k.id === selectedKeyIds.value[0]) || null
  })

  const selectedKeys = computed(() => {
    return layout.value.keys.filter(k => selectedKeyIds.value.includes(k.id))
  })

  const keys = computed(() => layout.value.keys)

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  const isLoggedIn = computed(() => githubAuth.value !== null)

  // Internal helper: Deep clone layout
  function cloneLayout(layout: KeyboardLayout): KeyboardLayout {
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

  // Internal helper: Save current state to history
  function saveHistory() {
    // 現在の位置より後ろの履歴を削除（redoの履歴をクリア）
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // 現在の状態をディープコピーして保存
    history.value.push(cloneLayout(layout.value))

    // 最大数を超えたら古いものから削除
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

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

  function selectNextKey() {
    // 単一選択時のみ動作
    if (selectedKeyIds.value.length !== 1) return

    const currentId = selectedKeyIds.value[0]
    const currentIndex = layout.value.keys.findIndex(k => k.id === currentId)

    if (currentIndex === -1) return

    // 次のキーがあれば選択
    if (currentIndex < layout.value.keys.length - 1) {
      selectedKeyIds.value = [layout.value.keys[currentIndex + 1].id]
      return true
    }

    return false
  }

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
      layout.value.metadata!.modified = new Date().toISOString()
      saveHistory()
    }
  }

  function moveSelectedKeys(deltaX: number, deltaY: number) {
    let moved = false
    for (const keyId of selectedKeyIds.value) {
      const index = layout.value.keys.findIndex(k => k.id === keyId)
      if (index !== -1) {
        const key = layout.value.keys[index]
        // 新しい座標を計算（マイナスにならないように制限）
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
      layout.value.metadata!.modified = new Date().toISOString()
      saveHistory()
    }
  }

  function resizeSelectedKeys(deltaWidth: number, deltaHeight: number) {
    let resized = false
    for (const keyId of selectedKeyIds.value) {
      const index = layout.value.keys.findIndex(k => k.id === keyId)
      if (index !== -1) {
        const key = layout.value.keys[index]
        layout.value.keys[index] = {
          ...key,
          width: Math.max(0.25, key.width + deltaWidth),
          height: Math.max(0.25, key.height + deltaHeight)
        }
        resized = true
      }
    }
    if (resized) {
      layout.value.metadata!.modified = new Date().toISOString()
      saveHistory()
    }
  }

  function addKey() {
    const newId = String(Date.now())

    // 選択中のキーがある場合、その右隣に配置
    let x = 0
    let y = 0
    if (selectedKey.value) {
      x = selectedKey.value.x + selectedKey.value.width
      y = selectedKey.value.y
    }

    const newKey: Key = {
      id: newId,
      x,
      y,
      width: 1,
      height: 1,
      legend: {},
      matrix: {},
      keycodes: {},
      shape: 'rectangle'
    }
    layout.value.keys.push(newKey)
    layout.value.metadata!.modified = new Date().toISOString()
    selectedKeyIds.value = [newId]
    saveHistory()
  }

  function deleteSelectedKeys() {
    if (selectedKeyIds.value.length === 0) return

    // 選択中のキーをすべて削除
    layout.value.keys = layout.value.keys.filter(k => !selectedKeyIds.value.includes(k.id))
    selectedKeyIds.value = []
    layout.value.metadata!.modified = new Date().toISOString()
    saveHistory()
  }

  function loadLayout(newLayout: KeyboardLayout) {
    // layerCountがない場合は1に設定
    if (!newLayout.layerCount) {
      newLayout.layerCount = 1
    }

    // 各キーの古い形式を新形式に変換
    newLayout.keys = newLayout.keys.map(key => {
      // 古い形式（keycode）を検出
      if ('keycode' in key && (key as any).keycode) {
        const { keycode, ...rest } = key as any
        return {
          ...rest,
          keycodes: { 0: keycode }
        }
      }

      // keycodesがない場合は空オブジェクトに
      if (!key.keycodes) {
        return { ...key, keycodes: {} }
      }

      return key
    })

    layout.value = newLayout
    selectedKeyIds.value = []

    // currentLayerが範囲外の場合は0にリセット
    if (currentLayer.value >= newLayout.layerCount) {
      currentLayer.value = 0
    }

    // 履歴をクリアして現在の状態を保存
    history.value = []
    historyIndex.value = -1
    saveHistory()
  }

  function toggleDisplayMode() {
    displayMode.value = displayMode.value === 'legend' ? 'matrix' : 'legend'
  }

  function copySelectedKeys() {
    if (selectedKeys.value.length === 0) return

    // 選択中のキーをすべてディープコピー
    copiedKeys.value = selectedKeys.value.map(key => ({
      ...key,
      legend: { ...key.legend },
      matrix: { ...key.matrix },
      keycodes: { ...key.keycodes }
    }))
  }

  function pasteKeys() {
    if (copiedKeys.value.length === 0) return

    const newKeyIds: string[] = []
    const baseTime = Date.now()

    // 選択中のキーがある場合、最初のキーの右隣を基準に配置
    let baseX = 0
    let baseY = 0
    if (selectedKeys.value.length > 0) {
      const firstSelected = selectedKeys.value[0]
      baseX = firstSelected.x + firstSelected.width
      baseY = firstSelected.y
    }

    // コピーしたキーの最小座標を取得（相対位置を維持するため）
    const minX = Math.min(...copiedKeys.value.map(k => k.x))
    const minY = Math.min(...copiedKeys.value.map(k => k.y))

    copiedKeys.value.forEach((copiedKey, index) => {
      const newId = String(baseTime + index)

      // 相対位置を維持してペースト
      const newKey: Key = {
        ...copiedKey,
        id: newId,
        x: baseX + (copiedKey.x - minX),
        y: baseY + (copiedKey.y - minY)
      }

      layout.value.keys.push(newKey)
      newKeyIds.push(newId)
    })

    layout.value.metadata!.modified = new Date().toISOString()

    // ペーストしたキーをすべて選択状態にする
    selectedKeyIds.value = newKeyIds

    saveHistory()
    return newKeyIds
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

    layout.value.metadata.modified = new Date().toISOString()
    saveHistory()
  }

  function setLegendFont(font: LegendFont | undefined) {
    layout.value.legendFont = font
    if (!layout.value.metadata) {
      layout.value.metadata = {}
    }
    layout.value.metadata.modified = new Date().toISOString()
    saveHistory()
  }

  function setCurrentLayer(layer: number) {
    // 範囲チェック
    if (layer >= 0 && layer < layout.value.layerCount) {
      currentLayer.value = layer
    }
  }

  function incrementLayerCount() {
    // 上限16
    if (layout.value.layerCount < 16) {
      const newLayerIndex = layout.value.layerCount // 新しいレイヤーのインデックス
      layout.value.layerCount++

      // 全てのキーに対して新しいレイヤーのキーコードとしてKC_TRNSを設定
      layout.value.keys.forEach(key => {
        if (!key.keycodes) {
          key.keycodes = {}
        }
        key.keycodes[newLayerIndex] = 'KC_TRNS'
      })

      layout.value.metadata!.modified = new Date().toISOString()
      saveHistory()
    }
  }

  function decrementLayerCount() {
    // 下限1
    if (layout.value.layerCount > 1) {
      const removedLayer = layout.value.layerCount - 1

      // 削除されるレイヤーのキーコードをクリア
      layout.value.keys.forEach(key => {
        if (key.keycodes && key.keycodes[removedLayer]) {
          delete key.keycodes[removedLayer]
        }
      })

      layout.value.layerCount--
      layout.value.metadata!.modified = new Date().toISOString()

      // 現在のレイヤーが削除された場合、レイヤー0に戻る
      if (currentLayer.value >= layout.value.layerCount) {
        currentLayer.value = 0
      }
      saveHistory()
    }
  }

  function undo() {
    if (!canUndo.value) return

    historyIndex.value--
    layout.value = cloneLayout(history.value[historyIndex.value])
    selectedKeyIds.value = []
  }

  function redo() {
    if (!canRedo.value) return

    historyIndex.value++
    layout.value = cloneLayout(history.value[historyIndex.value])
    selectedKeyIds.value = []
  }

  function createNewLayout() {
    // 新しい空のレイアウトを作成
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
    selectedKeyIds.value = []
    currentLayer.value = 0

    // ソースを「新規」に設定
    layoutSource.value = 'new'
    layoutGistId.value = null
    layoutGistFileKey.value = null

    // 履歴をクリアして現在の状態を保存
    history.value = []
    historyIndex.value = -1
    saveHistory()
  }

  function setKeyboardLayout(layoutType: KeyboardLayoutType) {
    keyboardLayout.value = layoutType
  }

  // Layout source tracking
  function setLayoutSource(source: StorageSource, gistId?: string, fileKey?: string) {
    layoutSource.value = source
    layoutGistId.value = gistId || null
    layoutGistFileKey.value = fileKey || null
    // ソースに応じて保存先も連動
    if (source === 'local' || source === 'gist') {
      saveDestination.value = source
    }
  }

  function clearLayoutSource() {
    layoutSource.value = 'local'
    layoutGistId.value = null
    layoutGistFileKey.value = null
    saveDestination.value = 'local'
  }

  function setSaveDestination(dest: 'local' | 'gist') {
    saveDestination.value = dest
  }

  // GitHub authentication
  function setGitHubAuth(auth: GitHubAuth | null) {
    githubAuth.value = auth
    if (auth) {
      localStorage.setItem(GITHUB_AUTH_KEY, JSON.stringify(auth))
    } else {
      localStorage.removeItem(GITHUB_AUTH_KEY)
    }
  }

  function loadGitHubAuth() {
    const stored = localStorage.getItem(GITHUB_AUTH_KEY)
    if (stored) {
      try {
        githubAuth.value = JSON.parse(stored)
      } catch {
        githubAuth.value = null
      }
    }
  }

  function logoutGitHub() {
    setGitHubAuth(null)
    // Gistから読み込んだレイアウトの場合、ソースをローカルに変更
    if (layoutSource.value === 'gist') {
      clearLayoutSource()
    }
    // 保存先もローカルに
    saveDestination.value = 'local'
  }

  return {
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
    selectKey,
    toggleKeySelection,
    selectMultipleKeys,
    clearSelection,
    selectNextKey,
    updateKey,
    moveSelectedKeys,
    resizeSelectedKeys,
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
