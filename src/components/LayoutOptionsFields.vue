<template>
  <div class="property-section">
    <h3 class="text-sm font-semibold text-gray-300 mb-2">{{ t('propertyPanel.layoutOptions') }}</h3>
    <div class="space-y-3">
      <div
        v-for="(row, index) in rows"
        :key="index"
        class="space-y-2 border border-gray-700 rounded p-2"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">#{{ index }}</span>
          <input
            type="text"
            :value="row.name"
            @change="updateRow(index, 'name', $event)"
            :placeholder="t('propertyPanel.layoutOptionGroupName')"
            class="flex-1 min-w-0 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
          />
          <button
            @click="removeGroup(index)"
            class="px-2 py-1 bg-gray-600 hover:bg-red-700 text-white rounded transition-colors text-xs"
          >
            {{ t('propertyPanel.layoutOptionRemoveGroup') }}
          </button>
        </div>
        <input
          type="text"
          :value="row.choices"
          @change="updateRow(index, 'choices', $event)"
          :placeholder="t('propertyPanel.layoutOptionChoices')"
          class="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
        />
      </div>
    </div>
    <button
      @click="addGroup"
      class="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
    >
      {{ t('propertyPanel.layoutOptionAddGroup') }}
    </button>
    <p class="text-xs text-gray-500 mt-2">{{ t('propertyPanel.layoutOptionsHint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LayoutOptionDefinition } from '../types/keyboard'
import { useLayoutStore } from '../stores/layout'

const { t } = useI18n()
const layoutStore = useLayoutStore()

/** 編集用に正規化したグループ行 */
interface LayoutOptionRow {
  name: string
  choices: string
}

const rows = computed<LayoutOptionRow[]>(() =>
  layoutStore.layoutOptions.map(definition =>
    typeof definition === 'string'
      ? { name: definition, choices: '' }
      : { name: definition[0], choices: definition.slice(1).join(', ') }
  )
)

function toDefinition(row: LayoutOptionRow): LayoutOptionDefinition {
  const choices = row.choices.split(',').map(choice => choice.trim()).filter(choice => choice !== '')
  return choices.length > 0 ? [row.name, ...choices] : row.name
}

function commit(nextRows: LayoutOptionRow[]) {
  layoutStore.setLayoutOptions(nextRows.map(toDefinition))
}

function updateRow(index: number, field: keyof LayoutOptionRow, event: Event) {
  const value = (event.target as HTMLInputElement).value
  commit(rows.value.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
}

function addGroup() {
  commit([...rows.value, { name: '', choices: '' }])
}

function removeGroup(index: number) {
  commit(rows.value.filter((_, i) => i !== index))
}
</script>
