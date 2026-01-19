/**
 * トースト通知のcomposable
 *
 * アプリケーション全体で共有されるトースト通知機能を提供します。
 * モジュールレベルでリアクティブな状態を保持し、どのコンポーネントからでも
 * トーストを表示できます。
 */
import { ref } from 'vue'

export type ToastType = 'success' | 'error'

// モジュールレベルで状態を共有（シングルトン）
const isVisible = ref(false)
const message = ref('')
const type = ref<ToastType>('success')

let timeoutId: ReturnType<typeof setTimeout> | null = null

/**
 * トースト通知を表示する
 * @param msg 表示するメッセージ
 * @param toastType トーストの種類（'success' | 'error'）
 * @param duration 表示時間（ミリ秒）
 */
export function showToast(msg: string, toastType: ToastType = 'success', duration = 3000): void {
  // 既存のタイマーをクリア
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  message.value = msg
  type.value = toastType
  isVisible.value = true

  timeoutId = setTimeout(() => {
    isVisible.value = false
    timeoutId = null
  }, duration)
}

/**
 * トーストを非表示にする
 */
export function hideToast(): void {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  isVisible.value = false
}

/**
 * トースト通知のcomposable
 */
export function useToast() {
  return {
    isVisible,
    message,
    type,
    showToast,
    hideToast
  }
}
