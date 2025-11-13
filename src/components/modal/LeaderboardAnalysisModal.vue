<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div class="bg-[var(--bg-primary)] rounded-2xl shadow-2xl border border-[var(--border-color)] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <!-- 模态框头部 -->
          <div class="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp :size="20" class="text-blue-500" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-[var(--text-primary)]">榜单分析</h2>
                <p class="text-sm text-[var(--text-secondary)] mt-0.5">
                  {{ boardName }} · {{ categoryName }} · 共 {{ books.length }} 本书
                </p>
              </div>
            </div>

            <!-- 关闭按钮 -->
            <button
              @click="handleClose"
              class="w-8 h-8 rounded-lg hover:bg-[var(--hover-bg)] transition-colors flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X :size="20" />
            </button>
          </div>

          <!-- 模态框内容 -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- 加载状态 -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-12">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p class="text-sm text-[var(--text-secondary)]">正在分析榜单数据...</p>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="error" class="flex flex-col items-center justify-center py-12">
              <AlertCircle :size="48" class="text-red-500 mb-4" />
              <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">分析失败</h3>
              <p class="text-sm text-[var(--text-secondary)] mb-4">{{ error }}</p>
              <button
                @click="retryAnalysis"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium"
              >
                重试
              </button>
            </div>

            <!-- 分析内容 -->
            <div v-else-if="analysisResult" class="space-y-6">
              <!-- 整体总结 -->
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <FileText :size="20" class="text-blue-500" />
                  整体总结
                </h3>
                <p class="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {{ analysisResult.overall_summary }}
                </p>
              </div>

              <!-- 题材分布 -->
              <div class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <PieChart :size="20" class="text-green-500" />
                  题材分布分析
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="(genre, index) in analysisResult.genre_distribution"
                    :key="index"
                    class="bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--border-color)]"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-semibold text-[var(--text-primary)]">{{ genre.genre }}</span>
                      <span class="text-sm text-blue-500 font-medium">{{ genre.percentage }}%</span>
                    </div>
                    <div class="text-xs text-[var(--text-secondary)] mb-2">数量: {{ genre.count }} 本</div>
                    <div class="text-xs text-[var(--text-tertiary)]">
                      代表作: {{ genre.examples.join('、') }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 热门趋势 -->
              <div class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <TrendingUp :size="20" class="text-orange-500" />
                  热门趋势分析
                </h3>
                <div class="space-y-3">
                  <div
                    v-for="(trend, index) in analysisResult.trend_analysis"
                    :key="index"
                    class="bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--border-color)]"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="font-semibold text-[var(--text-primary)]">{{ trend.trend_name }}</h4>
                      <span
                        :class="[
                          'px-2 py-1 rounded text-xs font-medium',
                          trend.popularity === '高'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : trend.popularity === '中'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        ]"
                      >
                        {{ trend.popularity }}热度
                      </span>
                    </div>
                    <p class="text-sm text-[var(--text-secondary)] mb-2">{{ trend.description }}</p>
                    <div class="text-xs text-[var(--text-tertiary)]">
                      代表作品: {{ trend.representative_books.join('、') }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 热点关键词 -->
              <div class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Tag :size="20" class="text-purple-500" />
                  热点关键词
                </h3>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(keyword, index) in analysisResult.hot_keywords"
                    :key="index"
                    class="inline-flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]"
                  >
                    <span class="text-sm font-medium text-[var(--text-primary)]">{{ keyword.keyword }}</span>
                    <span class="text-xs text-[var(--text-tertiary)]">{{ keyword.category }}</span>
                    <span class="text-xs text-blue-500 font-medium">×{{ keyword.frequency }}</span>
                  </div>
                </div>
              </div>

              <!-- 读者偏好 -->
              <div class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Users :size="20" class="text-pink-500" />
                  读者偏好洞察
                </h3>
                <div class="space-y-3">
                  <div
                    v-for="(preference, index) in analysisResult.reader_preferences"
                    :key="index"
                    class="bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--border-color)]"
                  >
                    <h4 class="font-semibold text-[var(--text-primary)] mb-2">{{ preference.preference_type }}</h4>
                    <p class="text-sm text-[var(--text-secondary)] mb-2">{{ preference.description }}</p>
                    <div class="text-xs text-[var(--text-tertiary)]">
                      数据支撑: {{ preference.supporting_data }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 商业价值评估 -->
              <div class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <DollarSign :size="20" class="text-yellow-500" />
                  商业价值评估
                </h3>
                <p class="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {{ analysisResult.commercial_value_assessment }}
                </p>
              </div>

              <!-- 创作建议 -->
              <div class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Lightbulb :size="20" class="text-amber-500" />
                  创作建议
                </h3>
                <ul class="space-y-2">
                  <li
                    v-for="(suggestion, index) in analysisResult.creation_suggestions"
                    :key="index"
                    class="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <span class="text-blue-500 mt-1">•</span>
                    <span>{{ suggestion }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 模态框底部 -->
          <div v-if="analysisResult && !loading" class="flex items-center justify-end p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <button
              @click="reAnalyze"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium"
            >
              重新分析
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { TrendingUp, X, AlertCircle, FileText, PieChart, Tag, Users, DollarSign, Lightbulb } from 'lucide-vue-next'
import type { DecodedBook } from '@/types/leaderboard'
import { generateLeaderboardAnalysis, type LeaderboardAnalysisResult } from '@/services/leaderboardAnalysis'

interface Props {
  show: boolean
  books: DecodedBook[]
  boardName: string
  categoryName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// 状态
const loading = ref(false)
const error = ref<string | null>(null)
const analysisResult = ref<LeaderboardAnalysisResult | null>(null)
const isFromCache = ref(false)

// 生成缓存键
const getCacheKey = () => {
  return `leaderboard_analysis_${props.boardName}_${props.categoryName}`
}

// 从 localStorage 加载缓存
const loadFromCache = (): LeaderboardAnalysisResult | null => {
  try {
    const cacheKey = getCacheKey()
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      return JSON.parse(cached) as LeaderboardAnalysisResult
    }
  } catch (error) {
    console.error('加载缓存失败:', error)
  }
  return null
}

// 保存到 localStorage
const saveToCache = (result: LeaderboardAnalysisResult) => {
  try {
    const cacheKey = getCacheKey()
    localStorage.setItem(cacheKey, JSON.stringify(result))
  } catch (error) {
    console.error('保存缓存失败:', error)
  }
}

// 监听 show 属性变化，自动开始分析或加载缓存
watch(() => props.show, (newShow) => {
  if (newShow) {
    // 先尝试从缓存加载
    const cached = loadFromCache()
    if (cached) {
      analysisResult.value = cached
      isFromCache.value = true
      error.value = null
    } else if (!loading.value) {
      // 如果没有缓存，则开始分析
      startAnalysis(false)
    }
  }
})

// 监听 boardName 和 categoryName 变化，重新加载
watch([() => props.boardName, () => props.categoryName], () => {
  if (props.show) {
    // 先尝试从缓存加载
    const cached = loadFromCache()
    if (cached) {
      analysisResult.value = cached
      isFromCache.value = true
      error.value = null
    } else {
      analysisResult.value = null
      isFromCache.value = false
    }
  }
})

// 开始分析
const startAnalysis = async (forceRefresh = false) => {
  if (props.books.length === 0) {
    error.value = '榜单数据为空，无法进行分析'
    return
  }

  loading.value = true
  error.value = null
  if (forceRefresh) {
    analysisResult.value = null
  }
  isFromCache.value = false

  try {
    const context = {
      books: props.books,
      boardName: props.boardName,
      categoryName: props.categoryName
    }

    // 使用非流式JSON输出
    const result = await generateLeaderboardAnalysis(context)
    analysisResult.value = result

    // 保存到缓存
    saveToCache(result)
  } catch (err: any) {
    console.error('分析失败:', err)
    error.value = err instanceof Error ? err.message : '分析失败，请重试'
  } finally {
    loading.value = false
  }
}

// 重新分析
const reAnalyze = () => {
  startAnalysis(true)
}

// 重试分析
const retryAnalysis = () => {
  error.value = null
  analysisResult.value = null
  isFromCache.value = false
  startAnalysis(false)
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
