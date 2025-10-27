export interface FetchModelsResult {
  success: boolean
  models: string[]
  error?: string
}

/**
 * 从供应商服务获取模型列表
 * @param url 供应商URL
 * @param key 供应商API Key
 * @returns 获取结果
 */
export async function fetchModelsFromService(url: string, key: string): Promise<FetchModelsResult> {
  try {
    const apiUrl = `${url}/models`
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`
      }
    }

    // 创建10秒超时的Promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('获取模型列表超时，请检查网络连接或稍后重试'))
      }, 10000) // 10秒超时
    })

    // 使用Promise.race实现超时机制
    const response = await Promise.race([
      fetch(apiUrl, options),
      timeoutPromise
    ])

    // 也为JSON解析添加超时机制
    const jsonData = await Promise.race([
      response.json(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('解析响应数据超时'))
        }, 5000) // 5秒超时用于JSON解析
      })
    ])

    if (!response.ok) {
      return {
        success: false,
        models: [],
        error: jsonData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    // 提取模型名称列表
    interface ModelItem {
      id?: string
      name?: string
    }

    let models: string[] = []

    if (Array.isArray(jsonData)) {
      models = jsonData.map((item: ModelItem) => item.id || item.name).filter(Boolean) as string[]
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      models = jsonData.data.map((item: ModelItem) => item.id || item.name).filter(Boolean) as string[]
    } else {
      throw new Error('返回的数据格式不正确')
    }

    return {
      success: true,
      models
    }
  } catch (error) {
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}