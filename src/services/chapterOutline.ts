import { streamChatCompletion, type ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'

export interface ChapterOutlineContext {
  bookTitle: string
  chapterTitle: string
  content?: string
}

const SYSTEM_PROMPT = `你是一个AI助手，生成100字以内的章节细纲`

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
  const { bookTitle, chapterTitle, content } = context

  let prompt = `书籍标题：${bookTitle}
章节标题：${chapterTitle}`

  if (content) {
    prompt += `\n\n现有内容：${content}`
  }

  prompt += `\n\n请为这个章节生成细纲，包括主要情节发展和关键场景。`

  return prompt
}

/**
 * 生成章节细纲 - 流式输出（返回推理内容和正式内容）
 */
export async function* streamChapterOutline(
  context: ChapterOutlineContext,
  featureConfig?: FeatureConfig
): AsyncGenerator<{ type: 'reasoning' | 'content', text: string }, void, unknown> {
  // 如果没有提供功能配置，则获取默认配置
  if (!featureConfig) {
    featureConfig = await getChapterOutlineConfig()
  }

  const userPrompt = buildChapterOutlinePrompt(context)

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ]

  // 流式生成章节细纲
  for await (const chunk of streamChatCompletion(messages, featureConfig)) {
    // 优先处理推理内容
    if (chunk.reasoning_content) {
      yield { type: 'reasoning', text: chunk.reasoning_content }
    } else if (chunk.content) {
      yield { type: 'content', text: chunk.content }
    }
  }
}