import { streamChatCompletion, type ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { getChapterOutlinePrompt } from './prompts'

export interface ChapterOutlineContext {
  content?: string
  userInput?: string // 用户输入内容
  previousChapterContent?: string
  recentChapterSummaries?: string[]
  globalSettings?: string
  selectedSettings?: Array<{
    name: string
    content: string
    status: string
    type: string
  }>
  selectedReferences?: Array<{
    id: number
    title: string
    content: string
    tags: string[]
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
    referenceChunks?: Array<{
      title: string
      content: string
      similarity: number
      tags?: string[]
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
 * 构建章节细纲的上下文信息
 * 优化版本：只包含全局设定、前文章节、前文梗概、选择的设定、记忆搜索结果
 * 注意：用户输入将作为单独的用户消息发送，不包含在上下文信息中
 */
export function buildChapterOutlinePrompt(context: ChapterOutlineContext): string {
  const { globalSettings, previousChapterContent, recentChapterSummaries, selectedSettings, selectedReferences, vectorSearchResults } = context

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
    prompt += `【选择的设定】
用户明确要求在本章节中重点体现的内容，具有最高优先级。这些设定必须在章节细纲中得到充分体现，成为推动情节发展的核心要素。
`
    selectedSettings.forEach((setting, index) => {
      prompt += `${index + 1}. ${setting.name}
${setting.content}

`
    })
  }


  // 选择的资料库
  if (selectedReferences && selectedReferences.length > 0) {
    prompt += `【资料库参考】
用户提供的参考资料，包含其他作品的剧情片段和写作手法。AI可以学习这些资料中的：
1. 剧情结构和节奏把控
2. 人物塑造和对话技巧
3. 场景描写和氛围营造
4. 情感表达和叙述方式
但请注意：只能学习写作技巧和表现手法，不得直接照搬具体情节、人物名称或原创内容。
`
    selectedReferences.forEach((reference, index) => {
      const tagsInfo = reference.tags && reference.tags.length > 0
        ? `\n标签：${reference.tags.join('、')}`
        : ''
      prompt += `${index + 1}. ${reference.title}${tagsInfo}
${reference.content}

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
        prompt += `${index + 1}. ${chunk.title}
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

  // 用户输入内容
  if (context.userInput) {
    prompt += `<用户输入>
用户的具体创作要求和指令，是生成章节细纲的直接任务目标。请根据以上背景资料，结合用户的具体要求来创作章节细纲。
${context.userInput}
<用户输入/>`
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

  // 构建系统提示词（基础系统提示词 + 上下文信息）
  const baseSystemPrompt = await getChapterOutlinePrompt()
  const contextInfo = buildChapterOutlinePrompt(context)
  const systemPrompt = baseSystemPrompt + '\n\n' + contextInfo

  // 构建消息数组 - 第一条是系统提示（包含上下文信息），然后是历史消息
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt }
  ]

  // 如果有历史消息且设置了上下文长度，则添加历史消息（排除推理内容）
  if (options?.messages && options.contextLength && options.contextLength > 0) {
    const recentMessages = getRecentMessages(options.messages, options.contextLength)
    messages.push(...recentMessages)
  }

  // 添加用户输入作为用户消息
  if (context.userInput) {
    messages.push({
      role: 'user',
      content: context.userInput
    })
  }

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