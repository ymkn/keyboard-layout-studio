<template>
  <select
    :value="currentLocale"
    @change="handleChange"
    class="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 hover:bg-gray-600 transition-colors text-sm"
  >
    <option v-for="locale in availableLocales" :key="locale" :value="locale">
      {{ getLocaleLabel(locale) }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { useLocale } from '../composables/useLocale'
import type { SupportedLocale } from '../i18n'

const { currentLocale, availableLocales, setLocale } = useLocale()

function getLocaleLabel(locale: SupportedLocale): string {
  const labels: Record<SupportedLocale, string> = {
    ja: '🇯🇵 日本語',
    en: '🇺🇸 English',
  }
  return labels[locale]
}

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  setLocale(target.value as SupportedLocale)
}
</script>
