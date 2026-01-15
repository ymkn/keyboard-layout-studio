<template>
  <div class="flex items-center gap-2">
    <img
      v-if="auth.avatarUrl"
      :src="auth.avatarUrl"
      :alt="auth.username"
      class="w-6 h-6 rounded-full"
    />
    <span class="text-sm text-gray-300">{{ auth.username }}</span>
    <button
      @click="$emit('logout')"
      class="text-gray-400 hover:text-white transition-colors"
      title="ログアウト"
    >
      <i class="fa-solid fa-right-from-bracket"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { GitHubAuth } from '../types/github'

defineProps<{
  auth: GitHubAuth
}>()

defineEmits<{
  logout: []
}>()
</script>
