<template>
  <div class="h-full bg-[var(--bg-primary)] flex flex-col">
    <!-- 顶部操作栏 -->
    <HeaderToolbar :current-chapter="currentChapter" :saving="saving" :last-saved="lastSaved" :has-changes="hasChanges"
      :is-streaming="isStreaming" :is-generating-summary="isGeneratingSummary"
      :is-reviewing-chapter="isReviewingChapter" :can-undo="canUndo" :can-redo="canRedo" :is-expanding-chapter="isExpandingChapter"
      @save-content="saveContent" @stop-streaming="handleStopStreaming"
      @generate-summary="startGenerateSummary" @update-memory-start="handleUpdateMemoryStart"
      @update-memory-end="handleUpdateMemoryEnd" @update-settings-start="handleUpdateSettingsStart"
      @update-settings-end="handleUpdateSettingsEnd" @review-chapter="startChapterReview" @expand-chapter="startChapterExpansion"
      @undo="handleUndo" @redo="handleRedo" />

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
      :book-id="currentChapter?.book_id" @close="handleChapterReviewClose" />

    <!-- 设定更新完成信息模态窗 -->
    <InfoModal v-model:visible="settingUpdateInfoVisible" :title="settingUpdateInfoTitle"
      :message="settingUpdateInfoMessage" @close="settingUpdateInfoVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useChaptersStore } from '@/stores/chapters'
import { useBooksStore } from '@/stores/books'
import { streamingManager } from '@/utils'
import { generateChapterSummary } from '@/services/chapterSummary'
import { streamChapterExpansion, type ChapterExpansionContext } from '@/services/chapterExpansion'
import { EditorHistoryManager } from '@/utils/editorHistory'
import { useToast } from '@/composables'
import HeaderToolbar from './editor/HeaderToolbar.vue'
import StatusBar from './editor/StatusBar.vue'
import ContentEditor from './editor/ContentEditor.vue'
import Toast from '@/components/shared/Toast.vue'
import ErrorModal from '@/components/shared/ErrorModal.vue'
import ChapterReviewModal from '@/components/modal/ChapterReviewModal.vue'
import InfoModal from '@/components/shared/InfoModal.vue'

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
const { toastVisible, toastMessage, toastType, showToast } = useToast()

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
const isExpandingChapter = ref(false)

// 撤销/恢复功能状态
const canUndo = ref(false)
const canRedo = ref(false)

// 流式写作章节锁定
const lockedChapterId = ref<number | null>(null)

// 设定更新信息模态窗状态
const settingUpdateInfoVisible = ref(false)
const settingUpdateInfoTitle = ref('')
const settingUpdateInfoMessage = ref('')

// 错误模态窗状态
const errorModalVisible = ref(false)
const errorModalMessage = ref('')
const errorModalDetails = ref('')

// 更新撤销/恢复按钮状态
const updateUndoRedoState = () => {
  if (!currentChapter.value) {
    canUndo.value = false
    canRedo.value = false
    return
  }

  canUndo.value = EditorHistoryManager.canUndo(currentChapter.value.id)
  canRedo.value = EditorHistoryManager.canRedo(currentChapter.value.id)
}

// 撤销
const handleUndo = () => {
  if (!currentChapter.value || !EditorHistoryManager.canUndo(currentChapter.value.id)) return

  const previousContent = EditorHistoryManager.undo(currentChapter.value.id)
  if (previousContent !== null) {
    content.value = previousContent
    originalContent.value = previousContent // 更新原始内容，防止保存时误判
    hasChanges.value = false
    updateUndoRedoState()
  }
}

// 恢复
const handleRedo = () => {
  if (!currentChapter.value || !EditorHistoryManager.canRedo(currentChapter.value.id)) return

  const nextContent = EditorHistoryManager.redo(currentChapter.value.id)
  if (nextContent !== null) {
    content.value = nextContent
    originalContent.value = nextContent // 更新原始内容，防止保存时误判
    hasChanges.value = false
    updateUndoRedoState()
  }
}

// 监听当前章节变化
watch(currentChapter, (newChapter) => {
  if (newChapter) {
    content.value = newChapter.content || ''
    originalContent.value = newChapter.content || ''
    hasChanges.value = false
    lastSaved.value = false
    autoSaveStatus.value = ''
    lastSavedTime.value = newChapter.updated_at || null

    // 初始化章节历史记录
    EditorHistoryManager.initializeChapter(newChapter.id, content.value)
    updateUndoRedoState()
  } else {
    content.value = ''
    originalContent.value = ''
    hasChanges.value = false
    autoSaveStatus.value = ''
    lastSavedTime.value = null

    // 重置撤销/恢复状态
    canUndo.value = false
    canRedo.value = false
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
  // 如果有章节被锁定且正在流式写作，则不允许手动保存
  if (lockedChapterId.value && isStreaming.value) {
    return
  }

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

    // 保存时添加到历史记录
    EditorHistoryManager.addRecord(currentChapter.value.id, content.value, '保存')
    updateUndoRedoState()

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


// 显示错误模态窗
const showErrorModal = (message: string, details?: string) => {
  errorModalMessage.value = message
  errorModalDetails.value = details || ''
  errorModalVisible.value = true
}

// 开始生成梗概
const startGenerateSummary = async () => {
  if (!currentChapter.value || !currentChapter.value.content) return

  // 锁定操作的章节ID，防止操作过程中切换章节导致数据保存错误
  const targetChapterId = currentChapter.value.id
  const targetBookId = currentChapter.value.book_id
  const targetContent = currentChapter.value.content

  isGeneratingSummary.value = true

  try {
    // 获取当前书籍信息
    const booksStore = useBooksStore()
    const currentBook = booksStore.books.find((book: any) => book.id === targetBookId)

    // 构建上下文 - 只传递必要参数：章节内容和全局设定
    const context = {
      content: targetContent,
      globalSettings: currentBook?.global_settings
    }

    // 生成梗概
    const summary = await generateChapterSummary(context)

    // 更新章节梗概到数据库 - 使用锁定的章节ID
    await chaptersStore.updateChapter(targetChapterId, {
      summary: summary
    })

    // 只有当当前显示的章节仍然是操作的目标章节时，才更新本地状态
    if (currentChapter.value && currentChapter.value.id === targetChapterId) {
      currentChapter.value.summary = summary
    }

    // 使用 toast 提示成功
    showToast({
      message: '梗概生成成功',
      type: 'success'
    })

  } catch (error) {
    console.error('生成章节梗概失败:', error)
    showToast({
      message: '生成章节梗概失败，请重试',
      type: 'error'
    })
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
    showToast({
      message: '记忆更新成功',
      type: 'success'
    })
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
const handleUpdateSettingsEnd = (success: boolean, result?: any) => {
  isUpdatingSettings.value = false

  if (success && result) {
    // 成功时显示详细信息模态窗
    settingUpdateInfoTitle.value = '设定维护完成'

    // 构建详细信息消息
    let message = result.message || '设定更新完成'

    // 添加详细统计信息
    if (result.updatedSettings && result.updatedSettings.length > 0) {
      message += `\n\n更新的设定数量：${result.updatedSettings.length} 个`
    }

    if (result.addedSettings && result.addedSettings.length > 0) {
      message += `\n新增的设定数量：${result.addedSettings.length} 个`
    }

    // 添加AI分析总结（如果有）
    if (result.details && result.details.trim()) {
      message += `\n\nAI分析总结：\n${result.details}`
    }

    settingUpdateInfoMessage.value = message
    settingUpdateInfoVisible.value = true
  } else if (!success && result) {
    // 失败时使用错误模态窗显示详细错误信息
    showErrorModal('设定更新失败', result.details || result.message || '更新设定时发生错误，请检查配置后重试')
  } else {
    // 默认处理
    if (success) {
      showToast({
        message: '设定更新成功',
        type: 'success'
      })
    } else {
      showErrorModal('设定更新失败', '更新设定时发生错误，请检查配置后重试')
    }
  }
}

// 开始章节评估
const startChapterReview = async () => {
  if (!currentChapter.value || !currentChapter.value.content) return

  // 锁定操作的章节信息，防止操作过程中切换章节导致数据保存错误
  // const targetChapterId = currentChapter.value.id
  const targetBookId = currentChapter.value.book_id
  // const targetContent = currentChapter.value.content
  // const targetTitle = currentChapter.value.title

  isReviewingChapter.value = true

  try {
    // 获取当前书籍的全局设定
    const currentBook = booksStore.books.find((book: any) => book.id === targetBookId)
    globalSettings.value = currentBook?.global_settings || ''

    // 显示章节评估模态窗口，传递锁定的章节信息
    chapterReviewModalVisible.value = true

  } catch (error) {
    console.error('开始章节评估失败:', error)
    showToast({
      message: '开始章节评估失败，请重试',
      type: 'error'
    })
  } finally {
    isReviewingChapter.value = false
  }
}

// 处理章节评估关闭
const handleChapterReviewClose = () => {
  chapterReviewModalVisible.value = false
}

// 开始章节扩写
const startChapterExpansion = async () => {
  if (!currentChapter.value || !currentChapter.value.content) return

  // 检查章节内容是否为空或只有空白字符
  const chapterContent = currentChapter.value.content.trim()
  if (!chapterContent) {
    showToast({
      message: '章节内容为空，无法进行扩写',
      type: 'error'
    })
    return
  }

  // 锁定操作的章节信息，防止操作过程中切换章节导致数据保存错误
  const targetChapterId = currentChapter.value.id
  const targetBookId = currentChapter.value.book_id
  const targetContent = currentChapter.value.content

  isExpandingChapter.value = true

  try {
    // 获取当前书籍信息
    const currentBook = booksStore.books.find((book: any) => book.id === targetBookId)

    // 获取前文章节内容（如果有）
    let previousChapterContent = ''
    const chapters = chaptersStore.chapters.filter((c: any) => c.book_id === targetBookId)
    const currentIndex = chapters.findIndex((c: any) => c.id === targetChapterId)
    if (currentIndex > 0) {
      previousChapterContent = chapters[currentIndex - 1].content || ''
    }

    // 获取前五章章节梗概
    const recentChapterSummaries = chapters
      .filter((c: any) => c.summary && c.id !== targetChapterId)
      .slice(-5) // 最近5个章节
      .map((c: any) => c.summary)

    // 构建扩写上下文
    const context: ChapterExpansionContext = {
      chapterContent: targetContent,
      previousChapterContent,
      recentChapterSummaries,
      globalSettings: currentBook?.global_settings
    }

    // 先将当前内容添加到历史记录
    EditorHistoryManager.addRecord(targetChapterId, targetContent, '扩写前的内容')
    updateUndoRedoState()

    // 清空当前章节内容
    content.value = ''

    // 使用流式扩写
    const streamGenerator = streamChapterExpansion(context)

    // 启动流式写作
    const event = new CustomEvent('start-streaming-writing', {
      detail: { streamGenerator }
    })
    window.dispatchEvent(event)

    showToast({
      message: '开始扩写章节...',
      type: 'info'
    })

  } catch (error) {
    console.error('开始章节扩写失败:', error)
    showToast({
      message: '开始章节扩写失败，请重试',
      type: 'error'
    })
    // 恢复原始内容
    content.value = targetContent
  } finally {
    isExpandingChapter.value = false
  }
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

  // 锁定当前章节，防止在流式写作过程中切换章节
  if (currentChapter.value) {
    lockedChapterId.value = currentChapter.value.id

    // 通知外部组件流式写作状态变化
    const event = new CustomEvent('streaming-status-changed', {
      detail: {
        isLocked: true,
        chapterId: lockedChapterId.value
      }
    })
    window.dispatchEvent(event)
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
      // 解锁章节
      const unlockedChapterId = lockedChapterId.value
      lockedChapterId.value = null

      // 通知外部组件流式写作状态变化
      const event = new CustomEvent('streaming-status-changed', {
        detail: {
          isLocked: false,
          chapterId: unlockedChapterId
        }
      })
      window.dispatchEvent(event)
    })
  } catch (error) {
    console.error('启动流式写作失败:', error)
    // 清理资源
    streamingManager.removeListener(updateStreamingStatus)
    if (controller) {
      controller.abort()
    }
    // 解锁章节
    const unlockedChapterId = lockedChapterId.value
    lockedChapterId.value = null

    // 通知外部组件流式写作状态变化
    const event = new CustomEvent('streaming-status-changed', {
      detail: {
        isLocked: false,
        chapterId: unlockedChapterId
      }
    })
    window.dispatchEvent(event)
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
    // 获取锁定的章节ID
    const targetChapterId = lockedChapterId.value
    if (!targetChapterId) {
      throw new Error('没有锁定的章节，无法进行流式写作')
    }

    // 获取锁定的章节内容
    let currentContent = ''
    if (targetChapterId === currentChapter.value?.id) {
      // 如果锁定的章节就是当前显示的章节，使用当前内容
      currentContent = content.value
    } else {
      // 如果当前显示的章节不是锁定的章节，从数据库获取锁定章节的内容
      const lockedChapter = await chaptersStore.getChapter(targetChapterId)
      currentContent = lockedChapter?.content || ''
    }

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
      // 只有当锁定的章节是当前显示的章节时，才更新界面显示
      if (targetChapterId === currentChapter.value?.id) {
        content.value = currentContent
      }

      // 每个chunk处理后都检查终止信号
      if (signal.aborted) {
        break
      }
    }

    // 流式输出完成后，清理空白段落
    currentContent = cleanEmptyParagraphs(currentContent)

    // 保存内容到锁定的章节
    await chaptersStore.updateChapter(targetChapterId, {
      content: currentContent
    })

    // 如果锁定的章节是当前显示的章节，更新界面显示
    if (targetChapterId === currentChapter.value?.id) {
      content.value = currentContent
      originalContent.value = currentContent
      hasChanges.value = false

      // 添加最终内容到历史记录
      EditorHistoryManager.addRecord(targetChapterId, currentContent, '扩写完成')
      updateUndoRedoState()
    }

    // 流式写作完成，内容已保存到章节

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
  handleMemorySearchStatus,
  isChapterLocked: () => lockedChapterId.value !== null,
  getLockedChapterId: () => lockedChapterId.value
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
