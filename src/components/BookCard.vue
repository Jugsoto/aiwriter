<template>
  <div
    class="group relative bg-[var(--bg-primary)] rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border-1 border-transparent hover:border-[var(--theme-bg)]">
    <!-- 书籍封面 - 3:4宽高比 -->
    <div class="aspect-[3/4] bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center">
      <div class="text-center px-4">
        <h3 class="font-semibold text-[var(--text-primary)] text-lg leading-tight">
          {{ book.name }}
        </h3>
      </div>
    </div>

    <!-- 悬停操作按钮 -->
    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div class="flex gap-1">
        <button @click.stop="handleEdit"
          class="p-1.5 bg-[var(--bg-primary)] rounded-full shadow-md hover:bg-[var(--hover-bg)] transition-colors"
          title="编辑">
          <Edit3 class="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
        <button @click.stop="handleDelete"
          class="p-1.5 bg-[var(--bg-primary)] rounded-full shadow-md hover:bg-[var(--hover-bg)] transition-colors"
          title="删除">
          <Trash2 class="w-4 h-4 text-red-500" />
        </button>
      </div>
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
import type { Book } from '@/electron.d'
import { Edit3, Trash2 } from 'lucide-vue-next'

interface Props {
  book: Book
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [book: Book]
  delete: [book: Book]
}>()

function handleEdit() {
  emit('edit', props.book)
}

function handleDelete() {
  emit('delete', props.book)
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
