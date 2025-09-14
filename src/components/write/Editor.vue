<template>
  <div class="h-full bg-[var(--bg-primary)] flex flex-col">
    <!-- 头部 -->
    <div class="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
      <h3 class="text-sm font-semibold text-[var(--text-primary)]">
        {{ currentChapter ? `编辑: ${currentChapter.title}` : '正文编辑器' }}
      </h3>
      <div v-if="currentChapter" class="flex items-center gap-2">
        <span v-if="saving" class="text-xs text-[var(--text-secondary)]">
          保存中...
        </span>
        <span v-else-if="lastSaved" class="text-xs text-[var(--text-secondary)]">
          已保存
        </span>
        <button @click="saveContent" :disabled="!hasChanges || saving"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          保存
        </button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="flex-1 p-6 overflow-y-auto">
      <div v-if="!currentChapter" class="text-center text-[var(--text-secondary)] py-12">
        <p class="text-lg mb-2">请选择一个章节开始编辑</p>
        <p class="text-sm">在左侧章节管理中选择章节后，即可开始编写内容</p>
      </div>
      <div v-else class="h-full">
        <textarea v-model="content" @input="handleContentChange"
          class="w-full h-full px-4 py-3 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm leading-relaxed"
          placeholder="在这里编写您的章节内容..."></textarea>
      </div>
    </div>

    <!-- 章节信息栏 -->
    <div v-if="currentChapter" class="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div class="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <div>
          <span>字数: {{ wordCount }}</span>
          <span class="mx-2">|</span>
          <span>字符数: {{ charCount }}</span>
        </div>
        <div v-if="currentChapter.summary" class="max-w-xs truncate">
          梗概: {{ currentChapter.summary }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChaptersStore } from '@/stores/chapters'
// 简单的防抖函数实现
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

const chaptersStore = useChaptersStore()

// 计算属性
const currentChapter = computed(() => chaptersStore.currentChapter)
const content = ref('')
const originalContent = ref('')
const hasChanges = ref(false)
const saving = ref(false)
const lastSaved = ref(false)

// 字数统计
const wordCount = computed(() => {
  if (!content.value) return 0
  return content.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const charCount = computed(() => {
  return content.value.length
})

// 监听当前章节变化
watch(currentChapter, (newChapter) => {
  if (newChapter) {
    content.value = newChapter.content || ''
    originalContent.value = newChapter.content || ''
    hasChanges.value = false
    lastSaved.value = false
  } else {
    content.value = ''
    originalContent.value = ''
    hasChanges.value = false
  }
}, { immediate: true })

// 监听内容变化
watch(content, (newContent) => {
  hasChanges.value = newContent !== originalContent.value
  if (hasChanges.value) {
    lastSaved.value = false
    // 自动保存（防抖）
    debouncedAutoSave()
  }
})

// 处理内容变化
const handleContentChange = () => {
  // 内容变化时触发，主要用于实时更新字数统计等
}

// 保存内容
const saveContent = async () => {
  if (!currentChapter.value || !hasChanges.value || saving.value) return

  saving.value = true
  try {
    await chaptersStore.updateChapter(currentChapter.value.id, {
      content: content.value
    })
    originalContent.value = content.value
    hasChanges.value = false
    lastSaved.value = true

    // 3秒后隐藏"已保存"提示
    setTimeout(() => {
      lastSaved.value = false
    }, 3000)
  } catch (err) {
    console.error('保存章节内容失败:', err)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 自动保存（防抖函数）
const debouncedAutoSave = debounce(() => {
  if (currentChapter.value && hasChanges.value && !saving.value) {
    saveContent()
  }
}, 2000) // 2秒后自动保存

// 监听章节变化，确保内容同步
watch(() => currentChapter.value?.content, (newContent) => {
  if (currentChapter.value && newContent !== content.value && !hasChanges.value) {
    content.value = newContent || ''
    originalContent.value = newContent || ''
  }
})
</script>
