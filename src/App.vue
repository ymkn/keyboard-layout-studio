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
        <!-- 保存ボタン + 保存先トグル -->
        <div class="flex items-center">
          <button
            @click="handleSaveLayout"
            class="px-4 py-2 bg-gray-600 text-white rounded-l hover:bg-gray-700 transition-colors text-sm font-semibold border-r border-gray-500"
          >
            <i class="fa-solid fa-floppy-disk"></i> 保存
          </button>
          <div class="flex rounded-r overflow-hidden border border-gray-600 border-l-0">
            <button
              @click="store.setSaveDestination('local')"
              :class="[
                'px-3 py-2 text-sm transition-colors',
                store.saveDestination === 'local'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              ]"
              title="ローカルに保存"
            >
              <i class="fa-solid fa-hard-drive"></i>
            </button>
            <button
              @click="store.isLoggedIn ? store.setSaveDestination('gist') : (showGitHubLoginDialog = true)"
              :class="[
                'px-3 py-2 text-sm transition-colors',
                store.saveDestination === 'gist'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600',
                !store.isLoggedIn && 'opacity-60'
              ]"
              :title="store.isLoggedIn ? 'Gistに保存' : 'GitHubにログインしてください'"
            >
              <i class="fa-brands fa-github"></i>
            </button>
          </div>
        </div>

        <!-- GitHub関連 -->
        <div class="border-l border-gray-600 pl-4 ml-2">
          <GitHubUserBadge
            v-if="store.isLoggedIn && store.githubAuth"
            :auth="store.githubAuth"
            @logout="handleGitHubLogout"
          />
          <button
            v-else
            @click="showGitHubLoginDialog = true"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-semibold"
          >
            <i class="fa-brands fa-github"></i> GitHubでログイン
          </button>
        </div>
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
      :items="layoutList"
      :loading="layoutListLoading"
      :error="layoutListError"
      :is-logged-in="store.isLoggedIn"
      @select="handleLayoutSelect"
      @select-preset="handlePresetSelect"
      @delete="handleDeleteRequest"
      @cancel="showLayoutListDialog = false"
      @login="showLayoutListDialog = false; showGitHubLoginDialog = true"
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

    <!-- GitHubログインダイアログ -->
    <GitHubLoginDialog
      :show="showGitHubLoginDialog"
      @cancel="showGitHubLoginDialog = false"
    />

    <!-- トースト通知 -->
    <div
      v-if="toast.isVisible.value"
      :class="[
        'fixed top-20 right-4 text-white px-6 py-3 rounded shadow-lg z-50',
        toast.type.value === 'success' ? 'bg-green-600' : 'bg-red-600'
      ]"
    >
      {{ toast.message.value }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import KeyboardCanvas from './components/KeyboardCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import JsonEditor from './components/JsonEditor.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import SavedListDialog from './components/SavedListDialog.vue'
import AboutDialog from './components/AboutDialog.vue'
import GitHubLoginDialog from './components/GitHubLoginDialog.vue'
import GitHubUserBadge from './components/GitHubUserBadge.vue'
import { useKeyboardStore } from './stores/keyboard'
import { useToast } from './composables/useToast'
import { GitHubService, filterKLSGists, getGitHubErrorMessage, exchangeCodeForToken } from './services/github'
import { STORAGE_KEYS } from './constants/storage'
import type { PresetInfo } from './services/presets'
import type { KeyboardLayout } from './types/keyboard'
import type { SavedLayoutItem } from './types/github'

// アプリケーションバージョン（package.jsonから自動取得）
const appVersion = __APP_VERSION__

const store = useKeyboardStore()
const toast = useToast()

const activeTab = ref<'layout' | 'json'>('layout')
const showNewLayoutDialog = ref(false)
const showAboutDialog = ref(false)

// レイアウト一覧関連
const showLayoutListDialog = ref(false)
const layoutList = ref<SavedLayoutItem[]>([])
const layoutListLoading = ref(false)
const layoutListError = ref<string | null>(null)

// 削除関連
const showDeleteConfirmDialog = ref(false)
const layoutToDelete = ref<SavedLayoutItem | null>(null)

// 開く確認関連
const showOpenConfirmDialog = ref(false)
const pendingLayoutToOpen = ref<SavedLayoutItem | null>(null)

// GitHub認証関連
const showGitHubLoginDialog = ref(false)

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

// OAuthコールバックを処理
async function handleOAuthCallback(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')
  const errorDescription = urlParams.get('error_description')
  
  if (error) {
    toast.showToast(`GitHub認証エラー: ${errorDescription || error}`, 'error')
    window.history.replaceState({}, '', window.location.pathname)
    return
  }
  
  if (!code) return
  
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  if (!clientId) {
    toast.showToast('VITE_GITHUB_CLIENT_IDが設定されていません', 'error')
    window.history.replaceState({}, '', window.location.pathname)
    return
  }
  
  try {
    const { access_token } = await exchangeCodeForToken(code)
    const service = new GitHubService(access_token)
    const user = await service.validateToken()
    
    store.setGitHubAuth({
      token: access_token,
      username: user.login,
      avatarUrl: user.avatar_url
    })
    
    toast.showToast(`${user.login}として認証されました`, 'success')
  } catch (error) {
    toast.showToast(`認証エラー: ${getGitHubErrorMessage(error)}`, 'error')
  } finally {
    window.history.replaceState({}, '', window.location.pathname)
  }
}

// ページロード時に認証情報を復元し、OAuthコールバックを処理
onMounted(async () => {
  await handleOAuthCallback()
  store.loadGitHubAuth()
})

function handleGitHubLogout() {
  store.logoutGitHub()
}

function handleNewLayout() {
  store.createNewLayout()
  showNewLayoutDialog.value = false
  // レイアウトタブに切り替え
  activeTab.value = 'layout'
}

// ローカルストレージからレイアウト一覧を取得
function getLocalLayouts(): SavedLayoutItem[] {
  const layouts: SavedLayoutItem[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_KEYS.LAYOUT_PREFIX)) {
      const content = localStorage.getItem(key)
      if (content) {
        try {
          const layout: KeyboardLayout = JSON.parse(content)
          layouts.push({
            id: key,
            filename: `${layout.name || 'Untitled'}.kls.json`,
            description: layout.metadata?.description || '',
            updatedAt: layout.metadata?.modified || layout.metadata?.created || new Date().toISOString(),
            source: 'local'
          })
        } catch (e) {
          console.error('レイアウト読み込みエラー:', e)
        }
      }
    }
  }

  return layouts
}

// LocalStorage + Gistから開く
async function handleOpenLayout() {
  showLayoutListDialog.value = true
  layoutListLoading.value = true
  layoutListError.value = null
  layoutList.value = [] // 古いデータをクリアして最新状態を取得

  try {
    // ローカルレイアウトを取得
    const localLayouts = getLocalLayouts()

    // Gistからレイアウトを取得（認証済みの場合のみ）
    let gistLayouts: SavedLayoutItem[] = []
    if (store.githubAuth) {
      try {
        const service = new GitHubService(store.githubAuth.token)
        const gists = await service.listGists()
        gistLayouts = filterKLSGists(gists)
      } catch (e) {
        // Gist取得エラーは警告として表示し、ローカルのみ表示
        console.warn('Gist取得エラー:', e)
        layoutListError.value = 'Gistの取得に失敗しました。ローカル保存のみ表示しています。'
      }
    }

    // マージして更新日時でソート（新しい順）
    const allLayouts = [...localLayouts, ...gistLayouts]
    allLayouts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    layoutList.value = allLayouts
  } catch (error) {
    layoutListError.value = error instanceof Error ? error.message : 'レイアウト一覧の取得に失敗しました'
  } finally {
    layoutListLoading.value = false
  }
}

function handleLayoutSelect(item: SavedLayoutItem) {
  // 編集中の内容がある場合は確認ダイアログを表示
  if (store.canUndo) {
    pendingLayoutToOpen.value = item
    showOpenConfirmDialog.value = true
    return
  }

  // 履歴がない場合は直接ロード
  loadLayoutFromSource(item)
}

function handlePresetSelect(preset: PresetInfo) {
  const hasCorrectedValues = store.loadLayout(preset.layout)
  store.clearLayoutSource()
  showLayoutListDialog.value = false
  activeTab.value = 'layout'
  if (hasCorrectedValues) {
    toast.showToast('一部の値が自動修正されました', 'success')
  }
}

async function loadLayoutFromSource(item: SavedLayoutItem) {
  try {
    let hasCorrectedValues = false

    if (item.source === 'local') {
      // ローカルストレージから読み込み
      const content = localStorage.getItem(item.id)
      if (!content) {
        alert('レイアウトが見つかりません')
        return
      }

      const layout = JSON.parse(content) as KeyboardLayout
      hasCorrectedValues = store.loadLayout(layout)
      store.setLayoutSource('local')
    } else {
      // Gistから読み込み
      if (!store.githubAuth) {
        alert('GitHubにログインしてください')
        return
      }

      const service = new GitHubService(store.githubAuth.token)
      const gist = await service.getGist(item.id)
      const fileKey = item.gistFileKey || Object.keys(gist.files).find(k => k.endsWith('.kls.json'))
      if (!fileKey || !gist.files[fileKey]) {
        alert('ファイルが見つかりません')
        return
      }

      const content = gist.files[fileKey].content
      if (!content) {
        alert('ファイル内容を取得できませんでした')
        return
      }

      const layout = JSON.parse(content) as KeyboardLayout
      hasCorrectedValues = store.loadLayout(layout)
      store.setLayoutSource('gist', item.id, fileKey)
    }

    showLayoutListDialog.value = false
    activeTab.value = 'layout'

    if (hasCorrectedValues) {
      toast.showToast('一部の値が自動修正されました', 'success')
    }
  } catch (error) {
    alert('レイアウトの読み込みに失敗しました')
    console.error(error)
  }
}

function handleOpenConfirm() {
  if (!pendingLayoutToOpen.value) {
    return
  }

  loadLayoutFromSource(pendingLayoutToOpen.value)
  showOpenConfirmDialog.value = false
  pendingLayoutToOpen.value = null
}

function handleDeleteRequest(item: SavedLayoutItem) {
  layoutToDelete.value = item
  showDeleteConfirmDialog.value = true
}

async function handleDeleteConfirm() {
  if (!layoutToDelete.value) {
    return
  }

  const itemToDelete = layoutToDelete.value

  try {
    if (itemToDelete.source === 'local') {
      // ローカルストレージから削除
      localStorage.removeItem(itemToDelete.id)
    } else {
      // Gistから削除
      if (!store.githubAuth) {
        alert('GitHubにログインしてください')
        return
      }
      const service = new GitHubService(store.githubAuth.token)
      await service.deleteGist(itemToDelete.id)
    }

    // リストから即座に削除（APIキャッシュを待たずに反映）
    layoutList.value = layoutList.value.filter(item => {
      if (item.source !== itemToDelete.source) return true
      if (item.source === 'local') return item.id !== itemToDelete.id
      // Gistの場合はgistIdとfileKeyで比較
      return !(item.id === itemToDelete.id && item.gistFileKey === itemToDelete.gistFileKey)
    })

    showDeleteConfirmDialog.value = false
    layoutToDelete.value = null
  } catch (error) {
    alert('削除に失敗しました: ' + getGitHubErrorMessage(error))
    console.error(error)
  }
}

// 保存処理（saveDestinationに応じてローカルまたはGistに保存）
async function handleSaveLayout() {
  try {
    const content = JSON.stringify(store.layout, null, 2)
    const filename = `${store.layout.name || 'untitled'}.kls.json`

    if (store.saveDestination === 'gist') {
      if (!store.githubAuth) {
        showGitHubLoginDialog.value = true
        return
      }

      const service = new GitHubService(store.githubAuth.token)

      if (store.layoutSource === 'gist' && store.layoutGistId) {
        // 既存のGistを更新
        const fileKey = store.layoutGistFileKey || filename
        await service.updateGist(
          store.layoutGistId,
          fileKey,
          content,
          store.layout.metadata?.description || ''
        )
      } else {
        // 新規Gistを作成
        const gist = await service.createGist(
          filename,
          content,
          store.layout.metadata?.description || '',
          false
        )
        store.setLayoutSource('gist', gist.id, filename)
      }
      toast.showToast('Gistに保存しました')
    } else {
      // ローカルストレージに保存
      const key = STORAGE_KEYS.LAYOUT_PREFIX + (store.layout.name || 'untitled')
      localStorage.setItem(key, content)
      store.setLayoutSource('local')
      toast.showToast('保存しました')
    }
  } catch (error) {
    alert('保存に失敗しました: ' + getGitHubErrorMessage(error))
    console.error(error)
  }
}
</script>
