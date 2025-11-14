import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FeatureConfig } from '@/electron.d'

export const useFeatureConfigsStore = defineStore('featureConfigs', () => {
  const configs = ref<FeatureConfig[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 功能名称映射和默认配置
  const featureNames = {
    'basic_model': '基础模型',
    'flagship_model': '旗舰模型',
    'embedding_model': '嵌入模型',
    'chapter_planning': '章节细纲',
    'content_writing': '正文写作',
    'setting_maintenance': '设定维护',
  }

  // 功能默认参数配置
  const featureDefaults = {
    'basic_model': {
      temperature: 0.7,
      description: [
        '章节梗概生成'
      ]
    },
    'chapter_planning': {
      temperature: 0.8,
      description: [
        '章节细纲生成',
        '写作助手对话'
      ]
    },
    'content_writing': {
      temperature: 0.8,
      description: [
        '正文创作',
        '章节扩写'
      ]
    },
    'flagship_model': {
      temperature: 0.7,
      description: [
        '章节评估',
        '榜单分析',
        '脑洞生成器',
        '书名生成器',
        '简介生成器'
      ]
    },
    'setting_maintenance': {
      temperature: 0.7,
      description: [
        '设定卡片更新',
        '人物设定维护',
        '世界观设定管理'
      ]
    },
    'embedding_model': {
      temperature: 0.1,
      description: [
        '章节内容检索',
        '设定卡片搜索',
        '记忆相似度匹配'
      ]
    },
  }

  // 获取所有功能配置
  async function loadFeatureConfigs() {
    try {
      loading.value = true
      error.value = null
      const loadedConfigs = await window.electronAPI.getFeatureConfigs()
      configs.value = loadedConfigs
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载功能配置失败'
      console.error('Failed to load feature configs:', err)
    } finally {
      loading.value = false
    }
  }

  // 更新功能配置
  async function updateFeatureConfig(featureName: string, data: { provider_id?: number; model_id?: number; temperature?: number }) {
    try {
      error.value = null
      const updatedConfig = await window.electronAPI.updateFeatureConfig(featureName, data)
      
      // 更新本地数据
      const index = configs.value.findIndex(c => c.feature_name === featureName)
      if (index !== -1) {
        configs.value[index] = updatedConfig
      } else {
        configs.value.push(updatedConfig)
      }
      
      return updatedConfig
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新功能配置失败'
      throw err
    }
  }

  // 根据功能名称获取配置
  function getConfigByFeatureName(featureName: string): FeatureConfig | undefined {
    return configs.value.find(c => c.feature_name === featureName)
  }

  // 获取功能显示名称
  function getFeatureDisplayName(featureName: string): string {
    return featureNames[featureName as keyof typeof featureNames] || featureName
  }

  // 获取功能默认参数
  function getFeatureDefaults(featureName: string) {
    return featureDefaults[featureName as keyof typeof featureDefaults] || {
      temperature: 0.7,
      description: []
    }
  }

  // 获取功能描述
  function getFeatureDescription(featureName: string): string[] {
    return featureDefaults[featureName as keyof typeof featureDefaults]?.description || []
  }

  // 获取所有功能名称
  function getAllFeatureNames(): string[] {
    return Object.keys(featureNames)
  }

  return {
    configs,
    loading,
    error,
    loadFeatureConfigs,
    updateFeatureConfig,
    getConfigByFeatureName,
    getFeatureDisplayName,
    getAllFeatureNames,
    getFeatureDefaults,
    getFeatureDescription
  }
})