<template>
  <div
    class="p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center gap-2">
    <div class="flex items-center gap-2">
      <button @click="saveContent" :disabled="!hasChanges || saving"
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        保存
      </button>
      <!-- 占位按钮 -->
      <button
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        按钮1
      </button>
      <button
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        按钮2
      </button>
      <button
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        按钮3
      </button>
      <!-- 停止流式输出按钮 - 仅在流式写作时显示 -->
      <button v-if="isStreaming" @click="stopStreaming"
        class="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-300 bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors animate-pulse">
        <span class="w-2 h-2 bg-red-500 rounded-full"></span>
        停止写作
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Chapter } from '@/electron.d'

// 定义props
defineProps({
  currentChapter: {
    type: Object as () => Chapter | null,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  },
  lastSaved: {
    type: Boolean,
    default: false
  },
  hasChanges: {
    type: Boolean,
    default: false
  },
  isStreaming: {
    type: Boolean,
    default: false
  }
})

// 定义emits
const emit = defineEmits<{
  saveContent: []
  stopStreaming: []
}>()

// 保存内容
const saveContent = () => {
  emit('saveContent')
}

// 停止流式输出
const stopStreaming = () => {
  emit('stopStreaming')
}
</script>