<template>
  <aside class="w-80 flex-shrink-0 min-h-0 flex flex-col bg-gray-800 border-l border-gray-700">
    <div role="tablist" :aria-label="t('sidebar.title')" class="grid grid-cols-[1fr_1.6fr] shrink-0 border-b border-gray-700">
      <button
        :id="`${id}-properties-tab`" ref="propertiesTabRef" type="button" role="tab"
        :aria-selected="editorStore.sidebarTab === 'properties'" :aria-controls="`${id}-properties-panel`"
        :tabindex="editorStore.sidebarTab === 'properties' ? 0 : -1"
        :class="['tab', editorStore.sidebarTab === 'properties' ? 'active' : 'inactive']"
        @click="editorStore.setSidebarTab('properties')"
        @keydown.left.prevent="focusTab('layoutOptions')" @keydown.right.prevent="focusTab('layoutOptions')"
        @keydown.home.prevent="focusTab('properties')" @keydown.end.prevent="focusTab('layoutOptions')"
      >{{ t('propertyPanel.properties') }}</button>
      <button
        :id="`${id}-options-tab`" ref="optionsTabRef" type="button" role="tab"
        :aria-selected="editorStore.sidebarTab === 'layoutOptions'" :aria-controls="`${id}-options-panel`"
        :tabindex="editorStore.sidebarTab === 'layoutOptions' ? 0 : -1"
        :class="['tab', editorStore.sidebarTab === 'layoutOptions' ? 'active' : 'inactive']"
        @click="editorStore.setSidebarTab('layoutOptions')"
        @keydown.left.prevent="focusTab('properties')" @keydown.right.prevent="focusTab('properties')"
        @keydown.home.prevent="focusTab('properties')" @keydown.end.prevent="focusTab('layoutOptions')"
      >{{ t('layoutOptions.title') }}</button>
    </div>
    <div
      v-show="editorStore.sidebarTab === 'properties'" :id="`${id}-properties-panel`"
      role="tabpanel" :aria-labelledby="`${id}-properties-tab`" class="flex-1 min-h-0 overflow-auto"
    >
      <div v-if="editorStore.layoutOptionPreview" class="p-4 space-y-3">
        <p class="text-sm text-gray-400">{{ t('sidebar.previewActive') }}</p>
        <button type="button" @click="editorStore.setLayoutOptionPreview(false)" class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">{{ t('sidebar.returnToEditing') }}</button>
      </div>
      <PropertyPanel v-show="!editorStore.layoutOptionPreview" active-tab="layout" />
    </div>
    <div
      v-show="editorStore.sidebarTab === 'layoutOptions'" :id="`${id}-options-panel`"
      role="tabpanel" :aria-labelledby="`${id}-options-tab`" class="flex-1 min-h-0 overflow-auto"
    >
      <LayoutOptionsPanel />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SidebarTabType } from '../stores/editor'
import { useEditorStore } from '../stores/editor'
import PropertyPanel from './PropertyPanel.vue'
import LayoutOptionsPanel from './LayoutOptionsPanel.vue'

const { t } = useI18n()
const editorStore = useEditorStore()
const id = useId()
const propertiesTabRef = ref<HTMLButtonElement | null>(null)
const optionsTabRef = ref<HTMLButtonElement | null>(null)

function focusTab(tab: SidebarTabType) {
  editorStore.setSidebarTab(tab)
  const target = tab === 'properties' ? propertiesTabRef.value : optionsTabRef.value
  target?.focus()
}
</script>

<style scoped>
.tab { @apply text-sm font-medium py-3 px-2 border-b-2 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400; }
.active { @apply text-white border-blue-400 bg-gray-700/40; }
.inactive { @apply text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-700/30; }
</style>
