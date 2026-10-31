<template>
  <details class="text-xs" :aria-label="t('layoutOptions.settings')">
    <summary class="cursor-pointer text-gray-400 hover:text-white py-1">{{ t('layoutOptions.settings') }}</summary>
    <div class="space-y-2 border border-gray-700 rounded p-2 mt-1">
      <label class="block text-gray-400">
        {{ t('layoutOptions.groupName') }}
        <input :value="name" @change="renameGroup" class="field mt-1" :aria-label="t('layoutOptions.groupName')" />
      </label>
      <p class="text-gray-400">{{ t(isToggle ? 'layoutOptions.checkbox' : 'layoutOptions.dropdown') }}</p>
      <template v-if="!isToggle">
        <div v-for="(choice, index) in choices" :key="index" class="flex gap-1">
          <input :value="choice" @change="renameChoice(index, $event)" class="field min-w-0" :aria-label="t('layoutOptions.choiceName', { number: index + 1 })" />
          <button v-if="choices.length > 2" type="button" @click="removeChoice(index)" class="text-gray-400 hover:text-red-400 px-1" :aria-label="t('layoutOptions.removeChoice', { name: choice })">×</button>
        </div>
        <button type="button" @click="addChoice" class="text-blue-300 hover:text-blue-200">+ {{ t('layoutOptions.addChoice') }}</button>
      </template>
      <button v-else type="button" @click="convertToDropdown" class="text-blue-300 hover:text-blue-200">{{ t('layoutOptions.convertToDropdown') }}</button>
      <button type="button" @click="removeGroup" :title="t('layoutOptions.removeHint')" class="text-red-400 hover:text-red-300">{{ t('layoutOptions.removeGroup') }}</button>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLayoutStore } from '../stores/layout'
import { useEditorStore } from '../stores/editor'

const props = defineProps<{ group: number }>()
const { t } = useI18n()
const layoutStore = useLayoutStore()
const editorStore = useEditorStore()
const definition = computed(() => layoutStore.layoutOptions[props.group])
const isToggle = computed(() => typeof definition.value === 'string')
const name = computed(() => typeof definition.value === 'string' ? definition.value : definition.value?.[0] ?? '')
const choices = computed(() => Array.isArray(definition.value) ? definition.value.slice(1) : [])

function updateDefinition(value: string | string[]) {
  layoutStore.setLayoutOptions(layoutStore.layoutOptions.map((entry, index) => index === props.group ? value : entry))
}

function renameGroup(event: Event) {
  const input = event.target as HTMLInputElement
  const next = input.value.trim()
  if (!next) { input.value = name.value; return }
  updateDefinition(isToggle.value ? next : [next, ...choices.value])
}

function renameChoice(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const next = input.value.trim()
  if (!next) { input.value = choices.value[index]; return }
  updateDefinition([name.value, ...choices.value.map((entry, item) => item === index ? next : entry)])
}

function addChoice() {
  updateDefinition([name.value, ...choices.value, t('layoutOptions.newChoice', { number: choices.value.length + 1 })])
}

function convertToDropdown() {
  updateDefinition([name.value, t('layoutOptions.off'), t('layoutOptions.on')])
}

function removeChoice(choice: number) {
  editorStore.resetLayoutOptionView()
  layoutStore.removeLayoutOptionChoice(props.group, choice)
}

function removeGroup() {
  editorStore.resetLayoutOptionView()
  layoutStore.removeLayoutOptionGroup(props.group)
}
</script>

<style scoped>
.field { @apply w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600; }
</style>
