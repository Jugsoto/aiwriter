<template>
  <div class="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
    <!-- 输入区域 -->
    <div class="p-3 pb-0">
      <div class="relative">
        <textarea ref="inputRef" v-model="inputText" @keydown.enter.exact.prevent="handleSend" :disabled="disabled"
          class="w-full min-h-[80px] max-h-[200px] px-4 py-3 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--sky-500)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="输入消息..." rows="3"></textarea>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="flex items-center justify-between px-3 py-2">
      <div class="flex items-center gap-2 relative">
        <button @click="handleAt" title="引用资源" ref="atButtonRef"
          class="p-2 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <AtSign class="w-4 h-4" />
        </button>

        <!-- 引用资源弹窗 -->
        <div v-if="showAtModal"
          class="absolute bottom-full left-0 mb-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg p-2 min-w-[120px] z-10">
          <div class="flex flex-col gap-1">
            <button @click="handleEntrySetting"
              class="px-3 py-2 text-sm text-left hover:bg-[var(--bg-secondary)] rounded transition-colors">
              词条设定
            </button>
            <button @click="handleWorldview"
              class="px-3 py-2 text-sm text-left hover:bg-[var(--bg-secondary)] rounded transition-colors">
              世界观
            </button>
            <button @click="handleCharacterProfile"
              class="px-3 py-2 text-sm text-left hover:bg-[var(--bg-secondary)] rounded transition-colors">
              人物档案
            </button>
          </div>
        </div>
        <button @click="handleClear" title="清空对话内容"
          class="p-2 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <Trash2 class="w-4 h-4" />
        </button>
        <button @click="handleStop" title="终止对话"
          class="p-2 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <Square class="w-4 h-4" />
        </button>
      </div>
      <button @click="handleSend" :disabled="disabled || !inputText.trim()"
        class="p-2 text-[var(--theme-text)] bg-[var(--theme-bg)] rounded-lg hover:bg-[var(--theme-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <Send class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { AtSign, Trash2, Square, Send } from 'lucide-vue-next'
import type { InputAreaProps } from '../../../utils/types'

defineProps<InputAreaProps>()
const emit = defineEmits(['send-message', 'at-resource', 'clear-conversation', 'stop-conversation', 'entry-setting', 'worldview', 'character-profile'])

const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement>()
const atButtonRef = ref<HTMLButtonElement>()
const showAtModal = ref(false)

const handleSend = () => {
  if (inputText.value.trim()) {
    emit('send-message', inputText.value.trim())
    inputText.value = ''
    adjustTextareaHeight()
  }
}

const handleAt = () => {
  showAtModal.value = !showAtModal.value
}

const handleEntrySetting = () => {
  emit('entry-setting')
  showAtModal.value = false
}

const handleWorldview = () => {
  emit('worldview')
  showAtModal.value = false
}

const handleCharacterProfile = () => {
  emit('character-profile')
  showAtModal.value = false
}

// 点击外部关闭弹窗
const handleClickOutside = (event: MouseEvent) => {
  if (showAtModal.value && atButtonRef.value && !atButtonRef.value.contains(event.target as Node)) {
    const modalElement = (event.target as HTMLElement).closest('.absolute.bottom-full')
    if (!modalElement) {
      showAtModal.value = false
    }
  }
}

const handleClear = () => {
  emit('clear-conversation')
}

const handleStop = () => {
  emit('stop-conversation')
}

// 自动调整输入框高度
const adjustTextareaHeight = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 200)}px`
  }
}

// 监听输入变化调整高度
watch(inputText, () => {
  adjustTextareaHeight()
})

// 聚焦输入框
const focusInput = () => {
  inputRef.value?.focus()
}

// 生命周期钩子
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

defineExpose({
  focusInput
})
</script>