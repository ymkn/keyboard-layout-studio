<template>
  <div
    v-if="show"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]"
    @click.self="onCancel"
  >
    <div class="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-bold text-white mb-4">
        <i class="fa-brands fa-github mr-2"></i>GitHubでログイン
      </h2>

      <p class="text-gray-300 mb-6">
        GitHubアカウントでログインすると、レイアウトをGistに保存できます。
      </p>

      <!-- OAuth Login Button -->
      <div class="mb-4">
        <button
          @click="onOAuthLogin"
          :disabled="loading"
          class="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
          <i v-else class="fa-brands fa-github mr-2"></i>
          {{ loading ? '認証中...' : 'GitHubでログイン' }}
        </button>
      </div>

      <!-- OAuth Error -->
      <div v-if="error" class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
        <i class="fa-solid fa-circle-exclamation mr-2"></i>{{ error }}
      </div>

      <!-- Note -->
      <p class="text-gray-500 text-xs mb-4">
        <i class="fa-solid fa-lock mr-1"></i>
        GitHubのOAuth認証を使用します。Gistの読み書き権限のみをリクエストします。
      </p>

      <!-- Actions -->
      <div class="flex justify-end">
        <button
          @click="onCancel"
          class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          :disabled="loading"
        >
          キャンセル
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { startOAuthFlow, isGitHubIntegrationConfigured, GITHUB_NOT_CONFIGURED_MESSAGE } from '../services/github'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  cancel: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)

async function onOAuthLogin() {
  if (!isGitHubIntegrationConfigured()) {
    error.value = GITHUB_NOT_CONFIGURED_MESSAGE
    return
  }
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID

  const basePath = window.location.pathname.replace(/\/$/, '')
  const redirectUri = `${window.location.origin}${basePath}/callback`

  try {
    loading.value = true
    const authUrl = startOAuthFlow(clientId, redirectUri)
    window.location.href = authUrl
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'OAuth認証の開始に失敗しました'
    setTimeout(() => error.value = null, 5000)
  } finally {
    loading.value = false
  }
}

function onCancel() {
  error.value = null
  emit('cancel')
}
</script>
