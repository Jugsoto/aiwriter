import { streamChatCompletion, type ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { getSelectedPromptByCategory } from './promptService'

export interface ChapterExpansionContext {
  chapterContent: string // 当前章节内容
  previousChapterContent?: string // 前文章节内容
  recentChapterSummaries?: string[] // 最近章节梗概
  globalSettings?: string // 全局设定
}

export interface ChapterExpansionOptions {
  contextLength?: number // 上下文长度
  messages?: ChatMessage[] // 历史消息数组
  previousChapterCount?: number // 前文章节数量
  chapterSummaryCount?: number // 前文章节梗概数量
}

/**
 * 获取章节扩写功能配置
 */
export async function getChapterExpansionConfig(): Promise<FeatureConfig> {
  const featureConfigsStore = useFeatureConfigsStore()

  // 确保配置已加载
  if (featureConfigsStore.configs.length === 0) {
    await featureConfigsStore.loadFeatureConfigs()
  }

  const config = featureConfigsStore.getConfigByFeatureName('content_writing')
  if (!config) {
    throw new Error('正文写作功能配置未找到（扩写功能使用正文写作的模型配置）')
  }

  return config
}

/**
 * 构建章节扩写的用户提示词
 */
export function buildChapterExpansionPrompt(context: ChapterExpansionContext): string {
  const {
    chapterContent,
    previousChapterContent,
    recentChapterSummaries,
    globalSettings
  } = context

  let prompt = ''

  if (globalSettings) {
    prompt += `# 全局设定：
全局设定是本书的基础信息，如小说类型、主线暗线信息。全局设定会贯穿整本书，影响所有章节的内容和走向。

全局设定内容：
${globalSettings}\n\n`
  }

  if (previousChapterContent) {
    prompt += `# 前文章节内容：
前文章节内容是紧接当前章节的上一个章节内容，在扩写时需要参考前文章节保持剧情流畅。

前文章节内容：
${previousChapterContent}\n\n`
  }

  if (recentChapterSummaries && recentChapterSummaries.length > 0) {
    prompt += `# 最近章节梗概：
最近章节梗概是对前几章内容的简要总结，帮助保持剧情连贯和理解故事背景。

最近章节梗概：
${recentChapterSummaries.join('\n\n')}\n\n`
  }

  prompt += `# 章节扩写任务：
请对以下章节内容进行扩写，写出完整的一章网文章节，要求符合给出的要求。

原章节内容：
${chapterContent}`

  return prompt
}

/**
 * 生成章节扩写 - 流式输出（只返回正式内容，不返回推理内容）
 */
export async function* streamChapterExpansion(
  context: ChapterExpansionContext,
  featureConfig?: FeatureConfig,
  options?: ChapterExpansionOptions,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  // 如果没有提供功能配置，则获取默认配置
  if (!featureConfig) {
    featureConfig = await getChapterExpansionConfig()
  }

  // 获取章节扩写提示词
  let systemPrompt = ''
  try {
    const expansionPrompt = await getSelectedPromptByCategory('chapter_expansion')
    if (expansionPrompt && expansionPrompt.content) {
      systemPrompt = expansionPrompt.content
    } else {
      // 如果没有找到扩写提示词，使用默认的扩写提示词
      systemPrompt = `你是一位专业的小说扩写助手，擅长将简略的章节内容扩写成生动完整的小说正文。

扩写要求：
1. 保持原有的故事情节和核心结构不变
2. 丰富场景描述、人物动作、心理活动等细节
3. 完善对话内容，使其更加自然生动
4. 增强情感表达和氛围营造
5. 确保扩写后的内容与前后文保持连贯
6. 保持语言风格的一致性
7. 注意控制扩写的幅度，避免过度偏离原意

请在保持原意的基础上，将给定的章节内容扩写成更加丰富完整的小说正文。`
    }
  } catch (error) {
    console.error('获取章节扩写提示词失败，使用默认提示词:', error)
    systemPrompt = `你是一位专业的小说扩写助手，擅长将简略的章节内容扩写成生动完整的小说正文。请在保持原意的基础上，将给定的章节内容扩写成更加丰富完整的小说正文。`
  }

  const userPrompt = buildChapterExpansionPrompt(context)

  // 构建消息数组
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt }
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
    console.error('流式扩写出错:', error)
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