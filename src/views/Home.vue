<template>
  <div class="h-full flex flex-col">
    <!-- 顶部栏 -->
    <div class="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
      <h1 class="text-2xl font-semibold text-[var(--text-primary)]">作品管理</h1>
      <div class="flex items-center gap-2">
        <button @click="handleImport"
          class="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors">
          <Download class="w-4 h-4" />
          导入书籍
        </button>
        <button @click="showAddModal = true"
          class="flex items-center gap-2 px-4 py-2 bg-[var(--theme-bg)] text-white rounded-xl hover:bg-blue-700 transition-colors">
          新增书籍
        </button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="flex-1 overflow-auto p-5 bg-[var(--bg-secondary)]">
      <!-- 加载状态 -->
      <div v-if="booksStore.loading" class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="booksStore.error" class="text-center text-red-500">
        <p class="mb-2">{{ booksStore.error }}</p>
        <button @click="retryLoad"
          class="px-4 py-2 bg-[var(--theme-bg)] text-white rounded-md hover:bg-blue-700 transition-colors">
          重试
        </button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="booksStore.books.length === 0"
        class="flex flex-col items-center justify-center h-64 text-gray-500">
        <BookOpen class="w-16 h-16 mb-4 text-[var(--text-secondary)]" />
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

    <!-- Toast 提示 -->
    <Toast :visible="toastVisible" :message="toastMessage" :type="toastType" @update:visible="toastVisible = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBooksStore } from '@/stores/books'
import { showConfirm, useToast } from '@/composables'
import BookCard from '../components/BookCard.vue'
import BookModal from '../components/modal/BookModal.vue'
import Toast from '../components/shared/Toast.vue'
import { BookOpen, Download } from 'lucide-vue-next'
import type { Book } from '@/electron.d'

const booksStore = useBooksStore()
const { toastVisible, toastMessage, toastType, showToast } = useToast()
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
  const confirmed = await showConfirm({
    title: '删除书籍',
    message: `确定要删除《${book.name}》吗？`,
    description: '此操作将永久删除该书籍及其所有章节，不可恢复。',
    dangerous: true,
    confirmText: '删除'
  })

  if (confirmed) {
    try {
      await booksStore.removeBook(book.id)
      showToast({
        message: '书籍删除成功',
        type: 'success'
      })
    } catch (err) {
      console.error('Failed to delete book:', err)
      showToast({
        message: '删除书籍失败，请重试',
        type: 'error'
      })
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
      showToast({
        message: '书籍更新成功',
        type: 'success'
      })
    } else {
      await booksStore.addBook(name)
      showToast({
        message: '书籍添加成功',
        type: 'success'
      })
    }
    closeModal()
  } catch (err) {
    console.error('Failed to save book:', err)
    showToast({
      message: err instanceof Error ? err.message : '操作失败，请重试',
      type: 'error'
    })
  }
}

// 导入书籍
async function handleImport() {
  try {
    const result = await booksStore.importBook()
    if (result.success) {
      console.log('书籍导入成功，书籍ID:', result.bookId)
      showToast({
        message: '书籍导入成功',
        type: 'success'
      })
    }
  } catch (err) {
    console.error('导入书籍失败:', err)
    showToast({
      message: err instanceof Error ? err.message : '导入书籍失败，请重试',
      type: 'error'
    })
  }
}

// 添加重试机制
function retryLoad() {
  booksStore.loadBooks()
}
</script>
