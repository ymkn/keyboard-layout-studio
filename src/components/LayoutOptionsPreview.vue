<template>
  <div class="comparison p-4 bg-gray-900" :aria-label="t('layoutOptions.comparePreview')" data-layout-comparison>
    <div class="comparison-layout">
      <figure class="reference min-w-0 rounded-lg border border-gray-700 p-3 bg-gray-900 self-center" data-reference-layout>
        <figcaption class="text-sm font-semibold text-white text-center mb-3">{{ t('layoutOptions.referenceLayout') }}</figcaption>
        <KeyboardPreviewSvg :keys="comparison.referenceKeys" :bounds="comparison.referenceBounds" :markers="markers" :label="t('layoutOptions.referenceLayout')" />
        <p v-if="comparison.referenceKeys.length === 0" class="text-xs text-gray-500 text-center py-2">{{ t('layoutOptions.noKeys') }}</p>
        <div v-if="comparison.groups.length > 0" class="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3 text-xs text-gray-400">
          <span v-for="group in comparison.groups" :key="group.group.index">{{ selectedName(group) }}</span>
        </div>
      </figure>
      <div v-if="leftGroups.length > 0" class="alternatives left">
        <LayoutOptionPreviewGroup v-for="group in leftGroups" :key="group.group.index" :preview="group" :interactive="interactive" @select="selectChoice" />
      </div>
      <div v-if="rightGroups.length > 0" class="alternatives right">
        <LayoutOptionPreviewGroup v-for="group in rightGroups" :key="group.group.index" :preview="group" :interactive="interactive" @select="selectChoice" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LayoutOptionPreviewGroup as PreviewGroupData } from '../utils/layout-options-preview'
import { buildLayoutOptionsComparison } from '../utils/layout-options-preview'
import { useEditorStore } from '../stores/editor'
import { useLayoutStore } from '../stores/layout'
import { useLayoutOptionNames } from '../composables/useLayoutOptionNames'
import KeyboardPreviewSvg from './KeyboardPreviewSvg.vue'
import LayoutOptionPreviewGroup from './LayoutOptionPreviewGroup.vue'

const props = withDefaults(defineProps<{ interactive?: boolean }>(), { interactive: true })
const { t } = useI18n()
const editorStore = useEditorStore()
const layoutStore = useLayoutStore()
const { groupName, choiceName } = useLayoutOptionNames()
const comparison = computed(() => buildLayoutOptionsComparison(layoutStore.keys, editorStore.layoutOptionGroups, editorStore.previewChoices))
const markers = computed(() => comparison.value.groups.flatMap(group => group.regions))
const leftGroups = computed(() => comparison.value.groups.filter(group => group.side === 'left'))
const rightGroups = computed(() => comparison.value.groups.filter(group => group.side === 'right'))

function selectedName(group: PreviewGroupData): string {
  const choice = group.choices.find(item => item.index === group.selectedChoice)
  return choice ? `${groupName(group.group)}: ${choiceName(group.group, choice)}` : groupName(group.group)
}

function selectChoice(group: number, choice: number) {
  if (props.interactive) editorStore.setPreviewChoice(group, choice)
}
</script>

<style scoped>
.comparison { container-type: inline-size; }
.comparison-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; }
.reference { grid-row: 1; }
.alternatives { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.75rem; min-width: 0; }
@container (min-width: 1000px) {
  .comparison-layout { grid-template-columns: minmax(12rem, 1fr) minmax(0, 3fr) minmax(12rem, 1fr); }
  .reference { grid-column: 2; grid-row: 1; }
  .left { grid-column: 1; grid-row: 1; }
  .right { grid-column: 3; grid-row: 1; }
}
</style>
