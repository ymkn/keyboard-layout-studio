<template>
  <div class="property-section">
    <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.rotationCenter') }}</h3>
    <div class="flex gap-2">
      <label v-for="axis in axes" :key="axis" class="flex-1 min-w-0 text-sm text-gray-400">
        {{ axis.toUpperCase() }}
        <input
          type="number"
          :value="layoutStore.rotationCenter[axis]"
          min="0"
          :max="axis === 'x' ? APP_CONFIG.MAX_KEY_X : APP_CONFIG.MAX_KEY_Y"
          :step="APP_CONFIG.MOVE_STEP"
          class="mt-1 w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
          @change="updateCoordinate(axis, $event)"
          @keydown.enter="blurInput"
        />
      </label>
    </div>
    <p class="text-xs text-gray-500 mt-2 whitespace-pre-line">{{ t('propertyPanel.rotationCenterHint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { APP_CONFIG } from '../constants/app-config'
import { useLayoutStore } from '../stores/layout'
import { showToast } from '../composables/useToast'

const { t } = useI18n()
const layoutStore = useLayoutStore()
const axes = ['x', 'y'] as const

function updateCoordinate(axis: 'x' | 'y', event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.valueAsNumber
  const max = axis === 'x' ? APP_CONFIG.MAX_KEY_X : APP_CONFIG.MAX_KEY_Y
  if (!Number.isFinite(value) || value < 0 || value > max) {
    input.value = String(layoutStore.rotationCenter[axis])
    showToast(t('propertyPanel.rotationCenterInvalid', { axis: axis.toUpperCase(), max }), 'error')
    return
  }
  layoutStore.setRotationCenter({ ...layoutStore.rotationCenter, [axis]: value })
}

function blurInput(event: KeyboardEvent) {
  (event.target as HTMLInputElement).blur()
}
</script>
