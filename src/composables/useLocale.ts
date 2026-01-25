import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { STORAGE_KEYS } from '../constants/storage'
import { SUPPORTED_LOCALES, type SupportedLocale } from '../i18n'
import { showToast } from './useToast'

/**
 * 言語切り替え用 Composable
 */
export function useLocale() {
  const { t, locale } = useI18n()

  const currentLocale = computed({
    get: () => locale.value as SupportedLocale,
    set: (value: SupportedLocale) => {
      locale.value = value
      try {
        localStorage.setItem(STORAGE_KEYS.LOCALE, value)
      } catch {
        // localStorage容量不足エラー
        showToast(t('toast.localStorageError'), 'error', 5000)
      }
    },
  })

  const availableLocales = SUPPORTED_LOCALES

  function setLocale(newLocale: SupportedLocale) {
    currentLocale.value = newLocale
  }

  return {
    currentLocale,
    availableLocales,
    setLocale,
  }
}
