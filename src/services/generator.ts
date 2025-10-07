import type { FeatureConfig } from '@/electron.d'
import { chatCompletion, streamChatCompletion } from './chat'
import type { ChatMessage } from './chat'
import { getSelectedPromptByCategory } from './promptService'

export type GeneratorType = 'idea' | 'book-title' | 'summary'

export interface GeneratorPrompt {
  type: GeneratorType
  name: string
  systemPrompt: string
  userPromptTemplate: string
}

// 生成器类型与提示词分类的映射
const GENERATOR_CATEGORY_MAP: Record<GeneratorType, string> = {
  'idea': 'idea_generator',
  'book-title': 'book_title_generator',
  'summary': 'summary_generator'
}

// 默认提示词（作为降级方案）
const DEFAULT_GENERATOR_PROMPTS: Record<GeneratorType, GeneratorPrompt> = {
  idea: {
    type: 'idea',
    name: '脑洞生成器',
    systemPrompt: '你是一个创意脑洞生成助手，擅长为用户提供各种新颖、有趣的创意和灵感。你的回答应该富有想象力，多样化，并且能够激发用户的创造力。',
    userPromptTemplate: '请为我生成一些关于"{keyword}"的创意脑洞和灵感，至少提供5个不同方向的想法，每个想法都应该有独特的视角和可能性。'
  },
  'book-title': {
    type: 'book-title',
    name: '书名生成器',
    systemPrompt: '你是一个专业的书名生成助手，擅长为各种类型的书籍创作吸引人、有记忆点的书名。你的书名应该简洁有力，能够准确传达书籍的核心内容或情感。',
    userPromptTemplate: '请为"{keyword}"这个主题生成10个吸引人的书名，涵盖不同风格（如文艺、商业、悬疑、温馨等），每个书名都应该简短有力，富有吸引力。'
  },
  summary: {
    type: 'summary',
    name: '简介生成器',
    systemPrompt: '你是一个专业的作品简介写作助手，擅长为各种类型的书籍、文章、项目等撰写简洁、吸引人的简介。你的简介应该能够准确概括核心内容，同时激发读者的兴趣。',
    userPromptTemplate: '请为"{keyword}"这个主题撰写一个简洁而吸引人的简介，大约150-200字，要能够准确传达核心内容，同时激发读者的阅读兴趣。'
  }
}

/**
 * 获取生成器提示词
 * @param type 生成器类型
 * @returns 生成器提示词配置
 */
export async function getGeneratorPrompt(type: GeneratorType): Promise<GeneratorPrompt> {
  try {
    // 从数据库获取用户选择的提示词
    const category = GENERATOR_CATEGORY_MAP[type]
    const prompt = await getSelectedPromptByCategory(category)
    
    if (prompt) {
      // 解析提示词内容，提取系统提示词和用户提示词模板
      const { systemPrompt, userPromptTemplate } = parsePromptContent(prompt.content, type)
      return {
        type,
        name: prompt.name,
        systemPrompt,
        userPromptTemplate
      }
    }
    
    // 如果没有找到提示词，使用默认提示词
    console.warn(`未找到生成器 ${type} 的提示词，使用默认提示词`)
    return DEFAULT_GENERATOR_PROMPTS[type]
  } catch (error) {
    console.error(`获取生成器 ${type} 提示词失败:`, error)
    // 出错时使用默认提示词
    return DEFAULT_GENERATOR_PROMPTS[type]
  }
}

/**
 * 解析提示词内容，提取系统提示词和用户提示词模板
 * @param content 提示词内容
 * @param type 生成器类型
 * @returns 解析后的系统提示词和用户提示词模板
 */
function parsePromptContent(content: string, type: GeneratorType): {
  systemPrompt: string
  userPromptTemplate: string
} {
  // 根据生成器类型生成相应的用户提示词模板
  let userPromptTemplate = ''
  
  switch (type) {
    case 'idea':
      userPromptTemplate = content.includes('{keyword}')
        ? content
        : `请为我生成一些关于"{keyword}"的创意脑洞和灵感，至少提供5个不同方向的想法，每个想法都应该有独特的视角和可能性。`
      break
    case 'book-title':
      userPromptTemplate = content.includes('{keyword}')
        ? content
        : `请为"{keyword}"这个主题生成10个吸引人的书名，涵盖不同风格（如文艺、商业、悬疑、温馨等），每个书名都应该简短有力，富有吸引力。`
      break
    case 'summary':
      userPromptTemplate = content.includes('{keyword}')
        ? content
        : `请为"{keyword}"这个主题撰写一个简洁而吸引人的简介，大约150-200字，要能够准确传达核心内容，同时激发读者的阅读兴趣。`
      break
  }
  
  return {
    systemPrompt: content,
    userPromptTemplate
  }
}

/**
 * 生成内容 - 非流式
 * @param type 生成器类型
 * @param keyword 关键词
 * @param featureConfig 功能配置
 * @returns 生成的内容
 */
export async function generateContent(
  type: GeneratorType,
  keyword: string,
  featureConfig: FeatureConfig
): Promise<string> {
  const promptConfig = await getGeneratorPrompt(type)
  
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: promptConfig.systemPrompt
    },
    {
      role: 'user',
      content: promptConfig.userPromptTemplate.replace('{keyword}', keyword)
    }
  ]

  try {
    const response = await chatCompletion(messages, featureConfig)
    return response.content
  } catch (error) {
    console.error('生成内容失败:', error)
    throw error
  }
}

/**
 * 生成内容 - 流式
 * @param type 生成器类型
 * @param keyword 关键词
 * @param featureConfig 功能配置
 * @param signal 可选的AbortSignal用于终止请求
 * @yields 流式响应块
 */
export async function* streamGenerateContent(
  type: GeneratorType,
  keyword: string,
  featureConfig: FeatureConfig,
  conversationHistory: ChatMessage[] = [],
  signal?: AbortSignal
): AsyncGenerator<{ content: string, reasoning_content?: string }, void, unknown> {
  const promptConfig = await getGeneratorPrompt(type)
  
  // 构建消息数组，包含对话历史
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: promptConfig.systemPrompt
    },
    ...conversationHistory,
    {
      role: 'user',
      content: promptConfig.userPromptTemplate.replace('{keyword}', keyword)
    }
  ]

  try {
    for await (const chunk of streamChatCompletion(messages, featureConfig, {}, signal)) {
      if (signal?.aborted) {
        break
      }
      yield {
        content: chunk.content,
        reasoning_content: chunk.reasoning_content
      }
    }
  } catch (error) {
    console.error('流式生成内容失败:', error)
    throw error
  }
}