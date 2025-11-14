<template>
  <div class="h-full flex flex-col bg-[var(--bg-secondary)]">
    <!-- 顶部导航栏 -->
    <div class="p-5 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="goBack"
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-all duration-300">
            <ChevronLeft class="w-5 h-5 text-[var(--text-primary)]" />
          </button>
          <h1 class="text-2xl font-semibold text-[var(--text-primary)]">{{ generatorConfig?.name || '生成器' }}</h1>
        </div>
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="flex flex-1 overflow-hidden relative">
      <!-- 左侧历史对话记录（绝对定位） -->
      <div
        class="absolute left-0 top-0 h-full bg-[var(--bg-primary)] border-r border-[var(--border-color)] flex flex-col transition-transform duration-300 ease-in-out z-20 w-64"
        :class="isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'">
        <!-- 顶部新建对话按钮 -->
        <div class="p-3 flex items-center justify-between">
          <button @click="handleNewConversation"
            class="px-4 py-2 bg-white border border-[var(--border-color)] text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-all duration-300 flex items-center gap-2">
            <Plus class="w-4 h-4" />
            <span>开始新对话</span>
          </button>
          <!-- 收起按钮 -->
          <button @click="toggleSidebar"
            class="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-all duration-300">
            <ChevronRight class="w-4 h-4 text-[var(--text-primary)]" />
          </button>
        </div>

        <!-- 历史对话列表 -->
        <div class="flex-1 overflow-y-auto p-3 pt-0">
          <div v-if="conversations.length === 0" class="text-center text-sm text-[var(--text-secondary)] py-8">
            暂无对话历史
          </div>

          <div v-else class="space-y-2">
            <div v-for="conversation in conversations" :key="conversation.id" @click="selectConversation(conversation)"
              class="group relative px-3 py-2 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] cursor-pointer transition-all hover:border-[var(--theme-bg)]"
              :class="{ 'border-[var(--theme-bg)] bg-[var(--blue-100)]': currentConversation?.id === conversation.id }">
              <div class="flex items-center">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-[var(--text-primary)] truncate"
                      :title="getFirstUserMessage(conversation)">
                      {{ getFirstUserMessage(conversation) || '新对话' }}
                    </h4>
                  </div>
                </div>
              </div>

              <!-- 操作按钮（hover时显示在右上角） -->
              <div
                class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-[var(--bg-secondary)] px-1.5 py-1 rounded-full border border-[var(--border-color)]">
                <button @click.stop="deleteConversation(conversation.id)"
                  class="p-1 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-100 rounded-full transition-all"
                  title="删除对话">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 收起后的胶囊按钮（左上角） -->
      <div v-if="isSidebarCollapsed" class="absolute top-3 left-3 z-30">
        <div class="flex items-center bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full">
          <button @click="toggleSidebar"
            class="p-2 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-l-full transition-all duration-300"
            title="展开侧边栏">
            <Menu class="w-4 h-4" />
          </button>
          <div class="w-px h-6 bg-[var(--border-color)]"></div>
          <button @click="handleNewConversation"
            class="p-2 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-r-full transition-all duration-300"
            title="新建对话">
            <Plus class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 右侧对话区域（居中的主体区域） -->
      <div class="flex-1 flex flex-col h-full relative transition-all duration-300 ease-in-out"
        :class="{ 'ml-0': isSidebarCollapsed, 'ml-64': !isSidebarCollapsed }" style="min-width: 0;">

        <!-- 消息列表容器 -->
        <div class="flex-1 flex items-start justify-center relative" style="min-width: 0;">
          <!-- 消息列表（主体区域） -->
          <div class="absolute inset-0 overflow-y-auto pb-40" ref="messageContainer" style="right: 0;">
            <div class="flex flex-col items-center justify-start min-h-full p-4 pt-8">
              <div class="w-full max-w-4xl message-content" style="max-width: 900px;">
                <div v-if="currentConversation?.messages.length === 0"
                  class="flex flex-col items-center justify-center min-h-[60vh] text-[var(--text-secondary)] py-12">
                  <div class="mb-6">
                    <Lightbulb v-if="generatorType === 'idea'"
                      class="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-60" />
                    <BookOpen v-else-if="generatorType === 'book-title'"
                      class="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-60" />
                    <FileText v-else class="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-60" />
                  </div>
                  <p class="text-xl mb-3 font-medium">开始与AI助手对话</p>
                  <p class="text-sm opacity-80">输入您的想法或问题，AI将为您提供创意和灵感</p>
                </div>

                <div v-else class="space-y-4">
                  <div v-for="message in currentConversation?.messages || []" :key="message.id">
                    <!-- 推理消息（仅对助手消息显示） -->
                    <div v-if="message.role === 'assistant' && (message.reasoningContent || message.isReasoning)"
                      class="flex justify-start mb-2">
                      <div
                        class="max-w-[80%] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl message-bubble reasoning-container">
                        <!-- 推理消息头部（可点击展开/收起） -->
                        <div
                          class="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[var(--hover-bg)] rounded-t-2xl"
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
                          <div class="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{{
                            message.reasoningContent
                          }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- 正常消息 -->
                    <div class="flex w-full" :class="{ 'justify-end': message.role === 'user' }">
                      <div class="message-container" :class="{
                        'order-2': message.role === 'user',
                        'user-message': message.role === 'user',
                        'assistant-message': message.role === 'assistant'
                      }" :style="message.role === 'user' ? {
                        width: calculateMessageWidth(message.content)
                      } : {}">
                        <div class="px-4 py-3 rounded-2xl message-bubble" :class="[
                          message.role === 'user'
                            ? 'bg-[var(--theme-bg)] text-white'
                            : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]',
                          message.role === 'user' ? 'w-fit' : 'w-full'
                        ]" :data-role="message.role">
                          <div v-if="message.role === 'user'" class="whitespace-pre-wrap">{{ message.content }}</div>
                          <div v-else class="text-sm markdown-content" v-html="renderMarkdown(message.content)"></div>
                          <div v-if="message.isStreaming" class="flex items-center gap-1 mt-2">
                            <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0ms">
                            </div>
                            <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 150ms">
                            </div>
                            <div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 300ms">
                            </div>
                          </div>
                        </div>
                        <!-- 消息操作工具栏（仅对AI消息显示） -->
                        <div v-if="message.role === 'assistant' && message.content && !message.isStreaming"
                          class="flex items-center gap-2 mt-2 px-1">
                          <button @click="handleCopyMessage(message)"
                            class="flex items-center p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded transition-colors"
                            title="复制消息">
                            <Copy class="w-4 h-4" />
                          </button>
                          <button @click="handleRegenerateMessage(message)"
                            class="flex items-center p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded transition-colors"
                            title="重新生成">
                            <RefreshCw class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 悬浮输入区域（绝对定位在底部） -->
      <div class="absolute bottom-0 left-0 right-0 flex justify-center p-3 z-10 transition-all duration-300 ease-in-out"
        :class="{ 'pl-4': isSidebarCollapsed, 'pl-68': !isSidebarCollapsed }" style="right: 0;">
        <!-- 输入区域（圆角矩形，悬浮效果） -->
        <div
          class="w-full max-w-4xl bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] p-3 message-content"
          style="max-width: 900px;">
          <div class="flex gap-2">
            <textarea v-model="inputText" @keydown.enter.prevent="handleEnterKey" placeholder="输入消息..."
              :disabled="isLoading" rows="2"
              class="flex-1 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none transition-all duration-300 focus:border-[var(--theme-bg)]"></textarea>
            <div class="flex flex-col gap-2">
              <button @click="handleSendMessage" :disabled="isLoading || !inputText.trim()"
                class="px-4 py-2 bg-[var(--theme-bg)] text-white rounded-2xl hover:bg-[var(--theme-hover)] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Trash2, Send, Loader2, Lightbulb, BookOpen, FileText, ChevronDown, ChevronLeft, Copy, RefreshCw, ChevronRight, Menu } from 'lucide-vue-next'
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
const router = useRouter()

// 状态
const generatorType = ref<GeneratorType>('idea')
const conversations = ref<Conversation[]>([])
const currentConversation = ref<Conversation | null>(null)
const inputText = ref('')
const isLoading = ref(false)
const messageContainer = ref<HTMLElement>()
const abortController = ref<AbortController | null>(null)
const { showErrorModal } = useErrorModal()
const isSidebarCollapsed = ref(false)

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
    const featureConfig = featureConfigs.find(config => config.feature_name === 'flagship_model')
    if (!featureConfig) {
      throw new Error('未找到旗舰模型配置，请在功能设置中配置旗舰模型参数')
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

// 获取第一条用户消息
const getFirstUserMessage = (conversation: Conversation): string => {
  if (!conversation.messages || conversation.messages.length === 0) {
    return '新对话'
  }

  const firstUserMessage = conversation.messages.find(msg => msg.role === 'user')
  if (!firstUserMessage) {
    return '新对话'
  }

  const content = firstUserMessage.content.trim()
  if (content.length <= 15) {
    return content
  }

  return content.substring(0, 15) + '...'
}

// 处理复制消息
const handleCopyMessage = async (message: Message) => {
  try {
    await navigator.clipboard.writeText(message.content)
    // 这里可以添加一个提示，暂时先简单处理
    console.log('消息已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 处理重新生成消息
const handleRegenerateMessage = async (message: Message) => {
  if (!currentConversation.value || isLoading.value) return

  // 找到这条AI消息之前的用户消息
  const messageIndex = currentConversation.value.messages.findIndex(m => m.id === message.id)
  if (messageIndex <= 0) return

  const userMessage = currentConversation.value.messages[messageIndex - 1]
  if (userMessage.role !== 'user') return

  // 删除原来的AI消息
  currentConversation.value.messages.splice(messageIndex, 1)

  // 创建新的助手消息
  const newAssistantMessage: Message = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true
  }

  currentConversation.value.messages.splice(messageIndex, 0, newAssistantMessage)
  isLoading.value = true

  try {
    // 获取功能配置
    const featureConfigs = await window.electronAPI.getFeatureConfigs()
    const featureConfig = featureConfigs.find(config => config.feature_name === 'flagship_model')
    if (!featureConfig) {
      throw new Error('未找到旗舰模型配置，请在功能设置中配置旗舰模型参数')
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
      userMessage.content,
      featureConfig,
      chatHistory,
      abortController.value.signal
    )) {
      if (abortController.value?.signal.aborted) break

      // 处理推理内容
      if (chunk.reasoning_content) {
        reasoningContent += chunk.reasoning_content
        newAssistantMessage.reasoningContent = reasoningContent
        newAssistantMessage.isReasoning = true
        newAssistantMessage.showReasoning = true
      }

      // 处理正式内容
      if (chunk.content) {
        fullContent += chunk.content
        newAssistantMessage.content = fullContent

        // 如果有正式内容，说明推理阶段结束
        if (newAssistantMessage.isReasoning) {
          newAssistantMessage.isReasoning = false
        }
      }

      // 滚动到底部
      await nextTick()
      scrollToBottom()
    }

    // 完成流式输出
    newAssistantMessage.isStreaming = false

    // 保存对话
    GeneratorConversationStorage.updateConversation(
      generatorType.value,
      currentConversation.value.id,
      currentConversation.value.messages
    )

    // 更新对话列表
    loadConversations()

  } catch (error: any) {
    console.error('重新生成内容失败:', error)
    newAssistantMessage.content = '重新生成内容时出错，请稍后重试。'
    newAssistantMessage.isStreaming = false

    showErrorModal({
      title: '重新生成失败',
      message: error.message || '重新生成内容时发生未知错误'
    })
  } finally {
    isLoading.value = false
    abortController.value = null

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 切换侧边栏展开/收起状态
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 根据消息内容计算合适的宽度
const calculateMessageWidth = (content: string): string => {
  if (!content || content.trim().length === 0) return 'auto'

  const charCount = content.length

  // 基础宽度计算：每个字符约8px，加上内边距
  let baseWidth = charCount * 8 + 32 // 32px是左右内边距总和

  // 考虑换行符的影响
  const lineBreaks = (content.match(/\n/g) || []).length
  if (lineBreaks > 0) {
    // 有换行时，宽度基于最长行
    const lines = content.split('\n')
    const longestLine = Math.max(...lines.map(line => line.length))
    baseWidth = longestLine * 8 + 32
  }

  // 设置最小和最大宽度
  const minWidth = 120 // 最小宽度
  const maxWidth = Math.min(800, window.innerWidth * 0.85) // 最大宽度，不超过屏幕85%且不超过800px

  // 应用限制
  const finalWidth = Math.max(minWidth, Math.min(baseWidth, maxWidth))

  return `${finalWidth}px`
}

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

/* 确保滚动条在整个右侧区域的最右侧显示 */
.overflow-y-auto {
  scrollbar-gutter: stable;
  /* 添加右侧内边距，确保滚动条不会贴边 */
  padding-right: 4px;
  /* 确保滚动区域占用全部可用宽度 */
  width: 100%;
}

/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 10px;
  /* 确保滚动条在内容的右侧 */
  margin-left: 8px;
  /* 添加右侧边距，使滚动条不贴边 */
  margin-right: 2px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  /* 添加右侧间距和圆角 */
  margin-right: 2px;
  border-radius: 5px;
  /* 添加细微的边框 */
  border: 1px solid var(--border-color);
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: var(--text-tertiary);
  border-radius: 5px;
  /* 确保滚动条不会贴边 */
  border: 2px solid var(--bg-secondary);
  /* 添加渐变效果 */
  background: linear-gradient(to bottom, var(--text-tertiary), var(--text-secondary));
  /* 添加阴影效果 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-primary);
  /* 悬停时增强阴影 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* 滚动条角落样式 */
.overflow-y-auto::-webkit-scrollbar-corner {
  background: var(--bg-secondary);
}

/* 确保内容区域有足够的右侧空间 */
.message-content {
  padding-right: 20px;
  /* 确保内容不会紧贴滚动条 */
  max-width: calc(100% - 20px);
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .message-content {
    padding-right: 16px;
    max-width: calc(100% - 16px);
  }

  .overflow-y-auto::-webkit-scrollbar {
    width: 8px;
  }

  /* 在中等屏幕上调整消息容器最大宽度 */
  .message-container {
    max-width: 90%;
  }

  .user-message {
    max-width: min(700px, 90%);
  }

  .reasoning-container {
    max-width: 90%;
  }
}

@media (max-width: 768px) {
  .message-content {
    padding-right: 12px;
    max-width: calc(100% - 12px);
  }

  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  /* 在小屏幕上进一步调整消息容器最大宽度 */
  .message-container {
    max-width: 95%;
  }

  .user-message {
    max-width: min(600px, 95%);
  }

  .reasoning-container {
    max-width: 95%;
  }
}

/* 超大屏幕上的最大宽度限制 */
@media (min-width: 1440px) {
  .message-content {
    max-width: 1000px;
  }

  .message-container {
    max-width: 80%;
  }

  .user-message {
    max-width: min(900px, 80%);
  }

  .reasoning-container {
    max-width: 80%;
  }
}

/* 消息容器基础样式 */
.message-container {
  max-width: 85%;
}

/* 用户消息容器 */
.user-message {
  width: fit-content;
  min-width: fit-content;
  max-width: min(800px, 85%);
}

/* 助手消息容器 */
.assistant-message {
  width: 100%;
}

/* 确保消息气泡不会超出容器 */
.message-bubble {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* 用户消息气泡样式 */
.message-bubble[data-role="user"] {
  width: fit-content;
  min-width: fit-content;
  max-width: 100%;
  display: inline-block;
}

/* 助手消息气泡样式 */
.message-bubble[data-role="assistant"] {
  width: 100%;
}

/* 推理消息容器 */
.reasoning-container {
  max-width: 85%;
}

/* 输入框响应式调整 */
@media (max-width: 640px) {
  textarea {
    max-height: 120px;
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
  color: var(--text-primary);
}

:deep(.markdown-content pre) {
  background-color: var(--bg-secondary);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 0.5em;
  border: 1px solid var(--border-color);
}

:deep(.markdown-content pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

:deep(.markdown-content blockquote) {
  border-left: 4px solid var(--border-color);
  padding-left: 1em;
  margin-left: 0;
  margin-bottom: 0.5em;
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  padding: 0.5em 1em;
  border-radius: 0 4px 4px 0;
}

:deep(.markdown-content table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0.5em;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
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
  color: var(--text-primary);
}

:deep(.markdown-content td) {
  color: var(--text-primary);
}

:deep(.markdown-content a) {
  color: var(--theme-bg);
  text-decoration: none;
}

:deep(.markdown-content a:hover) {
  text-decoration: underline;
  color: var(--theme-hover);
}
</style>