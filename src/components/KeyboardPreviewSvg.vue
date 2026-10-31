<template>
  <svg
    :viewBox="`${bounds.x * unit} ${bounds.y * unit} ${width} ${height}`"
    :width="width"
    :height="height"
    :style="{ maxWidth: `${width}px` }"
    class="block w-full h-auto mx-auto pointer-events-none"
    role="img"
    :aria-label="label"
  >
    <defs>
      <clipPath :id="clipId">
        <rect :x="bounds.x * unit" :y="bounds.y * unit" :width="width" :height="height" />
      </clipPath>
    </defs>
    <g :clip-path="`url(#${clipId})`">
      <g v-for="key in contextKeys" :key="`context-${key.id}`" opacity="0.2" data-preview-context>
        <KeyComponent :key-data="key" :is-selected="false" />
      </g>
      <g v-for="key in keys" :key="key.id" :data-preview-key="key.id">
        <KeyComponent :key-data="key" :is-selected="false" />
      </g>
      <g v-for="marker in markers" :key="marker.id" class="text-blue-300">
        <rect
          :x="marker.bounds.x * unit" :y="marker.bounds.y * unit"
          :width="marker.bounds.width * unit" :height="marker.bounds.height * unit"
          fill="rgba(59, 130, 246, 0.06)" stroke="#60a5fa" stroke-width="1" stroke-dasharray="4 3"
          :data-preview-region="marker.id"
        />
        <text
          :x="(marker.bounds.x + markerOffset) * unit" :y="(marker.bounds.y + markerOffset) * unit"
          dominant-baseline="hanging" fill="#bfdbfe" :font-size="markerFontSize" font-weight="600"
          stroke="#111827" stroke-width="3" paint-order="stroke"
        >{{ marker.id }}</text>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import type { Key } from '../types/keyboard'
import type { LayoutOptionPreviewRegion, PreviewBounds } from '../utils/layout-options-preview'
import { RENDERING, LAYOUT_OPTION_PREVIEW } from '../constants/rendering'
import KeyComponent from './KeyComponent.vue'

const props = withDefaults(defineProps<{
  keys: Key[]
  bounds: PreviewBounds
  label: string
  contextKeys?: Key[]
  markers?: LayoutOptionPreviewRegion[]
}>(), { contextKeys: () => [], markers: () => [] })
const unit = RENDERING.KEY_UNIT
const markerOffset = LAYOUT_OPTION_PREVIEW.MARKER_OFFSET
const markerFontSize = LAYOUT_OPTION_PREVIEW.MARKER_FONT_SIZE
const clipId = `preview-clip-${useId()}`
const width = computed(() => props.bounds.width * unit)
const height = computed(() => props.bounds.height * unit)
</script>
