<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
    @click.self="$emit('close')"
  >
    <div class="flex flex-col max-w-[95vw] max-h-[95vh]">
      <!-- ヘッダー -->
      <div class="flex items-center justify-between bg-gray-800 px-4 py-3 rounded-t-lg">
        <span class="text-white font-medium">{{ t('dialogs.screenshot.title') }}</span>
        <div class="flex items-center gap-4">
          <!-- タイトル表示トグル -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="showTitle"
              class="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <span class="text-sm text-gray-300">{{ t('dialogs.screenshot.showTitle') }}</span>
          </label>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
      </div>

      <!-- キーボードレイアウト -->
      <div class="bg-gray-900 p-6 overflow-auto">
        <svg
          :width="svgWidth"
          :height="svgHeight"
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          class="block"
        >
          <!-- 背景 -->
          <rect
            x="0"
            y="0"
            :width="svgWidth"
            :height="svgHeight"
            fill="#111827"
          />

          <!-- コンテンツグループ（パディング分オフセット） -->
          <g :transform="`translate(${paddingPixels}, ${paddingPixels})`">
            <!-- キーの描画 -->
            <g v-for="key in store.keys" :key="key.id">
              <KeyComponent :key-data="key" :is-selected="false" />
            </g>
          </g>

          <!-- タイトル表示 -->
          <g v-if="showTitle && (store.layout.name || store.layout.metadata?.author)">
            <text
              v-if="store.layout.name"
              :x="svgWidth / 2"
              :y="keyboardBottomY + 32"
              text-anchor="middle"
              fill="#e5e7eb"
              font-size="18"
              font-weight="600"
            >
              {{ store.layout.name }}
            </text>
            <text
              v-if="store.layout.metadata?.author"
              :x="svgWidth / 2"
              :y="keyboardBottomY + (store.layout.name ? 54 : 32)"
              text-anchor="middle"
              fill="#9ca3af"
              font-size="14"
            >
              by {{ store.layout.metadata.author }}
            </text>
          </g>
        </svg>
      </div>

      <!-- フッター -->
      <div class="bg-gray-800 px-4 py-3 text-center text-sm text-gray-400">
        {{ t('dialogs.screenshot.hint') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKeyboardStore } from '../stores/keyboard'
import KeyComponent from './KeyComponent.vue'

const { t } = useI18n()

interface Props {
  isOpen: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const store = useKeyboardStore()
const showTitle = ref(false)

const keyUnit = 54
const padding = 0.5 // パディング（u単位）
const titleAreaHeight = 70 // タイトル表示エリアの高さ（px）

// SVGサイズを計算
const contentWidth = computed(() => {
  if (store.keys.length === 0) return 10
  return Math.max(...store.keys.map(k => k.x + k.width))
})

const contentHeight = computed(() => {
  if (store.keys.length === 0) return 6
  return Math.max(...store.keys.map(k => k.y + k.height))
})

const keyboardBottomY = computed(() => (contentHeight.value + padding) * keyUnit)

const svgWidth = computed(() => (contentWidth.value + padding * 2) * keyUnit)
const svgHeight = computed(() => {
  const baseHeight = (contentHeight.value + padding * 2) * keyUnit
  if (showTitle.value && (store.layout.name || store.layout.metadata?.author)) {
    return baseHeight + titleAreaHeight
  }
  return baseHeight
})
const paddingPixels = computed(() => padding * keyUnit)
</script>
