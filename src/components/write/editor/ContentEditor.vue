<template>
  <div class="h-full">
    <!-- 空状态 -->
    <div v-if="!currentChapter" class="text-center text-[var(--text-secondary)] py-12">
      <p class="text-lg mb-2">请选择一个章节开始编辑</p>
      <p class="text-sm">在左侧章节管理中选择章节后，即可开始编写内容</p>
    </div>

    <!-- 内容编辑区域 -->
    <div v-else class="h-full relative">
      <textarea :value="content" @input="handleInput"
        class="w-full h-full px-4 py-3 bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none resize-none font-mono leading-relaxed overflow-y-auto"
        placeholder="在这里编写您的章节内容...">
      </textarea>
    </div>

  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
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
  originalContent: {
    type: String,
    default: ''
  },
  isStreaming: {
    type: Boolean,
    default: false
  }
})

// 定义emits
const emit = defineEmits<{
  'update:content': [value: string]
  'contentChange': []
  'stop-streaming': []
}>()

// 处理输入事件
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:content', target.value)
  emit('contentChange')
}

// 监听章节变化，同步内容（只在章节切换时更新）
watch(() => props.currentChapter?.id, (newId, oldId) => {
  if (newId !== oldId) {
    if (props.currentChapter) {
      emit('update:content', props.currentChapter.content || '')
    } else {
      emit('update:content', '')
    }
  }
}, { immediate: true })
</script>