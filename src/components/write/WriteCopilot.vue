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
import type { Setting } from '@/electron.d'

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

// 设定存储
const settingsStore = useSettingsStore()

// 章节存储
const chaptersStore = useChaptersStore()

// 书籍存储
const booksStore = useBooksStore()

// Copilot设置
const copilotSettings = ref<CopilotSettings>({
  contextLength: 3
})

// 星标设定
const starredSettings = ref<Setting[]>([])
const settingsLoading = ref(false)
const selectedSettings = ref<Setting[]>([])

// 流式响应控制器
let streamController: AbortController | null = null

// 处理发送消息
const handleSendMessage = async (content: string | EnhancedMessageContext) => {
  let userInput: string
  let enhancedContext: EnhancedMessageContext | undefined

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

  // 添加用户消息
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: userInput.trim(),
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
  await generateResponse(userInput.trim(), enhancedContext)
}

// 生成AI回复
const generateResponse = async (_userInput: string, enhancedContext?: EnhancedMessageContext) => {
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

    // 获取前章节内容和最近章节概括
    const previousChapterContent = await getPreviousChapterContent()
    const recentChapterSummaries = await getRecentChapterSummaries()

    // 获取当前书籍的全局设定
    const globalSettings = await getBookGlobalSettings()

    // 构建增强的章节细纲上下文
    const context = {
      content: '',
      previousChapterContent,
      recentChapterSummaries,
      globalSettings,
      selectedSettings: enhancedContext?.selectedSettings || []
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

    // 准备历史消息和上下文选项（排除推理消息，只保留user和assistant消息）
    const chatMessages: ChatMessage[] = messages.value
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
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

// 处理设定选择
const handleSettingsSelected = (settings: Setting[]) => {
  selectedSettings.value = settings
  console.log('设定已更新:', settings)
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

  // 加载星标设定
  loadStarredSettings()

  // 自动加载最新对话
  const latestConversation = ConversationStorage.getLatestConversation(props.bookId)
  if (latestConversation) {
    handleSelectConversation(latestConversation)
  }
})

// 监听设定存储变化，实时更新星标设定
watch(() => settingsStore.settings, (newSettings) => {
  starredSettings.value = newSettings.filter(setting => setting.starred)

  // 同时更新选中的设定，确保星标设定的变化能实时反映
  const newStarredSettings = newSettings.filter(setting => setting.starred)
  const currentStarredInSelected = selectedSettings.value.filter(setting => setting.starred)

  // 如果有星标设定被移除，从selectedSettings中移除
  currentStarredInSelected.forEach(starredSetting => {
    if (!newStarredSettings.some(s => s.id === starredSetting.id)) {
      const index = selectedSettings.value.findIndex(s => s.id === starredSetting.id)
      if (index > -1) {
        selectedSettings.value.splice(index, 1)
      }
    }
  })

  // 如果有新的星标设定，添加到selectedSettings中
  newStarredSettings.forEach(starredSetting => {
    if (!selectedSettings.value.some(s => s.id === starredSetting.id)) {
      selectedSettings.value.push(starredSetting)
    }
  })
}, { deep: true })

// 获取前一章节内容
const getPreviousChapterContent = async (): Promise<string> => {
  try {
    const currentChapter = chaptersStore.currentChapter
    if (!currentChapter) return ''

    const previousChapter = chaptersStore.getPreviousChapter(currentChapter.id)
    if (!previousChapter) return ''

    // 获取前一章节的完整内容
    const fullPreviousChapter = await chaptersStore.getChapter(previousChapter.id)
    return fullPreviousChapter?.content || ''
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

// 获取最近5章的概括
const getRecentChapterSummaries = async (): Promise<string[]> => {
  try {
    const currentChapter = chaptersStore.currentChapter
    if (!currentChapter) return []

    // 获取所有章节并按order_index排序
    const allChapters = [...chaptersStore.chapters].sort((a, b) => a.order_index - b.order_index)

    // 找到当前章节的索引
    const currentIndex = allChapters.findIndex(ch => ch.id === currentChapter.id)
    if (currentIndex === -1) return []

    // 获取前5章的概括（包括当前章节之前的章节）
    const startIndex = Math.max(0, currentIndex - 5)
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
</script>
