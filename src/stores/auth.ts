/**
 * 認証ストア
 *
 * GitHub認証情報とレイアウトのソース/保存先を管理
 * GitHub認証情報はLocalStorageに永続化される
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StorageSource, GitHubAuth } from '../types/github'
import { STORAGE_KEYS } from '../constants/storage'
import { i18n } from '../i18n'
import { showToast } from '../composables/useToast'

export const useAuthStore = defineStore('auth', () => {
  // State
  const githubAuth = ref<GitHubAuth | null>(null)
  const layoutSource = ref<StorageSource>('new')
  const layoutGistId = ref<string | null>(null)
  const layoutGistFileKey = ref<string | null>(null)
  const saveDestination = ref<'local' | 'gist'>('local')

  // Getters
  const isLoggedIn = computed(() => githubAuth.value !== null)
  const username = computed(() => githubAuth.value?.username || null)
  const avatarUrl = computed(() => githubAuth.value?.avatarUrl || null)
  const token = computed(() => githubAuth.value?.token || null)

  // Actions
  function setGitHubAuth(auth: GitHubAuth | null) {
    githubAuth.value = auth
    try {
      if (auth) {
        localStorage.setItem(STORAGE_KEYS.GITHUB_AUTH, JSON.stringify(auth))
      } else {
        localStorage.removeItem(STORAGE_KEYS.GITHUB_AUTH)
      }
    } catch {
      // localStorage容量不足エラー
      showToast(i18n.global.t('toast.localStorageError'), 'error', 5000)
    }
  }

  function loadGitHubAuth() {
    const stored = localStorage.getItem(STORAGE_KEYS.GITHUB_AUTH)
    if (stored) {
      try {
        githubAuth.value = JSON.parse(stored)
      } catch {
        githubAuth.value = null
      }
    }
  }

  function logoutGitHub() {
    setGitHubAuth(null)
    // Gistから読み込んだレイアウトの場合、ソースをローカルに変更
    if (layoutSource.value === 'gist') {
      clearLayoutSource()
    }
    // 保存先もローカルに
    saveDestination.value = 'local'
  }

  function setLayoutSource(source: StorageSource, gistId?: string, fileKey?: string) {
    layoutSource.value = source
    layoutGistId.value = gistId || null
    layoutGistFileKey.value = fileKey || null
    // ソースに応じて保存先も連動
    if (source === 'local' || source === 'gist') {
      saveDestination.value = source
    }
  }

  function clearLayoutSource() {
    layoutSource.value = 'local'
    layoutGistId.value = null
    layoutGistFileKey.value = null
    saveDestination.value = 'local'
  }

  function setSaveDestination(dest: 'local' | 'gist') {
    saveDestination.value = dest
  }

  function resetToNew() {
    layoutSource.value = 'new'
    layoutGistId.value = null
    layoutGistFileKey.value = null
  }

  return {
    // State
    githubAuth,
    layoutSource,
    layoutGistId,
    layoutGistFileKey,
    saveDestination,
    // Getters
    isLoggedIn,
    username,
    avatarUrl,
    token,
    // Actions
    setGitHubAuth,
    loadGitHubAuth,
    logoutGitHub,
    setLayoutSource,
    clearLayoutSource,
    setSaveDestination,
    resetToNew
  }
})
