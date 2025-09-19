import type { FeatureConfig } from '@/electron.d'
import OpenAI from 'openai'

declare module 'openai' {
  interface ChatCompletionStreamingDelta {
    reasoning_content?: string
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatOptions {
  temperature?: number
  top_p?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface StreamChunk {
  content: string
  reasoning_content?: string
  finish_reason?: string | null
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 通用聊天完成接口 - 非流式
 * @param messages 聊天消息数组
 * @param featureConfig 功能配置（包含供应商和模型信息）
 * @param options 可选参数
 * @returns 聊天响应
 */
export async function chatCompletion(
  messages: ChatMessage[],
  featureConfig: FeatureConfig,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  try {
    const provider = await window.electronAPI.getProvider(featureConfig.provider_id)
    if (!provider) {
      throw new Error('供应商不存在')
    }

    const model = await window.electronAPI.getModel(featureConfig.model_id)
    if (!model) {
      throw new Error('模型不存在')
    }

    const openai = new OpenAI({
      apiKey: provider.key,
      baseURL: provider.url,
      dangerouslyAllowBrowser: true
    })

    const response = await openai.chat.completions.create({
      model: model.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      temperature: options.temperature ?? featureConfig.temperature,
      top_p: options.top_p ?? featureConfig.top_p,
      max_tokens: options.max_tokens,
      stream: false
    })

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage
    }
  } catch (error) {
    console.error('Chat completion error:', error)
    throw error
  }
}

/**
 * 通用聊天完成接口 - 流式
 * @param messages 聊天消息数组
 * @param featureConfig 功能配置（包含供应商和模型信息）
 * @param options 可选参数
 * @yields 流式响应块
 */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  featureConfig: FeatureConfig,
  options: ChatOptions = {}
): AsyncGenerator<StreamChunk, void, unknown> {
  try {
    const provider = await window.electronAPI.getProvider(featureConfig.provider_id)
    if (!provider) {
      throw new Error('供应商不存在')
    }

    const model = await window.electronAPI.getModel(featureConfig.model_id)
    if (!model) {
      throw new Error('模型不存在')
    }

    // 记录详细的模型信息和发送内容
    const logData = {
      timestamp: new Date().toISOString(),
      provider: {
        id: provider.id,
        name: provider.name,
        url: provider.url
      },
      model: {
        id: model.id,
        name: model.model,
        provider_id: model.provider_id
      },
      featureConfig: {
        feature_name: featureConfig.feature_name,
        temperature: options.temperature ?? featureConfig.temperature,
        top_p: options.top_p ?? featureConfig.top_p,
        max_tokens: options.max_tokens
      },
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content.substring(0, 500) + (msg.content.length > 500 ? '...' : '') // 截断过长的内容
      })),
      fullMessages: messages // 完整的消息内容
    }

    console.log(JSON.stringify(logData, null, 2))

    const openai = new OpenAI({
      apiKey: provider.key,
      baseURL: provider.url,
      dangerouslyAllowBrowser: true
    })

    const stream = await openai.chat.completions.create({
      model: model.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      temperature: options.temperature ?? featureConfig.temperature,
      top_p: options.top_p ?? featureConfig.top_p,
      max_tokens: options.max_tokens,
      stream: true
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta as any
      yield {
        content: delta?.content || '',
        reasoning_content: delta?.reasoning_content || '',
        finish_reason: chunk.choices[0]?.finish_reason,
        usage: undefined // 流式响应中usage通常在最后返回
      }
    }
  } catch (error) {
    console.error('Stream chat completion error:', error)
    throw error
  }
}