<template>
  <div class="flex-1 overflow-y-auto p-4" ref="messagesContainer">
    <!-- 消息列表 -->
    <div v-if="messages.length > 0 || isLoading">
      <div v-for="message in messages" :key="message.id" class="mb-4">
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
                  {{ message.isReasoning ? '深度思考中...' : '思考过程' }}
                </span>
              </div>
              <ChevronDown class="w-4 h-4 text-[var(--text-tertiary)] transition-transform"
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
          'max-w-[80%] rounded-2xl px-4 py-3',
          message.role === 'user'
            ? 'ml-auto bg-[var(--sky-100)] text-[var(--text-primary)]'
            : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'
        ]">
          <div class="text-sm markdown-content" v-html="renderMarkdown(message.content)"></div>
        </div>
        <!-- 操作栏（仅对正式的AI消息显示） -->
        <div v-if="message.role === 'assistant' && message.content && !message.isReasoning"
          class="flex justify-start mt-2">
          <div class="max-w-[80%] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-2">
            <div class="flex items-center gap-2">
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
              <button @click="handleSend(message)"
                class="flex items-center px-2 py-1 text-white bg-[var(--theme-bg)] hover:bg-[var(--theme-hover)] rounded-lg transition-colors"
                title="发送消息">
                <Send class="w-4 h-4" />
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
import { ref, watch } from 'vue'
import { marked } from 'marked'
import { Edit, Copy, Send, ChevronDown } from 'lucide-vue-next'
import type { Message, MessageListProps } from '../../../utils/types'
import MessageEditModal from '../../modal/MessageEditModal.vue'
import Toast from '../../shared/Toast.vue'

const props = defineProps<MessageListProps>()
const emit = defineEmits<{
  'update:message': [message: Message]
}>()
const messagesContainer = ref<HTMLElement>()

// 编辑 modal 状态
const editModalVisible = ref(false)
const editingMessage = ref<Message | null>(null)

// Toast 提示状态
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')

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

// 切换推理消息显示状态
const toggleReasoning = (message: Message) => {
  if (message.reasoningContent) {
    message.showReasoning = !message.showReasoning
  }
}

// 处理编辑按钮点击
const handleEdit = (message: Message) => {
  editingMessage.value = { ...message }
  editModalVisible.value = true
}

// 显示提示
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = true
}

// 处理复制按钮点击
const handleCopy = async (message: Message) => {
  try {
    await navigator.clipboard.writeText(message.content)
    showToast('消息已复制到剪贴板', 'success')
  } catch (error) {
    console.error('复制失败:', error)
    showToast('复制失败，请重试', 'error')
  }
}

// 处理发送按钮点击
const handleSend = (message: Message) => {
  // 这里可以实现重新发送消息的逻辑
  console.log('重新发送消息:', message.content)
  // 可以触发一个事件，让父组件处理重新发送
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