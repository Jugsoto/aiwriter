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
    'chapter_planning': '章节细纲',
    'content_writing': '正文写作',
    'editing_review': '编辑审核',
    'setting_maintenance': '设定维护',
    'embedding_model': '嵌入模型',
    
  }

  // 功能默认参数配置
  const featureDefaults = {
    'basic_model': {
      temperature: 0.7,
      top_p: 0.9,
      description: '用于基础操作，如章节梗概，方向建议，工具页面等'
    },
    'chapter_planning': {
      temperature: 0.8,
      top_p: 0.95,
      description: '用于书籍章节的结构规划和内容设计'
    },
    'content_writing': {
      temperature: 0.8,
      top_p: 0.95,
      description: '用于创作书籍的正文内容'
    },
    'editing_review': {
      temperature: 0.3,
      top_p: 0.7,
      description: '用于内容的评价、校对和审核工作'
    },
    'setting_maintenance': {
      temperature: 0.3,
      top_p: 0.7,
      description: '用于维护和管理设定卡片的信息，包括更新、整理和优化设定内容'
    },
    'embedding_model': {
      temperature: 0.1,
      top_p: 0.5,
      description: '用于文本嵌入和语义搜索任务'
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
  async function updateFeatureConfig(featureName: string, data: { provider_id?: number; model_id?: number; temperature?: number; top_p?: number }) {
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
      top_p: 1.0,
      description: ''
    }
  }

  // 获取功能描述
  function getFeatureDescription(featureName: string): string {
    return featureDefaults[featureName as keyof typeof featureDefaults]?.description || ''
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