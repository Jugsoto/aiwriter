import {
  getAllProviders,
  createProvider,
  createModel
} from './database'

//默认供应商和模型数据
const DEFAULT_PROVIDERS_DATA = {
  providers: [
    {
      name: "DeepSeek",
      url: "https://api.deepseek.com/v1",
      key: "",
      models: [
        { model: "deepseek-chat", tags: "tool" },
        { model: "deepseek-reasoner", tags: "tool,think" }
      ]
    },
    {
      name: "Gemini",
      url: "https://generativelanguage.googleapis.com/v1",
      key: "",
      models: [
        { model: "gemini-2.5-pro", tags: "eye,tool" },
        { model: "gemini-2.5-flash", tags: "eye,tool" },
        { model: "gemini-2.5-flash-lite", tags: "eye,tool" }
      ]
    },
   {
      name: "Kimi",
      url: "https://api.moonshot.cn/v1",
      key: "",
      models: [
        { model: "kimi-k2-0905-preview", tags: "tool" },
        { model: "kimi-k2-turbo-preview", tags: "tool" },
        { model: "kimi-thinking-preview", tags: "tool,think" },
      ]
    },
    {
      name: "硅基流动",
      url: "https://api.siliconflow.cn",
      key: "",
      models: [
        { model: "deepseek-ai/DeepSeek-V3.1", tags: "tool,think" },
        { model: "deepseek-ai/DeepSeek-V3", tags: "tool" },
        { model: "deepseek-ai/DeepSeek-R1", tags: "tool,think" },
        { model: "moonshotai/Kimi-K2-Instruct-0905", tags: "tool" },
        { model: "zai-org/GLM-4.5", tags: "tool,think" },
        { model: "zai-org/GLM-4.5V", tags: "eye,tool,think" },
        { model: "Qwen/Qwen3-235B-A22B-Thinking-2507", tags: "tool,think" },
        { model: "Qwen/Qwen3-235B-A22B-Instruct-2507", tags: "tool" },
        { model: "Qwen/Qwen3-8B", tags: "tool,free" },
        { model: "Qwen/Qwen3-Embedding-0.6B", tags: "embedding" },
        { model: "BAAI/bge-m3", tags: "embedding,free" },
        { model: "BAAI/bge-reranker-v2-m3", tags: "reranker,free" },
      ]
    },
    {
      name: "AiHubMix",
      url: "https://aihubmix.com/v1",
      key: "",
      models: [
        { model: "gpt-5", tags: "eye,tool,think" },
        { model: "gpt-5-mini", tags: "eye,tool,think" },
        { model: "gpt-5-nano", tags: "eye,tool,think" },
        { model: "gemini-2.5-pro", tags: "eye,tool,think" },
        { model: "gemini-2.5-flash", tags: "eye,tool,think" },
        { model: "claude-sonnet-4-20250514", tags: "eye,tool,think" },
      ]
    },
    {
      name: "OpenAI",
      url: "https://api.openai.com/v1",
      key: "",
      models: [
        { model: "gpt-5", tags: "eye,tool,think" },
        { model: "gpt-5-mini", tags: "eye,tool,think" },
        { model: "gpt-5-nano", tags: "eye,tool,think" },
      ]
    },
    {
      name: "Claude",
      url: "https://api.anthropic.com/v1",
      key: "",
      models: [
        { model: "claude-sonnet-4-20250514", tags: "eye,tool,think" },
        { model: "claude-opus-4-20250514", tags: "eye,tool,think" },
      ]
    },

    {
      name: "智谱AI",
      url: "https://open.bigmodel.cn/api/paas/v4",
      key: "",
      models: [
        { model: "glm-4.5", tags: "tool,think" },
        { model: "glm-4.5-air", tags: "tool,think" },
        { model: "glm-4.5-flash", tags: "tool,think,free" },
        { model: "glm-4.5v", tags: "eye,tool,think" },
        { model: "embedding-3", tags: "embedding" }
      ]
    },
    {
      name: "Qwen",
      url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      key: "",
      models: [
        { model: "qwen-plus", tags: "tool,think" },
        { model: "qwen-flash", tags: "tool,think" },
        { model: "qwen-max", tags: "tool" }
      ]
    },
    {
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1",
      key: "",
      models: [
        { model: "deepseek/deepseek-chat-v3.1:free", tags: "tool,think,free" },
        { model: "deepseek/deepseek-chat:free", tags: "tool,free" },
        { model: "deepseek/deepseek-r1:free", tags: "tool,think,free" },
        { model: "moonshotai/kimi-k2:free", tags: "tool,free" },
        { model: "openai/gpt-oss-120b:free", tags: "tool,think,free" },
        { model: "qwen/qwen2.5-vl-72b-instruct:free", tags: "eye,free" },
        { model: "qwen/qwen3-235b-a22b:free", tags: "tool,think,free" },
        { model: "qwen/qwen3-coder:free", tags: "tool,think,free" },
        { model: "z-ai/glm-4.5-air:free", tags: "tool,think,free" },

      ]
    },
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