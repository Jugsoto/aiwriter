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
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * JSON聊天完成接口 - 非流式，强制JSON输出，带重试机制
 * @param messages 聊天消息数组
 * @param featureConfig 功能配置（包含供应商和模型信息）
 * @param options 可选参数
 * @param maxRetries 最大重试次数，默认3次
 * @returns JSON聊天响应
 */
export async function jsonChatCompletion(
  messages: ChatMessage[],
  featureConfig: FeatureConfig,
  options: JsonChatOptions = {},
  maxRetries: number = 3
): Promise<JsonChatResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
        dangerouslyAllowBrowser: true,
        timeout: 120000, // 120秒超时
        maxRetries: 0 // 禁用 OpenAI SDK 的内置重试，我们自己处理
      })

      console.log(`尝试第 ${attempt + 1} 次请求...`)

      const response = await openai.chat.completions.create({
        model: model.model,
        messages: messages as OpenAI.ChatCompletionMessageParam[],
        temperature: options.temperature ?? featureConfig.temperature,
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

      // 记录AI返回的原始内容，用于调试JSON格式错误
      console.log('完整内容:', content)

      // 尝试解析JSON内容
      try {
        if (content) {
          // 清理可能的Markdown代码块标记
          const cleanedContent = cleanJsonString(content)
          console.log('清理后的内容:', cleanedContent)
          json_content = JSON.parse(cleanedContent)
        }
      } catch (error) {
        console.warn('JSON解析失败，返回原始内容:', error)
        console.warn('原始内容:', content)
      }

      console.log(`请求成功完成`)
      return {
        content,
        json_content,
        usage: response.usage
      }
    } catch (error: any) {
      lastError = error
      console.error(`第 ${attempt + 1} 次请求失败:`, error)

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        break
      }

      // 判断是否应该重试
      const shouldRetry =
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('ERR_CONNECTION_CLOSED') ||
        error.message?.includes('fetch failed') ||
        error.status === 500 ||
        error.status === 502 ||
        error.status === 503 ||
        error.status === 504

      if (!shouldRetry) {
        // 如果不是网络错误，直接抛出
        throw error
      }

      // 指数退避：等待时间随重试次数增加
      const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000)
      console.log(`等待 ${waitTime}ms 后重试...`)
      await delay(waitTime)
    }
  }

  // 所有重试都失败了
  console.error('所有重试都失败了')
  throw lastError || new Error('请求失败，请检查网络连接后重试')
}

/**
 * 清理JSON字符串，移除可能的Markdown代码块标记
 * @param content 原始内容字符串
 * @returns 清理后的JSON字符串
 */
export function cleanJsonString(content: string): string {
  if (!content) return content

  let cleaned = content.trim()

  // 移除开头的 ```json 或 ``` (可能包含多个换行符和空格)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '')

  // 移除结尾的 ``` (可能包含多个换行符和空格)
  cleaned = cleaned.replace(/\s*```\s*$/i, '')

  // 再次清理首尾空白
  return cleaned.trim()
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