<template>
  <div class="h-full flex flex-col">
    <!-- 顶部栏 -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)]">
      <h1 class="text-2xl font-semibold text-[var(--text-primary)]">我的书架</h1>
      <button @click="showAddModal = true"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        新增书籍
      </button>
    </div>

    <!-- 主要内容区 -->
    <div class="flex-1 overflow-auto p-6">
      <!-- 加载状态 -->
      <div v-if="booksStore.loading" class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="booksStore.error" class="text-center text-red-500">
        <p class="mb-2">{{ booksStore.error }}</p>
        <button @click="retryLoad"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          重试
        </button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="booksStore.books.length === 0"
        class="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p class="text-lg">暂无书籍，点击右上角按钮添加</p>
      </div>

      <!-- 书籍网格 -->
      <div v-else class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <BookCard v-for="book in booksStore.books" :key="book.id" :book="book" @edit="handleEdit"
          @delete="handleDelete" />
      </div>
    </div>

    <!-- 新增/编辑模态框 -->
    <BookModal v-if="showAddModal || showEditModal" :book="editingBook" :is-edit="showEditModal" @close="closeModal"
      @save="handleSave" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBooksStore } from '@/stores/books'
import BookCard from '../components/BookCard.vue'
import BookModal from '../components/BookModal.vue'
import type { Book } from '@/electron.d'

const booksStore = useBooksStore()
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingBook = ref<Book | null>(null)

onMounted(async () => {
  await booksStore.loadBooks()
})

function handleEdit(book: Book) {
  editingBook.value = book
  showEditModal.value = true
}

async function handleDelete(book: Book) {
  if (confirm(`确定要删除《${book.name}》吗？`)) {
    try {
      await booksStore.removeBook(book.id)
      console.log('Book deleted successfully')
    } catch (err) {
      console.error('Failed to delete book:', err)
      alert('删除书籍失败，请重试')
    }
  }
}

function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  editingBook.value = null
}

async function handleSave(name: string) {
  try {
    if (showEditModal.value && editingBook.value) {
      await booksStore.updateBook(editingBook.value.id, name)
    } else {
      await booksStore.addBook(name)
    }
    closeModal()
  } catch (err) {
    console.error('Failed to save book:', err)
    alert(err instanceof Error ? err.message : '操作失败，请重试')
  }
}

// 添加重试机制
function retryLoad() {
  booksStore.loadBooks()
}
</script>
