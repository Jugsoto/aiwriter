<template>
  <div v-if="currentChapter" class="p-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
    <div class="flex items-center text-xs text-[var(--text-secondary)]">
      <!-- 左侧：字符数统计（固定宽度，胶囊背景） -->
      <div class="w-32 flex items-center justify-start">
        <div class="px-3 py-1 bg-[var(--bg-primary)] rounded-full">
          <span>{{ charCount }} 字符</span>
        </div>
      </div>

      <!-- 中间：状态提示区域（只有触发时才显示） -->
      <div class="flex-1 flex items-center justify-center">
        <span v-if="isStreaming"
          class="text-green-500 inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 rounded-full">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          神笔写作中
        </span>
        <span v-else-if="isGeneratingSummary"
          class="text-purple-500 inline-flex items-center gap-1 px-3 py-1 bg-purple-500/10 rounded-full">
          <span class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
          梗概生成中
        </span>
        <span v-else-if="isUpdatingMemory"
          class="text-orange-500 inline-flex items-center gap-1 px-3 py-1 bg-orange-500/10 rounded-full">
          <span class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
          记忆更新中
        </span>
        <span v-else-if="isUpdatingSettings"
          class="text-indigo-500 inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/10 rounded-full">
          <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          设定更新中
        </span>
        <span v-else-if="autoSaveStatus" class="text-blue-500 inline-block px-3 py-1 bg-blue-500/10 rounded-full">
          {{ autoSaveStatus }}
        </span>
      </div>

      <!-- 右侧：更新时间（固定宽度，胶囊背景） -->
      <div class="w-32 flex items-center justify-end">
        <div v-if="currentChapter.updated_at" class="px-3 py-1 bg-[var(--bg-primary)] rounded-full">
          <span>{{ formatDateTime(currentChapter.updated_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Chapter } from '@/electron.d'

// 定义props
const props = defineProps({
  currentChapter: {
    type: Object as () => Chapter | null,
    default: null
  },
  content: {
    type: String,
    default: ''
  },
  autoSaveStatus: {
    type: String,
    default: ''
  },
  lastSavedTime: {
    type: null as any,
    default: null
  },
  isStreaming: {
    type: Boolean,
    default: false
  },
  isGeneratingSummary: {
    type: Boolean,
    default: false
  },
  isUpdatingMemory: {
    type: Boolean,
    default: false
  },
  isUpdatingSettings: {
    type: Boolean,
    default: false
  },
})

// 计算属性 - 字符数统计
const charCount = computed(() => {
  return props.content.length
})

// 格式化日期时间（2025-09-14 12:12格式）
const formatDateTime = (time: string | Date) => {
  if (!time) return ''
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>