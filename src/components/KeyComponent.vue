<template>
  <g :transform="transformString">
    <!-- 長方形の場合（既存のロジック） -->
    <template v-if="!keyData.shape || keyData.shape === 'rectangle'">
      <!-- キーのボディ -->
      <rect
        :width="width"
        :height="height"
        :class="[
          'key-body',
          isSelected ? 'fill-blue-500 stroke-blue-300' : 'fill-gray-700 stroke-gray-500'
        ]"
        :stroke-width="isSelected ? 3 : 2"
        rx="4"
      />

      <!-- キーのトップ面（立体感） -->
      <rect
        :x="padding"
        :y="padding"
        :width="width - padding * 2"
        :height="height - padding * 2"
        :class="[
          'key-top',
          isSelected ? 'fill-blue-400' : 'fill-gray-600'
        ]"
        rx="3"
      />
    </template>

    <!-- 円形の場合 -->
    <template v-else-if="keyData.shape === 'circle'">
      <!-- キーのボディ（外側の円） -->
      <ellipse
        :cx="width / 2"
        :cy="height / 2"
        :rx="(width - 8) / 2"
        :ry="(height - 8) / 2"
        :class="[
          'key-body',
          isSelected ? 'fill-blue-500 stroke-blue-300' : 'fill-gray-700 stroke-gray-500'
        ]"
        :stroke-width="isSelected ? 3 : 2"
      />

      <!-- キーのトップ面（内側の円） -->
      <ellipse
        :cx="width / 2"
        :cy="height / 2"
        :rx="(width - 16) / 2"
        :ry="(height - 16) / 2"
        :class="[
          'key-top',
          isSelected ? 'fill-blue-400' : 'fill-gray-600'
        ]"
      />
    </template>

    <!-- その他のプリセット形状（ISO Enter等） -->
    <template v-else>
      <!-- キーのボディ（カスタムパス） -->
      <path
        :d="shapePaths.bodyPath"
        :class="[
          'key-body',
          isSelected ? 'fill-blue-500 stroke-blue-300' : 'fill-gray-700 stroke-gray-500'
        ]"
        :stroke-width="isSelected ? 3 : 2"
      />

      <!-- キーのトップ面（カスタムパス） -->
      <path
        :d="shapePaths.topPath"
        :class="[
          'key-top',
          isSelected ? 'fill-blue-400' : 'fill-gray-600'
        ]"
      />
    </template>

    <!-- レジェンド表示モード -->
    <g v-if="displayMode === 'legend'" class="legends">
      <!-- 上段左 -->
      <foreignObject
        v-if="keyData.legend.topLeft"
        :x="padding * 2 + pathOffsetX"
        :y="padding + pathOffsetY"
        :width="width - padding * 4"
        :height="height"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSize}px`,
            fontFamily: legendFontFamily,
            color: '#e5e7eb',
            textAlign: 'left',
            wordBreak: 'break-all',
            overflow: 'visible',
            lineHeight: '1',
            margin: 0,
            padding: '0.1em 0 0 0.1em'
          }"
        >
          {{ keyData.legend.topLeft }}
        </div>
      </foreignObject>

      <!-- 上段中央 -->
      <foreignObject
        v-if="keyData.legend.topCenter"
        :x="padding * 2 + pathOffsetX"
        :y="padding + pathOffsetY"
        :width="width - padding * 4"
        :height="height"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSize}px`,
            fontFamily: legendFontFamily,
            color: '#e5e7eb',
            textAlign: 'center',
            wordBreak: 'break-all',
            overflow: 'visible',
            lineHeight: '1',
            margin: 0,
            padding: '0.1em 0 0 0'
          }"
        >
          {{ keyData.legend.topCenter }}
        </div>
      </foreignObject>

      <!-- 上段右 -->
      <foreignObject
        v-if="keyData.legend.topRight"
        :x="padding * 2 + pathOffsetX"
        :y="padding + pathOffsetY"
        :width="width - padding * 4"
        :height="height"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSize}px`,
            fontFamily: legendFontFamily,
            color: '#e5e7eb',
            textAlign: 'right',
            wordBreak: 'break-all',
            overflow: 'visible',
            lineHeight: '1',
            margin: 0,
            padding: '0.1em 0.1em 0 0'
          }"
        >
          {{ keyData.legend.topRight }}
        </div>
      </foreignObject>

      <!-- 中段左 -->
      <foreignObject
        v-if="keyData.legend.centerLeft"
        :x="padding * 2 + pathOffsetX"
        :y="height / 2 - fontSize / 2 + pathOffsetY"
        :width="width - padding * 4"
        :height="height"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSize}px`,
            fontFamily: legendFontFamily,
            color: '#e5e7eb',
            textAlign: 'left',
            wordBreak: 'break-all',
            overflow: 'visible',
            lineHeight: '1',
            margin: 0,
            padding: '0 0 0 0.1em'
          }"
        >
          {{ keyData.legend.centerLeft }}
        </div>
      </foreignObject>

      <!-- 中央（形状に応じて位置調整） -->
      <foreignObject
        v-if="keyData.legend.center"
        :x="padding * 2 + pathOffsetX"
        :y="height / 2 - fontSizeCenter / 2 + pathOffsetY"
        :width="width - padding * 4"
        :height="height"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSizeCenter}px`,
            fontFamily: legendFontFamily,
            color: 'white',
            textAlign: 'center',
            fontWeight: '600',
            wordBreak: 'break-all',
            overflow: 'visible',
            lineHeight: '1',
            margin: 0,
            padding: 0
          }"
        >
          {{ keyData.legend.center }}
        </div>
      </foreignObject>

      <!-- 中段右 -->
      <foreignObject
        v-if="keyData.legend.centerRight"
        :x="padding * 2 + pathOffsetX"
        :y="height / 2 - fontSize / 2 + pathOffsetY"
        :width="width - padding * 4"
        :height="height"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSize}px`,
            fontFamily: legendFontFamily,
            color: '#e5e7eb',
            textAlign: 'right',
            wordBreak: 'break-all',
            overflow: 'visible',
            lineHeight: '1',
            margin: 0,
            padding: '0 0.1em 0 0'
          }"
        >
          {{ keyData.legend.centerRight }}
        </div>
      </foreignObject>

      <!-- 下段左 -->
      <foreignObject
        v-if="keyData.legend.bottomLeft"
        :x="padding * 2 + pathOffsetX"
        :y="height - padding - fontSize - fontSize * 0.3 + pathOffsetY"
        :width="width - padding * 4"
        :height="height"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSize}px`,
            fontFamily: legendFontFamily,
            color: '#e5e7eb',
            textAlign: 'left',
            wordBreak: 'break-all',
            overflow: 'visible',
            lineHeight: '1',
            margin: 0,
            padding: '0 0 0.1em 0.1em'
          }"
        >
          {{ keyData.legend.bottomLeft }}
        </div>
      </foreignObject>

      <!-- 下段中央 -->
      <foreignObject
        v-if="keyData.legend.bottomCenter"
        :x="padding * 2 + pathOffsetX"
        :y="height - padding - fontSize - fontSize * 0.3 + pathOffsetY"
        :width="width - padding * 4"
        :height="height"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSize}px`,
            fontFamily: legendFontFamily,
            color: '#e5e7eb',
            textAlign: 'center',
            wordBreak: 'break-all',
            overflow: 'visible',
            lineHeight: '1',
            margin: 0,
            padding: '0 0 0.1em 0'
          }"
        >
          {{ keyData.legend.bottomCenter }}
        </div>
      </foreignObject>

      <!-- 下段右 -->
      <foreignObject
        v-if="keyData.legend.bottomRight"
        :x="padding * 2 + pathOffsetX"
        :y="height - padding - fontSize - fontSize * 0.3 + pathOffsetY"
        :width="width - padding * 4"
        :height="height"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSize}px`,
            fontFamily: legendFontFamily,
            color: '#e5e7eb',
            textAlign: 'right',
            wordBreak: 'break-all',
            overflow: 'visible',
            lineHeight: '1',
            margin: 0,
            padding: '0 0.1em 0.1em 0'
          }"
        >
          {{ keyData.legend.bottomRight }}
        </div>
      </foreignObject>
    </g>

    <!-- マトリクス表示モード -->
    <g v-else-if="displayMode === 'matrix'" class="matrix-info">
      <!-- マトリクス情報（上部中央） -->
      <foreignObject
        v-if="hasMatrixInfo"
        :x="padding * 2 + pathOffsetX"
        :y="padding + pathOffsetY"
        :width="width - padding * 4"
        :height="height * 0.4"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSizeMatrix}px`,
            color: '#fbbf24',
            textAlign: 'center',
            wordBreak: 'break-all',
            overflow: 'hidden',
            lineHeight: '1',
            margin: 0,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }"
        >
          R{{ keyData.matrix.row ?? '?' }}C{{ keyData.matrix.col ?? '?' }}
        </div>
      </foreignObject>

      <!-- キーコード（中央） -->
      <foreignObject
        v-if="keyData.keycodes?.[store.currentLayer]"
        :x="padding * 2 + pathOffsetX"
        :y="(hasMatrixInfo ? height * 0.4 : padding) + pathOffsetY"
        :width="width - padding * 4"
        :height="hasMatrixInfo ? height * 0.6 - padding : height - padding * 2"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSizeKeycode}px`,
            color: '#93c5fd',
            textAlign: 'center',
            fontFamily: 'monospace',
            fontWeight: '600',
            wordBreak: 'break-all',
            overflow: 'hidden',
            lineHeight: '1',
            margin: 0,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }"
        >
          {{ keycodeLabel }}
        </div>
      </foreignObject>

      <!-- マトリクス情報がない場合のメッセージ -->
      <foreignObject
        v-if="!hasMatrixInfo && !keyData.keycodes?.[store.currentLayer]"
        :x="padding * 2 + pathOffsetX"
        :y="padding + pathOffsetY"
        :width="width - padding * 4"
        :height="height - padding * 2"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          :style="{
            fontSize: `${fontSizeUnset}px`,
            color: '#6b7280',
            textAlign: 'center',
            wordBreak: 'break-all',
            overflow: 'hidden',
            lineHeight: '1',
            margin: 0,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }"
        >
          未設定
        </div>
      </foreignObject>
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Key } from '../types/keyboard'
import { getKeycodeLabel } from '../data/keycode-labels'
import { useKeyboardStore } from '../stores/keyboard'
import { generateShapePath, getLegendOffset } from '../data/shape-presets'
import { RENDERING } from '../constants/rendering'

interface Props {
  keyData: Key
  isSelected: boolean
}

const props = defineProps<Props>()
const store = useKeyboardStore()

const keyUnit = RENDERING.KEY_UNIT
const padding = RENDERING.KEY_PADDING
const baseFontSize = RENDERING.BASE_FONT_SIZE

// 各表示用の固定フォントサイズ
const fontSize = baseFontSize
const fontSizeCenter = baseFontSize // 中央レジェンド用
const fontSizeMatrix = baseFontSize * 0.9 // マトリクス情報用
const fontSizeKeycode = baseFontSize * 1.1 // キーコード用
const fontSizeUnset = baseFontSize * 0.8 // 未設定メッセージ用

const x = computed(() => props.keyData.x * keyUnit)
const y = computed(() => props.keyData.y * keyUnit)
const width = computed(() => props.keyData.width * keyUnit)
const height = computed(() => props.keyData.height * keyUnit)
const rotation = computed(() => props.keyData.rotation || 0)

// SVG transform文字列（回転はキーの中心を基準）
const transformString = computed(() => {
  const translatePart = `translate(${x.value}, ${y.value})`
  if (rotation.value === 0) {
    return translatePart
  }
  // rotate(angle, cx, cy) - キーの中心を基準に回転
  const cx = width.value / 2
  const cy = height.value / 2
  return `${translatePart} rotate(${rotation.value}, ${cx}, ${cy})`
})

const displayMode = computed(() => store.displayMode)

// 形状に応じたSVGパスを生成
const shapePaths = computed(() => {
  if (!props.keyData.shape || props.keyData.shape === 'rectangle' || props.keyData.shape === 'circle') {
    return { bodyPath: '', topPath: '' }
  }
  return generateShapePath(props.keyData.shape, width.value, height.value, padding)
})

// レジェンドの中央位置（形状に応じて調整）
const legendOffset = computed(() => {
  const shape = props.keyData.shape || 'rectangle'
  return getLegendOffset(shape, width.value, height.value)
})

// SVGパスのオフセット（デフォルトは0）
const pathOffsetX = computed(() => legendOffset.value.offsetX ?? 0)
const pathOffsetY = computed(() => legendOffset.value.offsetY ?? 0)

const hasMatrixInfo = computed(() => {
  return props.keyData.matrix.row !== undefined || props.keyData.matrix.col !== undefined
})

const keycodeLabel = computed(() => {
  const keycode = props.keyData.keycodes?.[store.currentLayer]
  if (!keycode) return ''
  return getKeycodeLabel(keycode, store.keyboardLayout)
})

const legendFontFamily = computed(() => {
  const font = store.layout.legendFont || 'Noto Sans JP'
  return `'${font}', sans-serif`
})
</script>

<style scoped>
.key-body {
  transition: all 0.2s;
}

.key-top {
  transition: all 0.2s;
}

text {
  user-select: none;
  pointer-events: none;
}
</style>
