import { createI18n } from 'vue-i18n'
import { STORAGE_KEYS } from '../constants/storage'
import ja from './locales/ja'
import en from './locales/en'

export type SupportedLocale = 'ja' | 'en'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['ja', 'en']

/**
 * ブラウザの言語設定から適切なロケールを取得
 */
function detectBrowserLocale(): SupportedLocale {
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale
  }
  // デフォルトは日本語
  return 'ja'
}

/**
 * 保存された言語設定を取得
 */
function getStoredLocale(): SupportedLocale | null {
  const stored = localStorage.getItem(STORAGE_KEYS.LOCALE)
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale
  }
  return null
}

/**
 * 初期ロケールを決定
 */
function getInitialLocale(): SupportedLocale {
  return getStoredLocale() || detectBrowserLocale()
}

export const i18n = createI18n({
  legacy: false, // Composition API を使用
  locale: getInitialLocale(),
  fallbackLocale: 'ja',
  messages: {
    ja,
    en,
  },
})

export default i18n
