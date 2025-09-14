<template>
  <div v-if="currentChapter" class="p-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
    <div class="flex items-center justify-between text-xs text-[var(--text-secondary)]">
      <!-- 左侧：只显示字符数 -->
      <div class="flex items-center">
        <span>{{ charCount }}</span>
      </div>

      <!-- 中间：状态提示区域（只有触发时才显示） -->
      <div class="flex-1 text-center">
        <span v-if="autoSaveStatus" class="text-blue-500">
          {{ autoSaveStatus }}
        </span>
      </div>

      <!-- 右侧：只显示更新时间 -->
      <div class="flex items-center">
        <span v-if="currentChapter.updated_at" class="text-gray-500">
          {{ formatDateTime(currentChapter.updated_at) }}
        </span>
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
  }
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