/**
 * 工具调用服务
 * 提供OpenAI风格的function calling功能
 */

import type { FeatureConfig } from '@/electron.d'
import OpenAI from 'openai'
import type { ChatMessage } from './chat'

export interface OpenAIToolFunction {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
}

export interface OpenAIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface OpenAIToolResponse {
  content: string
  tool_calls?: OpenAIToolCall[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 带工具调用的聊天完成接口 - 非流式
 * @param messages 聊天消息数组
 * @param tools 工具定义数组
 * @param featureConfig 功能配置（包含供应商和模型信息）
 * @param options 可选参数
 * @returns 聊天响应，包含工具调用
 */
export async function chatCompletionWithTools(
  messages: ChatMessage[],
  tools: OpenAIToolFunction[],
  featureConfig: FeatureConfig,
  options: {
    temperature?: number
    top_p?: number
    max_tokens?: number
    tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  } = {}
): Promise<OpenAIToolResponse> {
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

    // 转换工具格式为OpenAI格式
    const openaiTools = tools.map(tool => ({
      type: tool.type,
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      }
    })) as any[]

    const response = await openai.chat.completions.create({
      model: model.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      temperature: options.temperature ?? featureConfig.temperature,
      top_p: options.top_p ?? featureConfig.top_p,
      max_tokens: options.max_tokens,
      tools: openaiTools,
      tool_choice: options.tool_choice || 'auto',
      stream: false
    })

    // 记录用量统计
    if (response.usage) {
      try {
        await window.electronAPI.createUsageStatistic({
          provider_id: featureConfig.provider_id,
          model_id: featureConfig.model_id,
          feature_name: featureConfig.feature_name,
          mode: 'tool-calling',
          input_tokens: response.usage.prompt_tokens,
          output_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        })
      } catch (error) {
        console.error('记录用量统计失败:', error)
      }
    }

    const message = response.choices[0]?.message
    const toolCalls = message?.tool_calls?.map(toolCall => ({
      id: toolCall.id,
      type: 'function' as const,
      function: {
        name: (toolCall as any).function.name,
        arguments: (toolCall as any).function.arguments
      }
    })) as OpenAIToolCall[]

    return {
      content: message?.content || '',
      tool_calls: toolCalls,
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      } : undefined
    }
  } catch (error) {
    console.error('Tool calling chat completion error:', error)
    throw error
  }
}

/**
 * 执行工具调用并获取结果
 * @param toolCall 工具调用信息
 * @param toolExecutor 工具执行器
 * @returns 工具执行结果
 */
export async function executeToolCall(
  toolCall: OpenAIToolCall,
  toolExecutor: any
): Promise<string> {
  try {
    const result = await toolExecutor.executeTool(toolCall)
    return result.output
  } catch (error) {
    console.error(`工具执行失败: ${toolCall.function.name}`, error)
    return `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`
  }
}

/**
 * 处理多轮工具调用
 * @param messages 初始消息数组
 * @param tools 可用工具定义
 * @param featureConfig 功能配置
 * @param toolExecutor 工具执行器
 * @param maxIterations 最大迭代次数
 * @returns 最终响应
 */
export async function handleMultiTurnToolCalls(
  messages: ChatMessage[],
  tools: OpenAIToolFunction[],
  featureConfig: FeatureConfig,
  toolExecutor: any,
  maxIterations: number = 5
): Promise<OpenAIToolResponse> {
  let currentMessages = [...messages]
  let iteration = 0

  while (iteration < maxIterations) {
    iteration++
    
    // 在每次迭代中，重新构建包含原始上下文的消息
    // 确保AI在每轮都能看到完整的设定列表信息
    const messagesWithOriginalContext = [
      messages[0], // 系统提示词
      messages[1], // 原始用户消息（包含设定列表等重要上下文）
      ...currentMessages.slice(2) // 后续的工具调用历史
    ]
    
    // 调用AI获取响应
    const response = await chatCompletionWithTools(
      messagesWithOriginalContext,
      tools,
      featureConfig,
      { temperature: 0.3 }
    )

    // 如果没有工具调用，返回最终结果
    if (!response.tool_calls || response.tool_calls.length === 0) {
      return response
    }

    // 有工具调用，执行工具并添加结果到消息历史
    for (const toolCall of response.tool_calls) {
      const toolResult = await executeToolCall(toolCall, toolExecutor)
      
      // 添加助手的消息（包含工具调用）
      currentMessages.push({
        role: 'assistant',
        content: response.content,
        tool_calls: response.tool_calls
      } as any)

      // 添加工具执行结果
      currentMessages.push({
        role: 'tool',
        content: toolResult,
        tool_call_id: toolCall.id
      } as any)
    }
  }

  // 达到最大迭代次数，返回最后一次响应
  return {
    content: '达到最大迭代次数，工具调用未完成',
    tool_calls: []
  }
}