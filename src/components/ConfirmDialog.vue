<template>
  <div
    v-if="show"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]"
    @click.self="onCancel"
  >
    <div class="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-bold text-white mb-4">{{ title }}</h2>
      <p class="text-gray-300 mb-6">{{ message }}</p>
      <div class="flex gap-3 justify-end">
        <button
          @click="onCancel"
          class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          @click="onConfirm"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>
