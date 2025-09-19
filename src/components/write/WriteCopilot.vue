<template>
  <div class="h-full flex flex-col bg-[var(--bg-primary)]">
    <CopilotHeader :conversations="conversations" :current-conversation="currentConversation" :book-id="bookId"
      @new-conversation="handleNewConversation" @select-conversation="handleSelectConversation"
      @conversations-updated="handleConversationsUpdated" @open-settings="handleOpenSettings"
      @settings-saved="handleSettingsSaved" />

    <MessageList :messages="messages" :is-loading="isLoading" />

    <InputArea :disabled="isLoading" @send-message="handleSendMessage" @at-resource="handleAtResource"
      @clear-conversation="handleClearConversation" @stop-conversation="handleStopConversation"
      @entry-setting="handleEntrySetting" @worldview="handleWorldview" @character-profile="handleCharacterProfile"
      ref="inputAreaRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CopilotHeader from './copilot/CopilotHeader.vue'
import MessageList from './copilot/MessageList.vue'
import InputArea from './copilot/InputArea.vue'
import { streamChapterOutline } from '@/services'
import type { Message, Conversation } from '../../utils/types'
import type { CopilotSettings } from '../../utils/types'
import type { ChatMessage } from '@/services/chat'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { ConversationStorage } from '../../utils/conversationStorage'

// Props
const props = defineProps<{
  bookId: number
}>()

// 消息列表
const messages = ref<Message[]>([])
const isLoading = ref(false)
const inputAreaRef = ref<InstanceType<typeof InputArea>>()

// 对话管理
const conversations = ref<Conversation[]>([])
const currentConversation = ref<Conversation | null>(null)

// 功能配置
const featureConfigsStore = useFeatureConfigsStore()

// Copilot设置
const copilotSettings = ref<CopilotSettings>({
  contextLength: 3
})

// 流式响应控制器
let streamController: AbortController | null = null

// 处理发送消息
const handleSendMessage = async (content: string) => {
  if (!content.trim()) return

  // 添加用户消息
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: content.trim(),
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  // 如果没有当前对话，创建新对话（但先不保存到存储）
  if (!currentConversation.value) {
    currentConversation.value = ConversationStorage.createNewConversation(props.bookId, [userMessage])
  } else {
    // 更新当前对话的消息
    currentConversation.value.messages = [...messages.value]
  }

  // 开始生成回复
  await generateResponse(content.trim())
}

// 生成AI回复
const generateResponse = async (userInput: string) => {
  isLoading.value = true

  try {
    // 获取章节细纲配置
    const featureConfig = await featureConfigsStore.getConfigByFeatureName('chapter_planning')
    if (!featureConfig) {
      throw new Error('章节细纲功能未配置')
    }

    // 创建AI消息（用于正式回复）
    const aiMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }

    // 创建流式控制器
    streamController = new AbortController()

    // 构建章节细纲上下文
    const context = {
      bookTitle: '当前书籍', // 可以从store获取实际数据
      chapterTitle: userInput,
      content: ''
    }

    // 创建独立的推理消息
    const reasoningMessage: Message = {
      id: `reasoning-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      reasoningContent: '',
      isReasoning: true,
      showReasoning: true
    }
    messages.value.push(reasoningMessage)

    // 将AI消息添加到消息列表
    messages.value.push(aiMessage)

    // 准备历史消息和上下文选项
    const chatMessages: ChatMessage[] = messages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const chapterOutlineOptions = {
      contextLength: copilotSettings.value.contextLength,
      messages: chatMessages
    }

    // 流式生成章节细纲
    for await (const { type, text } of streamChapterOutline(context, featureConfig, chapterOutlineOptions)) {
      if (streamController?.signal.aborted) {
        break
      }

      if (type === 'reasoning') {
        // 处理推理内容
        reasoningMessage.reasoningContent += text
      } else {
        // 处理正式内容
        aiMessage.content += text
        if (reasoningMessage.isReasoning) {
          // 第一次收到正式内容，停止推理状态
          reasoningMessage.isReasoning = false
          reasoningMessage.showReasoning = false
        }
      }

      // 触发视图更新
      messages.value = [...messages.value]
    }

    // 确保推理状态结束
    reasoningMessage.isReasoning = false

    // AI回复完成，自动保存对话
    if (currentConversation.value) {
      currentConversation.value.messages = [...messages.value]

      // 只有在有实际消息内容时才保存对话
      if (currentConversation.value.messages.length > 0) {
        // 更新对话标题（基于第一条用户消息）
        if (currentConversation.value.messages.filter(msg => msg.role === 'user').length === 1) {
          currentConversation.value.title = ConversationStorage.generateTitle(currentConversation.value.messages)
        }

        // 检查是否应该添加新对话还是更新现有对话
        const isExistingConversation = conversations.value.some(c => c.id === currentConversation.value!.id)

        if (isExistingConversation) {
          // 更新现有对话
          ConversationStorage.updateConversation(props.bookId, currentConversation.value.id, currentConversation.value.messages)
        } else {
          // 添加新对话：使用unshift添加到列表顶部，然后保存到存储
          conversations.value.unshift(currentConversation.value)
          ConversationStorage.addConversation(props.bookId, currentConversation.value)
        }
      }
    }

  } catch (error) {
    console.error('生成章节细纲失败:', error)

    // 添加错误消息
    const errorMessage: Message = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: `抱歉，生成章节细纲时出现错误：${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: new Date()
    }
    messages.value.push(errorMessage)

    // 错误时也要保存对话
    if (currentConversation.value) {
      currentConversation.value.messages = [...messages.value]
      if (currentConversation.value.messages.length > 0) {
        // 更新对话标题（基于第一条用户消息）
        if (currentConversation.value.messages.filter(msg => msg.role === 'user').length === 1) {
          currentConversation.value.title = ConversationStorage.generateTitle(currentConversation.value.messages)
        }

        // 使用相同逻辑：更新现有对话而不是重复添加
        const isExistingConversation = conversations.value.some(c => c.id === currentConversation.value!.id)
        if (isExistingConversation) {
          ConversationStorage.updateConversation(props.bookId, currentConversation.value.id, currentConversation.value.messages)
        } else {
          // 添加新对话：使用unshift添加到列表顶部，然后保存到存储
          conversations.value.unshift(currentConversation.value)
          ConversationStorage.addConversation(props.bookId, currentConversation.value)
        }
      }
    }
  } finally {
    isLoading.value = false
    streamController = null
  }
}

// 处理引用资源
const handleAtResource = () => {
  // 引用资源功能（现在由InputArea内部处理弹窗）
}

// 处理词条设定
const handleEntrySetting = () => {
  console.log('词条设定功能')
  // 这里可以添加词条设定的具体逻辑
}

// 处理世界观
const handleWorldview = () => {
  console.log('世界观功能')
  // 这里可以添加世界观的具体逻辑
}

// 处理人物档案
const handleCharacterProfile = () => {
  console.log('人物档案功能')
  // 这里可以添加人物档案的具体逻辑
}

// 清空对话
const handleClearConversation = () => {
  messages.value = []
  streamController?.abort()
  streamController = null
}

// 停止对话
const handleStopConversation = () => {
  if (streamController) {
    streamController.abort()
    streamController = null
    isLoading.value = false
  }
}

// 新建对话
const handleNewConversation = () => {
  handleClearConversation()
  currentConversation.value = null
}

// 选择对话
const handleSelectConversation = (conversation: Conversation) => {
  currentConversation.value = conversation
  messages.value = [...conversation.messages]
}

// 对话列表更新
const handleConversationsUpdated = (updatedConversations: Conversation[]) => {
  conversations.value = updatedConversations
}

// 打开设置
const handleOpenSettings = () => {
  // 打开功能设置页面
}

// 处理设置保存
const handleSettingsSaved = (settings: CopilotSettings) => {
  copilotSettings.value = settings
}

// 加载保存的设置
const loadSavedSettings = () => {
  try {
    const settingsKey = `copilot-settings-${props.bookId}`
    const savedSettings = localStorage.getItem(settingsKey)

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as CopilotSettings
      copilotSettings.value = parsed
    }
  } catch (error) {
    console.error('加载Copilot设置失败:', error)
  }
}

// 加载对话历史
const loadConversations = () => {
  conversations.value = ConversationStorage.loadConversations(props.bookId)
}

// 组件挂载时初始化
onMounted(() => {
  // 确保功能配置已加载
  if (featureConfigsStore.configs.length === 0) {
    featureConfigsStore.loadFeatureConfigs()
  }

  // 加载保存的设置
  loadSavedSettings()

  // 加载对话历史
  loadConversations()

  // 自动加载最新对话
  const latestConversation = ConversationStorage.getLatestConversation(props.bookId)
  if (latestConversation) {
    handleSelectConversation(latestConversation)
  }
})
</script>
