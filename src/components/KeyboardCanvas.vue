<template>
  <div class="keyboard-canvas-container h-full flex flex-col">
    <div class="flex gap-2 items-center bg-gray-800 px-4 py-3 border-b border-gray-700">
      <button
        @click="store.addKey()"
        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm"
      >
        <i class="fa-solid fa-plus"></i> キーを追加
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
        <i class="fa-solid fa-copy"></i> コピー
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
        <i class="fa-solid fa-paste"></i> ペースト
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
        <i class="fa-solid fa-trash"></i> 削除
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
        <i class="fa-solid fa-rotate-left"></i> 元に戻す
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
        <i class="fa-solid fa-rotate-right"></i> やり直す
      </button>

      <div class="flex-1"></div>

      <!-- 撮影モードボタン -->
      <button
        @click="showScreenshotDialog = true"
        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
        title="撮影モード"
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
          レジェンド
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
          行列・キーコード
        </button>
      </div>
    </div>

    <!-- レイヤー選択行 -->
    <div class="flex gap-2 items-center bg-gray-900 px-4 py-3">
      <span class="text-sm text-gray-400">レイヤー:</span>

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
        title="レイヤーを削除"
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
        title="レイヤーを追加"
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
import { useKeyboardStore } from '../stores/keyboard'
import KeyComponent from './KeyComponent.vue'
import ScreenshotDialog from './ScreenshotDialog.vue'

const store = useKeyboardStore()
const containerRef = ref<HTMLElement | null>(null)
const showScreenshotDialog = ref(false)

// 定数
const keyUnit = 54 // 1uのピクセルサイズ
const gridSize = 0.25 // グリッドサイズ（u単位）
const margin = 0.25 // マージン（u単位）

// ドラッグ選択用の状態
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragEndX = ref(0)
const dragEndY = ref(0)
const justFinishedDrag = ref(false) // ドラッグ直後のclickイベントをスキップするためのフラグ

const selectionRect = computed(() => {
  if (!isDragging.value) return null

  const x = Math.min(dragStartX.value, dragEndX.value)
  const y = Math.min(dragStartY.value, dragEndY.value)
  const width = Math.abs(dragEndX.value - dragStartX.value)
  const height = Math.abs(dragEndY.value - dragStartY.value)

  return { x, y, width, height }
})

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
  const svg = event.currentTarget as SVGSVGElement
  const pt = svg.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY
  const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())

  // マージンを考慮した座標
  const adjustedX = svgP.x - marginPixels.value
  const adjustedY = svgP.y - marginPixels.value

  isDragging.value = true
  dragStartX.value = adjustedX
  dragStartY.value = adjustedY
  dragEndX.value = adjustedX
  dragEndY.value = adjustedY
}

// ドラッグ中
function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return

  const svg = event.currentTarget as SVGSVGElement
  const pt = svg.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY
  const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())

  // マージンを考慮した座標
  dragEndX.value = svgP.x - marginPixels.value
  dragEndY.value = svgP.y - marginPixels.value
}

// ドラッグ終了
function handleMouseUp(_event: MouseEvent) {
  if (!isDragging.value) return

  const rect = selectionRect.value
  let didSelectKeys = false

  // 最小限の動きがあった場合のみ選択（クリックと区別）
  if (rect && (rect.width > 1 || rect.height > 1)) {
    // 矩形内にあるキーを選択
    const selectedIds: string[] = []

    for (const key of store.keys) {
      const keyX = key.x * keyUnit
      const keyY = key.y * keyUnit
      const keyWidth = key.width * keyUnit
      const keyHeight = key.height * keyUnit

      // キーが矩形と交差しているかチェック（一部でも重なっていればOK）
      if (
        keyX < rect.x + rect.width &&
        keyX + keyWidth > rect.x &&
        keyY < rect.y + rect.height &&
        keyY + keyHeight > rect.y
      ) {
        selectedIds.push(key.id)
      }
    }

    // 選択されたキーがあれば適用
    if (selectedIds.length > 0) {
      store.selectMultipleKeys(selectedIds)
      didSelectKeys = true
    }
  }

  isDragging.value = false

  // ドラッグ選択が行われた場合、直後のclickイベントをスキップするためにフラグを立てる
  if (didSelectKeys) {
    justFinishedDrag.value = true
  }
}

// レイヤー削除の確認ダイアログ
function handleDecrementLayer() {
  if (store.layout.layerCount <= 1) return

  const layerToDelete = store.layout.layerCount - 1
  const hasKeycodes = store.keys.some(key => key.keycodes?.[layerToDelete])

  let message = `レイヤー ${layerToDelete} を削除しますか？`
  if (hasKeycodes) {
    message += `\n\nこのレイヤーにはキーコードが設定されています。削除すると元に戻せません。`
  }

  if (confirm(message)) {
    store.decrementLayerCount()
  }
}

// キーボード操作
function handleKeyDown(event: KeyboardEvent) {
  // Ctrl+Z でundo（選択状態に関係なく有効）
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    store.undo()
    return
  }

  // Ctrl+Y または Ctrl+Shift+Z でredo（選択状態に関係なく有効）
  if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
    event.preventDefault()
    store.redo()
    return
  }

  if (store.selectedKeyIds.length === 0) return

  const step = 0.25 // 移動・サイズ変更の単位

  // カーソルキーでの移動（複数選択対応）
  if (event.key.startsWith('Arrow') && !event.shiftKey) {
    event.preventDefault()
    switch (event.key) {
      case 'ArrowUp':
        store.moveSelectedKeys(0, -step)
        break
      case 'ArrowDown':
        store.moveSelectedKeys(0, step)
        break
      case 'ArrowLeft':
        store.moveSelectedKeys(-step, 0)
        break
      case 'ArrowRight':
        store.moveSelectedKeys(step, 0)
        break
    }
  }

  // Shift + カーソルキーでのサイズ変更（複数選択対応）
  if (event.key.startsWith('Arrow') && event.shiftKey) {
    event.preventDefault()
    switch (event.key) {
      case 'ArrowUp':
        store.resizeSelectedKeys(0, -step)
        break
      case 'ArrowDown':
        store.resizeSelectedKeys(0, step)
        break
      case 'ArrowLeft':
        store.resizeSelectedKeys(-step, 0)
        break
      case 'ArrowRight':
        store.resizeSelectedKeys(step, 0)
        break
    }
  }

  // Deleteキーで選択中のキーを削除
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    store.deleteSelectedKeys()
  }

  // Ctrl+C で選択中のキーをコピー
  if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
    event.preventDefault()
    store.copySelectedKeys()
  }

  // Ctrl+V でペースト
  if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
    event.preventDefault()
    store.pasteKeys()
  }
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
