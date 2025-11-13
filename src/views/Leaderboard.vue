<template>
  <div class="h-full overflow-y-auto p-5 bg-[var(--bg-secondary)]">
    <div class="max-w-7xl mx-auto">
      <!-- 页面标题 -->
      <h1 class="text-2xl font-semibold text-[var(--text-primary)] mb-6">番茄小说排行榜</h1>

      <!-- 主榜单选择 -->
      <div class="mb-5">
        <div class="flex flex-wrap gap-3">
          <button
            v-for="board in mainBoards"
            :key="board.id"
            @click="selectBoard(board)"
            :class="[
              'px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              selectedBoard.id === board.id
                ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                : 'bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)]'
            ]"
          >
            {{ board.name }}
          </button>
        </div>
      </div>

      <!-- 子分类选择 -->
      <div class="mb-6">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="subCategory in selectedBoard.subCategories"
            :key="subCategory.id"
            @click="selectSubCategory(subCategory)"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
              selectedSubCategory.id === subCategory.id
                ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
            ]"
          >
            {{ subCategory.name }}
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)] p-12">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
          <p class="text-sm text-[var(--text-secondary)]">正在加载排行榜数据...</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)] p-12">
        <div class="text-center">
          <AlertCircle :size="48" class="mx-auto mb-3 text-red-500" />
          <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-2">加载失败</h2>
          <p class="text-sm text-[var(--text-secondary)] mb-4">{{ error }}</p>
          <button
            @click="loadLeaderboard"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium"
          >
            重试
          </button>
        </div>
      </div>

      <!-- 排行榜列表 - 卡片网格布局 -->
      <div v-else-if="books.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="(book, index) in books"
          :key="index"
          class="relative bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)] hover:shadow-lg hover:border-blue-400 transition-all duration-300 cursor-pointer group"
        >
          <!-- 排名徽章 - 移到卡片外层 -->
          <div class="absolute -top-2 -left-2 z-10">
            <div
              :class="[
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-white dark:ring-gray-900',
                index < 3
                  ? index === 0
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                    : index === 1
                    ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                    : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                  : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-[var(--border-color)]'
              ]"
            >
              {{ index + 1 }}
            </div>
          </div>

          <!-- 卡片内容 - 横向布局 -->
          <div class="flex h-full p-3 gap-3">
            <!-- 左侧：封面图片 (3:4 比例) -->
            <div class="relative w-28 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-sm">
              <!-- 封面图片 -->
              <img
                v-if="book.thumbUri"
                :src="book.thumbUri"
                :alt="book.bookName"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
              <!-- 无封面占位 -->
              <div v-else class="w-full h-full flex items-center justify-center">
                <Book :size="40" class="text-gray-400 dark:text-gray-600" />
              </div>
            </div>

            <!-- 右侧：书籍信息 -->
            <div class="flex-1 flex flex-col min-w-0 py-1">
              <!-- 书名 -->
              <h3 class="text-[15px] font-semibold text-[var(--text-primary)] mb-2 line-clamp-2 leading-snug group-hover:text-blue-500 transition-colors">
                {{ book.bookName }}
              </h3>

              <!-- 作者 -->
              <div class="flex items-center gap-1.5 mb-2">
                <User :size="13" class="text-[var(--text-tertiary)] flex-shrink-0" />
                <span class="text-[13px] text-[var(--text-secondary)] truncate">{{ book.author }}</span>
              </div>

              <!-- 简介 -->
              <p v-if="book.abstract" class="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-auto">
                {{ book.abstract }}
              </p>

              <!-- 状态信息区域 -->
              <div class="space-y-2 mt-3">
                <!-- 状态和统计信息 - 合并为一行 -->
                <div class="flex items-center justify-between gap-2">
                  <!-- 状态标签 -->
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0',
                      book.status === '连载中'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    ]"
                  >
                    {{ book.status }}
                  </span>

                  <!-- 统计信息 -->
                  <div class="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
                    <div class="flex items-center gap-1">
                      <Eye :size="12" class="text-[var(--text-tertiary)]" />
                      <span>{{ formatNumber(book.readCount) }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <FileText :size="12" class="text-[var(--text-tertiary)]" />
                      <span>{{ formatNumber(book.wordCount) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)] p-12">
        <div class="text-center">
          <Trophy :size="48" class="mx-auto mb-3 text-[var(--text-tertiary)]" />
          <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-2">暂无数据</h2>
          <p class="text-sm text-[var(--text-secondary)]">该分类暂时没有排行榜数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Trophy, Book, User, Eye, FileText, AlertCircle } from 'lucide-vue-next'
import { fetchLeaderboard, MAIN_BOARDS } from '../services/leaderboard'
import type { DecodedBook, MainBoard, SubCategory } from '../types/leaderboard'

// 状态
const mainBoards = ref(MAIN_BOARDS)
const selectedBoard = ref<MainBoard>(MAIN_BOARDS[0]) // 默认选择男频阅读榜
const selectedSubCategory = ref<SubCategory>(MAIN_BOARDS[0].subCategories[0]) // 默认选择第一个分类
const books = ref<DecodedBook[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 选择主榜单
const selectBoard = (board: MainBoard) => {
  selectedBoard.value = board
  selectedSubCategory.value = board.subCategories[0] // 切换榜单时选择第一个分类
  loadLeaderboard()
}

// 选择子分类
const selectSubCategory = (subCategory: SubCategory) => {
  selectedSubCategory.value = subCategory
  loadLeaderboard()
}

// 加载排行榜数据
const loadLeaderboard = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await fetchLeaderboard(
      selectedBoard.value.gender,
      selectedBoard.value.type,
      selectedSubCategory.value.id,
      0,
      30
    )
    books.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载排行榜数据失败'
    books.value = []
  } finally {
    loading.value = false
  }
}

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

// 组件挂载时加载数据
onMounted(() => {
  loadLeaderboard()
})
</script>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
