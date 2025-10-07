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
      max_tokens: options.max_tokens,
      stream: false
    })

    // 记录用量统计
    if (response.usage) {
      try {
        await window.electronAPI.createUsageStatistic({
          provider_id: featureConfig.provider_id,
          model_id: featureConfig.model_id,
          feature_name: featureConfig.feature_name,
          mode: 'non-stream',
          input_tokens: response.usage.prompt_tokens,
          output_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        })
      } catch (error) {
        console.error('记录用量统计失败:', error)
      }
    }

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
 * @param signal 可选的AbortSignal用于终止请求
 * @yields 流式响应块
 */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  featureConfig: FeatureConfig,
  options: ChatOptions = {},
  signal?: AbortSignal
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
        max_tokens: options.max_tokens
      },
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      fullMessages: messages // 完整的消息内容
    }

    console.log(logData)

    const openai = new OpenAI({
      apiKey: provider.key,
      baseURL: provider.url,
      dangerouslyAllowBrowser: true
    })

    const stream = await openai.chat.completions.create({
      model: model.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      temperature: options.temperature ?? featureConfig.temperature,
      max_tokens: options.max_tokens,
      stream: true
    }, {
      signal: signal // 在第二个参数中传递终止信号
    })

    let totalUsage = undefined
    
    try {
      for await (const chunk of stream) {
        // 立即检查终止信号
        if (signal?.aborted) {
          console.log('流式输出被用户终止')
          break
        }
        
        const delta = chunk.choices[0]?.delta as any
        const finishReason = chunk.choices[0]?.finish_reason
        
        // 检查是否有用量信息（通常在最后一个chunk中）
        if (chunk.usage) {
          totalUsage = chunk.usage
        }
        
        yield {
          content: delta?.content || '',
          reasoning_content: delta?.reasoning_content || '',
          finish_reason: finishReason,
          usage: chunk.usage ? {
            prompt_tokens: chunk.usage.prompt_tokens,
            completion_tokens: chunk.usage.completion_tokens,
            total_tokens: chunk.usage.total_tokens
          } : undefined
        }
        
        // 每个chunk处理后都检查终止信号，确保快速响应
        if (signal?.aborted) {
          console.log('流式输出在处理chunk时被终止')
          break
        }
      }
    } catch (error: any) {
      // 处理用户终止的情况
      if (error.name === 'AbortError' || signal?.aborted) {
        console.log('流式输出被终止')
        return
      }
      throw error
    }
    
    // 流式响应结束后记录用量统计
    if (totalUsage) {
      try {
        await window.electronAPI.createUsageStatistic({
          provider_id: featureConfig.provider_id,
          model_id: featureConfig.model_id,
          feature_name: featureConfig.feature_name,
          mode: 'stream',
          input_tokens: totalUsage.prompt_tokens,
          output_tokens: totalUsage.completion_tokens,
          total_tokens: totalUsage.total_tokens
        })
      } catch (error) {
        console.error('记录流式用量统计失败:', error)
      }
    }
  } catch (error) {
    console.error('Stream chat completion error:', error)
    throw error
  }
}