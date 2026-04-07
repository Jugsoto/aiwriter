import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ReferenceLibrary } from '@/electron.d'
import { useFeatureConfigsStore } from './featureConfigs'

export const useReferenceLibraryStore = defineStore('referenceLibrary', () => {
  const references = ref<ReferenceLibrary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentBookId = ref<number | null>(null)

  // 根据书籍ID加载资料
  async function loadReferences(bookId: number) {
    try {
      loading.value = true
      error.value = null

      // 如果切换了书籍，清空当前资料数据
      if (currentBookId.value !== bookId) {
        references.value = []
      }

      const loadedReferences = await window.electronAPI.getReferences(bookId)
      references.value = loadedReferences
      currentBookId.value = bookId
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载资料库失败'
      console.error('Failed to load references:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取资料详情
  async function getReference(id: number) {
    try {
      error.value = null
      const reference = await window.electronAPI.getReference(id)
      return reference
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取资料失败'
      throw err
    }
  }

  // 清空资料存储
  function clearReferences() {
    references.value = []
    currentBookId.value = null
    error.value = null
  }

  // 创建新资料
  async function createReference(data: {
    book_id: number
    title: string
    content: string
    file_type?: string
    source_type?: 'manual' | 'import' | 'chapter'
    source_path?: string
    tags?: string[]
    starred?: boolean
    metadata?: Record<string, any>
  }) {
    try {
      error.value = null

      // 验证书籍ID是否匹配当前加载的书籍
      if (currentBookId.value && currentBookId.value !== data.book_id) {
        console.warn(`警告：尝试为书籍ID ${data.book_id} 创建资料，但当前加载的书籍ID是 ${currentBookId.value}`)
      }

      const newReference = await window.electronAPI.createReference(data)
      // 将新资料添加到本地数组
      references.value.push(newReference)

      return newReference
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建资料失败'
      throw err
    }
  }

  // 更新资料
  async function updateReference(id: number, data: {
    title?: string
    content?: string
    file_type?: string
    source_type?: 'manual' | 'import' | 'chapter'
    source_path?: string
    tags?: string[]
    starred?: boolean
    metadata?: Record<string, any>
  }) {
    try {
      error.value = null
      const updatedReference = await window.electronAPI.updateReference(id, data)

      // 更新本地数据
      const index = references.value.findIndex(r => r.id === id)
      if (index !== -1) {
        references.value[index] = updatedReference
      }

      return updatedReference
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新资料失败'
      throw err
    }
  }

  // 删除资料
  async function deleteReference(id: number) {
    try {
      error.value = null
      await window.electronAPI.deleteReference(id)

      // 从本地数据中删除
      const index = references.value.findIndex(r => r.id === id)
      if (index !== -1) {
        references.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除资料失败'
      throw err
    }
  }

  // 切换资料星标状态
  async function toggleReferenceStar(id: number) {
    try {
      error.value = null
      const updatedReference = await window.electronAPI.toggleReferenceStar(id)

      // 更新本地数据
      const index = references.value.findIndex(r => r.id === id)
      if (index !== -1) {
        references.value[index] = updatedReference
      }

      return updatedReference
    } catch (err) {
      error.value = err instanceof Error ? err.message : '切换星标状态失败'
      throw err
    }
  }

  // 搜索资料
  async function searchReferences(query: string, fileType?: string, starredOnly?: boolean) {
    try {
      error.value = null
      if (!currentBookId.value) {
        throw new Error('未选择书籍')
      }

      const results = await window.electronAPI.searchReferences(
        currentBookId.value,
        query,
        fileType,
        starredOnly
      )

      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : '搜索资料失败'
      throw err
    }
  }

  // 批量创建资料（用于导入）
  async function batchCreateReferences(data: Array<{
    book_id: number
    title: string
    content: string
    file_type?: string
    source_type?: 'manual' | 'import' | 'chapter'
    source_path?: string
    tags?: string[]
    starred?: boolean
    metadata?: Record<string, any>
  }>) {
    try {
      error.value = null

      const newReferences = await window.electronAPI.batchCreateReferences(data)
      // 将新资料添加到本地数组
      references.value.push(...newReferences)

      return newReferences
    } catch (err) {
      error.value = err instanceof Error ? err.message : '批量创建资料失败'
      throw err
    }
  }

  return {
    references,
    loading,
    error,
    currentBookId,
    loadReferences,
    getReference,
    clearReferences,
    createReference,
    updateReference,
    deleteReference,
    toggleReferenceStar,
    searchReferences,
    batchCreateReferences
  }
})
