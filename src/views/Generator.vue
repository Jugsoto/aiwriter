<template>
  <div class="flex h-full bg-[var(--bg-secondary)]">
    <!-- 左侧历史对话记录 -->
    <div class="w-64 bg-[var(--bg-primary)] border-r border-[var(--border-color)] flex flex-col">
      <!-- 顶部新建对话按钮 -->
      <div class="p-4 border-b border-[var(--border-color)]">
        <button @click="handleNewConversation"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:opacity-90 transition-opacity">
          <Plus class="w-4 h-4" />
          <span>新建对话</span>
        </button>
      </div>

      <!-- 历史对话列表 -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="conversations.length === 0" class="text-center text-sm text-[var(--text-secondary)] py-8">
          暂无对话历史
        </div>

        <div v-else class="space-y-2">
          <div v-for="conversation in conversations" :key="conversation.id" @click="selectConversation(conversation)"
            class="p-3 rounded-lg cursor-pointer transition-colors hover:bg-[var(--bg-secondary)]"
            :class="{ 'bg-[var(--bg-secondary)]': currentConversation?.id === conversation.id }">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-[var(--text-primary)] truncate" :title="conversation.title">
                  {{ conversation.title }}
                </h4>
                <p class="text-xs text-[var(--text-secondary)] mt-1">
                  {{ formatDate(conversation.updatedAt) }}
                </p>
              </div>
              <button @click.stop="deleteConversation(conversation.id)"
                class="p-1 hover:bg-[var(--bg-primary)] rounded transition-colors ml-2 flex-shrink-0" title="删除对话">
                <Trash2 class="w-3 h-3 text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧对话区域 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部标题栏 -->
      <div class="p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
        <h2 class="text-lg font-semibold text-[var(--text-primary)]">
          {{ generatorConfig?.name || '生成器' }}
        </h2>
        <p class="text-sm text-[var(--text-secondary)] mt-1">
          与AI助手对话，获取创意和灵感
        </p>
      </div>

      <!-- 消息列表 -->
      <div class="flex-1 overflow-y-auto p-4" ref="messageContainer">
        <div v-if="currentConversation?.messages.length === 0" class="text-center text-[var(--text-secondary)] py-12">
          <div class="mb-4">
            <Lightbulb v-if="generatorType === 'idea'" class="w-12 h-12 mx-auto text-[var(--text-secondary)]" />
            <BookOpen v-else-if="generatorType === 'book-title'"
              class="w-12 h-12 mx-auto text-[var(--text-secondary)]" />
            <FileText v-else class="w-12 h-12 mx-auto text-[var(--text-secondary)]" />
          </div>
          <p class="text-lg mb-2">开始与AI助手对话</p>
          <p class="text-sm">输入您的想法或问题，AI将为您提供创意和灵感</p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="message in currentConversation?.messages || []" :key="message.id">
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
                  <ChevronDown v-if="!message.isReasoning"
                    class="w-4 h-4 text-[var(--text-tertiary)] transition-transform"
                    :class="{ 'rotate-180': message.showReasoning }" />
                </div>
                <!-- 推理内容 -->
                <div v-if="message.showReasoning && message.reasoningContent"
                  class="px-4 pb-3 pt-1 border-t border-[var(--border-color)]">
                  <div class="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{{ message.reasoningContent }}
                  </div>
                </div>
              </div>
            </div>
            <!-- 正常消息 -->
            <div class="flex" :class="{ 'justify-end': message.role === 'user' }">
              <div class="max-w-3xl" :class="{ 'order-2': message.role === 'user' }">
                <div class="px-4 py-3 rounded-lg" :class="message.role === 'user'
                  ? 'bg-[var(--accent-color)] text-white'
                  : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]'">
                  <div v-if="message.role === 'user'" class="whitespace-pre-wrap">{{ message.content }}</div>
                  <div v-else class="text-sm markdown-content" v-html="renderMarkdown(message.content)"></div>
                  <div v-if="message.isStreaming" class="flex items-center gap-1 mt-2">
                    <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                </div>
                <p class="text-xs text-[var(--text-secondary)] mt-1 px-1"
                  :class="{ 'text-right': message.role === 'user' }">
                  {{ formatTime(message.timestamp) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
        <div class="flex gap-2">
          <textarea v-model="inputText" @keydown.enter.prevent="handleEnterKey" placeholder="输入消息..."
            :disabled="isLoading" rows="3"
            class="flex-1 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none"></textarea>
          <div class="flex flex-col gap-2">
            <button @click="handleSendMessage" :disabled="isLoading || !inputText.trim()"
              class="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              <Send v-if="!isLoading" class="w-4 h-4" />
              <Loader2 v-else class="w-4 h-4 animate-spin" />
            </button>
          </div>
        </div>
        <div class="mt-2 text-xs text-[var(--text-secondary)]">
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Trash2, Send, Loader2, Lightbulb, BookOpen, FileText, ChevronDown } from 'lucide-vue-next'
import { marked } from 'marked'
import { getGeneratorPrompt, type GeneratorType, type GeneratorPrompt, streamGenerateContent } from '@/services/generator'
import type { Conversation, Message } from '@/utils/types'
import type { ChatMessage } from '@/services/chat'
import { GeneratorConversationStorage } from '@/utils/generatorConversationStorage'
import { showConfirm } from '@/composables/useConfirm'
import { useErrorModal } from '@/composables/useErrorModal'

// Props
const props = defineProps<{
  type?: string
}>()

// 路由
const route = useRoute()

// 状态
const generatorType = ref<GeneratorType>('idea')
const conversations = ref<Conversation[]>([])
const currentConversation = ref<Conversation | null>(null)
const inputText = ref('')
const isLoading = ref(false)
const messageContainer = ref<HTMLElement>()
const abortController = ref<AbortController | null>(null)
const { showErrorModal } = useErrorModal()

// 生成器配置
const generatorConfig = ref<GeneratorPrompt | null>(null)

// 加载生成器配置
const loadGeneratorConfig = async () => {
  try {
    generatorConfig.value = await getGeneratorPrompt(generatorType.value)
  } catch (error) {
    console.error('加载生成器配置失败:', error)
  }
}


// 初始化
onMounted(async () => {
  // 从路由参数获取生成器类型
  if (props.type && ['idea', 'book-title', 'summary'].includes(props.type)) {
    generatorType.value = props.type as GeneratorType
  } else if (route.query.type && ['idea', 'book-title', 'summary'].includes(route.query.type as string)) {
    generatorType.value = route.query.type as GeneratorType
  }

  await loadGeneratorConfig()
  loadConversations()

  // 如果没有当前对话，创建新对话
  if (!currentConversation.value) {
    handleNewConversation()
  }
})

// 监听生成器类型变化
watch(generatorType, async () => {
  await loadGeneratorConfig()
  loadConversations()
  if (!currentConversation.value) {
    handleNewConversation()
  }
})

// 加载对话历史
const loadConversations = () => {
  conversations.value = GeneratorConversationStorage.loadConversations(generatorType.value)
  currentConversation.value = GeneratorConversationStorage.getLatestConversation(generatorType.value)
}

// 新建对话
const handleNewConversation = () => {
  const newConversation = GeneratorConversationStorage.createNewConversation(generatorType.value)
  conversations.value.unshift(newConversation)
  GeneratorConversationStorage.saveConversations(generatorType.value, conversations.value)
  currentConversation.value = newConversation
}

// 选择对话
const selectConversation = (conversation: Conversation) => {
  currentConversation.value = conversation
}

// 删除对话
const deleteConversation = async (conversationId: string) => {
  const confirmed = await showConfirm({
    title: '删除对话',
    message: '确定要删除这个对话吗？此操作不可恢复。',
    dangerous: true
  })

  if (confirmed) {
    GeneratorConversationStorage.deleteConversation(generatorType.value, conversationId)
    conversations.value = conversations.value.filter(c => c.id !== conversationId)

    if (currentConversation.value?.id === conversationId) {
      currentConversation.value = GeneratorConversationStorage.getLatestConversation(generatorType.value)
    }
  }
}

// 发送消息
const handleSendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value || !currentConversation.value) return

  const userMessage: Message = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: inputText.value.trim(),
    timestamp: new Date()
  }

  // 添加用户消息
  currentConversation.value.messages.push(userMessage)
  const userInput = inputText.value.trim()
  inputText.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 创建助手消息
  const assistantMessage: Message = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true
  }

  currentConversation.value.messages.push(assistantMessage)
  isLoading.value = true

  try {
    // 获取功能配置
    const featureConfigs = await window.electronAPI.getFeatureConfigs()
    const featureConfig = featureConfigs.find(config => config.feature_name === 'generator')
    if (!featureConfig) {
      throw new Error('未找到生成器功能配置，请在功能设置中配置生成器参数')
    }

    // 创建中止控制器
    abortController.value = new AbortController()

    // 转换消息格式为 ChatMessage
    const chatHistory: ChatMessage[] = currentConversation.value.messages
      .filter(msg => msg.role !== 'assistant' || msg.content) // 过滤掉空的助手消息
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    // 流式生成内容
    let fullContent = ''
    let reasoningContent = ''
    for await (const chunk of streamGenerateContent(
      generatorType.value,
      userInput,
      featureConfig,
      chatHistory,
      abortController.value.signal
    )) {
      if (abortController.value?.signal.aborted) break

      // 处理推理内容
      if (chunk.reasoning_content) {
        reasoningContent += chunk.reasoning_content
        assistantMessage.reasoningContent = reasoningContent
        assistantMessage.isReasoning = true
        assistantMessage.showReasoning = true
      }

      // 处理正式内容
      if (chunk.content) {
        fullContent += chunk.content
        assistantMessage.content = fullContent

        // 如果有正式内容，说明推理阶段结束
        if (assistantMessage.isReasoning) {
          assistantMessage.isReasoning = false
        }
      }

      // 滚动到底部
      await nextTick()
      scrollToBottom()
    }

    // 完成流式输出
    assistantMessage.isStreaming = false

    // 更新对话标题（如果是第一条用户消息）
    if (currentConversation.value.messages.length === 2) {
      currentConversation.value.title = GeneratorConversationStorage.generateTitle([userMessage])
    }

    // 保存对话
    GeneratorConversationStorage.updateConversation(
      generatorType.value,
      currentConversation.value.id,
      currentConversation.value.messages
    )

    // 更新对话列表
    loadConversations()

  } catch (error: any) {
    console.error('生成内容失败:', error)
    assistantMessage.content = '生成内容时出错，请稍后重试。'
    assistantMessage.isStreaming = false

    showErrorModal({
      title: '生成失败',
      message: error.message || '生成内容时发生未知错误'
    })
  } finally {
    isLoading.value = false
    abortController.value = null

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

// 格式化日期
const formatDate = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

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
    return '深度思考中...'
  }
  return '思考过程'
}

// 切换推理消息显示状态
const toggleReasoning = (message: Message) => {
  if (message.reasoningContent) {
    message.showReasoning = !message.showReasoning
  }
}

// 处理Enter键
const handleEnterKey = (event: KeyboardEvent) => {
  if (event.shiftKey) {
    // Shift+Enter 允许换行
    return
  } else {
    // 普通Enter发送消息
    event.preventDefault()
    handleSendMessage()
  }
}
</script>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--hover-bg);
}

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