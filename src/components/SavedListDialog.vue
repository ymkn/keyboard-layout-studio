<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
      <div class="p-6 border-b border-gray-700">
        <h2 class="text-xl font-bold text-white">{{ t('dialogs.openLayout.title') }}</h2>
      </div>

      <!-- タブ -->
      <div class="flex border-b border-gray-700">
        <button
          @click="activeTab = 'local'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'local'
              ? 'text-white border-b-2 border-blue-500 bg-gray-700'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          ]"
        >
          <i class="fa-solid fa-hard-drive mr-2"></i>
          {{ t('dialogs.openLayout.tabLocal') }}
          <span class="ml-2 px-2 py-0.5 bg-gray-600 rounded text-xs">{{ localItems.length }}</span>
        </button>
        <button
          @click="activeTab = 'gist'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'gist'
              ? 'text-white border-b-2 border-blue-500 bg-gray-700'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          ]"
        >
          <i class="fa-brands fa-github mr-2"></i>
          {{ t('dialogs.openLayout.tabGist') }}
          <span v-if="isLoggedIn" class="ml-2 px-2 py-0.5 bg-gray-600 rounded text-xs">{{ gistItems.length }}</span>
        </button>
        <button
          @click="activeTab = 'preset'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'preset'
              ? 'text-white border-b-2 border-blue-500 bg-gray-700'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          ]"
        >
          <i class="fa-solid fa-shapes mr-2"></i>
          {{ t('dialogs.openLayout.tabPreset') }}
          <span class="ml-2 px-2 py-0.5 bg-gray-600 rounded text-xs">{{ presets.length }}</span>
        </button>
      </div>

      <div class="flex-1 overflow-auto p-6">
        <!-- プリセットタブ -->
        <template v-if="activeTab === 'preset'">
          <div v-if="presets.length === 0" class="text-center py-8">
            <div class="text-gray-400">{{ t('dialogs.openLayout.noPresets') }}</div>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="preset in presets"
              :key="preset.id"
              @click="$emit('select-preset', preset)"
              class="bg-gray-700 rounded p-4 hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div class="flex items-start">
                <div class="flex-1 min-w-0">
                  <h3 class="text-white font-semibold truncate">{{ preset.name }}</h3>
                  <p v-if="preset.description" class="text-gray-400 text-sm mt-1">
                    {{ preset.description }}
                  </p>
                </div>
                <div class="ml-4 flex-shrink-0">
                  <span class="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                    <i class="fa-solid fa-shapes mr-1"></i>
                    {{ t('dialogs.openLayout.template') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ローカルタブ -->
        <template v-else-if="activeTab === 'local'">
          <div v-if="loading" class="text-center py-8">
            <div class="text-gray-400">{{ t('common.loading') }}</div>
          </div>

          <div v-else-if="localItems.length === 0" class="text-center py-8">
            <div class="text-gray-400">{{ t('dialogs.openLayout.noLocalLayouts') }}</div>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="item in localItems"
              :key="item.id"
              @click="$emit('select', item)"
              class="bg-gray-700 rounded p-4 hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <h3 class="text-white font-semibold truncate">{{ item.filename }}</h3>
                  <p v-if="item.description" class="text-gray-400 text-sm mt-1">
                    {{ item.description }}
                  </p>
                  <p class="text-gray-500 text-xs mt-2">
                    {{ t('dialogs.openLayout.updatedAt') }} {{ formatDate(item.updatedAt) }}
                  </p>
                </div>
                <div class="flex gap-2 ml-4">
                  <button
                    @click.stop="$emit('delete', item)"
                    class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    :title="t('common.delete')"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Gistタブ -->
        <template v-else>
          <!-- GitHub連携未設定時 -->
          <div v-if="!isGitHubConfigured" class="text-center py-8">
            <div class="text-gray-400 mb-4">
              <i class="fa-solid fa-circle-exclamation text-4xl mb-4 block text-yellow-500"></i>
              {{ t('github.notConfigured') }}
            </div>
          </div>
          <!-- 未ログイン時 -->
          <div v-else-if="!isLoggedIn" class="text-center py-8">
            <div class="text-gray-400 mb-4 whitespace-pre-line">
              <i class="fa-brands fa-github text-4xl mb-4 block"></i>
              {{ t('dialogs.openLayout.gistLoginRequired') }}
            </div>
            <button
              @click="$emit('login')"
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <i class="fa-brands fa-github mr-2"></i>
              {{ t('header.loginWithGitHub') }}
            </button>
          </div>

          <template v-else>
            <div v-if="loading" class="text-center py-8">
              <div class="text-gray-400">{{ t('common.loading') }}</div>
            </div>

            <div v-else-if="error" class="text-center py-8">
              <div class="text-red-400">{{ error }}</div>
            </div>

            <div v-else-if="gistItems.length === 0" class="text-center py-8">
              <div class="text-gray-400">{{ t('dialogs.openLayout.noGistLayouts') }}</div>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="item in gistItems"
                :key="item.id + (item.gistFileKey || '')"
                @click="$emit('select', item)"
                class="bg-gray-700 rounded p-4 hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold truncate">{{ item.filename }}</h3>
                    <p v-if="item.description" class="text-gray-400 text-sm mt-1">
                      {{ item.description }}
                    </p>
                    <p class="text-gray-500 text-xs mt-2">
                      {{ t('dialogs.openLayout.updatedAt') }} {{ formatDate(item.updatedAt) }}
                    </p>
                  </div>
                  <div class="flex gap-2 ml-4">
                    <button
                      @click.stop="$emit('delete', item)"
                      class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      :title="t('common.delete')"
                    >
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>

      <div class="p-6 border-t border-gray-700 flex justify-end">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SavedLayoutItem } from '../types/github'
import { isGitHubIntegrationConfigured } from '../services/github'
import { getPresets, type PresetInfo } from '../services/presets'

const { t } = useI18n()

type TabType = 'preset' | 'local' | 'gist'

interface Props {
  show: boolean
  items: SavedLayoutItem[]
  loading: boolean
  error: string | null
  isLoggedIn: boolean
}

interface Emits {
  (e: 'select', item: SavedLayoutItem): void
  (e: 'select-preset', preset: PresetInfo): void
  (e: 'delete', item: SavedLayoutItem): void
  (e: 'cancel'): void
  (e: 'login'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const activeTab = ref<TabType>('local')
const presets = getPresets()

const localItems = computed(() => props.items.filter(item => item.source === 'local'))
const gistItems = computed(() => props.items.filter(item => item.source === 'gist'))
const isGitHubConfigured = isGitHubIntegrationConfigured()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP')
}
</script>
