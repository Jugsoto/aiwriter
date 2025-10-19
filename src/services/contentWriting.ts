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
 * 构建内容写作的上下文信息
 * 优化版本：包含全局设定、前文章节、前文梗概、选择的设定、记忆搜索结果、章节细纲
 * 注意：所有上下文信息将拼接到系统提示词后面，不作为用户消息发送
 */
export function buildContentWritingPrompt(context: ContentWritingContext): string {
  const { globalSettings, previousChapterContent, recentChapterSummaries, selectedSettings, vectorSearchResults } = context

  let prompt = '<背景资料>\n'

  // 全局设定
  if (globalSettings) {
    prompt += `【全局设定】
全局设定是贯穿全书的基础信息，包括小说类型、核心主题、主线剧情、世界观规则等根本性设定，决定了故事的整体走向和风格基调。
${globalSettings}

`
  }

  // 前文章节
  if (previousChapterContent) {
    prompt += `【前文章节】
紧接当前章节的上一章完整内容，确保剧情连贯性的关键参考。新章节必须与前文章节实现无缝衔接，保持时间线、人物状态、场景转换的连续性。
${previousChapterContent}

`
  }

  // 前文梗概
  if (recentChapterSummaries && recentChapterSummaries.length > 0) {
    prompt += `【前文梗概】
前几章核心内容的精炼总结，包含关键情节、人物变化、重要设定更新等信息。通过章节概括快速了解故事近期发展脉络，避免新章节与历史情节产生冲突。
${recentChapterSummaries.join('\n\n')}

`
  }

  // 选择的设定
  if (selectedSettings && selectedSettings.length > 0) {
    // 设定类型中文映射
    const typeMap: Record<string, string> = {
      'character': '人物档案',
      'worldview': '世界观设定',
      'entry': '其他设定'
    }

    prompt += `【选择的设定】
用户明确要求在本章节中重点体现的内容，具有最高优先级。这些设定必须在章节正文中得到充分体现，成为推动情节发展的核心要素。
`
    selectedSettings.forEach((setting, index) => {
      const chineseType = typeMap[setting.type] || setting.type
      prompt += `${index + 1}. [${chineseType}] ${setting.name}
当前状态：${setting.status}
${setting.content}

`
    })
  }

  // 记忆搜索结果（优化：限制3个设定和5个文本片段）
  if (vectorSearchResults) {
    // 相关设定片段 - 限制为3个
    if (vectorSearchResults.settingChunks && vectorSearchResults.settingChunks.length > 0) {
      const limitedSettings = vectorSearchResults.settingChunks.slice(0, 3)
      prompt += `【记忆搜索 - 设定】
通过语义搜索找到的相关设定信息，通常具有持续参考价值。星标设定表示重要内容，应优先考虑在章节中体现。
`
      limitedSettings.forEach((chunk, index) => {
        const typeInfo = chunk.settingType ? ` [${chunk.settingType}]` : ''
        const starInfo = chunk.starred ? ' ★' : ''
        prompt += `${index + 1}. ${chunk.title}${typeInfo}${starInfo}
${chunk.content}

`
      })
    }

    // 相关文本片段 - 限制为5个
    if (vectorSearchResults.textChunks && vectorSearchResults.textChunks.length > 0) {
      const limitedTexts = vectorSearchResults.textChunks.slice(0, 5)
      prompt += `【记忆搜索 - 文本片段】
通过语义搜索找到的历史章节内容，与当前章节主题高度相关。相似度越高参考价值越大，可借鉴表现手法但避免照搬具体情节。
`
      limitedTexts.forEach((chunk, index) => {
        prompt += `${index + 1}. ${chunk.title}
${chunk.content}

`
      })
    }
  }

  prompt += '</背景资料>\n\n'

  // 用户选中的章节细纲内容
  if (context.selectedMessage) {
    prompt += `<章节细纲>
用户选中的章节细纲内容，是生成章节正文的直接资料。请根据章节细纲并结合背景资料，严格按照要求来创作正文内容。
${context.selectedMessage}
</章节细纲>`
  }

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

  // 构建上下文信息
  const contextPrompt = buildContentWritingPrompt(context)

  // 构建完整的系统提示词（系统提示词 + 上下文信息）
  const systemPrompt = (await getContentWritingPrompt()) + '\n\n' + contextPrompt

  // 构建消息数组，包含系统消息（系统提示词+上下文）和章节细纲user消息
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt }
  ]

  // 如果有章节细纲，添加为用户消息
  if (context.selectedMessage) {
    messages.push({
      role: 'user',
      content: `<章节细纲>
${context.selectedMessage}
</章节细纲>`
    })
  }

  // 如果有历史消息且设置了上下文长度，则添加历史消息
  if (options?.messages && options.contextLength && options.contextLength > 0) {
    const recentMessages = getRecentMessages(options.messages, options.contextLength)
    messages.push(...recentMessages)
  }

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