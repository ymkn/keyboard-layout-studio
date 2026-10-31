<template>
  <section class="w-full rounded-lg border border-gray-700 bg-gray-900/70 p-3 min-w-0" :aria-label="groupName(preview.group)" :data-preview-option="preview.group.index">
    <h3 class="font-semibold text-sm text-gray-200 mb-2 flex items-center gap-2">
      <span class="text-blue-300 text-xs">{{ preview.regions.map(region => region.id).join(' · ') }}</span>
      {{ groupName(preview.group) }}
    </h3>
    <div class="choice-grid">
      <button
        v-for="choice in preview.choices" :key="choice.index" type="button"
        :disabled="!interactive"
        :aria-label="t('layoutOptions.useAsReference', { name: `${groupName(preview.group)} / ${choiceName(preview.group, choice)}` })"
        :aria-pressed="preview.selectedChoice === choice.index"
        :class="['rounded border p-2 min-w-0 max-w-full text-left', preview.selectedChoice === choice.index ? 'border-blue-500 bg-blue-950/30' : 'border-gray-700 hover:border-gray-500']"
        :data-preview-choice="`${preview.group.index}:${choice.index}`"
        @click="$emit('select', preview.group.index, choice.index)"
      >
        <div class="text-xs text-gray-300 mb-2 flex items-center gap-2">
          <span :class="preview.selectedChoice === choice.index ? 'text-blue-300' : ''">{{ choiceName(preview.group, choice) }}</span>
          <i v-if="preview.selectedChoice === choice.index" class="fa-solid fa-check text-blue-300" aria-hidden="true"></i>
        </div>
        <div class="flex flex-wrap gap-2">
          <figure v-for="region in preview.regions" :key="region.id" class="max-w-full">
            <figcaption v-if="preview.regions.length > 1" class="text-xs text-blue-300 mb-1">{{ region.id }}</figcaption>
            <KeyboardPreviewSvg
              :keys="keysInRegion(choice.keys, region)" :context-keys="region.contextKeys" :bounds="region.bounds"
              :label="`${groupName(preview.group)} / ${choiceName(preview.group, choice)} / ${t('layoutOptions.region', { number: region.id })}`"
            />
          </figure>
        </div>
        <p v-if="choice.keys.length === 0" class="text-xs text-gray-500 text-center py-2">{{ t('layoutOptions.noKeys') }}</p>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Key } from '../types/keyboard'
import type { LayoutOptionPreviewGroup, LayoutOptionPreviewRegion } from '../utils/layout-options-preview'
import { getKeyPreviewBounds, previewBoundsIntersect } from '../utils/layout-options-preview'
import { useLayoutOptionNames } from '../composables/useLayoutOptionNames'
import KeyboardPreviewSvg from './KeyboardPreviewSvg.vue'

withDefaults(defineProps<{ preview: LayoutOptionPreviewGroup; interactive?: boolean }>(), { interactive: true })
defineEmits<{ select: [group: number, choice: number] }>()
const { t } = useI18n()
const { groupName, choiceName } = useLayoutOptionNames()

function keysInRegion(keys: Key[], region: LayoutOptionPreviewRegion): Key[] {
  return keys.filter(key => previewBoundsIntersect(getKeyPreviewBounds(key), region.bounds))
}
</script>

<style scoped>
.choice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr)); gap: 0.5rem; align-items: start; }
</style>
