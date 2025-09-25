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

    const response = await fetch(apiUrl, options)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        models: [],
        error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    // 提取模型名称列表
    interface ModelItem {
      id?: string
      name?: string
    }
    
    let models: string[] = []
    
    if (Array.isArray(data)) {
      models = data.map((item: ModelItem) => item.id || item.name).filter(Boolean) as string[]
    } else if (data.data && Array.isArray(data.data)) {
      models = data.data.map((item: ModelItem) => item.id || item.name).filter(Boolean) as string[]
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