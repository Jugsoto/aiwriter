import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Provider, Model } from '@/electron.d'

export const useProvidersStore = defineStore('providers', () => {
  const providers = ref<Provider[]>([])
  const models = ref<Model[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedProviderId = ref<number | null>(null)

  // 加载所有供应商
  async function loadProviders() {
    try {
      loading.value = true
      error.value = null
      const loadedProviders = await window.electronAPI.getProviders()
      providers.value = loadedProviders
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载供应商失败'
      console.error('Failed to load providers:', err)
    } finally {
      loading.value = false
    }
  }

  // 根据ID获取供应商
  async function getProvider(id: number) {
    try {
      error.value = null
      const provider = await window.electronAPI.getProvider(id)
      return provider
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取供应商失败'
      throw err
    }
  }

  // 创建新供应商
  async function createProvider(data: { name: string; url: string; key: string; is_builtin?: number }) {
    try {
      error.value = null
      const newProvider = await window.electronAPI.createProvider(data)
      providers.value.push(newProvider)
      return newProvider
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建供应商失败'
      throw err
    }
  }

  // 更新供应商
  async function updateProvider(id: number, data: { name?: string; url?: string; key?: string; is_builtin?: number }) {
    try {
      error.value = null
      const updatedProvider = await window.electronAPI.updateProvider(id, data)
      
      // 更新本地数据
      const index = providers.value.findIndex(p => p.id === id)
      if (index !== -1) {
        providers.value[index] = updatedProvider
      }
      
      return updatedProvider
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新供应商失败'
      throw err
    }
  }

  // 删除供应商
  async function deleteProvider(id: number) {
    try {
      error.value = null
      await window.electronAPI.deleteProvider(id)
      
      // 从本地数据中删除
      const index = providers.value.findIndex(p => p.id === id)
      if (index !== -1) {
        providers.value.splice(index, 1)
      }
      
      // 如果删除的是当前选中的供应商，清空选择
      if (selectedProviderId.value === id) {
        selectedProviderId.value = null
        models.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除供应商失败'
      throw err
    }
  }

  // 加载指定供应商的模型
  async function loadModels(providerId: number) {
    try {
      loading.value = true
      error.value = null
      const loadedModels = await window.electronAPI.getModels(providerId)
      models.value = loadedModels
      selectedProviderId.value = providerId
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载模型失败'
      console.error('Failed to load models:', err)
    } finally {
      loading.value = false
    }
  }

  // 根据ID获取模型
  async function getModel(id: number) {
    try {
      error.value = null
      const model = await window.electronAPI.getModel(id)
      return model
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取模型失败'
      throw err
    }
  }

  // 创建新模型
  async function createModel(data: { provider_id: number; model: string; tags?: string }) {
    try {
      error.value = null
      const newModel = await window.electronAPI.createModel(data)
      models.value.push(newModel)
      return newModel
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建模型失败'
      throw err
    }
  }

  // 更新模型
  async function updateModel(id: number, data: { provider_id?: number; model?: string; tags?: string }) {
    try {
      error.value = null
      const updatedModel = await window.electronAPI.updateModel(id, data)
      
      // 更新本地数据
      const index = models.value.findIndex(m => m.id === id)
      if (index !== -1) {
        models.value[index] = updatedModel
      }
      
      return updatedModel
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新模型失败'
      throw err
    }
  }

  // 删除模型
  async function deleteModel(id: number) {
    try {
      error.value = null
      await window.electronAPI.deleteModel(id)
      
      // 从本地数据中删除
      const index = models.value.findIndex(m => m.id === id)
      if (index !== -1) {
        models.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除模型失败'
      throw err
    }
  }

  // 选择供应商
  function selectProvider(providerId: number | null) {
    selectedProviderId.value = providerId
    if (providerId) {
      loadModels(providerId)
    } else {
      models.value = []
    }
  }

  return {
    providers,
    models,
    loading,
    error,
    selectedProviderId,
    loadProviders,
    getProvider,
    createProvider,
    updateProvider,
    deleteProvider,
    loadModels,
    getModel,
    createModel,
    updateModel,
    deleteModel,
    selectProvider
  }
})