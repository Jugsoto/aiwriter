import { streamChatCompletion, type ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { getChapterOutlinePrompt } from './prompts'

export interface ChapterOutlineContext {
  content?: string
  previousChapterContent?: string
  recentChapterSummaries?: string[]
  globalSettings?: string
  selectedSettings?: Array<{
    name: string
    content: string
    status: string
    type: string
  }>
  vectorSearchResults?: {
    textChunks: Array<{
      title: string
      content: string
      similarity: number
      chapterTitle?: string
      chunkIndex?: number
    }>
    settingChunks: Array<{
      title: string
      content: string
      similarity: number
      settingType?: string
      starred?: boolean
    }>
  }
}

export interface ChapterOutlineOptions {
  contextLength?: number // 上下文长度，表示要包含的历史消息数量
  messages?: ChatMessage[] // 历史消息数组
  previousChapterCount?: number  // 前文章节数量 (1-3)
  chapterSummaryCount?: number   // 前文章节梗概数量 (3-10)
}


/**
 * 获取章节细纲功能配置
 */
export async function getChapterOutlineConfig(): Promise<FeatureConfig> {
  const featureConfigsStore = useFeatureConfigsStore()
  
  // 确保配置已加载
  if (featureConfigsStore.configs.length === 0) {
    await featureConfigsStore.loadFeatureConfigs()
  }
  
  const config = featureConfigsStore.getConfigByFeatureName('chapter_planning')
  if (!config) {
    throw new Error('章节细纲功能配置未找到')
  }
  
  return config
}

/**
 * 构建章节细纲的用户提示词
 */
export function buildChapterOutlinePrompt(context: ChapterOutlineContext): string {
  const { content, previousChapterContent, recentChapterSummaries, globalSettings, selectedSettings, vectorSearchResults } = context

  let prompt = ''

  if (globalSettings) {
    prompt += `全局设定（世界观背景）：
${globalSettings}`
  }

  if (previousChapterContent) {
    prompt += `\n前文章节内容（作为前文参考）：
${previousChapterContent}`
  }

  if (recentChapterSummaries && recentChapterSummaries.length > 0) {
    prompt += `\n最近${recentChapterSummaries.length}章章节概括（把握剧情发展）：
${recentChapterSummaries.join('\n')}`
  }

  if (selectedSettings && selectedSettings.length > 0) {
    // 设定类型中文映射
    const typeMap: Record<string, string> = {
      'character': '人物档案',
      'worldview': '世界观设定',
      'entry': '其他设定'
    }
    
    prompt += `\n当前选中的设定信息：`
    selectedSettings.forEach((setting, index) => {
      const chineseType = typeMap[setting.type] || setting.type
      prompt += `\n${index + 1}. [${chineseType}] ${setting.name}
      当前状态：${setting.status}
      全部设定：${setting.content}`
    })
  }

  if (vectorSearchResults) {
    
    if (vectorSearchResults.textChunks && vectorSearchResults.textChunks.length > 0) {
      prompt += `\n\n相关文本片段（基于语义匹配，相似度降序排列）：`
      vectorSearchResults.textChunks.forEach((chunk, index) => {
        prompt += `\n${index + 1}. [${chunk.title}] (相似度: ${(chunk.similarity * 100).toFixed(1)}%)
        ${chunk.content}`
      })
    }

    if (vectorSearchResults.settingChunks && vectorSearchResults.settingChunks.length > 0) {
      prompt += `\n\n相关设定片段（基于语义匹配，相似度降序排列）：`
      vectorSearchResults.settingChunks.forEach((chunk, index) => {
        const typeInfo = chunk.settingType ? ` [${chunk.settingType}]` : ''
        const starInfo = chunk.starred ? ' ★' : ''
        prompt += `\n${index + 1}. [${chunk.title}]${typeInfo}${starInfo} (相似度: ${(chunk.similarity * 100).toFixed(1)}%)
        ${chunk.content}`
      })
    }
  } else {
    console.log('向量搜索结果未包含在提示词中: vectorSearchResults 为 null 或 undefined')
  }

  if (content) {
    prompt += `\n\n现有内容：${content}`
  }

  return prompt
}

/**
 * 生成章节细纲 - 流式输出（返回推理内容和正式内容）
 */
export async function* streamChapterOutline(
  context: ChapterOutlineContext,
  featureConfig?: FeatureConfig,
  options?: ChapterOutlineOptions,
  signal?: AbortSignal
): AsyncGenerator<{ type: 'reasoning' | 'content', text: string }, void, unknown> {
  // 如果没有提供功能配置，则获取默认配置
  if (!featureConfig) {
    featureConfig = await getChapterOutlineConfig()
  }

  const userPrompt = buildChapterOutlinePrompt(context)

  // 构建消息数组 - 第一条是系统提示，第二条是包含后台信息的user消息
  const messages: ChatMessage[] = [
    { role: 'system', content: await getChapterOutlinePrompt() }
  ]

  // 如果有历史消息且设置了上下文长度，则添加历史消息（排除推理内容）
  if (options?.messages && options.contextLength && options.contextLength > 0) {
    const recentMessages = getRecentMessages(options.messages, options.contextLength)
    messages.push(...recentMessages)
  }

  // 添加包含后台信息的user消息（作为第一条user消息）
  messages.push({
    role: 'user',
    content: userPrompt
  })

  // 流式生成章节细纲
  for await (const chunk of streamChatCompletion(messages, featureConfig, {}, signal)) {
    // 立即检查终止信号
    if (signal?.aborted) {
      console.log('章节细纲生成被用户终止')
      break
    }
    
    // 优先处理推理内容
    if (chunk.reasoning_content) {
      yield { type: 'reasoning', text: chunk.reasoning_content }
    } else if (chunk.content) {
      yield { type: 'content', text: chunk.content }
    }
    
    // 每个chunk处理后都检查终止信号，确保快速响应
    if (signal?.aborted) {
      console.log('章节细纲生成在处理chunk时被终止')
      break
    }
  }
}

/**
 * 获取最近的历史消息
 */
function getRecentMessages(messages: ChatMessage[], contextLength: number): ChatMessage[] {
  if (!messages || messages.length === 0) {
    return []
  }

  // 只获取最近的几条消息（排除系统消息）
  const userAssistantMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant')
  const recentMessages = userAssistantMessages.slice(-contextLength * 2) // 每轮对话包含user和assistant消息
  
  return recentMessages
}