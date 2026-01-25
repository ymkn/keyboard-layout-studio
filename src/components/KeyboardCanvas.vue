<template>
  <div class="keyboard-canvas-container h-full flex flex-col">
    <div class="flex gap-2 items-center bg-gray-800 px-4 py-3 border-b border-gray-700">
      <button
        @click="store.addKey()"
        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm"
      >
        <i class="fa-solid fa-plus"></i> {{ t('common.addKey') }}
      </button>
      <button
        @click="store.copySelectedKeys()"
        :disabled="store.selectedKeyIds.length === 0"
        :class="[
          'px-4 py-2 rounded transition-colors text-sm',
          store.selectedKeyIds.length > 0
            ? 'bg-gray-600 hover:bg-gray-700 text-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        ]"
        title="Ctrl+C"
      >
        <i class="fa-solid fa-copy"></i> {{ t('common.copy') }}
      </button>
      <button
        @click="store.pasteKeys()"
        :disabled="store.copiedKeys.length === 0 || store.selectedKeyIds.length === 0"
        :class="[
          'px-4 py-2 rounded transition-colors text-sm',
          store.copiedKeys.length > 0 && store.selectedKeyIds.length > 0
            ? 'bg-gray-600 hover:bg-gray-700 text-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        ]"
        title="Ctrl+V"
      >
        <i class="fa-solid fa-paste"></i> {{ t('common.paste') }}
      </button>
      <button
        @click="store.deleteSelectedKeys()"
        :disabled="store.selectedKeyIds.length === 0"
        :class="[
          'px-4 py-2 rounded transition-colors text-sm',
          store.selectedKeyIds.length > 0
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        ]"
        title="Delete"
      >
        <i class="fa-solid fa-trash"></i> {{ t('common.delete') }}
      </button>

      <div class="border-l border-gray-600 h-8 mx-2"></div>

      <button
        @click="store.undo()"
        :disabled="!store.canUndo"
        :class="[
          'px-4 py-2 rounded transition-colors text-sm',
          store.canUndo
            ? 'bg-gray-600 hover:bg-gray-700 text-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        ]"
        title="Ctrl+Z"
      >
        <i class="fa-solid fa-rotate-left"></i> {{ t('common.undo') }}
      </button>
      <button
        @click="store.redo()"
        :disabled="!store.canRedo"
        :class="[
          'px-4 py-2 rounded transition-colors text-sm',
          store.canRedo
            ? 'bg-gray-600 hover:bg-gray-700 text-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        ]"
        title="Ctrl+Y"
      >
        <i class="fa-solid fa-rotate-right"></i> {{ t('common.redo') }}
      </button>

      <div class="flex-1"></div>

      <!-- 撮影モードボタン -->
      <button
        @click="showScreenshotDialog = true"
        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
        :title="t('canvas.screenshotMode')"
      >
        <i class="fa-solid fa-camera"></i>
      </button>

      <!-- 表示モード切り替え -->
      <div class="flex gap-1 bg-gray-700 rounded p-1">
        <button
          @click="store.toggleDisplayMode()"
          :class="[
            'px-3 py-1 rounded text-sm transition-colors',
            store.displayMode === 'legend'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-gray-300 hover:text-white'
          ]"
        >
          {{ t('canvas.legend') }}
        </button>
        <button
          @click="store.toggleDisplayMode()"
          :class="[
            'px-3 py-1 rounded text-sm transition-colors',
            store.displayMode === 'matrix'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-gray-300 hover:text-white'
          ]"
        >
          {{ t('canvas.matrixKeycode') }}
        </button>
      </div>
    </div>

    <!-- レイヤー選択行 -->
    <div class="flex gap-2 items-center bg-gray-900 px-4 py-3">
      <span class="text-sm text-gray-400">{{ t('canvas.layer') }}</span>

      <!-- レイヤーボタン（0, 1, 2, ...） -->
      <div class="flex gap-1">
        <button
          v-for="layer in store.layout.layerCount"
          :key="layer - 1"
          @click="store.setCurrentLayer(layer - 1)"
          :class="[
            'px-3 py-1 rounded text-sm transition-colors',
            store.currentLayer === layer - 1
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          {{ layer - 1 }}
        </button>
      </div>

      <div class="border-l border-gray-600 h-8 mx-2"></div>

      <!-- レイヤー数調整ボタン -->
      <button
        @click="handleDecrementLayer"
        :disabled="store.layout.layerCount <= 1"
        :class="[
          'px-3 py-1 rounded text-sm font-semibold transition-colors',
          store.layout.layerCount > 1
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        ]"
        :title="t('canvas.deleteLayer')"
      >
        -
      </button>
      <button
        @click="store.incrementLayerCount()"
        :disabled="store.layout.layerCount >= 16"
        :class="[
          'px-3 py-1 rounded text-sm font-semibold transition-colors',
          store.layout.layerCount < 16
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        ]"
        :title="t('canvas.addLayer')"
      >
        +
      </button>
    </div>

    <div
      ref="containerRef"
      class="flex-1 bg-gray-900 overflow-auto p-4 border border-gray-700 rounded-lg m-4"
      tabindex="0"
      @keydown="handleKeyDown"
    >
      <svg
        :style="{
          minWidth: svgWidth + 'px',
          minHeight: svgHeight + 'px',
          width: '100%',
          height: '100%'
        }"
        class="keyboard-svg"
        @click="handleCanvasClick"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
      >
        <!-- コンテンツグループ（マージン分オフセット） -->
        <g :transform="`translate(${marginPixels}, ${marginPixels})`">
          <!-- グリッド線（0.25u単位） -->
          <g class="grid" opacity="0.2">
            <line
              v-for="i in Math.ceil((gridWidth - margin * 2) / gridSize)"
              :key="`v-${i}`"
              :x1="i * gridSize * keyUnit"
              :y1="0"
              :x2="i * gridSize * keyUnit"
              :y2="(gridHeight - margin * 2) * keyUnit"
              stroke="#666"
              stroke-width="0.5"
            />
            <line
              v-for="i in Math.ceil((gridHeight - margin * 2) / gridSize)"
              :key="`h-${i}`"
              :x1="0"
              :y1="i * gridSize * keyUnit"
              :x2="(gridWidth - margin * 2) * keyUnit"
              :y2="i * gridSize * keyUnit"
              stroke="#666"
              stroke-width="0.5"
            />
          </g>

          <!-- キーの描画 -->
          <g
            v-for="key in store.keys"
            :key="key.id"
            @mousedown.stop="handleKeyMouseDown($event, key.id)"
            @click.stop="handleKeyClick($event, key.id)"
            class="cursor-pointer"
          >
            <KeyComponent :key-data="key" :is-selected="store.selectedKeyIds.includes(key.id)" />
          </g>
        </g>

        <!-- ドラッグ選択の矩形（マージン分オフセット） -->
        <rect
          v-if="selectionRect"
          :x="selectionRect.x + marginPixels"
          :y="selectionRect.y + marginPixels"
          :width="selectionRect.width"
          :height="selectionRect.height"
          fill="rgba(59, 130, 246, 0.2)"
          stroke="rgb(59, 130, 246)"
          stroke-width="2"
          pointer-events="none"
        />
      </svg>
    </div>

    <!-- 撮影モードダイアログ -->
    <ScreenshotDialog
      :is-open="showScreenshotDialog"
      @close="showScreenshotDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKeyboardStore } from '../stores/keyboard'
import KeyComponent from './KeyComponent.vue'
import ScreenshotDialog from './ScreenshotDialog.vue'
import { RENDERING } from '../constants/rendering'
import { useDragSelection } from '../composables/useDragSelection'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'

const { t } = useI18n()
const store = useKeyboardStore()

// キーボードショートカット
const { handleKeyDown } = useKeyboardShortcuts(
  {
    undo: () => store.undo(),
    redo: () => store.redo(),
    moveSelectedKeys: (dx, dy) => store.moveSelectedKeys(dx, dy),
    resizeSelectedKeys: (dw, dh) => store.resizeSelectedKeys(dw, dh),
    deleteSelectedKeys: () => store.deleteSelectedKeys(),
    copySelectedKeys: () => store.copySelectedKeys(),
    pasteKeys: () => store.pasteKeys(),
    rotateSelectedKeys: (angle) => store.rotateSelectedKeys(angle)
  },
  () => store.selectedKeyIds.length > 0
)
const containerRef = ref<HTMLElement | null>(null)
const showScreenshotDialog = ref(false)

// 定数
const keyUnit = RENDERING.KEY_UNIT
const gridSize = RENDERING.GRID_SIZE
const margin = RENDERING.GRID_SIZE

// ドラッグ選択機能
const {
  selectionRect,
  justFinishedDrag,
  handleMouseDown: onDragStart,
  handleMouseMove: onDragMove,
  handleMouseUp: onDragEnd
} = useDragSelection()

// SVGのサイズを計算（マージンを含む）
const gridWidth = computed(() => {
  const maxX = Math.max(...store.keys.map(k => k.x + k.width), 10)
  return maxX + margin * 2 // 左右のマージン
})

const gridHeight = computed(() => {
  const maxY = Math.max(...store.keys.map(k => k.y + k.height), 6)
  return maxY + margin * 2 // 上下のマージン
})

const svgWidth = computed(() => gridWidth.value * keyUnit)
const svgHeight = computed(() => gridHeight.value * keyUnit)

// マージンのピクセル値
const marginPixels = computed(() => margin * keyUnit)

// キーのマウスダウン（ドラッグ選択を防ぐ）
function handleKeyMouseDown(_event: MouseEvent, _keyId: string) {
  // キーをクリックした時はドラッグ選択を開始しない
  // イベント伝播は既に.stopで止まっている
}

// キークリック（Shiftクリックで追加選択）
function handleKeyClick(event: MouseEvent, keyId: string) {
  if (event.shiftKey) {
    // Shiftキーを押しながらクリックで追加/削除
    store.toggleKeySelection(keyId)
  } else {
    // 通常のクリックで単独選択
    store.selectKey(keyId)
  }
}

// キャンバスクリック（選択解除）
function handleCanvasClick(_event: MouseEvent) {
  // ドラッグ直後のclickイベントはスキップ
  if (justFinishedDrag.value) {
    justFinishedDrag.value = false
    return
  }

  // 通常のクリックの場合は選択解除
  store.clearSelection()
}

// ドラッグ選択開始
function handleMouseDown(event: MouseEvent) {
  onDragStart(event, marginPixels.value)
}

// ドラッグ中
function handleMouseMove(event: MouseEvent) {
  onDragMove(event, marginPixels.value)
}

// ドラッグ終了
function handleMouseUp(_event: MouseEvent) {
  // キーの境界情報を渡す
  const keyBounds = store.keys.map(key => ({
    id: key.id,
    x: key.x,
    y: key.y,
    width: key.width,
    height: key.height
  }))

  const selectedIds = onDragEnd(keyBounds)

  // 選択されたキーがあれば適用
  if (selectedIds.length > 0) {
    store.selectMultipleKeys(selectedIds)
  }
}

// レイヤー削除の確認ダイアログ
function handleDecrementLayer() {
  if (store.layout.layerCount <= 1) return

  store.decrementLayerCount(store.currentLayer)
}

</script>

<style scoped>
.keyboard-canvas-container {
  @apply w-full h-full;
}

.keyboard-svg {
  @apply select-none;
}
</style>
