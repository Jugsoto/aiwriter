import {
  getAllProviders,
  createProvider,
  createModel
} from './database'

/**
 * 默认供应商和模型数据
 * 直接写在代码中，不依赖外部文件
 */
const DEFAULT_PROVIDERS_DATA = {
  providers: [
    {
      name: "OpenAI",
      url: "https://api.openai.com/v1",
      key: "your-openai-api-key-here",
      models: [
        { model: "gpt-4", tags: "最新,强大,多模态" },
        { model: "gpt-4-turbo", tags: "快速,经济,高效" },
        { model: "gpt-3.5-turbo", tags: "经济,快速,轻量" }
      ]
    },
    {
      name: "Anthropic Claude",
      url: "https://api.anthropic.com/v1",
      key: "your-anthropic-api-key-here",
      models: [
        { model: "claude-3-5-sonnet-20241022", tags: "最新,智能,代码" },
        { model: "claude-3-opus-20240229", tags: "强大,复杂任务" },
        { model: "claude-3-sonnet-20240229", tags: "平衡,快速" },
        { model: "claude-3-haiku-20240307", tags: "快速,经济,轻量" }
      ]
    },
    {
      name: "Google Gemini",
      url: "https://generativelanguage.googleapis.com/v1",
      key: "your-google-api-key-here",
      models: [
        { model: "gemini-1.5-pro", tags: "最新,多模态,长文本" },
        { model: "gemini-1.5-flash", tags: "快速,经济,多模态" },
        { model: "gemini-pro", tags: "平衡,通用" }
      ]
    },
    {
      name: "Moonshot AI",
      url: "https://api.moonshot.cn/v1",
      key: "your-moonshot-api-key-here",
      models: [
        { model: "moonshot-v1-8k", tags: "轻量,经济" },
        { model: "moonshot-v1-32k", tags: "中等,平衡" },
        { model: "moonshot-v1-128k", tags: "长文本,强大" }
      ]
    },
    {
      name: "DeepSeek",
      url: "https://api.deepseek.com/v1",
      key: "your-deepseek-api-key-here",
      models: [
        { model: "deepseek-chat", tags: "对话,通用" },
        { model: "deepseek-coder", tags: "代码,编程" }
      ]
    },
    {
      name: "Zhipu AI",
      url: "https://open.bigmodel.cn/api/paas/v4",
      key: "your-zhipu-api-key-here",
      models: [
        { model: "glm-4", tags: "最新,强大,中文" },
        { model: "glm-4v", tags: "多模态,视觉" },
        { model: "glm-3-turbo", tags: "快速,经济,中文" }
      ]
    }
  ]
}

/**
 * 检查是否需要初始化默认数据
 */
function shouldInitializeDefaults(): boolean {
  try {
    const existingProviders = getAllProviders()
    return existingProviders.length === 0
  } catch (error) {
    console.error('Error checking existing providers:', error)
    return false
  }
}

/**
 * 初始化默认供应商和模型
 * 仅在第一次启动时自动执行
 */
export async function initializeDefaultProviders(): Promise<boolean> {
  try {
    // 检查是否需要初始化
    if (!shouldInitializeDefaults()) {
      console.log('Providers already exist, skipping default initialization')
      return true
    }
    
    console.log('Initializing default providers and models...')
    
    // 创建供应商和模型
    for (const providerData of DEFAULT_PROVIDERS_DATA.providers) {
      try {
        // 创建供应商
        const provider = await createProvider({
          name: providerData.name,
          url: providerData.url,
          key: providerData.key,
          is_builtin: 1
        })
        
        console.log(`Created provider: ${provider.name}`)
        
        // 创建模型
        if (providerData.models && providerData.models.length > 0) {
          for (const modelData of providerData.models) {
            await createModel({
              provider_id: provider.id,
              model: modelData.model,
              tags: modelData.tags || ''
            })
          }
          
          console.log(`Created ${providerData.models.length} models for provider: ${provider.name}`)
        }
      } catch (error) {
        console.error(`Failed to create provider ${providerData.name}:`, error)
        // 继续处理其他供应商，不中断整个初始化过程
      }
    }
    
    console.log('Default providers initialization completed successfully')
    return true
    
  } catch (error) {
    console.error('Failed to initialize default providers:', error)
    return false
  }
}

/**
 * 获取初始化状态信息
 */
export function getInitializationStatus(): {
  hasProviders: boolean
  providerCount: number
  isFirstRun: boolean
} {
  try {
    const providers = getAllProviders()
    
    return {
      hasProviders: providers.length > 0,
      providerCount: providers.length,
      isFirstRun: providers.length === 0
    }
  } catch (error) {
    console.error('Failed to get initialization status:', error)
    return {
      hasProviders: false,
      providerCount: 0,
      isFirstRun: false
    }
  }
}