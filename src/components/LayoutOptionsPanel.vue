<template>
  <section class="p-4 border-b border-gray-700" :aria-label="t('layoutOptions.title')">
    <h2 class="sr-only">{{ t('layoutOptions.title') }} (Vial)</h2>
    <div class="flex bg-gray-900 rounded p-1 my-3 gap-1">
      <button type="button" @click="editorStore.setLayoutOptionPreview(false)" :aria-pressed="!editorStore.layoutOptionPreview" :class="['mode', !editorStore.layoutOptionPreview && 'bg-blue-600 text-white']">{{ t('layoutOptions.editMode') }}</button>
      <button type="button" @click="editorStore.setLayoutOptionPreview(true)" :aria-pressed="editorStore.layoutOptionPreview" :class="['mode', editorStore.layoutOptionPreview && 'bg-blue-600 text-white']">{{ t('layoutOptions.previewMode') }}</button>
    </div>
    <div v-if="editorStore.layoutOptionPreview" class="flex justify-end mb-3">
      <div role="group" :aria-label="t('layoutOptions.previewDisplay')" class="inline-flex gap-0.5 rounded border border-gray-600 bg-gray-800 p-0.5">
        <button type="button" @click="editorStore.setLayoutOptionPreviewMode('single')" :aria-label="t('layoutOptions.singlePreview')" :title="t('layoutOptions.singlePreview')" :aria-pressed="editorStore.layoutOptionPreviewMode === 'single'" :class="['submode', editorStore.layoutOptionPreviewMode === 'single' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200']">{{ t('layoutOptions.singlePreviewShort') }}</button>
        <button type="button" @click="editorStore.setLayoutOptionPreviewMode('compare')" :aria-label="t('layoutOptions.comparePreview')" :title="t('layoutOptions.comparePreview')" :aria-pressed="editorStore.layoutOptionPreviewMode === 'compare'" :class="['submode', editorStore.layoutOptionPreviewMode === 'compare' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200']">{{ t('layoutOptions.comparePreviewShort') }}</button>
      </div>
    </div>
    <div class="space-y-2">
      <div :class="['layer-row', isActive(null) && !editorStore.layoutOptionPreview && 'active']">
        <button v-if="!editorStore.layoutOptionPreview" type="button" @click="editorStore.toggleLayoutOptionVisibility(null)" :aria-label="t('layoutOptions.visibility', { name: t('layoutOptions.common') })" :aria-pressed="isVisible(null)" class="eye">
          <i :class="isVisible(null) ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" aria-hidden="true"></i>
        </button>
        <button type="button" @click="activate(null)" :disabled="editorStore.layoutOptionPreview" class="flex-1 text-left py-2 truncate" :aria-pressed="isActive(null)">{{ t('layoutOptions.common') }}</button>
        <span class="text-gray-500 text-xs px-1">{{ keyCount(null) }}</span>
        <span v-if="isActive(null) && !editorStore.layoutOptionPreview" class="text-xs text-blue-300">{{ t('layoutOptions.editing') }}</span>
      </div>
      <div v-for="group in editorStore.layoutOptionGroups" :key="group.index" class="border border-gray-700 rounded p-2">
        <h3 class="text-sm font-semibold text-gray-200 mb-1 truncate"><i class="fa-regular fa-folder text-gray-500 mr-2" aria-hidden="true"></i>{{ groupName(group) }}</h3>
        <p v-if="!group.defined" class="text-xs text-amber-300 mb-1">{{ t('layoutOptions.undefined') }}</p>
        <div v-for="choice in group.choices" :key="choice.index" :class="['layer-row ml-2', isActive(option(group.index, choice.index)) && !editorStore.layoutOptionPreview && 'active']">
          <input v-if="editorStore.layoutOptionPreview" type="radio" :name="`layout-preview-${group.index}`" :checked="previewChoice(group.index) === choice.index" @change="editorStore.setPreviewChoice(group.index, choice.index)" :aria-label="targetName(option(group.index, choice.index))" class="mx-2" />
          <button v-else type="button" @click="editorStore.toggleLayoutOptionVisibility(option(group.index, choice.index))" :aria-label="t('layoutOptions.visibility', { name: targetName(option(group.index, choice.index)) })" :aria-pressed="isVisible(option(group.index, choice.index))" class="eye">
            <i :class="isVisible(option(group.index, choice.index)) ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" aria-hidden="true"></i>
          </button>
          <button type="button" @click="activate(option(group.index, choice.index))" class="flex-1 text-left py-2 truncate" :title="targetName(option(group.index, choice.index))" :aria-pressed="editorStore.layoutOptionPreview ? previewChoice(group.index) === choice.index : isActive(option(group.index, choice.index))">{{ choiceName(group, choice) }}</button>
          <span class="text-gray-500 text-xs px-1">{{ keyCount(option(group.index, choice.index)) }}</span>
          <span v-if="isActive(option(group.index, choice.index)) && !editorStore.layoutOptionPreview" class="text-xs text-blue-300">{{ t('layoutOptions.editing') }}</span>
        </div>
        <LayoutOptionGroupFields v-if="group.defined && !editorStore.layoutOptionPreview" :group="group.index" />
      </div>
    </div>

    <template v-if="!editorStore.layoutOptionPreview">
      <p class="text-xs text-blue-200 bg-blue-950/40 rounded p-2 mt-3 break-words">{{ t('layoutOptions.addTarget', { name: targetName(editorStore.activeLayoutOption) }) }}</p>
      <form @submit.prevent="addGroup" class="mt-3 space-y-2">
        <label class="block text-xs text-gray-400">{{ t('layoutOptions.newGroup') }}
          <input v-model="newGroupName" :placeholder="t('layoutOptions.groupExample')" class="field mt-1" :aria-label="t('layoutOptions.newGroup')" />
        </label>
        <div class="flex gap-2">
          <select v-model="newGroupType" :aria-label="t('layoutOptions.controlType')" class="field flex-1 min-w-0">
            <option value="toggle">{{ t('layoutOptions.checkbox') }}</option>
            <option value="choices">{{ t('layoutOptions.dropdown') }}</option>
          </select>
          <button type="submit" :disabled="!newGroupName.trim()" class="px-3 py-1 rounded bg-blue-600 text-white text-xs disabled:opacity-40">{{ t('layoutOptions.add') }}</button>
        </div>
      </form>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KeyLayoutOption } from '../types/keyboard'
import { useEditorStore } from '../stores/editor'
import { useLayoutStore } from '../stores/layout'
import { layoutOptionId } from '../utils/layout-options'
import { useLayoutOptionNames } from '../composables/useLayoutOptionNames'
import LayoutOptionGroupFields from './LayoutOptionGroupFields.vue'

const { t } = useI18n()
const editorStore = useEditorStore()
const layoutStore = useLayoutStore()
const { groupName, choiceName, targetName } = useLayoutOptionNames()
const newGroupName = ref('')
const newGroupType = ref<'toggle' | 'choices'>('toggle')

function option(group: number, choice: number): KeyLayoutOption { return { group, choice } }
function isActive(target: KeyLayoutOption | null): boolean {
  return layoutOptionId(target) === layoutOptionId(editorStore.activeLayoutOption)
}
function isVisible(target: KeyLayoutOption | null): boolean {
  return !editorStore.hiddenLayoutOptions.includes(layoutOptionId(target))
}
function keyCount(target: KeyLayoutOption | null): number {
  return layoutStore.keys.filter(key => layoutOptionId(key.layoutOption) === layoutOptionId(target)).length
}
function previewChoice(group: number): number {
  return editorStore.previewChoices[group] ?? editorStore.layoutOptionGroups.find(item => item.index === group)?.choices[0]?.index ?? 0
}
function activate(target: KeyLayoutOption | null) {
  if (editorStore.layoutOptionPreview) {
    if (target) editorStore.setPreviewChoice(target.group, target.choice)
  } else {
    editorStore.setActiveLayoutOption(target)
  }
}
function addGroup() {
  const name = newGroupName.value.trim()
  if (!name) return
  const group = layoutStore.layoutOptions.length
  layoutStore.setLayoutOptions([...layoutStore.layoutOptions,
    newGroupType.value === 'toggle' ? name : [name,
      t('layoutOptions.newChoice', { number: 1 }), t('layoutOptions.newChoice', { number: 2 })]
  ])
  editorStore.setActiveLayoutOption({ group, choice: 0 })
  newGroupName.value = ''
}
</script>

<style scoped>
.mode { @apply flex-1 text-xs text-gray-300 py-1.5 rounded transition-colors; }
.submode { @apply text-[11px] whitespace-nowrap px-2 py-1 rounded-sm transition-colors; }
.layer-row { @apply flex items-center gap-1 rounded px-1 text-sm text-gray-300; }
.active { @apply bg-blue-950/60 ring-1 ring-blue-500/60 text-white; }
.eye { @apply w-7 shrink-0 text-gray-400 hover:text-blue-300; }
.field { @apply w-full px-2 py-1.5 bg-gray-700 text-white rounded border border-gray-600 text-xs; }
</style>
