<template>
  <div class="border-b border-gray-700 pb-4 mb-4" v-if="editorStore.selectedKeyIds.length > 0 && editorStore.layoutOptionGroups.length > 0">
    <label class="text-sm font-semibold text-gray-300 block">
      {{ t('layoutOptions.membership') }}
      <select :value="destination" @change="changeDestination" :aria-label="t('layoutOptions.membership')" class="w-full mt-2 px-2 py-1.5 bg-gray-700 text-white rounded border border-gray-600 text-sm">
        <option value="common">{{ t('layoutOptions.common') }}</option>
        <optgroup v-for="group in editorStore.layoutOptionGroups" :key="group.index" :label="groupName(group)">
          <option v-for="choice in group.choices" :key="choice.index" :value="`${group.index}:${choice.index}`">{{ choiceName(group, choice) }}</option>
        </optgroup>
      </select>
    </label>
    <div class="flex gap-2 mt-2">
      <button type="button" @click="apply(false)" :disabled="sameDestination" class="action bg-blue-600 disabled:opacity-40">{{ t('layoutOptions.moveSelection') }}</button>
      <button type="button" @click="apply(true)" :disabled="sameDestination" class="action bg-gray-600 disabled:opacity-40">{{ t('layoutOptions.copySelection') }}</button>
    </div>
    <p class="text-xs text-gray-500 mt-2">{{ t('layoutOptions.assignmentHint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KeyLayoutOption } from '../types/keyboard'
import { useEditorStore } from '../stores/editor'
import { useLayoutStore } from '../stores/layout'
import { layoutOptionId } from '../utils/layout-options'
import { useLayoutOptionNames } from '../composables/useLayoutOptionNames'

const { t } = useI18n()
const editorStore = useEditorStore()
const layoutStore = useLayoutStore()
const { groupName, choiceName } = useLayoutOptionNames()
const destination = ref(layoutOptionId(editorStore.activeLayoutOption))
const sameDestination = computed(() => destination.value === layoutOptionId(editorStore.activeLayoutOption))
watch(() => editorStore.activeLayoutOption, option => { destination.value = layoutOptionId(option) })

function changeDestination(event: Event) {
  destination.value = (event.target as HTMLSelectElement).value
}

function apply(duplicate: boolean) {
  if (sameDestination.value) return
  const [group, choice] = destination.value.split(':').map(Number)
  const option: KeyLayoutOption | null = destination.value === 'common' ? null : { group, choice }
  const ids = [...editorStore.selectedKeyIds]
  const selectedIds = duplicate ? layoutStore.duplicateKeysToLayoutOption(ids, option) : ids
  if (!duplicate) layoutStore.assignKeysToLayoutOption(ids, option)
  editorStore.setActiveLayoutOption(option)
  editorStore.selectMultipleKeys(selectedIds)
}
</script>

<style scoped>
.action { @apply flex-1 text-xs text-white px-2 py-2 rounded; }
</style>
