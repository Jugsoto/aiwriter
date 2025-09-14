<template>
  <div class="h-full bg-[var(--bg-primary)] flex flex-col">
    <!-- 顶部操作栏 -->
    <HeaderToolbar :current-chapter="currentChapter" :saving="saving" :last-saved="lastSaved" :has-changes="hasChanges"
      @save-content="saveContent" />

    <!-- 编辑器区域 - 精确填充可用空间，无外部滚动 -->
    <div class="flex-1 min-h-0">
      <ContentEditor :current-chapter="currentChapter" :content="content" :original-content="originalContent"
        @update:content="updateContent" @content-change="handleContentChange" />
    </div>

    <!-- 底部状态栏 -->
    <StatusBar :current-chapter="currentChapter" :content="content" :auto-save-status="autoSaveStatus"
      :last-saved-time="lastSavedTime" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChaptersStore } from '@/stores/chapters'
import HeaderToolbar from './editor/HeaderToolbar.vue'
import StatusBar from './editor/StatusBar.vue'
import ContentEditor from './editor/ContentEditor.vue'

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
const autoSaveStatus = ref('')
const lastSavedTime = ref<string | Date | null>(null)

// 监听当前章节变化
watch(currentChapter, (newChapter) => {
  if (newChapter) {
    content.value = newChapter.content || ''
    originalContent.value = newChapter.content || ''
    hasChanges.value = false
    lastSaved.value = false
    autoSaveStatus.value = ''
    lastSavedTime.value = newChapter.updated_at || null
  } else {
    content.value = ''
    originalContent.value = ''
    hasChanges.value = false
    autoSaveStatus.value = ''
    lastSavedTime.value = null
  }
}, { immediate: true })

// 更新内容
const updateContent = (newContent: string) => {
  content.value = newContent
}

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
  autoSaveStatus.value = '保存中...'

  try {
    await chaptersStore.updateChapter(currentChapter.value.id, {
      content: content.value
    })
    originalContent.value = content.value
    hasChanges.value = false
    lastSaved.value = true
    lastSavedTime.value = new Date().toISOString()
    autoSaveStatus.value = '保存成功'

    // 3秒后隐藏保存提示
    setTimeout(() => {
      lastSaved.value = false
      autoSaveStatus.value = ''
    }, 3000)
  } catch (err) {
    console.error('保存章节内容失败:', err)
    autoSaveStatus.value = '保存失败'
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 自动保存（防抖函数）
const debouncedAutoSave = debounce(() => {
  if (currentChapter.value && hasChanges.value && !saving.value) {
    autoSaveStatus.value = '自动保存中...'
    saveContent()
  }
}, 2000) // 2秒后自动保存

</script>
