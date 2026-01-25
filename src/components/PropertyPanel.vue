<template>
  <div class="property-panel p-4">
    <h2 class="text-lg font-bold text-white mb-4">{{ t('propertyPanel.properties') }}</h2>

    <div v-if="store.selectedKeyIds.length === 0" class="space-y-4">
      <!-- レイアウト画面のみメタデータを表示 -->
      <template v-if="props.activeTab === 'layout'">
        <!-- レイアウト情報 -->
        <p class="text-sm text-gray-400">{{ t('propertyPanel.layoutInfo') }}</p>

        <!-- タイトル -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.title') }}</h3>
          <input
            v-model="title"
            @input="updateTitle"
            type="text"
            :placeholder="t('propertyPanel.titlePlaceholder')"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        <!-- 作者名 -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.author') }}</h3>
          <input
            v-model="author"
            @input="updateAuthor"
            type="text"
            :placeholder="t('propertyPanel.authorPlaceholder')"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        <!-- 説明 -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.description') }}</h3>
          <textarea
            v-model="description"
            @input="updateDescription"
            rows="4"
            :placeholder="t('propertyPanel.descriptionPlaceholder')"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm resize-none"
          ></textarea>
        </div>

        <!-- レジェンドフォント -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.legendFont') }}</h3>
          <select
            :value="store.layout.legendFont || ''"
            @change="updateLegendFont"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="">{{ t('common.default') }}</option>
            <optgroup :label="t('propertyPanel.fontGroupGothic')">
              <option value="Noto Sans JP">Noto Sans JP</option>
              <option value="M PLUS 1p">M PLUS 1p</option>
              <option value="M PLUS 2">M PLUS 2</option>
              <option value="Zen Kaku Gothic New">Zen Kaku Gothic New</option>
            </optgroup>
            <optgroup :label="t('propertyPanel.fontGroupRounded')">
              <option value="M PLUS Rounded 1c">M PLUS Rounded 1c</option>
              <option value="Zen Maru Gothic">Zen Maru Gothic</option>
              <option value="Kosugi Maru">Kosugi Maru</option>
            </optgroup>
            <optgroup :label="t('propertyPanel.fontGroupMincho')">
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
            {{ t('propertyPanel.fontPreview') }}
          </p>
        </div>

        <!-- 追加情報 -->
        <div class="property-section">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.additionalInfo') }}</h3>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-400">{{ t('propertyPanel.createdAt') }}</span>
              <span class="text-gray-300">{{ formatDate(store.layout.metadata?.created) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">{{ t('propertyPanel.modifiedAt') }}</span>
              <span class="text-gray-300">{{ formatDate(store.layout.metadata?.modified) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">{{ t('propertyPanel.keyCount') }}</span>
              <span class="text-gray-300">{{ store.keys.length }} {{ t('propertyPanel.keys') }}</span>
            </div>

            <!-- 幅別内訳 -->
            <div class="mt-3 pt-2 border-t border-gray-700">
              <div class="font-semibold text-gray-300 mb-1">{{ t('propertyPanel.sizeBreakdown') }}</div>
              <div class="space-y-1 ml-2">
                <!-- 特殊形状（形状別に表示） -->
                <div v-for="[shape, count] in sortedSpecialShapeCounts" :key="shape" class="flex justify-between">
                  <span class="text-gray-400">{{ getShapeDisplayName(shape) }}:</span>
                  <span class="text-gray-300">{{ count }} {{ t('propertyPanel.keys') }}</span>
                </div>
                <!-- 縦長キー（高さが1uでない） -->
                <div v-for="[size, count] in sortedVerticalCounts" :key="size" class="flex justify-between">
                  <span class="text-gray-400">{{ size }}:</span>
                  <span class="text-gray-300">{{ count }} {{ t('propertyPanel.keys') }}</span>
                </div>
                <!-- 通常の長方形（高さ1u）の幅別 -->
                <div v-for="[width, count] in sortedWidthCounts" :key="width" class="flex justify-between">
                  <span class="text-gray-400">{{ width }}u:</span>
                  <span class="text-gray-300">{{ count }} {{ t('propertyPanel.keys') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- JSON画面では選択メッセージのみ -->
      <template v-else>
        <p class="text-sm text-gray-400">{{ t('propertyPanel.selectKeyToEdit') }}</p>
      </template>
    </div>

    <div v-else-if="store.selectedKeyIds.length > 1" class="text-gray-400">
      <p class="text-sm mb-2">{{ t('propertyPanel.keysSelected', { count: store.selectedKeyIds.length }) }}</p>
      <p class="text-xs text-gray-500">{{ t('propertyPanel.multiSelectInfo') }}</p>
      <p class="text-xs text-gray-500 mt-2 whitespace-pre-line">{{ t('propertyPanel.multiSelectHint') }}</p>
    </div>

    <div v-else-if="store.selectedKey" class="space-y-4">
      <!-- 形状 -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.shape') }}</h3>
        <select
          :value="store.selectedKey.shape || 'rectangle'"
          @change="updateShape"
          class="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
        >
          <option value="rectangle">{{ t('propertyPanel.shapeRectangle') }}</option>
          <option value="iso-enter">{{ t('propertyPanel.shapeIsoEnter') }}</option>
          <option value="big-ass-enter">{{ t('propertyPanel.shapeBigAssEnter') }}</option>
          <option value="circle">{{ t('propertyPanel.shapeCircle') }}</option>
        </select>
        <p class="text-xs text-gray-500 mt-1">
          {{ getShapeDescription(store.selectedKey.shape || 'rectangle') }}
        </p>
      </div>

      <!-- 位置 -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.position') }}</h3>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-400">X (u)</label>
            <input
              :ref="(el) => setInputRef(el, 'x')"
              type="number"
              :value="store.selectedKey.x"
              @input="updateX"
              @focus="saveValidValue('x')"
              @blur="validateField('x', $event)"
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
              @focus="saveValidValue('y')"
              @blur="validateField('y', $event)"
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
        <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.size') }}</h3>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-400">{{ t('propertyPanel.width') }} (u)</label>
            <input
              :ref="(el) => setInputRef(el, 'width')"
              type="number"
              :value="store.selectedKey.width"
              @input="updateWidth"
              @focus="saveValidValue('width')"
              @blur="validateField('width', $event)"
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
            <label class="text-xs text-gray-400">{{ t('propertyPanel.height') }} (u)</label>
            <input
              :ref="(el) => setInputRef(el, 'height')"
              type="number"
              :value="store.selectedKey.height"
              @input="updateHeight"
              @focus="saveValidValue('height')"
              @blur="validateField('height', $event)"
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
          {{ t('propertyPanel.fixedSizeShape') }}
        </p>
      </div>

      <!-- 回転 -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.rotation') }}</h3>
        <div class="flex items-center gap-2">
          <input
            :ref="(el) => setInputRef(el, 'rotation')"
            type="number"
            :value="store.selectedKey.rotation || 0"
            @input="updateRotation"
            @focus="saveValidValue('rotation')"
            @blur="validateField('rotation', $event)"
            @keydown.enter="handleEnterKey('rotation')"
            step="3"
            class="flex-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
          />
          <span class="text-gray-400 text-sm">{{ t('propertyPanel.degrees') }}</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">{{ t('propertyPanel.rotationHint') }}</p>
      </div>

      <!-- レジェンド -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.legends') }}</h3>
        <div class="space-y-2">
          <!-- 上段 -->
          <div class="grid grid-cols-3 gap-1">
            <input
              :ref="(el) => setInputRef(el, 'topLeft')"
              type="text"
              :value="store.selectedKey.legend.topLeft"
              @input="updateLegend('topLeft', $event)"
              @focus="saveValidValue('topLeft')"
              @blur="validateField('topLeft', $event)"
              @keydown.enter="handleEnterKey('topLeft')"
              :placeholder="t('propertyPanel.legendTopLeft')"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'topCenter')"
              type="text"
              :value="store.selectedKey.legend.topCenter"
              @input="updateLegend('topCenter', $event)"
              @focus="saveValidValue('topCenter')"
              @blur="validateField('topCenter', $event)"
              @keydown.enter="handleEnterKey('topCenter')"
              :placeholder="t('propertyPanel.legendTopCenter')"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'topRight')"
              type="text"
              :value="store.selectedKey.legend.topRight"
              @input="updateLegend('topRight', $event)"
              @focus="saveValidValue('topRight')"
              @blur="validateField('topRight', $event)"
              @keydown.enter="handleEnterKey('topRight')"
              :placeholder="t('propertyPanel.legendTopRight')"
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
              @focus="saveValidValue('centerLeft')"
              @blur="validateField('centerLeft', $event)"
              @keydown.enter="handleEnterKey('centerLeft')"
              :placeholder="t('propertyPanel.legendCenterLeft')"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'center')"
              type="text"
              :value="store.selectedKey.legend.center"
              @input="updateLegend('center', $event)"
              @focus="saveValidValue('center')"
              @blur="validateField('center', $event)"
              @keydown.enter="handleEnterKey('center')"
              :placeholder="t('propertyPanel.legendCenter')"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs font-semibold"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'centerRight')"
              type="text"
              :value="store.selectedKey.legend.centerRight"
              @input="updateLegend('centerRight', $event)"
              @focus="saveValidValue('centerRight')"
              @blur="validateField('centerRight', $event)"
              @keydown.enter="handleEnterKey('centerRight')"
              :placeholder="t('propertyPanel.legendCenterRight')"
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
              @focus="saveValidValue('bottomLeft')"
              @blur="validateField('bottomLeft', $event)"
              @keydown.enter="handleEnterKey('bottomLeft')"
              :placeholder="t('propertyPanel.legendBottomLeft')"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'bottomCenter')"
              type="text"
              :value="store.selectedKey.legend.bottomCenter"
              @input="updateLegend('bottomCenter', $event)"
              @focus="saveValidValue('bottomCenter')"
              @blur="validateField('bottomCenter', $event)"
              @keydown.enter="handleEnterKey('bottomCenter')"
              :placeholder="t('propertyPanel.legendBottomCenter')"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
            <input
              :ref="(el) => setInputRef(el, 'bottomRight')"
              type="text"
              :value="store.selectedKey.legend.bottomRight"
              @input="updateLegend('bottomRight', $event)"
              @focus="saveValidValue('bottomRight')"
              @blur="validateField('bottomRight', $event)"
              @keydown.enter="handleEnterKey('bottomRight')"
              :placeholder="t('propertyPanel.legendBottomRight')"
              class="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-xs"
              :style="legendFontStyle"
            />
          </div>
        </div>
      </div>

      <!-- キーマトリクス -->
      <div class="property-section">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.keyMatrix') }}</h3>
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
        <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.keycode') }}</h3>
        <div class="flex gap-2">
          <input
            :ref="(el) => setInputRef(el, 'keycode')"
            type="text"
            :value="store.selectedKey.keycodes?.[store.currentLayer] || ''"
            @input="updateKeycode"
            @keydown.enter="handleEnterKey('keycode')"
            :placeholder="t('propertyPanel.keycodePlaceholder')"
            class="flex-1 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm font-mono"
          />
          <button
            @click="showKeycodeDialog = true"
            class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
            :title="t('propertyPanel.selectKeycode')"
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
import { useI18n } from 'vue-i18n'
import { useKeyboardStore } from '../stores/keyboard'
import { getKeycodeLabel } from '../data/keycodes'
import { SHAPE_PRESETS } from '../data/shape-presets'
import type { KeyShape, LegendFont } from '../types/keyboard'
import KeycodePickerDialog from './KeycodePickerDialog.vue'
import {
  processNumericField,
  processTextField,
  getNumericFieldUpdate,
  getMatrixFieldUpdate,
  getLegendFieldUpdate,
  getKeycodeFieldUpdate,
  isLegendField
} from '../composables/useKeyPropertyFields'

const { t, locale } = useI18n()

// Propsの定義
const props = defineProps<{
  activeTab: 'layout' | 'json'
}>()

const store = useKeyboardStore()
const showKeycodeDialog = ref(false)

// 各入力欄のref（動的ref）
const inputRefs = ref<Record<string, HTMLInputElement | null>>({})

// Enterキーが押されたかどうかのフラグ（blurイベントとの競合回避用）
const isEnterPressed = ref(false)

// フォーカスイン時の有効な値を保存（バリデーションエラー時に復元用）
const lastValidValues = ref<Record<string, string>>({})

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

// 形状名を翻訳（shape-presets.tsのキー名をそのまま使用）
function getShapeDisplayName(shape: string): string {
  return t(`shapes.${shape}`)
}

// 形状の説明文を取得（shape-presets.tsのキー名 + "-desc"）
function getShapeDescription(shape: KeyShape): string {
  return t(`shapes.${shape}-desc`)
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

/**
 * 数値フィールドの汎用更新関数
 */
function updateNumericField(fieldName: string, event: Event) {
  if (!store.selectedKey) return

  const rawValue = (event.target as HTMLInputElement).value
  const update = getNumericFieldUpdate(fieldName, rawValue)

  if (update) {
    store.updateKey(store.selectedKey.id, update)
  }
}

function updateX(event: Event) {
  updateNumericField('x', event)
}

function updateY(event: Event) {
  updateNumericField('y', event)
}

function updateWidth(event: Event) {
  updateNumericField('width', event)
}

function updateHeight(event: Event) {
  updateNumericField('height', event)
}

function updateRotation(event: Event) {
  updateNumericField('rotation', event)
}

function updateLegend(position: string, event: Event) {
  if (!store.selectedKey) return

  const value = (event.target as HTMLInputElement).value
  const update = getLegendFieldUpdate(
    store.selectedKey.legend,
    position as keyof typeof store.selectedKey.legend,
    value
  )
  if (update) {
    store.updateKey(store.selectedKey.id, update)
  }
}

function updateMatrix(field: 'row' | 'col', event: Event) {
  if (!store.selectedKey) return

  const rawValue = (event.target as HTMLInputElement).value
  const update = getMatrixFieldUpdate(store.selectedKey.matrix, field, rawValue)
  store.updateKey(store.selectedKey.id, update)
}

function updateKeycode(event: Event) {
  if (!store.selectedKey) return

  const value = (event.target as HTMLInputElement).value
  const update = getKeycodeFieldUpdate(store.selectedKey.keycodes, store.currentLayer, value)
  store.updateKey(store.selectedKey.id, update)
}

function onKeycodeSelect(keycode: string) {
  if (!store.selectedKey) return

  const update = getKeycodeFieldUpdate(store.selectedKey.keycodes, store.currentLayer, keycode)
  store.updateKey(store.selectedKey.id, update)
}

// フォーカスイン時に有効な値を保存
function saveValidValue(fieldName: string) {
  const inputElement = inputRefs.value[fieldName]
  if (!inputElement) return
  lastValidValues.value[fieldName] = inputElement.value
}

// フィールドのバリデーションを実行
function validateField(fieldName: string, event: FocusEvent) {
  // Enterキーが押された場合は、blurイベントでのバリデーションをスキップ
  if (isEnterPressed.value) {
    return
  }

  const inputElement = inputRefs.value[fieldName]
  if (!inputElement) return

  const rawValue = inputElement.value

  // 数値フィールドのバリデーション
  if (['x', 'y', 'width', 'height', 'rotation'].includes(fieldName)) {
    const result = processNumericField(fieldName, rawValue, { showError: true })
    // バリデーションエラーがある場合はフォーカスを維持し、値を復元
    if (!result.isValid) {
      event.preventDefault()
      const lastValidValue = lastValidValues.value[fieldName]
      // 入力欄とストア内のキーデータを両方復元
      const update = getNumericFieldUpdate(fieldName, lastValidValue)
      if (update && store.selectedKey) {
        store.updateKey(store.selectedKey.id, update)
      }
      nextTick(() => {
        inputElement.value = lastValidValue
        inputElement.focus()
      })
    }
  } else if (isLegendField(fieldName)) {
    // レジェンドフィールドのバリデーション
    const result = processTextField('legend', rawValue, { showError: true })
    // バリデーションエラーがある場合はフォーカスを維持し、値を復元
    if (!result.isValid) {
      event.preventDefault()
      const lastValidValue = lastValidValues.value[fieldName]
      // 入力欄とストア内のキーデータを両方復元
      if (store.selectedKey) {
        const update = getLegendFieldUpdate(store.selectedKey.legend, fieldName, lastValidValue)
        if (update) {
          store.updateKey(store.selectedKey.id, update)
        }
      }
      nextTick(() => {
        inputElement.value = lastValidValue
        inputElement.focus()
      })
    }
  }
}

// Enterキーで次のキーに移動し、同じ入力欄にフォーカス
function handleEnterKey(fieldName: string) {
  if (!store.selectedKey) return

  const inputElement = inputRefs.value[fieldName]
  if (!inputElement) return

  const rawValue = inputElement.value
  let isValid = true

  // Enterキーが押されたことをマーク
  isEnterPressed.value = true

  // フィールドタイプごとにバリデーションと更新を実行
  if (['x', 'y', 'width', 'height', 'rotation'].includes(fieldName)) {
    // 数値フィールド
    const result = processNumericField(fieldName, rawValue, { showError: true })
    if (!result.isValid) {
      isValid = false
      // バリデーションエラー時にストア内のキーデータも復元
      const lastValidValue = lastValidValues.value[fieldName]
      const update = getNumericFieldUpdate(fieldName, lastValidValue)
      if (update) {
        store.updateKey(store.selectedKey.id, update)
      }
    } else {
      const update = getNumericFieldUpdate(fieldName, rawValue)
      if (update) {
        store.updateKey(store.selectedKey.id, update)
      }
    }
  } else if (fieldName === 'row' || fieldName === 'col') {
    // マトリクスフィールド
    const update = getMatrixFieldUpdate(store.selectedKey.matrix, fieldName, rawValue)
    store.updateKey(store.selectedKey.id, update)
  } else if (fieldName === 'keycode') {
    // キーコードフィールド
    const update = getKeycodeFieldUpdate(store.selectedKey.keycodes, store.currentLayer, rawValue)
    store.updateKey(store.selectedKey.id, update)
  } else if (isLegendField(fieldName)) {
    // レジェンドフィールド
    const result = processTextField('legend', rawValue, { showError: true })
    if (!result.isValid) {
      isValid = false
      // バリデーションエラー時にストア内のキーデータも復元
      const lastValidValue = lastValidValues.value[fieldName]
      const update = getLegendFieldUpdate(store.selectedKey.legend, fieldName, lastValidValue)
      if (update) {
        store.updateKey(store.selectedKey.id, update)
      }
    } else {
      const update = getLegendFieldUpdate(store.selectedKey.legend, fieldName, rawValue)
      if (update) {
        store.updateKey(store.selectedKey.id, update)
      }
    }
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

  // 次のティックでフラグをリセット（blurイベントが発生した後に実行されるように）
  nextTick(() => {
    isEnterPressed.value = false
  })
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
  const result = processTextField('layoutName', title.value, { showError: true })
  if (result.isValid) {
    store.updateMetadata({ name: title.value })
  } else {
    // 無効な値の場合、ストアの値に戻す
    title.value = store.layout.name || ''
  }
}

function updateAuthor() {
  const result = processTextField('author', author.value, { showError: true })
  if (result.isValid) {
    store.updateMetadata({ author: author.value })
  } else {
    // 無効な値の場合、ストアの値に戻す
    author.value = store.layout.metadata?.author || ''
  }
}

function updateDescription() {
  const result = processTextField('description', description.value, { showError: true })
  if (result.isValid) {
    store.updateMetadata({ description: description.value })
  } else {
    // 無効な値の場合、ストアの値に戻す
    description.value = store.layout.metadata?.description || ''
  }
}

function updateLegendFont(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  store.setLegendFont(value ? value as LegendFont : undefined)
}

function formatDate(dateString?: string): string {
  if (!dateString) return t('propertyPanel.notSet')
  try {
    const date = new Date(dateString)
    // アプリの言語設定に従ってフォーマット
    return date.toLocaleString(locale.value, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return t('propertyPanel.invalidDate')
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
