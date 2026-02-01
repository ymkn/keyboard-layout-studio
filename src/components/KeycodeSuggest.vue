<template>
  <div class="relative">
    <input
      ref="inputEl"
      type="text"
      :value="modelValue"
      @input="onInput"
      @keydown="onKeydown"
      @focus="onFocus"
      @blur="onBlur"
      :placeholder="placeholder"
      :class="inputClass"
    />
    <Teleport to="body">
      <ul
        v-if="showSuggestions && suggestions.length > 0"
        ref="listEl"
        class="fixed z-[9999] max-h-60 overflow-y-auto bg-gray-800 border border-gray-600 rounded shadow-lg"
        :style="floatStyle"
      >
        <li
          v-for="(item, index) in suggestions"
          :key="item.code"
          @mousedown.prevent="selectItem(item.code)"
          :class="[
            'px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2',
            index === activeIndex ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-700'
          ]"
        >
          <span class="font-mono text-xs shrink-0">{{ item.code }}</span>
          <span v-if="item.description" class="text-gray-400 text-xs truncate">{{ item.description }}</span>
        </li>
      </ul>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { searchKeycodes } from '../data/keycodes'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  inputClass?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', code: string): void
  (e: 'enter'): void
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLUListElement | null>(null)
const showSuggestions = ref(false)
const activeIndex = ref(0)
const query = ref('')

const floatStyle = ref<Record<string, string>>({})

const suggestions = computed(() => {
  return searchKeycodes(query.value).slice(0, 30)
})

watch(suggestions, () => {
  activeIndex.value = 0
})

function updatePosition() {
  if (!inputEl.value) return
  const rect = inputEl.value.getBoundingClientRect()
  floatStyle.value = {
    bottom: `${window.innerHeight - rect.top + 2}px`,
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 280)}px`,
  }
}

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  query.value = value
  emit('update:modelValue', value)
  showSuggestions.value = true
  nextTick(updatePosition)
}

function onFocus() {
  query.value = props.modelValue || ''
}

function onBlur() {
  // mousedownのpreventDefaultで選択時はblurが発火しない
  showSuggestions.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (!showSuggestions.value || suggestions.value.length === 0) {
    if (e.key === 'Enter') {
      // サジェストが表示されていない場合は親にenterイベントを通知
      e.preventDefault()
      emit('enter')
    }
    return
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % suggestions.value.length
      scrollToActive()
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = (activeIndex.value - 1 + suggestions.value.length) % suggestions.value.length
      scrollToActive()
      break
    case 'Enter':
      e.preventDefault()
      e.stopPropagation()
      selectItem(suggestions.value[activeIndex.value].code)
      break
    case 'Escape':
      e.preventDefault()
      showSuggestions.value = false
      break
  }
}

function scrollToActive() {
  nextTick(() => {
    if (!listEl.value) return
    const item = listEl.value.children[activeIndex.value] as HTMLElement
    item?.scrollIntoView({ block: 'nearest' })
  })
}

function selectItem(code: string) {
  emit('update:modelValue', code)
  emit('select', code)
  showSuggestions.value = false
  query.value = ''
  nextTick(() => {
    inputEl.value?.focus()
    inputEl.value?.select()
  })
}

defineExpose({
  focus: () => inputEl.value?.focus(),
  select: () => { inputEl.value?.focus(); inputEl.value?.select() },
})
</script>
