<template>
  <div class="flex-1 overflow-y-auto p-4" ref="messagesContainer">
    <!-- 消息列表 -->
    <div v-if="messages.length > 0 || isLoading">
      <div v-for="message in messages" :key="message.id" class="">
        <!-- 推理消息（仅对助手消息显示） -->
        <div v-if="message.role === 'assistant' && (message.reasoningContent || message.isReasoning)"
          class="flex justify-start mb-2">
          <div class="max-w-[80%] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl">
            <!-- 推理消息头部（可点击展开/收起） -->
            <div
              class="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[var(--bg-hover)] rounded-t-2xl"
              @click="toggleReasoning(message)">
              <div class="flex items-center gap-2">
                <div class="flex space-x-1" v-if="message.isReasoning">
                  <div class="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce"
                    style="animation-delay: -0.3s"></div>
                  <div class="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce"
                    style="animation-delay: -0.15s"></div>
                  <div class="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce"></div>
                </div>
                <span class="text-sm text-[var(--text-secondary)]">
                  {{ getReasoningTitle(message) }}
                </span>
              </div>
              <ChevronDown v-if="!message.isReasoning" class="w-4 h-4 text-[var(--text-tertiary)] transition-transform"
                :class="{ 'rotate-180': message.showReasoning }" />
            </div>
            <!-- 推理内容 -->
            <div v-if="message.showReasoning && message.reasoningContent"
              class="px-4 pb-3 pt-1 border-t border-[var(--border-color)]">
              <div class="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{{ message.reasoningContent }}</div>
            </div>
          </div>
        </div>
        <!-- 正常消息 -->
        <div v-if="message.content" :class="[
          'max-w-[80%] rounded-2xl px-4 py-3 mb-3',
          message.role === 'user'
            ? 'ml-auto bg-[var(--sky-100)] text-[var(--text-primary)]'
            : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'
        ]">
          <div class="text-sm markdown-content" v-html="renderMarkdown(message.content)"></div>
        </div>
        <!-- 操作栏（仅对正式的AI消息显示） -->
        <div v-if="message.role === 'assistant' && message.content && !message.isReasoning"
          class="flex justify-start mb-3">
          <div class="max-w-[80%] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-2">
            <div class="flex items-center gap-2">
              <button @click="handleRegenerate(message)"
                class="flex items-center p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                title="重新生成">
                <RefreshCw class="w-4 h-4" />
              </button>
              <button @click="handleEdit(message)"
                class="flex items-center p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                title="编辑消息">
                <Edit class="w-4 h-4" />
              </button>
              <button @click="handleCopy(message)"
                class="flex items-center p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                title="复制消息">
                <Copy class="w-4 h-4" />
              </button>
              <button @click="handleStartWriting(message)"
                class="flex items-center px-2 py-1 text-white bg-[var(--theme-bg)] hover:bg-[var(--theme-hover)] rounded-lg transition-colors"
                title="开始写作">
                <PenTool class="w-4 h-4" />
                <span class="ml-1 text-xs">写作</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态（仅当没有消息且正在加载时显示） -->
    <div v-if="isLoading && messages.length === 0" class="flex justify-start">
      <div class="max-w-[80%] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl px-4 py-3">
        <div class="flex items-center gap-2">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style="animation-delay: -0.3s">
            </div>
            <div class="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style="animation-delay: -0.15s">
            </div>
            <div class="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce"></div>
          </div>
          <span class="text-sm text-[var(--text-secondary)]">正在思考中...</span>
        </div>
      </div>
    </div>

    <!-- 消息编辑 Modal -->
    <MessageEditModal v-model:visible="editModalVisible" :message="editingMessage" @confirm="handleEditConfirm"
      @cancel="handleEditCancel" />

    <!-- 复制成功提示 -->
    <Toast v-model:visible="toastVisible" :message="toastMessage" :type="toastType" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { marked } from 'marked'
import { Edit, Copy, ChevronDown, PenTool, RefreshCw } from 'lucide-vue-next'
import type { Message, MessageListProps } from '../../../utils/types'
import { useToast } from '@/composables'
import MessageEditModal from '../../modal/MessageEditModal.vue'
import Toast from '../../shared/Toast.vue'

const props = defineProps<MessageListProps>()
const emit = defineEmits<{
  'update:message': [message: Message]
  'start-writing': [message: Message]
  'regenerate-message': [message: Message]
}>()
const messagesContainer = ref<HTMLElement>()
const { toastVisible, toastMessage, toastType, showToast } = useToast()

// 标记是否为用户手动操作（如点击推理消息）
const isUserAction = ref(false)
// 记录上一次消息状态，用于检测流式输出结束
const lastMessageStatus = ref<Map<string, { isStreaming: boolean, contentLength: number }>>(new Map())

// 编辑 modal 状态
const editModalVisible = ref(false)
const editingMessage = ref<Message | null>(null)

// 配置marked选项
marked.setOptions({
  breaks: true,
  gfm: true
})

// 将markdown转换为HTML
const renderMarkdown = (content: string): string => {
  try {
    const result = marked(content)
    // 如果marked返回的是Promise，使用同步版本
    if (result instanceof Promise) {
      return content // 降级处理，直接返回原文本
    }
    return result
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return content
  }
}

// 获取推理消息标题
const getReasoningTitle = (message: Message): string => {
  if (message.isReasoning) {
    // 检查是否是搜索状态消息
    if (message.reasoningContent?.includes('搜索') || message.reasoningContent?.includes('记忆')) {
      return '记忆搜索中...'
    }
    return '深度思考中...'
  }
  // 检查是否是搜索完成消息
  if (message.reasoningContent?.includes('搜索完成') || message.reasoningContent?.includes('找到')) {
    return '记忆搜索'
  }
  return '思考过程'
}

// 切换推理消息显示状态
const toggleReasoning = (message: Message) => {
  if (message.reasoningContent) {
    // 标记这是用户手动触发的展开/收起操作
    isUserAction.value = true
    message.showReasoning = !message.showReasoning

    // 延迟重置标记，确保滚动监听能检测到
    setTimeout(() => {
      isUserAction.value = false
    }, 100)
  }
}

// 处理重新生成按钮点击
const handleRegenerate = (message: Message) => {
  emit('regenerate-message', message)
}

// 处理编辑按钮点击
const handleEdit = (message: Message) => {
  editingMessage.value = { ...message }
  editModalVisible.value = true
}


// 处理复制按钮点击
const handleCopy = async (message: Message) => {
  try {
    await navigator.clipboard.writeText(message.content)
    showToast({
      message: '消息已复制到剪贴板',
      type: 'success'
    })
  } catch (error) {
    console.error('复制失败:', error)
    showToast({
      message: '复制失败，请重试',
      type: 'error'
    })
  }
}

// 处理开始写作按钮点击
const handleStartWriting = (message: Message) => {
  // 触发开始写作事件，让父组件处理
  emit('start-writing', message)
}

// 处理编辑确认
const handleEditConfirm = (updatedMessage: Message) => {
  // 通过事件通知父组件更新消息
  emit('update:message', updatedMessage)
  editModalVisible.value = false
  editingMessage.value = null
}

// 处理编辑取消
const handleEditCancel = () => {
  editModalVisible.value = false
  editingMessage.value = null
}

// 滚动到底部的辅助函数
const scrollToBottom = (smooth = false) => {
  nextTick(() => {
    if (!messagesContainer.value) {
      console.warn('滚动失败：messagesContainer 未找到')
      return
    }

    console.log(`执行滚动操作: smooth=${smooth}, scrollHeight=${messagesContainer.value.scrollHeight}`)

    if (smooth) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 检测AI消息流式输出是否结束
const checkStreamingEnd = (messages: Message[]): boolean => {
  let hasStreamingEnd = false

  messages.forEach(message => {
    if (message.role === 'assistant' && message.content) {
      const messageId = message.id
      const currentStatus = {
        isStreaming: message.isStreaming ?? false,
        contentLength: message.content.length
      }

      const lastStatus = lastMessageStatus.value.get(messageId)

      if (lastStatus) {
        // 检测流式输出结束：之前是流式状态，现在不是了，或者内容长度不再变化且不是流式状态
        if ((lastStatus.isStreaming && !currentStatus.isStreaming) ||
          (!currentStatus.isStreaming && lastStatus.contentLength !== currentStatus.contentLength)) {
          console.log(`检测到消息 ${messageId} 流式输出结束`)
          hasStreamingEnd = true
        }
      }

      // 更新状态记录
      lastMessageStatus.value.set(messageId, currentStatus)
    }
  })

  return hasStreamingEnd
}

// 监听推理状态变化，自动展开推理消息
watch(() => props.messages, (newMessages) => {
  newMessages.forEach(message => {
    if (message.role === 'assistant' && message.isReasoning && message.reasoningContent) {
      // 正在推理时自动展开
      message.showReasoning = true
    } else if (message.role === 'assistant' && !message.isReasoning && message.content) {
      // 开始输出正式内容时自动收起推理消息
      message.showReasoning = false
    }
  })
}, { deep: true })

// 监听消息变化，处理自动滚动
watch(() => props.messages, (newMessages, oldMessages) => {
  // 如果是用户手动操作（如点击推理消息），不自动滚动
  if (isUserAction.value) {
    return
  }

  nextTick(() => {
    if (!messagesContainer.value) return

    let shouldScroll = false
    let useSmooth = false

    // 情况1：初始加载消息
    if (!oldMessages && newMessages.length > 0) {
      console.log('初始加载消息，滚动到底部')
      shouldScroll = true
      useSmooth = false
    }
    // 情况2：有新消息添加
    else if (oldMessages && newMessages.length > oldMessages.length) {
      console.log('检测到新消息添加，滚动到底部')
      shouldScroll = true
      useSmooth = true
    }
    // 情况3：检测AI流式输出结束
    else if (oldMessages && newMessages.length === oldMessages.length) {
      const streamingEnded = checkStreamingEnd(newMessages)
      if (streamingEnded) {
        console.log('检测到AI流式输出结束，滚动到底部')
        shouldScroll = true
        useSmooth = true
      }
    }

    if (shouldScroll) {
      scrollToBottom(useSmooth)
    }
  })
}, { deep: true })

// 暴露给父组件的方法
defineExpose({
  scrollToBottom
})
</script>

<style scoped>
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }

  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

/* Markdown样式 */
:deep(.markdown-content) {
  line-height: 1.6;
}

:deep(.markdown-content h1),
:deep(.markdown-content h2),
:deep(.markdown-content h3),
:deep(.markdown-content h4),
:deep(.markdown-content h5),
:deep(.markdown-content h6) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

:deep(.markdown-content h1) {
  font-size: 1.5em;
}

:deep(.markdown-content h2) {
  font-size: 1.3em;
}

:deep(.markdown-content h3) {
  font-size: 1.1em;
}

:deep(.markdown-content p) {
  margin-bottom: 0.1em;
}

:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  /* margin-left: 1.5em; */
  margin-bottom: 0.5em;
}

:deep(.markdown-content li) {
  margin-bottom: 0.25em;
}

:deep(.markdown-content code) {
  background-color: var(--bg-secondary);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

:deep(.markdown-content pre) {
  background-color: var(--bg-secondary);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 0.5em;
}

:deep(.markdown-content pre code) {
  background-color: transparent;
  padding: 0;
}

:deep(.markdown-content blockquote) {
  border-left: 4px solid var(--border-color);
  padding-left: 1em;
  margin-left: 0;
  margin-bottom: 0.5em;
  color: var(--text-secondary);
}

:deep(.markdown-content table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0.5em;
}

:deep(.markdown-content th),
:deep(.markdown-content td) {
  border: 1px solid var(--border-color);
  padding: 0.5em;
  text-align: left;
}

:deep(.markdown-content th) {
  background-color: var(--bg-secondary);
  font-weight: 600;
}
</style>