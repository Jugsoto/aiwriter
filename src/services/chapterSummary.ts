import { chatCompletion, type ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'

export interface ChapterSummaryContext {
  content: string
  globalSettings?: string
}

export interface ChapterSummaryOptions {
  maxTokens?: number
}

const SYSTEM_PROMPT = `你是一个AI助手，名字是神笔AI。请根据提供的章节内容和全局设定生成简洁准确的章节梗概。专注于内容本身的概括。`

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
    prompt += `全局设定（世界观背景）：\n${globalSettings}\n\n`
  }

  prompt += `请根据以下章节内容生成简洁准确的章节梗概（100-200字左右）：\n\n${content}`

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
    { role: 'system', content: SYSTEM_PROMPT },
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