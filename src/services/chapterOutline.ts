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
    prompt += `全局设定：
1. 全局设定是贯穿全书的基石信息，包括小说类型、核心主题、主线剧情、重要伏笔等基础框架。
2. 全局设定决定了故事的整体走向和风格基调，是章节创作的根本依据。
3. 在生成章节细纲时，必须确保所有内容与全局设定保持一致，避免出现设定冲突。
4. 全局设定中的关键要素（如世界观规则、主角目标、核心矛盾）需要在章节中得到体现。

设定内容：
${globalSettings}`
  }

  if (previousChapterContent) {
    prompt += `

前文章节：
1. 前文章节是紧接当前章节的上一章完整内容，是确保剧情连贯性的关键参考。
2. 新章节必须与前文章节实现无缝衔接，时间线、人物状态、场景转换必须保持连续性。
3. 重点参考前文章节结尾处的人物状态、环境氛围、悬念设置，确保新章节开头自然承接。
4. 可以回应前文章节的伏笔和疑问，但要避免简单重复前文章节的情节和描写。

前文章节内容：
${previousChapterContent}`
  }

  if (recentChapterSummaries && recentChapterSummaries.length > 0) {
    prompt += `

最近${recentChapterSummaries.length}章章节概括：
1. 章节概括是前几章核心内容的精炼总结，包含关键情节、人物变化、重要设定更新等核心信息。
2. 通过章节概括可以快速了解故事近期发展脉络，避免新章节与历史情节产生冲突。
3. 重点关注章节概括中的人物状态变化、新出现的能力或关系、以及重要的剧情转折点。
4. 章节概括有助于把握故事整体节奏，确保新章节的内容密度和进展速度合理。

章节概括内容：
${recentChapterSummaries.join('\n\n')}`
  }

  if (selectedSettings && selectedSettings.length > 0) {
    // 设定类型中文映射
    const typeMap: Record<string, string> = {
      'character': '人物档案',
      'worldview': '世界观设定',
      'entry': '其他设定'
    }

    prompt += `

用户选中的设定信息：
1. 用户选中设定是明确要求在本章节中重点体现的内容，具有最高优先级。
2. 这些设定必须在章节细纲中得到充分体现，成为推动情节发展的核心要素。
3. 对于人物档案，要确保人物的性格、能力、状态在章节中得到准确展现。
4. 对于世界观设定，要巧妙地将设定规则融入情节发展中，避免生硬说明。
5. 特别关注设定中的"当前状态"，这反映了人物或设定的最新发展情况。

用户选中的设定内容：`
    selectedSettings.forEach((setting, index) => {
      const chineseType = typeMap[setting.type] || setting.type
      prompt += `
${index + 1}. [${chineseType}] ${setting.name}
当前状态：${setting.status}
全部设定：${setting.content}`
    })
  }

  if (vectorSearchResults) {

    if (vectorSearchResults.textChunks && vectorSearchResults.textChunks.length > 0) {
      prompt += `

相关文本片段：
1. 相关文本片段是通过语义搜索找到的历史章节内容，与当前章节主题高度相关。
2. 相似度百分比反映了与当前章节的相关程度，相似度越高参考价值越大。
3. 历史片段可能包含人物对话、情节处理、场景描写等可借鉴的创作素材。
4. 使用时要注意时间线顺序，避免出现逻辑错误，可以提取表现手法但不要照搬具体情节。

相关文本片段内容：`
      vectorSearchResults.textChunks.forEach((chunk, index) => {
        prompt += `
${index + 1}. [${chunk.title}] (相似度: ${(chunk.similarity * 100).toFixed(1)}%)
${chunk.content}`
      })
    }

    if (vectorSearchResults.settingChunks && vectorSearchResults.settingChunks.length > 0) {
      prompt += `

相关设定片段：
1. 相关设定片段是从设定库中匹配的长期设定信息，通常具有持续参考价值。
2. 星标(★)表示重要设定，应优先考虑在章节中体现。
3. 设定片段可能包含人物背景、世界观规则、物品能力等基础设定信息。
4. 注意设定的时效性，确保在当前时间线中该设定仍然有效且适用。

相关设定片段内容：`
      vectorSearchResults.settingChunks.forEach((chunk, index) => {
        const typeInfo = chunk.settingType ? ` [${chunk.settingType}]` : ''
        const starInfo = chunk.starred ? ' ★' : ''
        prompt += `
${index + 1}. [${chunk.title}]${typeInfo}${starInfo} (相似度: ${(chunk.similarity * 100).toFixed(1)}%)
${chunk.content}`
      })
    }
  } else {
    console.log('向量搜索结果未包含在提示词中: vectorSearchResults 为 null 或 undefined')
  }

  if (content) {
    prompt += `

现有内容：
1. 现有内容是用户为当前章节创作的初始材料，可能是开头段落、关键场景或草稿内容。
2. 现有内容反映了用户对章节的初步构思和期望方向，是生成细纲的重要基础。
3. 要在现有内容基础上进行扩展和完善，保持已有情节的连贯性和人物行为的一致性。
4. 如果现有内容包含对话、描写或情节片段，要确保这些内容在细纲中得到合理安排。

现有内容：
${content}`
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