o<template>
  <div class="h-full bg-[var(--bg-primary)] flex flex-col">
    <!-- 顶部操作栏 -->
    <HeaderToolbar :current-chapter="currentChapter" :saving="saving" :last-saved="lastSaved" :has-changes="hasChanges"
      :is-streaming="isStreaming" @save-content="saveContent" @stop-streaming="handleStopStreaming" />

    <!-- 编辑器区域 - 精确填充可用空间，无外部滚动 -->
    <div class="flex-1 min-h-0">
      <ContentEditor :current-chapter="currentChapter" :content="content" :original-content="originalContent"
        :is-streaming="isStreaming" @update:content="updateContent" @content-change="handleContentChange"
        @stop-streaming="handleStopStreaming" />
    </div>

    <!-- 底部状态栏 -->
    <StatusBar :current-chapter="currentChapter" :content="content" :auto-save-status="autoSaveStatus"
      :last-saved-time="lastSavedTime" :is-streaming="isStreaming" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useChaptersStore } from '@/stores/chapters'
import { streamingManager } from '@/utils'
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
  handleStopStreaming
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
