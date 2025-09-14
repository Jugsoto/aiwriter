import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Chapter } from '@/electron.d'

export const useChaptersStore = defineStore('chapters', () => {
  const chapters = ref<Chapter[]>([])
  const currentChapter = ref<Chapter | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 根据书籍ID加载章节
  async function loadChapters(bookId: number) {
    try {
      loading.value = true
      error.value = null
      const loadedChapters = await window.electronAPI.getChapters(bookId)
      chapters.value = loadedChapters
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载章节失败'
      console.error('Failed to load chapters:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取章节详情
  async function getChapter(id: number) {
    try {
      error.value = null
      const chapter = await window.electronAPI.getChapter(id)
      return chapter
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取章节失败'
      throw err
    }
  }

  // 创建新章节
  async function createChapter(data: { book_id: number; title: string; content?: string; summary?: string; order_index?: number }) {
    try {
      error.value = null
      const newChapter = await window.electronAPI.createChapter(data)
      await loadChapters(data.book_id)
      return newChapter
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建章节失败'
      throw err
    }
  }

  // 更新章节
  async function updateChapter(id: number, data: { title?: string; content?: string; summary?: string; order_index?: number }) {
    try {
      error.value = null
      const updatedChapter = await window.electronAPI.updateChapter(id, data)
      
      // 更新本地数据
      const index = chapters.value.findIndex(ch => ch.id === id)
      if (index !== -1) {
        chapters.value[index] = updatedChapter
      }
      
      // 如果当前显示的章节被更新，也更新currentChapter
      if (currentChapter.value?.id === id) {
        currentChapter.value = updatedChapter
      }
      
      return updatedChapter
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新章节失败'
      throw err
    }
  }

  // 更新章节排序
  async function updateChapterOrder(id: number, orderIndex: number) {
    try {
      error.value = null
      const updatedChapter = await window.electronAPI.updateChapterOrder(id, orderIndex)
      
      // 更新本地数据
      const index = chapters.value.findIndex(ch => ch.id === id)
      if (index !== -1) {
        chapters.value[index] = updatedChapter
      }
      
      // 重新排序
      chapters.value.sort((a, b) => a.order_index - b.order_index)
      
      return updatedChapter
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新章节排序失败'
      throw err
    }
  }

  // 删除章节
  async function deleteChapter(id: number) {
    try {
      error.value = null
      await window.electronAPI.deleteChapter(id)
      
      // 从本地数据中删除
      const index = chapters.value.findIndex(ch => ch.id === id)
      if (index !== -1) {
        chapters.value.splice(index, 1)
      }
      
      // 如果删除的是当前显示的章节，清空currentChapter
      if (currentChapter.value?.id === id) {
        currentChapter.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除章节失败'
      throw err
    }
  }

  // 设置当前章节
  function setCurrentChapter(chapter: Chapter | null) {
    currentChapter.value = chapter
  }

  // 获取下一章节
  function getNextChapter(currentId: number): Chapter | null {
    const currentIndex = chapters.value.findIndex(ch => ch.id === currentId)
    if (currentIndex !== -1 && currentIndex < chapters.value.length - 1) {
      return chapters.value[currentIndex + 1]
    }
    return null
  }

  // 获取上一章节
  function getPreviousChapter(currentId: number): Chapter | null {
    const currentIndex = chapters.value.findIndex(ch => ch.id === currentId)
    if (currentIndex > 0) {
      return chapters.value[currentIndex - 1]
    }
    return null
  }

  return {
    chapters,
    currentChapter,
    loading,
    error,
    loadChapters,
    getChapter,
    createChapter,
    updateChapter,
    updateChapterOrder,
    deleteChapter,
    setCurrentChapter,
    getNextChapter,
    getPreviousChapter
  }
})