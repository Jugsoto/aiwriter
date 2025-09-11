<template>
  <div class="h-full flex flex-col">
    <!-- 顶部操作栏 -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)]">
      <!-- 左侧：返回按钮 + 书名 -->
      <div class="flex items-center gap-2">
        <button @click="goBack"
          class="flex items-center gap-2 px-1 py-1.5 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors">
          <ChevronLeft class="w-6 h-6" />
        </button>
        <h1 class="text-xl font-semibold text-[var(--text-primary)]">
          {{ book?.name || '加载中...' }}
        </h1>
      </div>

      <!-- 右侧：占位按钮 -->
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors">
          <Settings class="w-4 h-4" />
          <span>设置</span>
        </button>
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors">
          <Share2 class="w-4 h-4" />
          <span>分享</span>
        </button>
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors">
          <Download class="w-4 h-4" />
          <span>导出</span>
        </button>
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors">
          <MoreVertical class="w-4 h-4" />
          <span>更多</span>
        </button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="flex-1 overflow-auto p-6">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex flex-col items-center justify-center h-64 text-red-500">
        <p class="mb-2">{{ error }}</p>
        <button @click="loadBook"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          重试
        </button>
      </div>

      <!-- 书籍详情 -->
      <div v-else-if="book" class="max-w-4xl mx-auto">
        <div class="bg-[var(--bg-primary)] rounded-lg p-6 border border-[var(--border-color)]">
          <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-4">{{ book.name }}</h2>
          <div class="text-sm text-[var(--text-secondary)]">
            <p>创建时间：{{ formatDate(book.created_at) }}</p>
            <p>ID：{{ book.id }}</p>
          </div>

          <!-- 预留内容区域 -->
          <div class="mt-8 p-8 border-2 border-dashed border-[var(--border-color)] rounded-lg">
            <p class="text-center text-[var(--text-secondary)]">
              书籍内容编辑区域（待实现）
            </p>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>未找到书籍信息</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import type { Book } from '@/electron.d'
import { ChevronLeft, Settings, Share2, Download, MoreVertical } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()

const book = ref<Book | null>(null)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  await loadBook()
})

// 监听路由变化，当ID改变时重新加载
watch(() => route.params.id, async () => {
  await loadBook()
})

async function loadBook() {
  const bookId = route.params.id as string
  if (!bookId) {
    error.value = '无效的书籍ID'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 确保书籍数据已加载
    if (booksStore.books.length === 0) {
      await booksStore.loadBooks()
    }

    const foundBook = booksStore.books.find((b: Book) => b.id === Number(bookId))

    if (foundBook) {
      book.value = foundBook
    } else {
      error.value = '未找到该书籍'
    }
  } catch (err) {
    console.error('Failed to load book:', err)
    error.value = '加载书籍失败，请重试'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/')
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
