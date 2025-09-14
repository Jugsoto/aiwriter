<template>
  <div
    class="p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center gap-2">
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
    <button
      class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
      按钮4
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { Chapter } from '@/electron.d'

// 定义props
const props = defineProps({
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
  }
})

// 定义emits
const emit = defineEmits<{
  saveContent: []
}>()

// 保存内容
const saveContent = () => {
  emit('saveContent')
}
</script>