import { streamChatCompletion, type ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { getContentWritingPrompt } from './prompts'

export interface ContentWritingContext {
  selectedMessage: string // 选中的消息内容
  previousChapterContent?: string // 前文章节内容
  recentChapterSummaries?: string[] // 最近章节梗概
  selectedSettings?: Array<{
    name: string
    content: string
    status: string
    type: string
  }> // 选择的设定
  globalSettings?: string // 前局设定（全局设定）
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
  } // 向量搜索结果
}

export interface ContentWritingOptions {
  contextLength?: number // 上下文长度
  messages?: ChatMessage[] // 历史消息数组
  previousChapterCount?: number // 前文章节数量
  chapterSummaryCount?: number // 前文章节梗概数量
}


/**
 * 获取内容写作功能配置
 */
export async function getContentWritingConfig(): Promise<FeatureConfig> {
  const featureConfigsStore = useFeatureConfigsStore()
  
  // 确保配置已加载
  if (featureConfigsStore.configs.length === 0) {
    await featureConfigsStore.loadFeatureConfigs()
  }
  
  const config = featureConfigsStore.getConfigByFeatureName('content_writing')
  if (!config) {
    throw new Error('内容写作功能配置未找到')
  }
  
  return config
}

/**
 * 构建内容写作的用户提示词
 */
export function buildContentWritingPrompt(context: ContentWritingContext): string {
  const {
    selectedMessage,
    previousChapterContent,
    recentChapterSummaries,
    selectedSettings,
    globalSettings,
    vectorSearchResults
  } = context

  let prompt = ''

  if (globalSettings) {
    prompt += `# 全局设定：
1. 全局设定是本书的基础信息，如小说类型、主线暗线信息。
2. 全局设定会贯穿整本书，影响所有章节的内容和走向。
3. 全局设定会影响章节正文的生成，请务必参考。
# 以下是全局设定内容：
${globalSettings}\n\n`
  }

  if (previousChapterContent) {
    prompt += `# 前文章节内容（前文参考）：
1. 前文章节内容是紧接当前章节的上一个章节内容。
2. 在新章节创作时必须参考前文章节保持剧情流畅。
3. 新章节写作时禁止照搬前文章节内容。
# 以下是前文章节内容：
${previousChapterContent}\n\n`
  }

  if (recentChapterSummaries && recentChapterSummaries.length > 0) {
    prompt += `# 最近${recentChapterSummaries.length}章情节梗概（把握剧情发展）：
1. 最近章节概括是对前几章内容的简要总结，帮助保持剧情连贯。
2. 最近章节概括会影响当前章节的内容和走向，请务必参考。
3. 最近章节概括会帮助你更好的理解故事背景和人物关系。
# 以下是最近章节概括内容：
${recentChapterSummaries.join('\n')}\n\n`
  }

  if (selectedSettings && selectedSettings.length > 0) {
    // 设定类型中文映射
    const typeMap: Record<string, string> = {
      'character': '人物档案',
      'worldview': '世界观设定',
      'entry': '其他设定'
    }
    
    prompt += `# 用户选中的设定信息：
1. 选中的设定信息是用户特别指定需要参考的设定内容。
2. 选中的设定信息会影响章节正文的生成，请务必参考。
3. 选中的设定信息会帮助你更好的理解故事背景和人物关系。
# 以下是用户选中的设定内容：`
    selectedSettings.forEach((setting, index) => {
      const chineseType = typeMap[setting.type] || setting.type
      prompt += `\n${index + 1}. [${chineseType}] ${setting.name}
      当前状态：${setting.status}
      设定内容：${setting.content}`
    })
    prompt += '\n\n'
  }

  if (vectorSearchResults) {
    if (vectorSearchResults.textChunks && vectorSearchResults.textChunks.length > 0) {
      prompt += `# 相关文本片段（基于语义匹配，相似度降序排列）：
1. 相关文本片段是基于当前章节内容进行语义匹配得到的。
2. 注意相关文本片段为历史内容，可能与当前章节时间线不符，请谨慎参考。
3. 使用相关文本片段时请注意与当前章节内容的衔接和一致性。
# 以下是相关文本片段内容：`
      vectorSearchResults.textChunks.forEach((chunk, index) => {
        prompt += `\n${index + 1}. [${chunk.title}] (相似度: ${(chunk.similarity * 100).toFixed(1)}%)
        ${chunk.content}`
      })
      prompt += '\n\n'
    }

    if (vectorSearchResults.settingChunks && vectorSearchResults.settingChunks.length > 0) {
      prompt += `# 相关设定片段（基于语义匹配，相似度降序排列）：
1. 相关设定片段是基于当前章节内容进行语义匹配得到的。
2. 相关设定片段为设定库内容，通常为长期设定，请务必参考。
3. 注意有些设定在当前章节时间线可能已经过时，请谨慎参考。
# 以下是相关设定片段内容：`
      vectorSearchResults.settingChunks.forEach((chunk, index) => {
        const typeInfo = chunk.settingType ? ` [${chunk.settingType}]` : ''
        const starInfo = chunk.starred ? ' ★' : ''
        prompt += `\n${index + 1}. [${chunk.title}]${typeInfo}${starInfo} (相似度: ${(chunk.similarity * 100).toFixed(1)}%)
        ${chunk.content}`
      })
      prompt += '\n\n'
    }
  }

  prompt += `# 章节细纲：
1. 章节细纲是当前章节的内容框架和结构。
2. 章节细纲必须严格遵守，不能擅自更改或忽略。
3. 章节细纲会直接影响章节正文的内容和走向。
# 以下是章节细纲：
${selectedMessage}

请根据以上信息，生成相应的小说正文内容。要求符合系统提示词要求。`

  return prompt
}

/**
 * 生成内容写作 - 流式输出（只返回正式内容，不返回推理内容）
 */
export async function* streamContentWriting(
  context: ContentWritingContext,
  featureConfig?: FeatureConfig,
  options?: ContentWritingOptions,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  // 如果没有提供功能配置，则获取默认配置
  if (!featureConfig) {
    featureConfig = await getContentWritingConfig()
  }

  const userPrompt = buildContentWritingPrompt(context)

  // 构建消息数组
  const messages: ChatMessage[] = [
    { role: 'system', content: await getContentWritingPrompt() }
  ]

  // 如果有历史消息且设置了上下文长度，则添加历史消息
  if (options?.messages && options.contextLength && options.contextLength > 0) {
    const recentMessages = getRecentMessages(options.messages, options.contextLength)
    messages.push(...recentMessages)
  }

  // 添加包含上下文信息的用户消息
  messages.push({
    role: 'user',
    content: userPrompt
  })

  // 流式生成内容
  try {
    for await (const chunk of streamChatCompletion(messages, featureConfig, {}, signal)) {
      // 立即检查终止信号
      if (signal?.aborted) {
        break
      }
      
      // 只返回正式内容，不返回推理内容
      if (chunk.content) {
        yield chunk.content
      }
      
      // 每个chunk处理后都检查终止信号
      if (signal?.aborted) {
        break
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || signal?.aborted) {
      return
    }
    console.error('流式生成出错:', error)
    throw error
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