import {
  getAllProviders,
  createProvider,
  createModel,
  getFeatureConfigByName,
  createFeatureConfig,
  deleteFeatureConfig,
  getModelsByProviderId
} from '../database'

// 默认供应商和模型数据
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
        { model: "gemini-2.5-pro", tags: "eye,tool,think" },
        { model: "gemini-2.5-flash", tags: "eye,tool,think" },
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
        { model: "kimi-thinking-preview", tags: "tool,think" }
      ]
    },
    {
      name: "硅基流动",
      url: "https://api.siliconflow.cn",
      key: "",
      models: [
        { model: "deepseek-ai/DeepSeek-V3.1", tags: "tool" },
        { model: "deepseek-ai/DeepSeek-V3", tags: "tool" },
        { model: "deepseek-ai/DeepSeek-R1", tags: "tool,think" },
        { model: "moonshotai/Kimi-K2-Instruct-0905", tags: "tool,think" },
        { model: "zai-org/GLM-4.5", tags: "tool,think" },
        { model: "zai-org/GLM-4.5V", tags: "eye,tool,think" },
        { model: "Qwen/Qwen3-235B-A22B-Thinking-2507", tags: "tool,think" },
        { model: "Qwen/Qwen3-235B-A22B-Instruct-2507", tags: "tool" },
        { model: "Qwen/Qwen3-8B", tags: "tool,free" },
        { model: "Qwen/Qwen3-Embedding-0.6B", tags: "embedding" },
        { model: "BAAI/bge-m3", tags: "embedding,free" },
        { model: "BAAI/bge-reranker-v2-m3", tags: "reranker,free" }
      ]
    },
    {
      name: "AiHubMix",
      url: "https://aihubmix.com/v1",
      key: "",
      models: [
        { model: "gpt-5", tags: "tool,think" },
        { model: "gpt-5-mini", tags: "tool,think" },
        { model: "gpt-5-nano", tags: "tool,think" },
        { model: "gemini-2.5-pro", tags: "eye,tool,think" },
        { model: "gemini-2.5-flash", tags: "eye,tool,think" },
        { model: "claude-sonnet-4-20250514", tags: "tool,think" }
      ]
    },
    {
      name: "OpenAI",
      url: "https://api.openai.com/v1",
      key: "",
      models: [
        { model: "gpt-5", tags: "tool,think" },
        { model: "gpt-5-mini", tags: "tool,think" },
        { model: "gpt-5-nano", tags: "tool,think" }
      ]
    },
    {
      name: "Claude",
      url: "https://api.anthropic.com/v1",
      key: "",
      models: [
        { model: "claude-sonnet-4-20250514", tags: "tool,think" },
        { model: "claude-opus-4-20250514", tags: "tool,think" }
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
        { model: "qwen-max", tags: "tool,think" }
      ]
    },
    {
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1",
      key: "",
      models: [
        { model: "deepseek/deepseek-chat-v3.1:free", tags: "tool,free" },
        { model: "deepseek/deepseek-chat:free", tags: "tool,think,free" },
        { model: "deepseek/deepseek-r1:free", tags: "tool,think,free" },
        { model: "moonshotai/kimi-k2:free", tags: "tool,think,free" },
        { model: "openai/gpt-oss-120b:free", tags: "tool,think,free" },
        { model: "qwen/qwen2.5-vl-72b-instruct:free", tags: "eye,tool,free" },
        { model: "qwen/qwen3-235b-a22b:free", tags: "tool,think,free" },
        { model: "qwen/qwen3-coder:free", tags: "tool,think,free" },
        { model: "z-ai/glm-4.5-air:free", tags: "tool,think,free" }
      ]
    }
  ]
}

// 默认功能配置数据
const DEFAULT_FEATURE_CONFIGS_DATA = {
  configs: [
    {
      feature_name: 'basic_model',
      temperature: 0.7,
      provider_name: 'DeepSeek',
      model_name: 'deepseek-chat'
    },
    {
      feature_name: 'chapter_planning',
      temperature: 0.8,
      provider_name: 'DeepSeek',
      model_name: 'deepseek-reasoner'
    },
    {
      feature_name: 'content_writing',
      temperature: 0.8,
      provider_name: 'Kimi',
      model_name: 'kimi-k2-0905-preview'
    },
    {
      feature_name: 'flagship_model',
      temperature: 0.7,
      provider_name: 'AiHubMix',
      model_name: 'gpt-5'
    },
    {
      feature_name: 'embedding_model',
      temperature: 0.7,
      provider_name: '硅基流动',
      model_name: 'BAAI/bge-m3'
    },
    {
      feature_name: 'setting_maintenance',
      temperature: 0.6,
      provider_name: 'DeepSeek',
      model_name: 'deepseek-chat'
    }
  ]
}

// 检查是否需要初始化默认数据
function shouldInitializeDefaults(): boolean {
  try {
    const existingProviders = getAllProviders()
    return existingProviders.length === 0
  } catch (error) {
    console.error('检查现有供应商失败:', error)
    return false
  }
}

// 使用默认数据初始化功能配置
function initializeFeatureConfigsWithDefaults(): void {
  try {
    // 获取所有供应商
    const allProviders = getAllProviders()
    if (allProviders.length === 0) {
      console.log('没有可用的供应商，跳过功能配置初始化')
      return
    }

    // 为每个默认功能配置创建或更新配置
    for (const defaultConfig of DEFAULT_FEATURE_CONFIGS_DATA.configs) {
      try {
        // 检查功能配置是否已存在
        const existingConfig = getFeatureConfigByName(defaultConfig.feature_name)

        if (!existingConfig) {
          // 根据配置中指定的供应商名称查找供应商
          const targetProvider = allProviders.find(p => p.name === defaultConfig.provider_name)
          if (!targetProvider) {
            console.log(`未找到供应商 ${defaultConfig.provider_name}，跳过功能 ${defaultConfig.feature_name} 的配置`)
            continue
          }

          // 获取该供应商的所有模型
          const providerModels = getModelsByProviderId(targetProvider.id)
          if (providerModels.length === 0) {
            console.log(`供应商 ${targetProvider.name} 没有可用的模型，跳过功能 ${defaultConfig.feature_name} 的配置`)
            continue
          }

          // 根据配置中指定的模型名称查找模型
          const selectedModel = providerModels.find(m => m.model === defaultConfig.model_name)
          if (!selectedModel) {
            console.log(`未找到模型 ${defaultConfig.model_name}，使用供应商 ${targetProvider.name} 的第一个模型`)
            const firstModel = providerModels[0]
            createFeatureConfig({
              feature_name: defaultConfig.feature_name,
              provider_id: targetProvider.id,
              model_id: firstModel.id,
              temperature: defaultConfig.temperature
            })
            console.log(`为功能 ${defaultConfig.feature_name} 创建默认配置: 供应商=${targetProvider.name}, 模型=${firstModel.model}`)
          } else {
            // 创建功能配置
            createFeatureConfig({
              feature_name: defaultConfig.feature_name,
              provider_id: targetProvider.id,
              model_id: selectedModel.id,
              temperature: defaultConfig.temperature
            })
            console.log(`为功能 ${defaultConfig.feature_name} 创建默认配置: 供应商=${targetProvider.name}, 模型=${selectedModel.model}`)
          }
        }
      } catch (error) {
        console.error(`功能配置 ${defaultConfig.feature_name} 初始化失败:`, error)
        // 继续处理其他功能配置
      }
    }

    console.log('功能配置初始化完成')
  } catch (error) {
    console.error('功能配置初始化失败:', error)
    throw error
  }
}

export function ensureDefaultFeatureConfigs(): void {
  initializeFeatureConfigsWithDefaults()
}

// 初始化默认供应商和模型
export async function initializeDefaultProviders(): Promise<boolean> {
  try {
    // 检查是否需要初始化
    if (!shouldInitializeDefaults()) {
      // 已存在供应商，跳过初始化
      return true
    }

    // 开始初始化默认供应商和模型

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

        // 供应商创建成功

        // 创建模型
        if (providerData.models && providerData.models.length > 0) {
          for (const modelData of providerData.models) {
            await createModel({
              provider_id: provider.id,
              model: modelData.model,
              tags: modelData.tags || ''
            })
          }

          // 模型创建完成
        }
      } catch (error) {
        console.error(`创建供应商 ${providerData.name} 失败:`, error)
        // 继续处理其他供应商，不中断整个初始化过程
      }
    }

    // 初始化功能配置（使用默认数据）
    try {
      initializeFeatureConfigsWithDefaults()
      // 功能配置初始化完成
    } catch (error) {
      console.error('功能配置初始化失败:', error)
    }

    return true

  } catch (error) {
    console.error('默认供应商初始化失败:', error)
    return false
  }
}

// 迁移旧的功能配置到新的旗舰模型
export function migrateToFlagshipModel(): void {
  try {
    // 检查是否存在 chapter_review 或 generator 配置
    const chapterReviewConfig = getFeatureConfigByName('chapter_review')
    const generatorConfig = getFeatureConfigByName('generator')

    // 如果已经存在 flagship_model 配置，则不需要迁移
    const flagshipConfig = getFeatureConfigByName('flagship_model')
    if (flagshipConfig) {
      // 删除旧的配置
      if (chapterReviewConfig) {
        deleteFeatureConfig('chapter_review')
        console.log('已删除旧的 chapter_review 配置')
      }
      if (generatorConfig) {
        deleteFeatureConfig('generator')
        console.log('已删除旧的 generator 配置')
      }
      return
    }

    // 如果存在 chapter_review 配置，使用它作为 flagship_model 的基础
    if (chapterReviewConfig) {
      createFeatureConfig({
        feature_name: 'flagship_model',
        provider_id: chapterReviewConfig.provider_id,
        model_id: chapterReviewConfig.model_id,
        temperature: chapterReviewConfig.temperature
      })
      console.log('已从 chapter_review 迁移到 flagship_model')

      // 删除旧配置
      deleteFeatureConfig('chapter_review')
      if (generatorConfig) {
        deleteFeatureConfig('generator')
      }
    }
    // 如果只存在 generator 配置，使用它作为 flagship_model 的基础
    else if (generatorConfig) {
      createFeatureConfig({
        feature_name: 'flagship_model',
        provider_id: generatorConfig.provider_id,
        model_id: generatorConfig.model_id,
        temperature: generatorConfig.temperature
      })
      console.log('已从 generator 迁移到 flagship_model')

      // 删除旧配置
      deleteFeatureConfig('generator')
    }

    console.log('功能配置迁移完成')
  } catch (error) {
    console.error('功能配置迁移失败:', error)
  }
}

// 获取初始化状态信息
export function getProviderInitializationStatus(): {
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
    console.error('获取初始化状态失败:', error)
    return {
      hasProviders: false,
      providerCount: 0,
      isFirstRun: false
    }
  }
}