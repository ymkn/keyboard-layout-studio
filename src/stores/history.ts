/**
 * 履歴ストア
 *
 * Undo/Redo履歴を管理
 * セッション内でのみ有効で永続化されない
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { KeyboardLayout } from '../types/keyboard'
import { useLayoutStore, cloneLayout } from './layout'
import { APP_CONFIG } from '../constants/app-config'

export const useHistoryStore = defineStore('history', () => {
  const layoutStore = useLayoutStore()

  // State
  const snapshots = ref<KeyboardLayout[]>([])
  const currentIndex = ref<number>(-1)

  // Getters
  const canUndo = computed(() => currentIndex.value > 0)
  const canRedo = computed(() => currentIndex.value < snapshots.value.length - 1)

  // Actions
  function saveSnapshot() {
    // 現在の位置より後ろの履歴を削除（redoの履歴をクリア）
    if (currentIndex.value < snapshots.value.length - 1) {
      snapshots.value = snapshots.value.slice(0, currentIndex.value + 1)
    }

    // 現在の状態をディープコピーして保存
    snapshots.value.push(cloneLayout(layoutStore.layout))

    // 最大数を超えたら古いものから削除
    if (snapshots.value.length > APP_CONFIG.MAX_HISTORY_STATES) {
      snapshots.value.shift()
    } else {
      currentIndex.value++
    }
  }

  function undo() {
    if (!canUndo.value) return false

    currentIndex.value--
    layoutStore.setLayout(cloneLayout(snapshots.value[currentIndex.value]))
    return true
  }

  function redo() {
    if (!canRedo.value) return false

    currentIndex.value++
    layoutStore.setLayout(cloneLayout(snapshots.value[currentIndex.value]))
    return true
  }

  function clearHistory() {
    snapshots.value = []
    currentIndex.value = -1
  }

  function initializeHistory() {
    clearHistory()
    saveSnapshot()
  }

  // layoutStoreの変更を監視して履歴に保存
  function setupLayoutWatcher() {
    layoutStore.setOnLayoutChange(() => {
      saveSnapshot()
    })
  }

  return {
    // State
    snapshots,
    currentIndex,
    // Getters
    canUndo,
    canRedo,
    // Actions
    saveSnapshot,
    undo,
    redo,
    clearHistory,
    initializeHistory,
    setupLayoutWatcher
  }
})
