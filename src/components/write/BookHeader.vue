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

    <!-- 右侧：功能按钮 -->
    <div class="flex items-center gap-2">
      <button @click="$emit('open-reference-library')"
        class="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        <Library class="w-4 h-4" />
        <span>资料库</span>
      </button>
      <button @click="$emit('open-settings', 'character')"
        class="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        <User class="w-4 h-4" />
        <span>人物档案</span>
      </button>
      <button @click="$emit('open-settings', 'worldview')"
        class="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        <Globe class="w-4 h-4" />
        <span>世界观</span>
      </button>
      <button @click="$emit('open-settings', 'entry')"
        class="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        <FileText class="w-4 h-4" />
        <span>词条设定</span>
      </button>
      <button @click="$emit('global-settings')"
        class="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        <Settings class="w-4 h-4" />
        <span>全局设定</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, Settings, User, Globe, FileText, Library } from 'lucide-vue-next'

defineProps<{
  bookName?: string
}>()

defineEmits<{
  (e: 'back'): void
  (e: 'global-settings'): void
  (e: 'open-settings', type: 'character' | 'worldview' | 'entry'): void
  (e: 'open-reference-library'): void
}>()
</script>