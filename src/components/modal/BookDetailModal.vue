<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div class="bg-[var(--bg-primary)] rounded-2xl shadow-2xl border border-[var(--border-color)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <!-- 模态框头部 -->
          <div class="flex items-stretch gap-4 p-6 border-b border-[var(--border-color)]">
            <!-- 封面 -->
            <div class="w-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-md">
              <img
                v-if="book?.thumbUri"
                :src="book.thumbUri"
                :alt="book.bookName"
                class="w-full h-44 object-cover"
                @error="handleImageError"
              />
              <div v-else class="w-full h-44 flex items-center justify-center">
                <Book :size="48" class="text-gray-400 dark:text-gray-600" />
              </div>
            </div>

            <!-- 基本信息 -->
            <div class="flex-1 min-w-0 flex flex-col">
              <div class="space-y-2">
                <!-- 书名 -->
                <h2 class="text-xl font-bold text-[var(--text-primary)] leading-tight line-clamp-2">
                  {{ book?.bookName }}
                </h2>

                <!-- 作者 -->
                <div class="flex items-center gap-2">
                  <User :size="15" class="text-[var(--text-tertiary)]" />
                  <span class="text-sm text-[var(--text-secondary)]">{{ book?.author }}</span>
                </div>

                <!-- 排行榜信息 -->
                <div v-if="boardName">
                  <span class="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    {{ boardName }} · 第
                    <span
                      :class="[
                        'font-semibold ml-0.5',
                        rankIndex < 3
                          ? rankIndex === 0
                            ? 'text-yellow-600 dark:text-yellow-500'
                            : rankIndex === 1
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-orange-600 dark:text-orange-500'
                          : 'text-[var(--text-primary)]'
                      ]"
                    >
                      {{ rankIndex + 1 }}
                    </span>
                    名
                  </span>
                </div>

                <!-- 分类信息 -->
                <div v-if="categoryName">
                  <span class="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    {{ categoryName }}
                  </span>
                </div>

                <!-- 状态标签 -->
                <div>
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-1 rounded text-sm font-medium',
                      book?.status === '连载中'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    ]"
                  >
                    {{ book?.status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 关闭按钮 -->
            <button
              @click="handleClose"
              class="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-[var(--hover-bg)] transition-colors flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] self-start"
            >
              <X :size="20" />
            </button>
          </div>

          <!-- 模态框内容 -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- 统计信息 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
                <div class="flex items-center gap-2 mb-2">
                  <Eye :size="18" class="text-blue-500" />
                  <span class="text-sm text-[var(--text-secondary)]">在读人数</span>
                </div>
                <p class="text-2xl font-bold text-[var(--text-primary)]">{{ formatNumber(book?.readCount || 0) }}</p>
              </div>
              <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
                <div class="flex items-center gap-2 mb-2">
                  <FileText :size="18" class="text-green-500" />
                  <span class="text-sm text-[var(--text-secondary)]">总字数</span>
                </div>
                <p class="text-2xl font-bold text-[var(--text-primary)]">{{ formatNumber(book?.wordCount || 0) }}</p>
              </div>
            </div>

            <!-- 简介 -->
            <div v-if="book?.abstract">
              <h3 class="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Book :size="18" />
                作品简介
              </h3>
              <p class="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {{ book.abstract }}
              </p>
            </div>

            <!-- 书籍ID -->
            <div v-if="book?.bookId">
              <h3 class="text-base font-semibold text-[var(--text-primary)] mb-3">书籍ID</h3>
              <p class="text-sm text-[var(--text-secondary)] font-mono bg-[var(--bg-secondary)] px-3 py-2 rounded border border-[var(--border-color)]">
                {{ book.bookId }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Book, User, Eye, FileText, X } from 'lucide-vue-next'
import type { DecodedBook } from '@/types/leaderboard'

interface Props {
  show: boolean
  book: DecodedBook | null
  rankIndex: number
  boardName?: string
  categoryName?: string
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 关闭模态框
const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
/* 模态框过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
