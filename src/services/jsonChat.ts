/**
 * JSON聊天服务
 * 基于OpenAI库的非流式JSON输出调用
 * 参考chat.ts和toolCalling.ts实现
 */

import type { FeatureConfig } from '@/electron.d'
import OpenAI from 'openai'
import type { ChatMessage } from './chat'

export interface JsonChatOptions {
  temperature?: number
  top_p?: number
  response_format?: {
    type: 'json_object'
  }
}

export interface JsonChatResponse {
  content: string
  json_content?: Record<string, any>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * JSON聊天完成接口 - 非流式，强制JSON输出
 * @param messages 聊天消息数组
 * @param featureConfig 功能配置（包含供应商和模型信息）
 * @param options 可选参数
 * @returns JSON聊天响应
 */
export async function jsonChatCompletion(
  messages: ChatMessage[],
  featureConfig: FeatureConfig,
  options: JsonChatOptions = {}
): Promise<JsonChatResponse> {
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
      response_format: { type: 'json_object' }, // 强制JSON输出
      stream: false
    })

    // 记录用量统计
    if (response.usage) {
      try {
        await window.electronAPI.createUsageStatistic({
          provider_id: featureConfig.provider_id,
          model_id: featureConfig.model_id,
          feature_name: featureConfig.feature_name,
          mode: 'json-chat',
          input_tokens: response.usage.prompt_tokens,
          output_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        })
      } catch (error) {
        console.error('记录用量统计失败:', error)
      }
    }

    const content = response.choices[0]?.message?.content || ''
    let json_content: Record<string, any> | undefined

    // 尝试解析JSON内容
    try {
      if (content) {
        json_content = JSON.parse(content)
      }
    } catch (error) {
      console.warn('JSON解析失败，返回原始内容:', error)
    }

    return {
      content,
      json_content,
      usage: response.usage
    }
  } catch (error) {
    console.error('JSON聊天完成错误:', error)
    throw error
  }
}

/**
 * 验证JSON结构是否符合预期格式
 * @param json 要验证的JSON对象
 * @param expectedFields 期望的字段列表
 * @returns 验证结果
 */
export function validateJsonStructure(
  json: Record<string, any>,
  expectedFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = []
  
  for (const field of expectedFields) {
    if (!(field in json)) {
      missingFields.push(field)
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  }
}