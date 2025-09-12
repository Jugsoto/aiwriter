<template>
  <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
    <!-- 左侧：返回按钮 + 书名 -->
    <div class="flex items-center gap-2">
      <button @click="$emit('back')"
        class="flex items-center gap-2 text-[var(--text-primary)]  rounded-md transition-colors">
        <ChevronLeft class="w-6 h-6" />
      </button>
      <h1 class="text-xl font-semibold text-[var(--text-primary)]">
        {{ bookName || '加载中...' }}
      </h1>
    </div>

    <!-- 右侧：占位按钮 -->
    <div class="flex items-center gap-2">
      <button
        class="flex items-center gap-2 px-3 py-1.5 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors">
        <Settings class="w-4 h-4" />
        <span>设置</span>
      </button>
      <button
        class="flex items-center gap-2 px-3 py-1.5 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors">
        <Share2 class="w-4 h-4" />
        <span>分享</span>
      </button>
      <button
        class="flex items-center gap-2 px-3 py-1.5 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors">
        <Download class="w-4 h-4" />
        <span>导出</span>
      </button>
      <button
        class="flex items-center gap-2 px-3 py-1.5 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors">
        <MoreVertical class="w-4 h-4" />
        <span>更多</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, Settings, Share2, Download, MoreVertical } from 'lucide-vue-next'

defineProps<{
  bookName?: string
}>()

defineEmits<{
  (e: 'back'): void
}>()
</script>