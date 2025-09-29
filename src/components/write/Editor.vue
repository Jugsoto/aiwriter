<template>
  <div class="h-full bg-[var(--bg-primary)] flex flex-col">
    <!-- 顶部操作栏 -->
    <HeaderToolbar :current-chapter="currentChapter" :saving="saving" :last-saved="lastSaved" :has-changes="hasChanges"
      :is-streaming="isStreaming" :is-generating-summary="isGeneratingSummary"
      :is-reviewing-chapter="isReviewingChapter" @save-content="saveContent" @stop-streaming="handleStopStreaming"
      @generate-summary="startGenerateSummary" @update-memory-start="handleUpdateMemoryStart"
      @update-memory-end="handleUpdateMemoryEnd" @update-settings-start="handleUpdateSettingsStart"
      @update-settings-end="handleUpdateSettingsEnd" @review-chapter="startChapterReview" />

    <!-- 编辑器区域 - 精确填充可用空间，无外部滚动 -->
    <div class="flex-1 min-h-0">
      <ContentEditor :current-chapter="currentChapter" :content="content" :original-content="originalContent"
        :is-streaming="isStreaming" @update:content="updateContent" @content-change="handleContentChange"
        @stop-streaming="handleStopStreaming" />
    </div>

    <!-- 底部状态栏 -->
    <StatusBar :current-chapter="currentChapter" :content="content" :auto-save-status="autoSaveStatus"
      :last-saved-time="lastSavedTime" :is-streaming="isStreaming" :is-generating-summary="isGeneratingSummary"
      :is-updating-memory="isUpdatingMemory" :is-searching-memory="isSearchingMemory"
      :is-updating-settings="isUpdatingSettings" :is-reviewing-chapter="isReviewingChapter" />

    <!-- Toast 提示 -->
    <Toast v-model:visible="toastVisible" :message="toastMessage" :type="toastType" />

    <!-- 错误模态窗 -->
    <ErrorModal v-model:visible="errorModalVisible" :message="errorModalMessage" :error-details="errorModalDetails"
      @close="errorModalVisible = false" />

    <!-- 章节评估模态窗 -->
    <ChapterReviewModal v-model:visible="chapterReviewModalVisible" :chapter-content="content"
      :global-settings="globalSettings" :chapter-title="currentChapter?.title" :chapter-id="currentChapter?.id"
      @close="handleChapterReviewClose" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useChaptersStore } from '@/stores/chapters'
import { useBooksStore } from '@/stores/books'
import { streamingManager } from '@/utils'
import { generateChapterSummary } from '@/services/chapterSummary'
import HeaderToolbar from './editor/HeaderToolbar.vue'
import StatusBar from './editor/StatusBar.vue'
import ContentEditor from './editor/ContentEditor.vue'
import Toast from '@/components/shared/Toast.vue'
import ErrorModal from '@/components/shared/ErrorModal.vue'
import ChapterReviewModal from '@/components/modal/ChapterReviewModal.vue'

// 简单的防抖函数实现
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// 清理空白段落的函数
function cleanEmptyParagraphs(text: string): string {
  if (!text) return text

  // 将多个连续换行符替换为单个换行符（只保留一个换行符）
  text = text.replace(/\n{2,}/g, '\n')

  // 移除内容末尾的换行符
  text = text.replace(/\n+$/, '')

  return text
}

const chaptersStore = useChaptersStore()
const booksStore = useBooksStore()

// 计算属性
const currentChapter = computed(() => chaptersStore.currentChapter)
const content = ref('')
const originalContent = ref('')
const hasChanges = ref(false)
const saving = ref(false)
const lastSaved = ref(false)
const autoSaveStatus = ref('')
const lastSavedTime = ref<string | Date | null>(null)
const isStreaming = ref(false)
const isGeneratingSummary = ref(false)
const isUpdatingMemory = ref(false)
const isSearchingMemory = ref(false)
const isUpdatingSettings = ref(false)
const isReviewingChapter = ref(false)
const chapterReviewModalVisible = ref(false)
const globalSettings = ref('')

// Toast 提示状态
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')

// 错误模态窗状态
const errorModalVisible = ref(false)
const errorModalMessage = ref('')
const errorModalDetails = ref('')

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

// 停止流式输出
const handleStopStreaming = () => {
  streamingManager.stopStreaming()
}

// 显示 Toast 提示
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = true
}

// 显示错误模态窗
const showErrorModal = (message: string, details?: string) => {
  errorModalMessage.value = message
  errorModalDetails.value = details || ''
  errorModalVisible.value = true
}

// 开始生成梗概
const startGenerateSummary = async () => {
  if (!currentChapter.value || !currentChapter.value.content) return

  isGeneratingSummary.value = true

  try {
    // 获取当前书籍信息
    const booksStore = useBooksStore()
    const currentBook = booksStore.books.find((book: any) => book.id === currentChapter.value?.book_id)

    // 构建上下文 - 只传递必要参数：章节内容和全局设定
    const context = {
      content: currentChapter.value.content,
      globalSettings: currentBook?.global_settings
    }

    // 生成梗概
    const summary = await generateChapterSummary(context)

    // 更新章节梗概到数据库
    await chaptersStore.updateChapter(currentChapter.value.id, {
      summary: summary
    })

    // 更新本地状态
    if (currentChapter.value) {
      currentChapter.value.summary = summary
    }

    // 使用 toast 提示成功
    showToast('梗概生成成功', 'success')

  } catch (error) {
    console.error('生成章节梗概失败:', error)
    showToast('生成章节梗概失败，请重试', 'error')
  } finally {
    isGeneratingSummary.value = false
  }
}

// 处理记忆更新开始
const handleUpdateMemoryStart = () => {
  isUpdatingMemory.value = true
}

// 处理记忆更新结束
const handleUpdateMemoryEnd = (success: boolean) => {
  isUpdatingMemory.value = false
  // 可以根据成功状态显示不同的提示
  if (success) {
    showToast('记忆更新成功', 'success')
  } else {
    // 错误时使用错误模态窗而不是Toast
    showErrorModal('记忆更新失败', '更新章节记忆时发生错误，请检查配置后重试')
  }
}

// 处理设定更新开始
const handleUpdateSettingsStart = () => {
  isUpdatingSettings.value = true
}

// 处理设定更新结束
const handleUpdateSettingsEnd = (success: boolean) => {
  isUpdatingSettings.value = false
  if (success) {
    showToast('设定更新成功', 'success')
  } else {
    showErrorModal('设定更新失败', '更新设定时发生错误，请检查配置后重试')
  }
}

// 开始章节评估
const startChapterReview = async () => {
  if (!currentChapter.value || !currentChapter.value.content) return

  isReviewingChapter.value = true

  try {
    // 获取当前书籍的全局设定
    const currentBook = booksStore.books.find((book: any) => book.id === currentChapter.value?.book_id)
    globalSettings.value = currentBook?.global_settings || ''

    // 显示章节评估模态窗口
    chapterReviewModalVisible.value = true

  } catch (error) {
    console.error('开始章节评估失败:', error)
    showToast('开始章节评估失败，请重试', 'error')
  } finally {
    isReviewingChapter.value = false
  }
}

// 处理章节评估关闭
const handleChapterReviewClose = () => {
  chapterReviewModalVisible.value = false
}

// 开始流式写作（供父组件调用）
const startStreamingWriting = (streamGenerator: AsyncGenerator<string, void, unknown>) => {
  // 检查是否已有写作流在进行中，但给予一定的容错时间
  if (streamingManager.isStreaming() && streamingManager.getCurrentType() === 'writing') {
    // 等待100ms让之前的流完全清理，然后重试
    setTimeout(() => {
      if (!streamingManager.isStreaming() || streamingManager.getCurrentType() !== 'writing') {
        startStreamingWriting(streamGenerator)
      }
    }, 100)
    return
  }

  // 监听流式状态变化 - 必须在开始流式输出之前注册
  const updateStreamingStatus = (streaming: boolean, type: string | null) => {
    isStreaming.value = streaming && type === 'writing'
  }

  // 先注册监听器，再开始流式输出
  streamingManager.addListener(updateStreamingStatus)

  let controller: AbortController | null = null
  try {
    // 使用全局流式管理器开始新的写作流
    controller = streamingManager.startStreaming('writing')

    // 异步处理流式内容
    processStreamContent(streamGenerator, controller.signal).finally(() => {
      // 清理监听器
      streamingManager.removeListener(updateStreamingStatus)
      // 强制检查最终状态，确保流式输出完全停止
      if (streamingManager.isStreaming() && streamingManager.getCurrentType() === 'writing') {
        streamingManager.stopStreaming()
      }
    })
  } catch (error) {
    console.error('启动流式写作失败:', error)
    // 清理资源
    streamingManager.removeListener(updateStreamingStatus)
    if (controller) {
      controller.abort()
    }
  }
}

// 处理记忆搜索状态（供父组件调用）
const handleMemorySearchStatus = (isSearching: boolean) => {
  isSearchingMemory.value = isSearching
}

// 处理流式内容
const processStreamContent = async (
  streamGenerator: AsyncGenerator<string, void, unknown>,
  signal: AbortSignal
) => {
  try {
    // 获取当前内容
    let currentContent = content.value

    // 在内容末尾添加换行，确保新内容从新段落开始（避免双换行导致的空白段）
    if (currentContent && !currentContent.endsWith('\n')) {
      currentContent += '\n'
    }


    // 流式接收内容
    for await (const contentChunk of streamGenerator) {
      // 检查是否被终止
      if (signal.aborted) {
        break
      }

      // 将生成的内容追加到当前内容
      currentContent += contentChunk

      // 更新内容（触发响应式更新）
      content.value = currentContent

      // 每个chunk处理后都检查终止信号
      if (signal.aborted) {
        break
      }
    }

    // 流式输出完成后，清理空白段落
    content.value = cleanEmptyParagraphs(content.value)

  } catch (error) {
    console.error('流式写作处理失败:', error)
  } finally {
    // 确保状态被正确清理
    if (streamingManager.isStreaming() && streamingManager.getCurrentType() === 'writing') {
      streamingManager.stopStreaming()
    }
  }
}

// 暴露方法给父组件
defineExpose({
  startStreamingWriting,
  handleStopStreaming,
  handleMemorySearchStatus
})

// 监听流式写作事件
let eventHandler: EventListener | null = null

onMounted(() => {
  eventHandler = ((event: Event) => {
    const customEvent = event as CustomEvent
    const { streamGenerator } = customEvent.detail
    if (streamGenerator) {
      startStreamingWriting(streamGenerator)
    }
  }) as EventListener

  window.addEventListener('start-streaming-writing', eventHandler)
})

onUnmounted(() => {
  if (eventHandler) {
    window.removeEventListener('start-streaming-writing', eventHandler)
    eventHandler = null
  }
})
</script>
