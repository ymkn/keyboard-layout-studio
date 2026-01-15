<template>
  <div class="property-panel p-4">
    <h2 class="text-lg font-bold text-white mb-4">プロパティ</h2>

    <div v-if="store.selectedKeyIds.length === 0" class="space-y-4">
      <!-- レイアウト画面のみメタデータを表示 -->
      <template v-if="props.activeTab === 'layout'">
        <!-- レイアウト情報 -->
        <p class="text-sm text-gray-400">レイアウト全体の情報</p>

        <!-- タイトル -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">タイトル</h3>
          <input
            v-model="title"
            @input="updateTitle"
            type="text"
            placeholder="例: My Custom Keyboard Layout"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        <!-- 作者名 -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">作者名</h3>
          <input
            v-model="author"
            @input="updateAuthor"
            type="text"
            placeholder="例: John Doe"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        <!-- 説明 -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">説明</h3>
          <textarea
            v-model="description"
            @input="updateDescription"
            rows="4"
            placeholder="例: 60%キーボード用のカスタムレイアウト"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm resize-none"
          ></textarea>
        </div>

        <!-- レジェンドフォント -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">レジェンドフォント</h3>
          <select
            :value="store.layout.legendFont || ''"
            @change="updateLegendFont"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="">デフォルト</option>
            <optgroup label="ゴシック系">
              <option value="Noto Sans JP">Noto Sans JP</option>
              <option value="M PLUS 1p">M PLUS 1p</option>
              <option value="M PLUS 2">M PLUS 2</option>
              <option value="Zen Kaku Gothic New">Zen Kaku Gothic New</option>
            </optgroup>
            <optgroup label="丸ゴシック系">
              <option value="M PLUS Rounded 1c">M PLUS Rounded 1c</option>
              <option value="Zen Maru Gothic">Zen Maru Gothic</option>
              <option value="Kosugi Maru">Kosugi Maru</option>
            </optgroup>
            <optgroup label="明朝系">
              <option value="Noto Serif JP">Noto Serif JP</option>
              <option value="Zen Old Mincho">Zen Old Mincho</option>
              <option value="Shippori Mincho">Shippori Mincho</option>
            </optgroup>
          </select>
          <p
            v-if="store.layout.legendFont"
            class="mt-2 text-xs text-gray-400"
            :style="{ fontFamily: `'${store.layout.legendFont}', sans-serif` }"
          >
            プレビュー: あいうえお ABCDE 12345
          </p>
        </div>

        <!-- 追加情報 -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">追加情報</h3>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-400">作成日時:</span>
              <span class="text-gray-300">{{ formatDate(store.layout.metadata?.created) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">最終更新:</span>
              <span class="text-gray-300">{{ formatDate(store.layout.metadata?.modified) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">キー数:</span>
              <span class="text-gray-300">{{ store.keys.length }} keys</span>
            </div>

            <!-- 幅別内訳 -->
            <div class="mt-3 pt-2 border-t border-gray-700">
              <div class="font-semibold text-gray-300 mb-1">幅別内訳:</div>
              <div class="space-y-1 ml-2">
                <!-- 特殊形状（形状別に表示） -->
                <div v-for="[shape, count] in sortedSpecialShapeCounts" :key="shape" class="flex justify-between">
                  <span class="text-gray-400">{{ getShapeDisplayName(shape) }}:</span>
                  <span class="text-gray-300">{{ count }} keys</span>
                </div>
                <!-- 縦長キー（高さが1uでない） -->
                <div v-for="[size, count] in sortedVerticalCounts" :key="size" class="flex justify-between">
                  <span class="text-gray-400">{{ size }}:</span>
                  <span class="text-gray-300">{{ count }} keys</span>
                </div>
                <!-- 通常の長方形（高さ1u）の幅別 -->
                <div v-for="[width, count] in sortedWidthCounts" :key="width" class="flex justify-between">
                  <span class="text-gray-400">{{ width }}u:</span>
                  <span class="text-gray-300">{{ count }} keys</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- JSON画面では選択メッセージのみ -->
      <template v-else>
        <p class="text-sm text-gray-400">キーを選択してプロパティを編集します</p>
      </template>
    </div>

    <div v-else-if="store.selectedKeyIds.length > 1" class="text-gray-400">
      <p class="text-sm mb-2">{{ store.selectedKeyIds.length }} 個のキーが選択されています</p>
      <p class="text-xs text-gray-500">複数選択時はプロパティの編集はできません。</p>
      <p class="text-xs text-gray-500 mt-2">カーソルキー: 移動<br/>Shift+カーソルキー: サイズ変更</p>
    </div>

    <div v-else-if="store.selectedKey" class="space-y-4">
      <!-- 形状 -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">形状</h3>
        <select
          :value="store.selectedKey.shape || 'rectangle'"
          @change="updateShape"
          class="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
        >
          <option value="rectangle">長方形</option>
          <option value="iso-enter">ISO Enter</option>
          <option value="big-ass-enter">Big Ass Enter</option>
          <option value="circle">円形</option>
        </select>
        <p class="text-xs text-gray-500 mt-1">
          {{ getShapeDescription(store.selectedKey.shape || 'rectangle') }}
        </p>
      </div>

      <!-- 位置 -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">位置</h3>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-400">X (u)</label>
            <input
              :ref="(el) => setInputRef(el, 'x')"
              type="number"
              :value="store.selectedKey.x"
              @input="updateX"
              @keydown.enter="handleEnterKey('x')"
              step="0.25"
              min="0"
              class="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-gray-400">Y (u)</label>
            <input
              :ref="(el) => setInputRef(el, 'y')"
              type="number"
              :value="store.selectedKey.y"
              @input="updateY"
              @keydown.enter="handleEnterKey('y')"
              step="0.25"
              min="0"
              class="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            />
          </div>
        </div>
      </div>

      <!-- サイズ -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">サイズ</h3>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-400">幅 (u)</label>
            <input
              :ref="(el) => setInputRef(el, 'width')"
              type="number"
              :value="store.selectedKey.width"
              @input="updateWidth"
              @keydown.enter="handleEnterKey('width')"
              step="0.25"
              min="0.25"
              :disabled="!isShapeResizable"
              :class="[
                'w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm',
                !isShapeResizable && 'opacity-50 cursor-not-allowed'
              ]"
            />
          </div>
          <div>
            <label class="text-xs text-gray-400">高さ (u)</label>
            <input
              :ref="(el) => setInputRef(el, 'height')"
              type="number"
              :value="store.selectedKey.height"
              @input="updateHeight"
              @keydown.enter="handleEnterKey('height')"
              step="0.25"
              min="0.25"
              :disabled="!isShapeResizable"
              :class="[
                'w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm',
                !isShapeResizable && 'opacity-50 cursor-not-allowed'
              ]"
            />
          </div>
        </div>
        <p v-if="!isShapeResizable" class="text-xs text-yellow-500 mt-1">
          この形状は固定サイズです
        </p>
      </div>

      <!-- 回転 -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">回転</h3>
        <div class="flex items-center gap-2">
          <input
            :ref="(el) => setInputRef(el, 'rotation')"
            type="number"
            :value="store.selectedKey.rotation || 0"
            @input="updateRotation"
            @keydown.enter="handleEnterKey('rotation')"
            step="3"
            class="flex-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
          />
          <span class="text-gray-400 text-sm">度</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">R: +3° / Shift+R: -3°</p>
      </div>

      <!-- レジェンド -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">レジェンド</h3>
        <div class="space-y-2">
          <!-- 上段 -->
          <div class="grid grid-cols-3 gap-1">
            <input
              :ref="(el) => setInputRef(el, 'topLeft')"
              type="text"
              :value="store.selectedKey.legend.topLeft"
              @input="updateLegend('topLeft', $event)"
              @keydown.enter="handleEnterKey('topLeft')"
              placeholder="左上"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'topCenter')"
              type="text"
              :value="store.selectedKey.legend.topCenter"
              @input="updateLegend('topCenter', $event)"
              @keydown.enter="handleEnterKey('topCenter')"
              placeholder="中上"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'topRight')"
              type="text"
              :value="store.selectedKey.legend.topRight"
              @input="updateLegend('topRight', $event)"
              @keydown.enter="handleEnterKey('topRight')"
              placeholder="右上"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
          </div>

          <!-- 中段 -->
          <div class="grid grid-cols-3 gap-1">
            <input
              :ref="(el) => setInputRef(el, 'centerLeft')"
              type="text"
              :value="store.selectedKey.legend.centerLeft"
              @input="updateLegend('centerLeft', $event)"
              @keydown.enter="handleEnterKey('centerLeft')"
              placeholder="左中"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'center')"
              type="text"
              :value="store.selectedKey.legend.center"
              @input="updateLegend('center', $event)"
              @keydown.enter="handleEnterKey('center')"
              placeholder="中央"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs font-semibold"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'centerRight')"
              type="text"
              :value="store.selectedKey.legend.centerRight"
              @input="updateLegend('centerRight', $event)"
              @keydown.enter="handleEnterKey('centerRight')"
              placeholder="右中"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
          </div>

          <!-- 下段 -->
          <div class="grid grid-cols-3 gap-1">
            <input
              :ref="(el) => setInputRef(el, 'bottomLeft')"
              type="text"
              :value="store.selectedKey.legend.bottomLeft"
              @input="updateLegend('bottomLeft', $event)"
              @keydown.enter="handleEnterKey('bottomLeft')"
              placeholder="左下"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'bottomCenter')"
              type="text"
              :value="store.selectedKey.legend.bottomCenter"
              @input="updateLegend('bottomCenter', $event)"
              @keydown.enter="handleEnterKey('bottomCenter')"
              placeholder="中下"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'bottomRight')"
              type="text"
              :value="store.selectedKey.legend.bottomRight"
              @input="updateLegend('bottomRight', $event)"
              @keydown.enter="handleEnterKey('bottomRight')"
              placeholder="右下"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
          </div>
        </div>
      </div>

      <!-- キーマトリクス -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">キーマトリクス</h3>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-400">ROW</label>
            <input
              :ref="(el) => setInputRef(el, 'row')"
              type="number"
              :value="store.selectedKey.matrix.row"
              @input="updateMatrix('row', $event)"
              @keydown.enter="handleEnterKey('row')"
              min="0"
              class="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-gray-400">COL</label>
            <input
              :ref="(el) => setInputRef(el, 'col')"
              type="number"
              :value="store.selectedKey.matrix.col"
              @input="updateMatrix('col', $event)"
              @keydown.enter="handleEnterKey('col')"
              min="0"
              class="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            />
          </div>
        </div>
      </div>

      <!-- キーコード -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">キーコード</h3>
        <div class="flex gap-2">
          <input
            :ref="(el) => setInputRef(el, 'keycode')"
            type="text"
            :value="store.selectedKey.keycodes?.[store.currentLayer] || ''"
            @input="updateKeycode"
            @keydown.enter="handleEnterKey('keycode')"
            placeholder="KC_A, MO(1), etc..."
            class="flex-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm font-mono"
          />
          <button
            @click="showKeycodeDialog = true"
            class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
            title="キーコードを選択"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <div v-if="store.selectedKey.keycodes?.[store.currentLayer]" class="mt-1 text-xs text-gray-400">
          {{ getKeycodeLabel(store.selectedKey.keycodes[store.currentLayer]) }}
        </div>
      </div>
    </div>

    <!-- キーコードピッカーダイアログ -->
    <KeycodePickerDialog
      v-model="showKeycodeDialog"
      @select="onKeycodeSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useKeyboardStore } from '../stores/keyboard'
import { getKeycodeLabel } from '../data/keycodes'
import { SHAPE_PRESETS } from '../data/shape-presets'
import type { KeyShape, LegendFont } from '../types/keyboard'
import KeycodePickerDialog from './KeycodePickerDialog.vue'

// Propsの定義
const props = defineProps<{
  activeTab: 'layout' | 'json'
}>()

const store = useKeyboardStore()
const showKeycodeDialog = ref(false)

// 各入力欄のref（動的ref）
const inputRefs = ref<Record<string, HTMLInputElement | null>>({})

// メタデータ編集用
const title = ref('')
const author = ref('')
const description = ref('')

// 形状がサイズ変更可能かどうか
const isShapeResizable = computed(() => {
  if (!store.selectedKey) return true
  const shape = store.selectedKey.shape || 'rectangle'
  return SHAPE_PRESETS[shape].isResizable
})

// レジェンドフォントスタイル
const legendFontStyle = computed(() => {
  const font = store.layout.legendFont || 'Noto Sans JP'
  return { fontFamily: `'${font}', sans-serif` }
})

// キーの幅別内訳を計算
const keyCountsByShape = computed(() => {
  const widthCounts = new Map<number, number>()
  const verticalCounts = new Map<string, number>()
  const specialShapeCounts = new Map<string, number>()

  store.keys.forEach(key => {
    const shape = key.shape || 'rectangle'

    if (shape === 'rectangle') {
      // 長方形の場合
      if (key.height !== 1) {
        // 高さが1uでない場合は縦長キーとしてカウント
        const size = `${key.width}u × ${key.height}u`
        verticalCounts.set(size, (verticalCounts.get(size) || 0) + 1)
      } else {
        // 高さが1uの通常キーは幅でカウント
        const width = key.width
        widthCounts.set(width, (widthCounts.get(width) || 0) + 1)
      }
    } else {
      // 長方形以外は形状別にカウント
      specialShapeCounts.set(shape, (specialShapeCounts.get(shape) || 0) + 1)
    }
  })

  return {
    widthCounts,
    verticalCounts,
    specialShapeCounts
  }
})

// 幅別カウントをソートして配列に変換
const sortedWidthCounts = computed(() => {
  return Array.from(keyCountsByShape.value.widthCounts.entries()).sort((a, b) => a[0] - b[0])
})

// 縦長キーのカウントをソートして配列に変換
const sortedVerticalCounts = computed(() => {
  return Array.from(keyCountsByShape.value.verticalCounts.entries()).sort((a, b) => {
    // サイズ文字列をパースして幅×高さでソート
    const parseSize = (sizeStr: string) => {
      const match = sizeStr.match(/(\d+\.?\d*)u × (\d+\.?\d*)u/)
      if (match) {
        return { width: parseFloat(match[1]), height: parseFloat(match[2]) }
      }
      return { width: 0, height: 0 }
    }
    const sizeA = parseSize(a[0])
    const sizeB = parseSize(b[0])

    // まず幅でソート、幅が同じなら高さでソート
    if (sizeA.width !== sizeB.width) {
      return sizeA.width - sizeB.width
    }
    return sizeA.height - sizeB.height
  })
})

// 特殊形状のカウントをソートして配列に変換（定義された順序で表示）
const sortedSpecialShapeCounts = computed(() => {
  const shapeOrder = ['iso-enter', 'big-ass-enter', 'circle']
  return shapeOrder
    .map(shape => [shape, keyCountsByShape.value.specialShapeCounts.get(shape) || 0] as [string, number])
    .filter(([, count]) => count > 0)
})

// 形状名を日本語に変換
function getShapeDisplayName(shape: string): string {
  const shapeNames: Record<string, string> = {
    'iso-enter': 'ISO Enter',
    'big-ass-enter': 'Big Ass Enter',
    'circle': '円形'
  }
  return shapeNames[shape] || shape
}

// 形状の説明文を取得
function getShapeDescription(shape: KeyShape): string {
  return SHAPE_PRESETS[shape].description
}

// 形状を変更
function updateShape(event: Event) {
  const shape = (event.target as HTMLSelectElement).value as KeyShape
  if (store.selectedKey) {
    const preset = SHAPE_PRESETS[shape]

    // 固定サイズ形状の場合、デフォルトサイズを設定
    if (!preset.isResizable) {
      store.updateKey(store.selectedKey.id, {
        shape: shape,
        width: preset.defaultWidth,
        height: preset.defaultHeight
      })
    } else {
      store.updateKey(store.selectedKey.id, { shape: shape })
    }
  }
}

// 動的refを設定する関数
function setInputRef(el: unknown, key: string) {
  if (el instanceof HTMLInputElement) {
    inputRefs.value[key] = el
  }
}

function updateX(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value) && store.selectedKey) {
    // マイナス値は0に制限
    store.updateKey(store.selectedKey.id, { x: Math.max(0, value) })
  }
}

function updateY(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value) && store.selectedKey) {
    // マイナス値は0に制限
    store.updateKey(store.selectedKey.id, { y: Math.max(0, value) })
  }
}

function updateWidth(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value) && value >= 0.25 && store.selectedKey) {
    store.updateKey(store.selectedKey.id, { width: value })
  }
}

function updateHeight(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value) && value >= 0.25 && store.selectedKey) {
    store.updateKey(store.selectedKey.id, { height: value })
  }
}

function updateRotation(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value) && store.selectedKey) {
    // 角度を-180〜180の範囲に正規化
    let normalizedValue = value
    while (normalizedValue > 180) normalizedValue -= 360
    while (normalizedValue <= -180) normalizedValue += 360
    store.updateKey(store.selectedKey.id, { rotation: normalizedValue })
  }
}

function updateLegend(position: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (store.selectedKey) {
    store.updateKey(store.selectedKey.id, {
      legend: {
        ...store.selectedKey.legend,
        [position]: value || undefined
      }
    })
  }
}

function updateMatrix(field: 'row' | 'col', event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value)
  if (store.selectedKey) {
    store.updateKey(store.selectedKey.id, {
      matrix: {
        ...store.selectedKey.matrix,
        [field]: isNaN(value) ? undefined : value
      }
    })
  }
}

function updateKeycode(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (store.selectedKey) {
    const newKeycodes = { ...store.selectedKey.keycodes }
    if (value) {
      newKeycodes[store.currentLayer] = value
    } else {
      delete newKeycodes[store.currentLayer]
    }
    store.updateKey(store.selectedKey.id, {
      keycodes: newKeycodes
    })
  }
}

function onKeycodeSelect(keycode: string) {
  if (store.selectedKey) {
    const newKeycodes = { ...store.selectedKey.keycodes }
    if (keycode) {
      newKeycodes[store.currentLayer] = keycode
    } else {
      delete newKeycodes[store.currentLayer]
    }
    store.updateKey(store.selectedKey.id, {
      keycodes: newKeycodes
    })
  }
}

// Enterキーで次のキーに移動し、同じ入力欄にフォーカス
function handleEnterKey(fieldName: string) {
  if (!store.selectedKey) return

  const inputElement = inputRefs.value[fieldName]
  if (!inputElement) return

  const value = inputElement.value

  // フィールドタイプごとにバリデーションと更新を実行
  let isValid = true

  try {
    switch (fieldName) {
      case 'x': {
        const numValue = parseFloat(value)
        if (isNaN(numValue) || numValue < 0) {
          isValid = false
          alert('X座標は0以上の数値である必要があります')
        } else {
          store.updateKey(store.selectedKey.id, { x: numValue })
        }
        break
      }
      case 'y': {
        const numValue = parseFloat(value)
        if (isNaN(numValue) || numValue < 0) {
          isValid = false
          alert('Y座標は0以上の数値である必要があります')
        } else {
          store.updateKey(store.selectedKey.id, { y: numValue })
        }
        break
      }
      case 'width': {
        const numValue = parseFloat(value)
        if (isNaN(numValue) || numValue < 0.25) {
          isValid = false
          alert('幅は0.25以上の数値である必要があります')
        } else {
          store.updateKey(store.selectedKey.id, { width: numValue })
        }
        break
      }
      case 'height': {
        const numValue = parseFloat(value)
        if (isNaN(numValue) || numValue < 0.25) {
          isValid = false
          alert('高さは0.25以上の数値である必要があります')
        } else {
          store.updateKey(store.selectedKey.id, { height: numValue })
        }
        break
      }
      case 'rotation': {
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          isValid = false
          alert('回転角度は数値である必要があります')
        } else {
          // 角度を-180〜180の範囲に正規化
          let normalizedValue = numValue
          while (normalizedValue > 180) normalizedValue -= 360
          while (normalizedValue <= -180) normalizedValue += 360
          store.updateKey(store.selectedKey.id, { rotation: normalizedValue })
        }
        break
      }
      case 'row': {
        const intValue = parseInt(value)
        store.updateKey(store.selectedKey.id, {
          matrix: {
            ...store.selectedKey.matrix,
            row: isNaN(intValue) ? undefined : intValue
          }
        })
        break
      }
      case 'col': {
        const intValue = parseInt(value)
        store.updateKey(store.selectedKey.id, {
          matrix: {
            ...store.selectedKey.matrix,
            col: isNaN(intValue) ? undefined : intValue
          }
        })
        break
      }
      case 'keycode': {
        const newKeycodes = { ...store.selectedKey.keycodes }
        if (value) {
          newKeycodes[store.currentLayer] = value
        } else {
          delete newKeycodes[store.currentLayer]
        }
        store.updateKey(store.selectedKey.id, {
          keycodes: newKeycodes
        })
        break
      }
      default: {
        // レジェンドフィールド
        const legendFields = ['topLeft', 'topCenter', 'topRight', 'centerLeft', 'center', 'centerRight', 'bottomLeft', 'bottomCenter', 'bottomRight']
        if (legendFields.includes(fieldName)) {
          store.updateKey(store.selectedKey.id, {
            legend: {
              ...store.selectedKey.legend,
              [fieldName]: value || undefined
            }
          })
        }
        break
      }
    }
  } catch (error) {
    isValid = false
    alert('値の更新中にエラーが発生しました')
  }

  // バリデーションに成功した場合のみ次のキーに移動
  if (isValid) {
    const moved = store.selectNextKey()
    if (moved) {
      // 次のキーに移動できた場合、同じ入力欄にフォーカスを戻す
      nextTick(() => {
        const input = inputRefs.value[fieldName]
        if (input) {
          input.focus()
          input.select()
        }
      })
    }
  }
}

// メタデータの初期化と監視
onMounted(() => {
  loadMetadataFromStore()
})

watch(
  () => store.layout,
  () => {
    loadMetadataFromStore()
  },
  { deep: true }
)

function loadMetadataFromStore() {
  title.value = store.layout.name || ''
  author.value = store.layout.metadata?.author || ''
  description.value = store.layout.metadata?.description || ''
}

function updateTitle() {
  store.updateMetadata({ name: title.value })
}

function updateAuthor() {
  store.updateMetadata({ author: author.value })
}

function updateDescription() {
  store.updateMetadata({ description: description.value })
}

function updateLegendFont(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  store.setLegendFont(value ? value as LegendFont : undefined)
}

function formatDate(dateString?: string): string {
  if (!dateString) return '未設定'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '無効な日付'
  }
}
</script>

<style scoped>
.property-section {
  @apply border-b border-gray-700 pb-4;
}

.property-section:last-child {
  @apply border-b-0;
}
</style>
