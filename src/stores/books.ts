import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Book } from '@/electron.d'

export const useBooksStore = defineStore('books', () => {
  const books = ref<Book[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 加载所有书籍
  async function loadBooks() {
    try {
      loading.value = true
      error.value = null
      const loadedBooks = await window.electronAPI.getBooks()
      // 按创建时间排序，最新的在前面
      books.value = loadedBooks.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载书籍失败'
      console.error('Failed to load books:', err)
    } finally {
      loading.value = false
    }
  }

  // 强制刷新数据
  async function refreshBooks() {
    await loadBooks()
  }

  // 创建新书籍
  async function addBook(name: string) {
    try {
      error.value = null
      const newBook = await window.electronAPI.createBook({ name })
      await refreshBooks()
      return newBook
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建书籍失败'
      throw err
    }
  }

  // 更新书籍
  async function updateBook(id: number, name: string) {
    try {
      error.value = null
      const updatedBook = await window.electronAPI.updateBook(id, { name })
      await refreshBooks()
      return updatedBook
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新书籍失败'
      throw err
    }
  }

  // 删除书籍
  async function removeBook(id: number) {
    try {
      error.value = null
      await window.electronAPI.deleteBook(id)
      await refreshBooks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除书籍失败'
      throw err
    }
  }

  // 更新书籍全局设定
  async function updateBookGlobalSettings(id: number, global_settings: string) {
    try {
      error.value = null
      const updatedBook = await window.electronAPI.updateBook(id, { global_settings })
      await refreshBooks()
      return updatedBook
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新书籍全局设定失败'
      throw err
    }
  }

  return {
    books,
    loading,
    error,
    loadBooks,
    refreshBooks,
    addBook,
    updateBook,
    removeBook,
    updateBookGlobalSettings
  }
})
