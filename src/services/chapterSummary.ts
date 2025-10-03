import { chatCompletion, type ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { CHAPTER_SUMMARY_SYSTEM_PROMPT } from './prompts'

export interface ChapterSummaryContext {
  content: string
  globalSettings?: string
}

export interface ChapterSummaryOptions {
  maxTokens?: number
}


/**
 * 获取章节梗概功能配置 - 使用基础模型配置
 */
export async function getChapterSummaryConfig(): Promise<FeatureConfig> {
  const featureConfigsStore = useFeatureConfigsStore()
  
  // 确保配置已加载
  if (featureConfigsStore.configs.length === 0) {
    await featureConfigsStore.loadFeatureConfigs()
  }
  
  const config = featureConfigsStore.getConfigByFeatureName('basic_model')
  if (!config) {
    throw new Error('基础模型配置未找到')
  }
  
  return config
}

/**
 * 构建章节梗概的用户提示词
 */
export function buildChapterSummaryPrompt(context: ChapterSummaryContext): string {
  const { content, globalSettings } = context

  let prompt = ''

  if (globalSettings) {
    prompt += `# 全局设定（世界观背景）：
1. 全局设定是本书的基础信息，如小说类型、主线暗线信息。
2. 全局设定会贯穿整本书，影响所有章节的内容和走向。
3. 全局设定会影响章节梗概的生成，请务必参考。
# 以下是全局设定内容：
${globalSettings}\n\n`
  }

  prompt += `# 当前章节内容（待生成梗概）：
1. 当前章节内容是本次生成梗概的主要对象，请基于以上上下文信息生成准确梗概。
2. 梗概要简洁明了，突出章节核心情节和关键发展。
3. 梗概要控制在100-200字左右，确保信息完整且精炼。
# 以下是当前章节内容：
${content}`

  return prompt
}

/**
 * 生成章节梗概 - 非流式输出
 */
export async function generateChapterSummary(
  context: ChapterSummaryContext,
  featureConfig?: FeatureConfig,
  options?: ChapterSummaryOptions
): Promise<string> {
  // 如果没有提供功能配置，则获取默认配置
  if (!featureConfig) {
    featureConfig = await getChapterSummaryConfig()
  }

  const userPrompt = buildChapterSummaryPrompt(context)

  // 构建消息数组
  const messages: ChatMessage[] = [
    { role: 'system', content: CHAPTER_SUMMARY_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ]

  try {
    // 使用非流式聊天完成接口
    const response = await chatCompletion(messages, featureConfig, {
      max_tokens: options?.maxTokens || 500
    })

    return response.content.trim()
  } catch (error) {
    console.error('生成章节梗概失败:', error)
    throw new Error('生成章节梗概失败，请重试')
  }
}