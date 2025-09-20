<template>
  <div class="h-full flex flex-col bg-[var(--bg-primary)]">
    <CopilotHeader :conversations="conversations" :current-conversation="currentConversation" :book-id="bookId"
      @new-conversation="handleNewConversation" @select-conversation="handleSelectConversation"
      @conversations-updated="handleConversationsUpdated" @open-settings="handleOpenSettings"
      @settings-saved="handleSettingsSaved" />

    <MessageList :messages="messages" :is-loading="isLoading" />

    <InputArea :disabled="isLoading" :starred-settings="starredSettings" :settings-loading="settingsLoading"
      :book-id="bookId" :selected-settings="selectedSettings" @send-message="handleSendMessage"
      @at-resource="handleAtResource" @clear-conversation="handleClearConversation"
      @stop-conversation="handleStopConversation" @entry-setting="handleEntrySetting" @worldview="handleWorldview"
      @character-profile="handleCharacterProfile" @settings-updated="loadStarredSettings"
      @settings-selected="handleSettingsSelected" ref="inputAreaRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import CopilotHeader from './copilot/CopilotHeader.vue'
import MessageList from './copilot/MessageList.vue'
import InputArea from './copilot/InputArea.vue'
import { streamChapterOutline } from '@/services'
import type { Message, Conversation, EnhancedMessageContext } from '../../utils/types'
import type { CopilotSettings } from '../../utils/types'
import type { ChatMessage } from '@/services/chat'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { useSettingsStore } from '@/stores/settings'
import { useChaptersStore } from '@/stores/chapters'
import { useBooksStore } from '@/stores/books'
import { ConversationStorage } from '../../utils/conversationStorage'
import { CopilotSettingsStorage } from '../../utils/copilotSettingsStorage'
import type { Setting } from '@/electron.d'

// Props定义
const props = defineProps<{
  bookId: number
}>()

// 响应式状态
// 消息状态
const messages = ref<Message[]>([])
const isLoading = ref(false)
const inputAreaRef = ref<InstanceType<typeof InputArea>>()

// 对话管理
const conversations = ref<Conversation[]>([])
const currentConversation = ref<Conversation | null>(null)

// 设定管理
const starredSettings = ref<Setting[]>([])
const settingsLoading = ref(false)
const selectedSettings = ref<Setting[]>([])

// Copilot配置
const copilotSettings = ref<CopilotSettings>({
  contextLength: 3,
  previousChapterCount: 1,    // 默认前文章节数量为1
  chapterSummaryCount: 5      // 默认前文章节梗概数量为5
})

// Store实例
const featureConfigsStore = useFeatureConfigsStore()
const settingsStore = useSettingsStore()
const chaptersStore = useChaptersStore()
const booksStore = useBooksStore()

// 流控制器
let streamController: AbortController | null = null

// 消息处理
// 发送消息
const handleSendMessage = async (content: string | EnhancedMessageContext) => {
  let userInput: string
  let enhancedContext: EnhancedMessageContext | undefined

  // 解析输入内容
  if (typeof content === 'string') {
    userInput = content.trim()
    enhancedContext = {
      userInput,
      selectedSettings: selectedSettings.value.map(setting => ({
        name: setting.name,
        content: setting.content,
        status: setting.status,
        type: setting.type
      }))
    }
  } else {
    enhancedContext = content
    userInput = content.userInput
  }

  if (!userInput.trim()) return

  // 创建并添加用户消息
  const userMessage = createUserMessage(userInput)
  messages.value.push(userMessage)

  // 管理对话状态
  updateConversationState(userMessage)

  // 生成AI回复
  await generateResponse(userInput.trim(), enhancedContext)
}

// 创建用户消息
const createUserMessage = (content: string): Message => ({
  id: `user-${Date.now()}`,
  role: 'user',
  content: content.trim(),
  timestamp: new Date()
})

// 更新对话状态
const updateConversationState = (userMessage: Message) => {
  if (!currentConversation.value) {
    // 创建新对话（暂不保存到存储）
    currentConversation.value = ConversationStorage.createNewConversation(props.bookId, [userMessage])
  } else {
    // 更新现有对话的消息列表
    currentConversation.value.messages = [...messages.value]
  }
}

// AI回复生成
// 生成回复
const generateResponse = async (_userInput: string, enhancedContext?: EnhancedMessageContext) => {
  isLoading.value = true

  try {
    // 获取功能配置
    const featureConfig = await getFeatureConfig()

    // 构建生成上下文
    const context = await buildGenerationContext(enhancedContext)

    // 创建AI消息
    const { aiMessage, reasoningMessage } = createAIMessages()

    // 准备聊天历史
    const chatMessages = prepareChatHistory()

    // 流式生成回复
    await streamAIResponse(context, featureConfig, chatMessages, aiMessage, reasoningMessage)

    // 保存对话
    await saveConversation()

  } catch (error) {
    await handleGenerationError(error)
  } finally {
    isLoading.value = false
    streamController = null
  }
}

// 获取功能配置
const getFeatureConfig = async () => {
  const config = await featureConfigsStore.getConfigByFeatureName('chapter_planning')
  if (!config) {
    throw new Error('章节细纲功能未配置')
  }
  return config
}

// 构建生成上下文
const buildGenerationContext = async (enhancedContext?: EnhancedMessageContext) => {
  const [previousChapterContent, recentChapterSummaries, globalSettings] = await Promise.all([
    getPreviousChapterContent(),
    getRecentChapterSummaries(),
    getBookGlobalSettings()
  ])

  return {
    content: '',
    previousChapterContent,
    recentChapterSummaries,
    globalSettings,
    selectedSettings: enhancedContext?.selectedSettings || []
  }
}

// 创建AI消息
const createAIMessages = () => {
  const aiMessage: Message = {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: '',
    timestamp: new Date()
  }

  const reasoningMessage: Message = {
    id: `reasoning-${Date.now()}`,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    reasoningContent: '',
    isReasoning: true,
    showReasoning: true
  }

  messages.value.push(reasoningMessage, aiMessage)
  return { aiMessage, reasoningMessage }
}

// 准备聊天历史
const prepareChatHistory = (): ChatMessage[] => {
  return messages.value
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }))
}

// 流式生成回复
const streamAIResponse = async (
  context: any,
  featureConfig: any,
  chatMessages: ChatMessage[],
  aiMessage: Message,
  reasoningMessage: Message
) => {
  streamController = new AbortController()

  const chapterOutlineOptions = {
    contextLength: copilotSettings.value.contextLength,
    messages: chatMessages,
    previousChapterCount: copilotSettings.value.previousChapterCount,
    chapterSummaryCount: copilotSettings.value.chapterSummaryCount
  }

  try {
    for await (const { type, text } of streamChapterOutline(context, featureConfig, chapterOutlineOptions, streamController.signal)) {
      // 立即检查终止信号
      if (streamController?.signal.aborted) {
        console.log('检测到终止信号，停止流式输出')
        break
      }

      if (type === 'reasoning') {
        reasoningMessage.reasoningContent += text
      } else {
        aiMessage.content += text
        if (reasoningMessage.isReasoning) {
          reasoningMessage.isReasoning = false
          reasoningMessage.showReasoning = false
        }
      }

      // 触发视图更新
      messages.value = [...messages.value]

      // 每个chunk处理后都检查终止信号，确保快速响应
      if (streamController?.signal.aborted) {
        console.log('处理chunk时检测到终止信号，停止流式输出')
        break
      }
    }
  } catch (error: any) {
    // 处理用户终止的情况
    if (error.name === 'AbortError' || streamController?.signal.aborted) {
      console.log('流式输出被用户终止')
      // 添加终止提示消息
      const stopMessage: Message = {
        id: `stop-${Date.now()}`,
        role: 'assistant',
        content: '\n\n*对话已终止*',
        timestamp: new Date()
      }
      messages.value.push(stopMessage)
    } else {
      throw error
    }
  } finally {
    reasoningMessage.isReasoning = false
    // 立即更新加载状态
    if (streamController?.signal.aborted) {
      isLoading.value = false
    }
  }
}

// 保存对话
const saveConversation = async () => {
  if (!currentConversation.value || currentConversation.value.messages.length === 0) return

  // 更新对话标题（基于第一条用户消息）
  const userMessages = currentConversation.value.messages.filter(msg => msg.role === 'user')
  if (userMessages.length === 1) {
    currentConversation.value.title = ConversationStorage.generateTitle(currentConversation.value.messages)
  }

  // 更新当前对话的消息列表
  currentConversation.value.messages = [...messages.value]

  // 检查是否为现有对话
  const isExistingConversation = conversations.value.some(c => c.id === currentConversation.value!.id)

  if (isExistingConversation) {
    ConversationStorage.updateConversation(props.bookId, currentConversation.value.id, currentConversation.value.messages)
  } else {
    conversations.value.unshift(currentConversation.value)
    ConversationStorage.addConversation(props.bookId, currentConversation.value)
  }
}

// 处理生成错误
const handleGenerationError = async (error: any) => {
  console.error('生成章节细纲失败:', error)

  const errorMessage: Message = {
    id: `error-${Date.now()}`,
    role: 'assistant',
    content: `抱歉，生成章节细纲时出现错误：${error instanceof Error ? error.message : '未知错误'}`,
    timestamp: new Date()
  }
  messages.value.push(errorMessage)

  // 错误时也要保存对话
  await saveConversation()
}

// 事件处理
// 引用资源
const handleAtResource = () => {
  // 引用资源功能（现在由InputArea内部处理弹窗）
}

// 词条设定
const handleEntrySetting = () => {
  console.log('词条设定功能')
  // 这里可以添加词条设定的具体逻辑
}

// 世界观
const handleWorldview = () => {
  console.log('世界观功能')
  // 这里可以添加世界观的具体逻辑
}

// 人物档案
const handleCharacterProfile = () => {
  console.log('人物档案功能')
  // 这里可以添加人物档案的具体逻辑
}

// 设定选择
const handleSettingsSelected = (settings: Setting[]) => {
  selectedSettings.value = settings
}

// 清空对话
const handleClearConversation = () => {
  // 如果有当前对话，先删除它
  if (currentConversation.value) {
    ConversationStorage.deleteConversation(props.bookId, currentConversation.value.id)
    // 从对话列表中移除
    conversations.value = conversations.value.filter(c => c.id !== currentConversation.value!.id)
  }

  // 清空当前消息
  messages.value = []
  streamController?.abort()
  streamController = null

  // 重置当前对话为null，这样下次发送消息时会自动创建新对话
  currentConversation.value = null
}

// 停止对话
const handleStopConversation = () => {
  if (streamController) {
    console.log('用户点击终止按钮，立即终止流式输出')
    streamController.abort()
    streamController = null
    isLoading.value = false

    // 立即禁用输入框，提供即时反馈
    if (inputAreaRef.value) {
      inputAreaRef.value.focusInput()
    }
  }
}

// 创建新对话
const handleNewConversation = () => {
  // 停止任何正在进行的流
  if (streamController) {
    streamController.abort()
    streamController = null
  }

  // 清空当前消息
  messages.value = []
  isLoading.value = false

  // 重置当前对话为null，这样下次发送消息时会自动创建新对话
  currentConversation.value = null
}

// 选择历史对话
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

// 保存设置
const handleSettingsSaved = (settings: CopilotSettings) => {
  copilotSettings.value = settings
}

// 数据加载
// 加载设置
const loadSavedSettings = () => {
  try {
    // 使用存储管理类加载设置，与对话参数保存机制保持一致
    const loadedSettings = CopilotSettingsStorage.loadSettings(props.bookId)
    copilotSettings.value = loadedSettings
  } catch (error) {
    console.error('加载Copilot设置失败:', error)
  }
}

// 加载星标设定
const loadStarredSettings = async () => {
  try {
    settingsLoading.value = true
    await settingsStore.loadSettings(props.bookId)

    // 过滤星标设定
    starredSettings.value = settingsStore.settings.filter(setting => setting.starred)

    // 初始化选中的设定（包含所有星标设定）
    selectedSettings.value = [...starredSettings.value]
  } catch (error) {
    console.error('加载星标设定失败:', error)
  } finally {
    settingsLoading.value = false
  }
}

// 加载对话历史
const loadConversations = () => {
  conversations.value = ConversationStorage.loadConversations(props.bookId)
}

// 初始化组件
const initializeComponent = () => {
  // 确保功能配置已加载
  if (featureConfigsStore.configs.length === 0) {
    featureConfigsStore.loadFeatureConfigs()
  }

  // 加载保存的设置
  loadSavedSettings()

  // 加载对话历史
  loadConversations()

  // 加载星标设定
  loadStarredSettings()

  // 自动加载最新对话
  const latestConversation = ConversationStorage.getLatestConversation(props.bookId)
  if (latestConversation) {
    handleSelectConversation(latestConversation)
  }
}

// 监听函数
// 监听设定变化
watch(() => settingsStore.settings, (newSettings) => {
  // 更新星标设定列表
  starredSettings.value = newSettings.filter(setting => setting.starred)

  // 同步更新选中的设定
  syncSelectedSettings(newSettings)
}, { deep: true })

// 同步设定状态
const syncSelectedSettings = (newSettings: Setting[]) => {
  const newStarredSettings = newSettings.filter(setting => setting.starred)
  const currentStarredInSelected = selectedSettings.value.filter(setting => setting.starred)

  // 移除已取消星标的设定
  currentStarredInSelected.forEach(starredSetting => {
    if (!newStarredSettings.some(s => s.id === starredSetting.id)) {
      const index = selectedSettings.value.findIndex(s => s.id === starredSetting.id)
      if (index > -1) {
        selectedSettings.value.splice(index, 1)
      }
    }
  })

  // 添加新的星标设定
  newStarredSettings.forEach(starredSetting => {
    if (!selectedSettings.value.some(s => s.id === starredSetting.id)) {
      selectedSettings.value.push(starredSetting)
    }
  })
}

// 数据获取
// 获取前一章节内容
const getPreviousChapterContent = async (): Promise<string> => {
  try {
    const currentChapter = chaptersStore.currentChapter
    if (!currentChapter) return ''

    // 根据设置获取前N个章节的内容
    const allChapters = [...chaptersStore.chapters].sort((a, b) => a.order_index - b.order_index)
    const currentIndex = allChapters.findIndex(ch => ch.id === currentChapter.id)

    if (currentIndex === -1) return ''

    // 获取前N个章节（根据设置）
    const previousChapterCount = copilotSettings.value.previousChapterCount
    const startIndex = Math.max(0, currentIndex - previousChapterCount)
    const previousChapters = allChapters.slice(startIndex, currentIndex)

    if (previousChapters.length === 0) return ''

    // 获取这些章节的完整内容
    const chapterContents: string[] = []
    for (const chapter of previousChapters) {
      const fullChapter = await chaptersStore.getChapter(chapter.id)
      if (fullChapter?.content) {
        chapterContents.push(`第${chapter.order_index + 1}章 - ${chapter.title}:\n${fullChapter.content}`)
      }
    }

    return chapterContents.join('\n\n')
  } catch (error) {
    console.error('获取前一章节内容失败:', error)
    return ''
  }
}

// 获取书籍全局设定
const getBookGlobalSettings = async (): Promise<string> => {
  try {
    // 确保书籍数据已加载
    if (booksStore.books.length === 0) {
      await booksStore.loadBooks()
    }

    // 查找当前书籍
    const currentBook = booksStore.books.find(book => book.id === props.bookId)
    return currentBook?.global_settings || ''
  } catch (error) {
    console.error('获取书籍全局设定失败:', error)
    return ''
  }
}

// 获取最近章节概括
const getRecentChapterSummaries = async (): Promise<string[]> => {
  try {
    const currentChapter = chaptersStore.currentChapter
    if (!currentChapter) return []

    // 获取所有章节并按order_index排序
    const allChapters = [...chaptersStore.chapters].sort((a, b) => a.order_index - b.order_index)

    // 找到当前章节的索引
    const currentIndex = allChapters.findIndex(ch => ch.id === currentChapter.id)
    if (currentIndex === -1) return []

    // 根据设置获取前N章的概括（包括当前章节之前的章节）
    const chapterSummaryCount = copilotSettings.value.chapterSummaryCount
    const startIndex = Math.max(0, currentIndex - chapterSummaryCount)
    const recentChapters = allChapters.slice(startIndex, currentIndex)

    // 返回这些章节的标题和概括
    return recentChapters.map(chapter => {
      const summary = chapter.summary?.trim() || '暂无概括'
      return `第${chapter.order_index + 1}章 - ${chapter.title}: ${summary}`
    })
  } catch (error) {
    console.error('获取最近章节概括失败:', error)
    return []
  }
}

// 生命周期
// 组件挂载
onMounted(() => {
  initializeComponent()
})
</script>
