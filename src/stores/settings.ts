import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Setting } from '@/electron.d'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Setting[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 根据书籍ID加载设定
  async function loadSettings(bookId: number) {
    try {
      loading.value = true
      error.value = null
      const loadedSettings = await window.electronAPI.getSettings(bookId)
      settings.value = loadedSettings
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载设定失败'
      console.error('Failed to load settings:', err)
    } finally {
      loading.value = false
    }
  }

  // 根据书籍ID和类型加载设定
  async function loadSettingsByType(bookId: number, type: string) {
    try {
      loading.value = true
      error.value = null
      const loadedSettings = await window.electronAPI.getSettingsByType(bookId, type)
      
      // 保留其他类型的设定，只更新当前类型的设定
      const otherTypeSettings = settings.value.filter(setting => setting.type !== type)
      settings.value = [...otherTypeSettings, ...loadedSettings]
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载设定失败'
      console.error('Failed to load settings by type:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取设定详情
  async function getSetting(id: number) {
    try {
      error.value = null
      const setting = await window.electronAPI.getSetting(id)
      return setting
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取设定失败'
      throw err
    }
  }

  // 创建新设定
  async function createSetting(data: { book_id: number; type: string; name: string; content?: string; status?: string; starred?: boolean }) {
    try {
      error.value = null
      const newSetting = await window.electronAPI.createSetting(data)
      // 将新设定添加到本地数组，而不是重新加载
      settings.value.push(newSetting)
      return newSetting
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建设定失败'
      throw err
    }
  }

  // 更新设定
  async function updateSetting(id: number, data: { type?: string; name?: string; content?: string; status?: string; starred?: boolean }) {
    try {
      error.value = null
      const updatedSetting = await window.electronAPI.updateSetting(id, data)
      
      // 更新本地数据
      const index = settings.value.findIndex(s => s.id === id)
      if (index !== -1) {
        settings.value[index] = updatedSetting
      }
      
      return updatedSetting
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新设定失败'
      throw err
    }
  }

  // 删除设定
  async function deleteSetting(id: number) {
    try {
      error.value = null
      await window.electronAPI.deleteSetting(id)
      
      // 从本地数据中删除
      const index = settings.value.findIndex(s => s.id === id)
      if (index !== -1) {
        settings.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除设定失败'
      throw err
    }
  }

  // 切换设定星标状态
  async function toggleSettingStar(id: number) {
    try {
      error.value = null
      const updatedSetting = await window.electronAPI.toggleSettingStar(id)
      
      // 更新本地数据
      const index = settings.value.findIndex(s => s.id === id)
      if (index !== -1) {
        settings.value[index] = updatedSetting
      }
      
      return updatedSetting
    } catch (err) {
      error.value = err instanceof Error ? err.message : '切换星标状态失败'
      throw err
    }
  }

  return {
    settings,
    loading,
    error,
    loadSettings,
    loadSettingsByType,
    getSetting,
    createSetting,
    updateSetting,
    deleteSetting,
    toggleSettingStar
  }
})