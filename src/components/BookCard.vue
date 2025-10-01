<template>
  <div @click="handleView"
    class="group relative bg-[var(--bg-primary)] rounded-xl cursor-pointer border-1 border-[var(--border-color)] hover:border-[var(--theme-bg)] transition-colors">
    <!-- 书籍封面 -->
    <div class="aspect-[3/4] bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center">
      <div class="text-center px-4">
        <h3 class="font-semibold text-[var(--text-primary)] text-lg leading-tight">
          {{ book.name }}
        </h3>
      </div>
    </div>

    <!-- 右上角操作按钮 -->
    <div
      class="absolute top-2 right-2 flex items-center gap-1 bg-[var(--bg-secondary)] px-2 rounded-full border border-[var(--border-color)] shadow-sm min-h-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button @click.stop="handleExport"
        class="px-1 py-1 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all min-h-[20px] flex items-center"
        title="导出">
        <Upload class="w-4 h-4" />
      </button>
      <button @click.stop="handleEdit"
        class="px-1 py-1 text-[var(--text-secondary)] hover:text-green-600 hover:bg-green-100 rounded-full transition-all min-h-[20px] flex items-center"
        title="编辑">
        <Edit class="w-4 h-4" />
      </button>
      <button @click.stop="handleDelete"
        class="px-1 py-1 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-100 rounded-full transition-all min-h-[20px] flex items-center"
        title="删除">
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <!-- 悬停时显示的时间 - 胶囊样式 -->
    <div
      class="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div class="px-3 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
        {{ formatDate(book.created_at) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Book } from '@/electron.d'
import { Edit, Trash2, Upload } from 'lucide-vue-next'
import { useBooksStore } from '@/stores/books'

interface Props {
  book: Book
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [book: Book]
  delete: [book: Book]
}>()

const router = useRouter()
const booksStore = useBooksStore()

function handleView() {
  router.push(`/book/${props.book.id}`)
}

function handleEdit() {
  emit('edit', props.book)
}

function handleDelete() {
  emit('delete', props.book)
}

async function handleExport() {
  try {
    await booksStore.exportBook(props.book.id)
    // 可以添加成功提示
    console.log('书籍导出成功')
  } catch (error) {
    console.error('书籍导出失败:', error)
    // 可以添加错误提示
    alert('导出书籍失败，请重试')
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>
