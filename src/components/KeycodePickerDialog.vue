<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="close"
    >
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <!-- ヘッダー -->
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 class="text-xl font-bold text-white">{{ t('dialogs.keycodePicker.title') }}</h2>
          <button
            @click="close"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 検索バー -->
        <div class="px-6 py-3 border-b border-gray-700">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('dialogs.keycodePicker.searchPlaceholder')"
            class="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <!-- タブ -->
        <div class="px-6 pt-4 border-b border-gray-700">
          <div class="flex gap-2 overflow-x-auto">
            <button
              v-for="category in keycodeCategories"
              :key="category.name"
              @click="activeTab = category.name"
              :class="[
                'px-4 py-2 rounded-t transition-colors whitespace-nowrap',
                activeTab === category.name
                  ? 'bg-gray-900 text-white font-semibold'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
            >
              {{ category.label }}
            </button>
          </div>
        </div>

        <!-- キーコード一覧 -->
        <div class="flex-1 overflow-auto p-6">
          <div
            v-if="filteredKeycodes.length === 0"
            class="text-center text-gray-400 py-8"
          >
            {{ t('dialogs.keycodePicker.noResults') }}
          </div>
          <div v-else class="grid grid-cols-4 gap-2">
            <button
              v-for="keycode in filteredKeycodes"
              :key="keycode.code"
              @click="selectKeycode(keycode.code)"
              class="px-4 py-3 bg-gray-700 hover:bg-blue-600 text-white rounded transition-colors text-left"
              :title="keycode.description"
            >
              <div class="font-semibold">{{ getKeycodeLabel(keycode.code, store.keyboardLayout) }}</div>
              <div class="text-xs text-gray-400 truncate">{{ keycode.code }}</div>
            </button>
          </div>
        </div>

        <!-- フッター -->
        <div class="px-6 py-4 border-t border-gray-700 flex justify-between items-center">
          <div class="text-sm text-gray-400">
            {{ t('dialogs.keycodePicker.keycodeCount', { count: filteredKeycodes.length }) }}
          </div>
          <div class="flex gap-2">
            <button
              @click="selectKeycode('')"
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              {{ t('common.clear') }}
            </button>
            <button
              @click="close"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { keycodeCategories, searchKeycodes } from '../data/keycodes'
import { getKeycodeLabel } from '../data/keycode-labels'
import { useKeyboardStore } from '../stores/keyboard'

const { t } = useI18n()

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', keycode: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useKeyboardStore()
const activeTab = ref(keycodeCategories[0].name)
const searchQuery = ref('')

const currentCategory = computed(() => {
  return keycodeCategories.find(c => c.name === activeTab.value) || keycodeCategories[0]
})

const filteredKeycodes = computed(() => {
  const query = searchQuery.value.trim()

  if (!query) {
    return currentCategory.value.keycodes
  }

  return searchKeycodes(query)
})

function selectKeycode(code: string) {
  emit('select', code)
  close()
}

function close() {
  emit('update:modelValue', false)
  searchQuery.value = ''
}
</script>

<style scoped>
/* スクロールバーのスタイル */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #374151;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
