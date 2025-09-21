import { streamChatCompletion, type ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'

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
}

export interface ContentWritingOptions {
  contextLength?: number // 上下文长度
  messages?: ChatMessage[] // 历史消息数组
  previousChapterCount?: number // 前文章节数量
  chapterSummaryCount?: number // 前文章节梗概数量
}

const SYSTEM_PROMPT = `你是一个专业的AI写作助手，专门帮助用户创作小说内容。你需要根据提供的上下文信息，生成连贯、生动的小说正文内容。

写作要求：
1. 内容要连贯自然，符合前文情节发展
2. 语言要生动形象，具有文学性
3. 要符合人物性格设定和世界观背景
4. 段落要清晰，每段不宜过长
5. 直接输出正文内容，不要包含推理过程`

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
    globalSettings 
  } = context

  let prompt = ''

  if (globalSettings) {
    prompt += `世界观设定（全局背景）：
${globalSettings}

`
  }

  if (previousChapterContent) {
    prompt += `前文章节内容（前文参考）：
${previousChapterContent}

`
  }

  if (recentChapterSummaries && recentChapterSummaries.length > 0) {
    prompt += `最近${recentChapterSummaries.length}章情节梗概（把握剧情发展）：
${recentChapterSummaries.join('\n')}

`
  }

  if (selectedSettings && selectedSettings.length > 0) {
    // 设定类型中文映射
    const typeMap: Record<string, string> = {
      'character': '人物档案',
      'worldview': '世界观设定',
      'entry': '其他设定'
    }
    
    prompt += `当前选中的设定信息：`
    selectedSettings.forEach((setting, index) => {
      const chineseType = typeMap[setting.type] || setting.type
      prompt += `\n${index + 1}. [${chineseType}] ${setting.name}
      当前状态：${setting.status}
      设定内容：${setting.content}`
    })
    prompt += '\n\n'
  }

  prompt += `用户的写作要求：
${selectedMessage}

请根据以上信息，生成相应的小说正文内容。要求内容连贯、生动，符合设定背景，段落清晰。`

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
    { role: 'system', content: SYSTEM_PROMPT }
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