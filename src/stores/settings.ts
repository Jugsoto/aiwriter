import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Setting } from '@/electron.d'
import { updateSettingMemory } from '@/services/settingMemory'
import { useFeatureConfigsStore } from './featureConfigs'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Setting[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentBookId = ref<number | null>(null)

  // 根据书籍ID加载设定
  async function loadSettings(bookId: number) {
    try {
      loading.value = true
      error.value = null
      
      // 如果切换了书籍，清空当前设定数据
      if (currentBookId.value !== bookId) {
        settings.value = []
      }
      
      const loadedSettings = await window.electronAPI.getSettings(bookId)
      settings.value = loadedSettings
      currentBookId.value = bookId
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
      
      // 如果切换了书籍，清空当前设定数据
      if (currentBookId.value !== bookId) {
        settings.value = []
      }
      
      const loadedSettings = await window.electronAPI.getSettingsByType(bookId, type)
      
      // 保留其他类型的设定，只更新当前类型的设定
      const otherTypeSettings = settings.value.filter(setting => setting.type !== type)
      settings.value = [...otherTypeSettings, ...loadedSettings]
      currentBookId.value = bookId
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

  // 清空设定存储
  function clearSettings() {
    settings.value = []
    currentBookId.value = null
    error.value = null
  }

  // 创建新设定
  async function createSetting(data: { book_id: number; type: string; name: string; content?: string; status?: string; starred?: boolean }) {
    try {
      error.value = null
      
      // 验证书籍ID是否匹配当前加载的书籍
      if (currentBookId.value && currentBookId.value !== data.book_id) {
        console.warn(`警告：尝试为书籍ID ${data.book_id} 创建设定，但当前加载的书籍ID是 ${currentBookId.value}`)
      }
      
      const newSetting = await window.electronAPI.createSetting(data)
      // 将新设定添加到本地数组，而不是重新加载
      settings.value.push(newSetting)
      
      // 创建向量时必须有名字，另外两项（内容和状态）任选其一
      if (data.name) { // 只要有名字就创建向量，内容和状态是可选的
        try {
          const featureConfigsStore = useFeatureConfigsStore()
         const embeddingConfig = featureConfigsStore.getConfigByFeatureName('embedding_model')
          
          if (embeddingConfig) {
            console.log('新设定包含内容，自动创建向量记忆...')
            const result = await updateSettingMemory(newSetting, embeddingConfig)
            
            if (result.success) {
              console.log('向量记忆创建成功')
            } else {
              console.warn('向量记忆创建失败:', result.error)
            }
          } else {
            console.warn('未找到嵌入配置，跳过向量创建')
          }
        } catch (memoryError) {
          console.error('创建向量记忆时出错:', memoryError)
          // 不中断主流程，只记录错误
        }
      }
      
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
      
      // 更新时检测设定内容和当前状态两个文本的变化，任意一个变化就更新向量
      if (data.content !== undefined || data.status !== undefined) {
        try {
          const featureConfigsStore = useFeatureConfigsStore()
          const embeddingConfig = featureConfigsStore.getConfigByFeatureName('embedding_model')
          
          if (embeddingConfig) {
            console.log('内容更新，自动更新向量记忆...')
            const result = await updateSettingMemory(updatedSetting, embeddingConfig)
            
            if (result.success) {
              console.log('向量记忆更新成功')
            } else {
              console.warn('向量记忆更新失败:', result.error)
            }
          } else {
            console.warn('未找到嵌入配置，跳过向量更新')
          }
        } catch (memoryError) {
          console.error('更新向量记忆时出错:', memoryError)
          // 不中断主流程，只记录错误
        }
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
    currentBookId,
    loadSettings,
    loadSettingsByType,
    getSetting,
    createSetting,
    updateSetting,
    deleteSetting,
    toggleSettingStar,
    clearSettings
  }
})