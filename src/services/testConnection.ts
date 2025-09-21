import type { Provider } from '@/electron.d'

export interface TestConnectionResult {
  success: boolean
  message: string
  error?: string
}

/**
 * 测试供应商连接
 * @param provider 供应商配置
 * @param modelName 模型名称
 * @returns 测试结果
 */
export async function testConnection(provider: Provider, modelName: string): Promise<TestConnectionResult> {
  try {
    // 简单的连接测试，发送一个基本的聊天请求
    const response = await fetch(`${provider.url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a connection test. Please respond with "Connection successful".'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      return {
        success: false,
        message: '连接失败',
        error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    return {
      success: true,
      message: '连接成功'
    }
  } catch (error) {
    return {
      success: false,
      message: '连接失败',
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}