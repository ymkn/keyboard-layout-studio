<template>
  <div class="h-screen flex flex-col bg-gray-900">
    <header class="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="/kls-logo.png" alt="Keyboard Layout Studio" class="h-8 object-contain" />
        <button
          @click="showAboutDialog = true"
          class="text-xs text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
        >
          v{{ appVersion }}
        </button>
      </div>

      <!-- 右側ボタングループ -->
      <div class="flex items-center gap-4">
        <!-- 言語設定ドロップダウン -->
        <div class="flex items-center gap-2">
          <label for="keyboard-layout" class="text-sm text-gray-300">レイアウト:</label>
          <select
            id="keyboard-layout"
            v-model="store.keyboardLayout"
            @change="handleLayoutChange"
            class="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 hover:bg-gray-600 transition-colors text-sm"
          >
            <option value="ANSI">ANSI</option>
            <option value="JIS">JIS</option>
          </select>
        </div>

        <button
          @click="showNewLayoutDialog = true"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-semibold"
        >
          <i class="fa-solid fa-file-circle-plus"></i> 新規作成
        </button>
        <button
          @click="handleOpenLayout"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-semibold"
        >
          <i class="fa-solid fa-folder-open"></i> 開く
        </button>
        <button
          @click="handleSaveLayout"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-semibold"
        >
          <i class="fa-solid fa-floppy-disk"></i> 保存
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- メインエリア（タブ切り替え） -->
      <main class="flex-1 flex flex-col overflow-hidden bg-gray-900">
        <!-- タブヘッダー -->
        <div class="flex gap-1 px-4 pt-4 bg-gray-900">
          <button
            @click="activeTab = 'layout'"
            :class="[
              'px-4 py-2 rounded-t transition-colors',
              activeTab === 'layout'
                ? 'bg-gray-800 text-white font-semibold'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            レイアウト
          </button>
          <button
            @click="switchToJsonTab"
            :class="[
              'px-4 py-2 rounded-t transition-colors',
              activeTab === 'json'
                ? 'bg-gray-800 text-white font-semibold'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            JSON
          </button>
        </div>

        <!-- タブコンテンツ -->
        <div class="flex-1 overflow-hidden">
          <!-- レイアウトタブ -->
          <div v-show="activeTab === 'layout'" class="h-full flex">
            <!-- キャンバスエリア -->
            <div class="flex-1 overflow-auto">
              <KeyboardCanvas />
            </div>
            <!-- プロパティパネル -->
            <aside class="w-80 flex-shrink-0 bg-gray-800 border-l border-gray-700 overflow-auto">
              <PropertyPanel :active-tab="activeTab" />
            </aside>
          </div>

          <!-- JSONタブ -->
          <div v-show="activeTab === 'json'" class="h-full">
            <JsonEditor @switch-to-layout="handleJsonError" />
          </div>
        </div>
      </main>
    </div>

    <!-- 新規作成確認ダイアログ -->
    <ConfirmDialog
      :show="showNewLayoutDialog"
      title="新規作成"
      message="現在のレイアウトを破棄して、新しいレイアウトを作成しますか？この操作は取り消せません。"
      confirm-text="新規作成"
      @confirm="handleNewLayout"
      @cancel="showNewLayoutDialog = false"
    />

    <!-- レイアウト一覧ダイアログ -->
    <SavedListDialog
      :show="showLayoutListDialog"
      :gists="layoutList"
      :loading="layoutListLoading"
      :error="layoutListError"
      @select="handleLayoutSelect"
      @delete="handleDeleteRequest"
      @cancel="showLayoutListDialog = false"
    />

    <!-- 削除確認ダイアログ -->
    <ConfirmDialog
      :show="showDeleteConfirmDialog"
      title="レイアウトを削除"
      :message="`「${layoutToDelete?.filename}」を削除しますか？この操作は取り消せません。`"
      confirm-text="削除"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteConfirmDialog = false"
    />

    <!-- 開く確認ダイアログ -->
    <ConfirmDialog
      :show="showOpenConfirmDialog"
      title="レイアウトを開く"
      message="現在のレイアウトへの変更が破棄されます。よろしいですか？"
      confirm-text="開く"
      @confirm="handleOpenConfirm"
      @cancel="showOpenConfirmDialog = false"
    />

    <!-- バージョン情報ダイアログ -->
    <AboutDialog
      :show="showAboutDialog"
      :version="appVersion"
      @cancel="showAboutDialog = false"
    />

    <!-- 保存成功通知 -->
    <div
      v-if="showSaveNotification"
      class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50"
    >
      保存しました
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import KeyboardCanvas from './components/KeyboardCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import JsonEditor from './components/JsonEditor.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import SavedListDialog from './components/SavedListDialog.vue'
import AboutDialog from './components/AboutDialog.vue'
import { useKeyboardStore } from './stores/keyboard'
import type { KeyboardLayout } from './types/keyboard'

// アプリケーションバージョン
const appVersion = '0.1.0'

// LocalStorage保存用の型定義
interface SavedLayout {
  id: string
  filename: string
  description: string
  updatedAt: string
}

const store = useKeyboardStore()

const activeTab = ref<'layout' | 'json'>('layout')
const showNewLayoutDialog = ref(false)
const showAboutDialog = ref(false)

// レイアウト一覧関連
const showLayoutListDialog = ref(false)
const layoutList = ref<SavedLayout[]>([])
const layoutListLoading = ref(false)
const layoutListError = ref<string | null>(null)

// 削除関連
const showDeleteConfirmDialog = ref(false)
const layoutToDelete = ref<SavedLayout | null>(null)

// 開く確認関連
const showOpenConfirmDialog = ref(false)
const pendingLayoutToOpen = ref<SavedLayout | null>(null)

// 通知
const showSaveNotification = ref(false)

const STORAGE_PREFIX = 'kls-layout-'

function switchToJsonTab() {
  activeTab.value = 'json'
}

function handleJsonError() {
  // JSONエラーがあった場合、JSONタブに戻す
  activeTab.value = 'json'
}

function handleLayoutChange() {
  // キーボードレイアウトが変更された際の処理
  // storeのsetKeyboardLayoutはv-modelで自動的に呼ばれるため、ここでは特に何もしない
  // 必要に応じて、将来的にLocalStorageに保存するなどの処理を追加可能
}

function handleNewLayout() {
  store.createNewLayout()
  showNewLayoutDialog.value = false
  // レイアウトタブに切り替え
  activeTab.value = 'layout'
}

// LocalStorageから開く
function handleOpenLayout() {
  showLayoutListDialog.value = true
  layoutListLoading.value = true
  layoutListError.value = null

  try {
    const layouts: SavedLayout[] = []

    // LocalStorageから保存済みレイアウトを取得
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const content = localStorage.getItem(key)
        if (content) {
          try {
            const layout: KeyboardLayout = JSON.parse(content)
            layouts.push({
              id: key,
              filename: `${layout.name || 'Untitled'}.kls.json`,
              description: layout.metadata?.description || '',
              updatedAt: layout.metadata?.modified || layout.metadata?.created || new Date().toISOString()
            })
          } catch (e) {
            console.error('レイアウト読み込みエラー:', e)
          }
        }
      }
    }

    // 更新日時でソート（新しい順）
    layouts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    layoutList.value = layouts
  } catch (error) {
    layoutListError.value = error instanceof Error ? error.message : 'レイアウト一覧の取得に失敗しました'
  } finally {
    layoutListLoading.value = false
  }
}

function handleLayoutSelect(item: SavedLayout) {
  // 編集中の内容がある場合は確認ダイアログを表示
  if (store.canUndo) {
    pendingLayoutToOpen.value = item
    showOpenConfirmDialog.value = true
    return
  }

  // 履歴がない場合は直接ロード
  loadLayoutFromStorage(item)
}

function loadLayoutFromStorage(item: SavedLayout) {
  try {
    const content = localStorage.getItem(item.id)
    if (!content) {
      alert('レイアウトが見つかりません')
      return
    }

    const layout = JSON.parse(content) as KeyboardLayout
    store.loadLayout(layout)
    showLayoutListDialog.value = false
    activeTab.value = 'layout'
  } catch (error) {
    alert('レイアウトの読み込みに失敗しました')
    console.error(error)
  }
}

function handleOpenConfirm() {
  if (!pendingLayoutToOpen.value) {
    return
  }

  loadLayoutFromStorage(pendingLayoutToOpen.value)
  showOpenConfirmDialog.value = false
  pendingLayoutToOpen.value = null
}

function handleDeleteRequest(item: SavedLayout) {
  layoutToDelete.value = item
  showDeleteConfirmDialog.value = true
}

function handleDeleteConfirm() {
  if (!layoutToDelete.value) {
    return
  }

  try {
    localStorage.removeItem(layoutToDelete.value.id)
    showDeleteConfirmDialog.value = false
    layoutToDelete.value = null

    // レイアウト一覧を再読み込み
    handleOpenLayout()
  } catch (error) {
    alert('削除に失敗しました')
    console.error(error)
  }
}

// LocalStorageへ保存
function handleSaveLayout() {
  try {
    const key = STORAGE_PREFIX + (store.layout.name || 'untitled')
    const content = JSON.stringify(store.layout, null, 2)

    localStorage.setItem(key, content)

    // 保存成功通知
    showSaveNotification.value = true
    setTimeout(() => {
      showSaveNotification.value = false
    }, 3000)
  } catch (error) {
    alert('保存に失敗しました')
    console.error(error)
  }
}
</script>
