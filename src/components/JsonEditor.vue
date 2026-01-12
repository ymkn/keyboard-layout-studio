<template>
  <div class="h-full flex bg-gray-800">
    <!-- 左側: JSON エディタ -->
    <div class="flex-1 flex flex-col border-r border-gray-700">
      <!-- ツールバー -->
      <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span v-if="hasChanges" class="text-xs text-yellow-400">* 未保存</span>
        </div>
        <div class="flex gap-2">
          <button
            @click="formatJson"
            class="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
          >
            整形
          </button>
          <button
            @click="resetToLayout"
            :disabled="!hasChanges"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              hasChanges
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            ]"
            title="編集内容を破棄してレイアウト画面の状態に戻す"
          >
            リセット
          </button>
          <button
            @click="applyChanges"
            :disabled="!hasChanges"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              hasChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            ]"
          >
            適用
          </button>
        </div>
      </div>

      <!-- KLE インポート用の非表示input -->
      <input
        ref="kleFileInput"
        type="file"
        accept=".json,application/json"
        @change="handleKLEFileUpload"
        class="hidden"
      />

      <!-- エラー表示 -->
      <div v-if="error" class="px-4 py-3 bg-red-900 border-b border-red-700">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-200">JSONエラー</p>
            <p class="text-xs text-red-300 mt-1">{{ error }}</p>
          </div>
          <button @click="error = null" class="text-red-400 hover:text-red-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- JSON エディタ -->
      <div class="flex-1 overflow-hidden">
        <textarea
          v-model="jsonText"
          @input="onInput"
          class="w-full h-full p-4 bg-gray-900 text-gray-100 border-0 focus:outline-none font-mono text-sm resize-none"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- ステータスバー -->
      <div class="px-4 py-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div>
          {{ lineCount }} 行, {{ charCount }} 文字
        </div>
        <div>
          キー数: {{ keyCount }}
        </div>
      </div>
    </div>

    <!-- 右側: プロパティパネル -->
    <div class="w-80 flex flex-col bg-gray-800">
      <!-- スクロール可能なコンテンツ -->
      <div class="flex-1 overflow-auto">
        <!-- インポート -->
        <div class="border-b border-gray-700">
          <div class="px-4 py-3">
            <h2 class="text-lg font-semibold text-white">インポート</h2>
            <p class="text-sm text-gray-400 mt-1">KLE形式のJSONをインポート</p>
          </div>
          <div class="px-4 pb-4">
            <button
              @click="triggerKLEImport"
              class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
            >
              KLE形式のJSONをインポート
            </button>
          </div>
        </div>

        <!-- エクスポート -->
        <div class="border-b border-gray-700">
          <div class="px-4 py-3">
            <h2 class="text-lg font-semibold text-white">エクスポート</h2>
            <p class="text-sm text-gray-400 mt-1">QMK/Vial用のフォーマットでエクスポート</p>
          </div>
          <div class="px-4 pb-4">
            <div class="space-y-3">
              <button
                @click="handleExportQMK"
                class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
              >
                QMK keyboard.json としてエクスポート
              </button>
              <button
                @click="handleExportVial"
                class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
              >
                Vial vial.json としてエクスポート
              </button>
              <button
                @click="handleExportKeymapC"
                class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
              >
                QMK keymap.c としてエクスポート
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useKeyboardStore } from '../stores/keyboard'
import type { KeyboardLayout } from '../types/keyboard'
import { exportToQMK, exportToVial, exportToQMKKeymapC, downloadJSON, downloadText } from '../utils/export'
import { parseKLEJson } from '../utils/kle-import'
import defaultLayout from '../templates/default-layout.json'

interface Emits {
  (e: 'switch-to-layout'): void
}

const emit = defineEmits<Emits>()
const store = useKeyboardStore()

const jsonText = ref('')
const hasChanges = ref(false)
const error = ref<string | null>(null)

// KLE インポート用
const kleFileInput = ref<HTMLInputElement | null>(null)

// 統計情報
const lineCount = computed(() => jsonText.value.split('\n').length)
const charCount = computed(() => jsonText.value.length)
const keyCount = computed(() => {
  try {
    const data = JSON.parse(jsonText.value)
    return data.keys?.length || 0
  } catch {
    return 0
  }
})

// 初期化時にデフォルトレイアウトを読み込む
onMounted(() => {
  // デフォルトレイアウトをストアに適用
  store.loadLayout(defaultLayout as KeyboardLayout)
  // JSONテキストを初期化
  loadFromStore()
})

// ストアが変更されたら自動的にJSONを更新（レイアウトタブでの変更を反映）
watch(
  () => store.layout,
  () => {
    if (!hasChanges.value) {
      loadFromStore()
    }
  },
  { deep: true }
)

function loadFromStore() {
  jsonText.value = JSON.stringify(store.layout, null, 2)
  hasChanges.value = false
  error.value = null
}

function onInput() {
  hasChanges.value = true
  error.value = null
}

function formatJson() {
  try {
    const parsed = JSON.parse(jsonText.value)
    jsonText.value = JSON.stringify(parsed, null, 2)
    hasChanges.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'JSON形式が不正です'
  }
}

function resetToLayout() {
  // 編集内容を破棄してレイアウト画面の状態に戻す
  loadFromStore()
}

function applyChanges() {
  try {
    // JSONをパース
    const parsed = JSON.parse(jsonText.value)

    // 基本的なバリデーション
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('ルートオブジェクトが必要です')
    }

    if (!Array.isArray(parsed.keys)) {
      throw new Error('keysプロパティが配列である必要があります')
    }

    // 各キーの検証
    for (let i = 0; i < parsed.keys.length; i++) {
      const key = parsed.keys[i]
      if (!key.id) {
        throw new Error(`keys[${i}]: idが必要です`)
      }
      if (typeof key.x !== 'number') {
        throw new Error(`keys[${i}]: xは数値である必要があります`)
      }
      if (typeof key.y !== 'number') {
        throw new Error(`keys[${i}]: yは数値である必要があります`)
      }
      if (typeof key.width !== 'number') {
        throw new Error(`keys[${i}]: widthは数値である必要があります`)
      }
      if (typeof key.height !== 'number') {
        throw new Error(`keys[${i}]: heightは数値である必要があります`)
      }
      if (!key.legend || typeof key.legend !== 'object') {
        throw new Error(`keys[${i}]: legendがオブジェクトである必要があります`)
      }
      if (!key.matrix || typeof key.matrix !== 'object') {
        throw new Error(`keys[${i}]: matrixがオブジェクトである必要があります`)
      }
      // keycodeまたはkeycodesがあればバリデーション（どちらも任意）
      if (key.keycode && typeof key.keycode !== 'string') {
        throw new Error(`keys[${i}]: keycodeは文字列である必要があります`)
      }
      if (key.keycodes && typeof key.keycodes !== 'object') {
        throw new Error(`keys[${i}]: keycodesはオブジェクトである必要があります`)
      }
    }

    // 検証成功 - ストアに適用
    store.loadLayout(parsed as KeyboardLayout)
    hasChanges.value = false
    error.value = null

  } catch (e) {
    error.value = e instanceof Error ? e.message : 'JSONの適用に失敗しました'
    emit('switch-to-layout')
  }
}

// KLE インポート
function triggerKLEImport() {
  kleFileInput.value?.click()
}

function handleKLEFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const jsonString = e.target?.result as string
      const importedLayout = parseKLEJson(jsonString)

      // ストアにロード
      store.loadLayout(importedLayout)

      // エディタ表示更新
      loadFromStore()

      // エラークリア
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? `KLEインポートエラー: ${err.message}` : 'KLE JSONの読み込みに失敗しました'
    }
  }

  reader.onerror = () => {
    error.value = 'ファイルの読み込みに失敗しました'
  }

  reader.readAsText(file)

  // 同じファイルを再選択可能にする
  target.value = ''
}

// エクスポート機能
function handleExportQMK() {
  try {
    const qmkJson = exportToQMK(store.layout)
    const filename = 'keyboard.json'
    downloadJSON(qmkJson, filename)
  } catch (error) {
    console.error('QMKエクスポートエラー:', error)
    alert('QMKエクスポート中にエラーが発生しました')
  }
}

function handleExportVial() {
  try {
    const vialJson = exportToVial(store.layout)
    const filename = `vial.json`
    downloadJSON(vialJson, filename)
  } catch (error) {
    console.error('Vialエクスポートエラー:', error)
    alert('Vialエクスポート中にエラーが発生しました')
  }
}

function handleExportKeymapC() {
  try {
    const keymapC = exportToQMKKeymapC(store.layout)
    const filename = 'keymap.c'
    downloadText(keymapC, filename)
  } catch (error) {
    console.error('keymap.cエクスポートエラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'keymap.cエクスポート中にエラーが発生しました'
    alert(errorMessage)
  }
}
</script>

<style scoped>
textarea {
  tab-size: 2;
  -moz-tab-size: 2;
}

textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

textarea::-webkit-scrollbar-track {
  background: #1f2937;
}

textarea::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
