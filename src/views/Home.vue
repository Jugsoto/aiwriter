<template>
  <div class="h-full overflow-y-auto p-5 bg-[var(--bg-secondary)]">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-[var(--text-primary)]">作品管理</h1>
      <div class="flex items-center gap-2">
        <button
          v-if="hasUpdate"
          @click="handleUpdate"
          :disabled="updateStore.isDownloading"
          class="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw v-if="updateStore.isDownloading" class="w-4 h-4 animate-spin" />
          <Download v-else class="w-4 h-4" />
          {{ updateButtonLabel }}
        </button>
        <button @click="openCommunity"
          class="flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--hover-bg)] transition-colors">
          <Users class="w-4 h-4" />
          社区
        </button>
        <button @click="openTutorial"
          class="flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--hover-bg)] transition-colors">
          <BookOpenCheck class="w-4 h-4" />
          教程
        </button>
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

    <div v-if="booksStore.loading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="booksStore.error" class="text-center text-red-500">
      <p class="mb-2">{{ booksStore.error }}</p>
      <button @click="retryLoad"
        class="px-4 py-2 bg-[var(--theme-bg)] text-white rounded-md hover:bg-blue-700 transition-colors">
        重试
      </button>
    </div>

    <div v-else-if="booksStore.books.length === 0"
      class="flex flex-col items-center justify-center h-64 text-gray-500">
      <BookOpen class="w-16 h-16 mb-4 text-[var(--text-secondary)]" />
      <p class="text-lg">暂无书籍，点击右上角按钮添加</p>
    </div>

    <div v-else class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      <BookCard v-for="book in booksStore.books" :key="book.id" :book="book" @edit="handleEdit"
        @delete="handleDelete" />
    </div>

    <BookModal v-if="showAddModal || showEditModal" :book="editingBook" :is-edit="showEditModal" @close="closeModal"
      @save="handleSave" />

    <Toast :visible="toastVisible" :message="toastMessage" :type="toastType" @update:visible="toastVisible = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBooksStore } from '@/stores/books'
import { useUpdateStore } from '@/stores/update'
import { showConfirm, useToast } from '@/composables'
import BookCard from '../components/BookCard.vue'
import BookModal from '../components/modal/BookModal.vue'
import Toast from '../components/shared/Toast.vue'
import { BookOpen, Download, BookOpenCheck, RefreshCw, Users } from 'lucide-vue-next'
import type { Book } from '@/electron.d'

const booksStore = useBooksStore()
const updateStore = useUpdateStore()
const { toastVisible, toastMessage, toastType, showToast } = useToast()
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingBook = ref<Book | null>(null)

const hasUpdate = computed(() => updateStore.hasUpdate)
const updateButtonLabel = computed(() => {
  if (updateStore.state.status === 'downloading') {
    return `下载中 ${updateStore.state.downloadPercent.toFixed(0)}%`
  }

  if (updateStore.state.status === 'downloaded') {
    return '重启安装'
  }

  return '下载更新'
})

onMounted(async () => {
  await booksStore.loadBooks()
  await updateStore.initialize()
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

async function handleImport() {
  try {
    const result = await booksStore.importBook()
    if (result.success) {
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

function retryLoad() {
  booksStore.loadBooks()
}

async function openTutorial() {
  try {
    await window.electronAPI.openExternal('https://shenbi.qgming.com/software/introduction')
  } catch (error) {
    console.error('打开教程失败:', error)
    showToast({
      message: '打开教程失败，请重试',
      type: 'error'
    })
  }
}

async function openCommunity() {
  try {
    await window.electronAPI.openExternal('https://pd.qq.com/g/shenbixiezuo0')
  } catch (error) {
    console.error('打开社区失败:', error)
    showToast({
      message: '打开社区失败，请重试',
      type: 'error'
    })
  }
}

async function handleUpdate() {
  try {
    if (updateStore.state.status === 'downloaded') {
      await updateStore.installUpdate()
      return
    }

    await updateStore.downloadUpdate()
  } catch (error) {
    console.error('处理更新失败:', error)
    showToast({
      message: updateStore.state.errorMessage || '更新失败，请稍后重试',
      type: 'error'
    })
  }
}
</script>
