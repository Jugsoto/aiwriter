<template>
  <div class="h-full flex flex-col bg-[var(--bg-primary)]">
    <CopilotHeader :conversations="conversations" :current-conversation="currentConversation"
      @new-conversation="handleNewConversation" @select-conversation="handleSelectConversation"
      @open-settings="handleOpenSettings" />

    <MessageList :messages="messages" :is-loading="isLoading" />

    <InputArea :disabled="isLoading" @send-message="handleSendMessage" @at-resource="handleAtResource"
      @clear-conversation="handleClearConversation" @stop-conversation="handleStopConversation" ref="inputAreaRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CopilotHeader from './copilot/CopilotHeader.vue'
import MessageList from './copilot/MessageList.vue'
import InputArea from './copilot/InputArea.vue'
import { streamChapterOutline } from '@/services'
import type { Message } from './copilot/types'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'

// 消息列表
const messages = ref<Message[]>([])
const isLoading = ref(false)
const inputAreaRef = ref<InstanceType<typeof InputArea>>()

// 对话管理
const conversations = ref<any[]>([])
const currentConversation = ref<any>(null)

// 功能配置
const featureConfigsStore = useFeatureConfigsStore()

// 流式响应控制器
let streamController: AbortController | null = null

// 处理发送消息
const handleSendMessage = async (content: string) => {
  if (!content.trim()) return

  // 添加用户消息
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: content.trim(),
    timestamp: new Date()
  }
  messages.value.push(userMessage)

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
      id: (Date.now() + 1).toString(),
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
      id: (Date.now() + 1).toString(),
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

    // 流式生成章节细纲
    for await (const { type, text } of streamChapterOutline(context, featureConfig)) {
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

  } catch (error) {
    console.error('生成章节细纲失败:', error)

    // 添加错误消息
    const errorMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `抱歉，生成章节细纲时出现错误：${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: new Date()
    }
    messages.value.push(errorMessage)
  } finally {
    isLoading.value = false
    streamController = null
  }
}

// 处理引用资源
const handleAtResource = () => {
  console.log('引用资源功能')
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
const handleSelectConversation = (conversation: any) => {
  currentConversation.value = conversation
  // 这里可以加载历史消息
}

// 打开设置
const handleOpenSettings = () => {
  // 打开功能设置页面
  console.log('打开设置')
}

// 组件卸载时清理
onMounted(() => {
  // 确保功能配置已加载
  if (featureConfigsStore.configs.length === 0) {
    featureConfigsStore.loadFeatureConfigs()
  }
})
</script>
