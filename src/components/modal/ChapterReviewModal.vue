<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel">
        <div
          class="bg-[var(--bg-primary)] rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] min-h-[400px] flex flex-col border border-[var(--border-color)] shadow-2xl overflow-hidden">

          <!-- 标题栏 -->
          <div class="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FileText :size="20" class="text-white" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-[var(--text-primary)]">章节锐评报告</h2>
                <p class="text-sm text-[var(--text-secondary)] mt-0.5">
                  10年老读者 × 资深编辑 双重视角深度评估
                </p>
              </div>
            </div>
            <button @click="handleCancel"
              class="w-8 h-8 rounded-lg hover:bg-[var(--hover-bg)] transition-colors flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <X :size="20" />
            </button>
          </div>

          <!-- 模态框内容 -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- AI生成时的评估中提示 -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-12">
              <div class="text-center max-w-md">
                <!-- 居中显示的加载动画 -->
                <div class="flex justify-center mb-6">
                  <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>

                <!-- 优化评估中提示文案 -->
                <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3">神笔AI正在锐评中</h4>
                <p class="text-[var(--text-secondary)] mb-4">
                  正在从老读者和资深编辑双重视角深度分析章节...
                </p>

                <div class="text-sm text-[var(--text-secondary)] opacity-80 space-y-1">
                  <div>📖 老读者视角：爽点、槽点、毒点、追更欲望</div>
                  <div>✍️ 编辑视角：商业价值、情节结构、修改建议</div>
                  <div>📊 八大维度：情节、人物、情绪、节奏、创意、商业、文笔、对话</div>
                </div>
              </div>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="error" class="flex flex-col items-center justify-center py-12">
              <div class="text-red-500 mb-4">
                <TriangleAlert class="w-12 h-12 mx-auto" />
              </div>
              <p class="text-[var(--text-secondary)] mb-4">{{ error }}</p>
              <button @click="handleRetry"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium">
                重试
              </button>
            </div>

            <!-- 评估结果 -->
            <div v-else-if="reviewResult" class="space-y-6">
              <!-- 总分显示 -->
              <div class="mb-6">
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-center text-white">
                  <div class="text-3xl font-bold mb-2">{{ calculateOverallScore(reviewResult) }}/10</div>
                  <div class="text-lg">综合评分</div>
                  <div class="text-sm opacity-80 mt-1">{{ getScoreComment(calculateOverallScore(reviewResult)) }}</div>
                </div>
              </div>

              <!-- ECharts雷达图展示八大维度评分 -->
              <div class="mb-6">
                <div class="bg-[var(--bg-secondary)] rounded-lg p-4">
                  <div class="flex flex-col lg:flex-row items-center justify-center gap-8">
                    <!-- 左侧维度卡片 -->
                    <div class="grid grid-cols-1 gap-3 w-full lg:w-auto">
                      <div
                        class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700 transition-all hover:shadow-md">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-blue-700 dark:text-blue-300">情节推进</span>
                          <span class="text-lg font-bold text-blue-600">{{ reviewResult.plot_progression_score
                            }}/10</span>
                        </div>
                        <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
                          <div class="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                            :style="{ width: `${reviewResult.plot_progression_score * 10}%` }"></div>
                        </div>
                      </div>
                      <div
                        class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 border border-green-200 dark:border-green-700 transition-all hover:shadow-md">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-green-700 dark:text-green-300">人物表现</span>
                          <span class="text-lg font-bold text-green-600">{{ reviewResult.character_performance_score
                            }}/10</span>
                        </div>
                        <div class="w-full bg-green-200 dark:bg-green-800 rounded-full h-1.5">
                          <div class="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                            :style="{ width: `${reviewResult.character_performance_score * 10}%` }"></div>
                        </div>
                      </div>
                      <div
                        class="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700 transition-all hover:shadow-md">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-purple-700 dark:text-purple-300">情绪价值</span>
                          <span class="text-lg font-bold text-purple-600">{{ reviewResult.emotional_value_score
                            }}/10</span>
                        </div>
                        <div class="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1.5">
                          <div class="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                            :style="{ width: `${reviewResult.emotional_value_score * 10}%` }"></div>
                        </div>
                      </div>
                      <div
                        class="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700 transition-all hover:shadow-md">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-yellow-700 dark:text-yellow-300">阅读节奏</span>
                          <span class="text-lg font-bold text-yellow-600">{{ reviewResult.reading_pace_score
                            }}/10</span>
                        </div>
                        <div class="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-1.5">
                          <div class="bg-yellow-600 h-1.5 rounded-full transition-all duration-500"
                            :style="{ width: `${reviewResult.reading_pace_score * 10}%` }"></div>
                        </div>
                      </div>
                    </div>

                    <!-- ECharts雷达图 -->
                    <div class="flex justify-center">
                      <div ref="radarChartRef" style="width: 400px; height: 400px;" class="w-full max-w-[400px] h-auto">
                      </div>
                    </div>

                    <!-- 右侧维度卡片 -->
                    <div class="grid grid-cols-1 gap-3 w-full lg:w-auto">
                      <div
                        class="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg p-3 border border-pink-200 dark:border-pink-700 transition-all hover:shadow-md">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-pink-700 dark:text-pink-300">创意新颖</span>
                          <span class="text-lg font-bold text-pink-600">{{ reviewResult.creativity_score }}/10</span>
                        </div>
                        <div class="w-full bg-pink-200 dark:bg-pink-800 rounded-full h-1.5">
                          <div class="bg-pink-600 h-1.5 rounded-full transition-all duration-500"
                            :style="{ width: `${reviewResult.creativity_score * 10}%` }"></div>
                        </div>
                      </div>
                      <div
                        class="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-3 border border-red-200 dark:border-red-700 transition-all hover:shadow-md">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-red-700 dark:text-red-300">商业价值</span>
                          <span class="text-lg font-bold text-red-600">{{ reviewResult.commercial_value_score
                            }}/10</span>
                        </div>
                        <div class="w-full bg-red-200 dark:bg-red-800 rounded-full h-1.5">
                          <div class="bg-red-600 h-1.5 rounded-full transition-all duration-500"
                            :style="{ width: `${reviewResult.commercial_value_score * 10}%` }"></div>
                        </div>
                      </div>
                      <div
                        class="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-700 transition-all hover:shadow-md">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-indigo-700 dark:text-indigo-300">文笔质量</span>
                          <span class="text-lg font-bold text-indigo-600">{{ reviewResult.writing_quality_score
                            }}/10</span>
                        </div>
                        <div class="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-1.5">
                          <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                            :style="{ width: `${reviewResult.writing_quality_score * 10}%` }"></div>
                        </div>
                      </div>
                      <div
                        class="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg p-3 border border-teal-200 dark:border-teal-700 transition-all hover:shadow-md">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-teal-700 dark:text-teal-300">对话质量</span>
                          <span class="text-lg font-bold text-teal-600">{{ reviewResult.dialogue_quality_score
                            }}/10</span>
                        </div>
                        <div class="w-full bg-teal-200 dark:bg-teal-800 rounded-full h-1.5">
                          <div class="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                            :style="{ width: `${reviewResult.dialogue_quality_score * 10}%` }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 综合评价 -->
              <div class="mb-6">
                <div
                  class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <FileText :size="20" class="text-blue-500" />
                    综合锐评
                  </h4>
                  <p class="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{{
                    reviewResult.overall_evaluation }}</p>
                </div>
              </div>

              <!-- 深度分析区域 -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <!-- 开篇分析 -->
                <div
                  class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <BookOpen :size="20" class="text-green-500" />
                    开篇分析
                  </h4>
                  <p class="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{{
                    reviewResult.opening_analysis }}</p>
                </div>

                <!-- 结尾分析 -->
                <div
                  class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <BookmarkCheck :size="20" class="text-purple-500" />
                    结尾分析
                  </h4>
                  <p class="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{{
                    reviewResult.ending_analysis }}</p>
                </div>
              </div>

              <!-- 爽点与槽点分析 -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <!-- 爽点分析 -->
                <div
                  class="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Sparkles :size="20" class="text-yellow-500" />
                    爽点分析
                  </h4>
                  <ul class="space-y-2">
                    <li v-for="(moment, index) in reviewResult.highlight_moments" :key="index"
                      class="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span class="text-yellow-600 dark:text-yellow-400 mt-1 font-bold">✨</span>
                      <span class="leading-relaxed">{{ moment }}</span>
                    </li>
                  </ul>
                </div>

                <!-- 槽点分析 -->
                <div
                  class="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <MessageSquareWarning :size="20" class="text-orange-500" />
                    槽点分析
                  </h4>
                  <ul class="space-y-2">
                    <li v-for="(point, index) in reviewResult.weak_points" :key="index"
                      class="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span class="text-orange-600 dark:text-orange-400 mt-1 font-bold">⚠️</span>
                      <span class="leading-relaxed">{{ point }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- 节奏分析 -->
              <div class="mb-6">
                <div
                  class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Activity :size="20" class="text-indigo-500" />
                    节奏分析
                  </h4>
                  <p class="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{{
                    reviewResult.pacing_analysis }}</p>
                </div>
              </div>

              <!-- 优点分析 -->
              <div class="mb-6">
                <div class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <CheckCircle :size="20" class="text-green-500" />
                    优点分析
                  </h4>
                  <ul class="space-y-2">
                    <li v-for="(strength, index) in reviewResult.strengths" :key="index" class="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span class="text-green-500 mt-1">•</span>
                      <span>{{ strength }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- 问题与不足（锐评版） -->
              <div class="mb-6">
                <div
                  class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <AlertTriangle :size="20" class="text-red-500" />
                    问题与不足
                  </h4>
                  <div class="space-y-3">
                    <div v-for="(pitfall, index) in reviewResult.pitfalls" :key="index"
                      class="bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--border-color)]">
                      <div class="flex items-start gap-3 mb-3">
                        <span :class="[
                          'px-2 py-1 rounded text-xs font-medium',
                          pitfall.severity === '严重'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : pitfall.severity === '中等'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        ]">
                          {{ pitfall.severity === '严重' ? '🚨 严重' : pitfall.severity === '中等' ? '⚠️ 中等' : '📌 轻微' }}
                        </span>
                        <span class="text-[var(--text-primary)] font-semibold leading-relaxed">{{ pitfall.content
                          }}</span>
                      </div>
                      <div v-if="pitfall.position"
                        class="text-sm text-[var(--text-secondary)] mb-2">
                        <span class="font-semibold">📍 问题位置：</span>
                        <span>{{ pitfall.position }}</span>
                      </div>
                      <div v-if="pitfall.suggestion"
                        class="text-sm text-[var(--text-secondary)] mt-2 pt-2 border-t border-[var(--border-color)]">
                        <div class="font-semibold mb-1">💡 编辑修改建议：</div>
                        <div class="leading-relaxed whitespace-pre-wrap">{{ pitfall.suggestion }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 严重问题警告 -->
              <div v-if="reviewResult.critical_issues && reviewResult.critical_issues.length > 0" class="mb-6">
                <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <ShieldAlert :size="20" class="text-red-500" />
                    严重问题警告
                  </h4>
                  <ul class="space-y-2">
                    <li v-for="(issue, index) in reviewResult.critical_issues" :key="index"
                      class="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span class="text-red-500 mt-1">•</span>
                      <span>{{ issue }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- 快速优化建议 -->
              <div class="mb-6">
                <div
                  class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Zap :size="20" class="text-green-500" />
                    快速优化建议
                  </h4>
                  <ul class="space-y-2">
                    <li v-for="(win, index) in reviewResult.quick_wins" :key="index"
                      class="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span class="text-green-500 mt-1">•</span>
                      <span class="leading-relaxed">{{ win }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- 改进建议 -->
              <div class="mb-6">
                <div
                  class="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-color)]">
                  <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Lightbulb :size="20" class="text-blue-500" />
                    改进建议
                  </h4>
                  <ul class="space-y-2">
                    <li v-for="(suggestion, index) in reviewResult.improvement_suggestions" :key="index"
                      class="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span class="text-blue-500 mt-1">•</span>
                      <span class="leading-relaxed">{{ suggestion }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 模态框底部 -->
          <div v-if="reviewResult && !loading"
            class="flex items-center justify-end p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <button @click="handleRetry"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium">
              重新评估
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import {
  X, TriangleAlert, CheckCircle, Lightbulb, FileText,
  BookOpen, BookmarkCheck, Sparkles, MessageSquareWarning, Activity,
  AlertTriangle, ShieldAlert, Zap
} from 'lucide-vue-next'
import type { ChapterReviewResult } from '@/services/chapterReview'
import * as echarts from 'echarts'

interface Props {
  visible: boolean
  chapterContent: string
  globalSettings?: string
  chapterTitle?: string
  chapterId?: number
  bookId?: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'retry'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  chapterContent: '',
  globalSettings: '',
  chapterTitle: '',
  chapterId: undefined,
  bookId: undefined
})

const emit = defineEmits<Emits>()

// 状态管理
const loading = ref(false)
const error = ref('')
const reviewResult = ref<ChapterReviewResult | null>(null)
const radarChartRef = ref<HTMLElement>()
let radarChart: echarts.ECharts | null = null

// 监听visible变化，初始化数据
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await loadChapterReview()
  } else {
    // 关闭时重置状态
    resetState()
  }
})

// 监听reviewResult变化，更新雷达图
watch(() => reviewResult.value, (newResult) => {
  if (newResult) {
    nextTick(() => {
      initRadarChart()
    })
  }
})

// 初始化雷达图
const initRadarChart = () => {
  if (!radarChartRef.value || !reviewResult.value) return

  // 如果图表已存在，先销毁
  if (radarChart) {
    radarChart.dispose()
  }

  // 创建新图表
  radarChart = echarts.init(radarChartRef.value)

  // 配置项
  const option = {
    title: {
      text: '章节能力雷达图',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'rgba(0, 0, 0, 0.85)'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const dimensionNames = ['情节推进', '人物表现', '情绪价值', '阅读节奏', '创意新颖', '商业价值', '文笔质量', '对话质量']
        const dataIndex = params.dataIndex
        return `${dimensionNames[dataIndex]}: ${params.value}/10`
      }
    },
    radar: {
      indicator: [
        { name: '情节推进', max: 10 },
        { name: '人物表现', max: 10 },
        { name: '情绪价值', max: 10 },
        { name: '阅读节奏', max: 10 },
        { name: '创意新颖', max: 10 },
        { name: '商业价值', max: 10 },
        { name: '文笔质量', max: 10 },
        { name: '对话质量', max: 10 }
      ],
      shape: 'polygon',
      radius: 120,
      splitNumber: 5,
      name: {
        textStyle: {
          color: 'rgba(0, 0, 0, 0.85)',
          fontSize: 14,
          fontWeight: 'bold',
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          shadowBlur: 2,
          shadowOffsetX: 1,
          shadowOffsetY: 1
        },
        formatter: (value: string) => {
          return value
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.2)'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.2)'
        }
      }
    },
    series: [{
      name: '章节评分',
      type: 'radar',
      data: [{
        value: [
          reviewResult.value.plot_progression_score,
          reviewResult.value.character_performance_score,
          reviewResult.value.emotional_value_score,
          reviewResult.value.reading_pace_score,
          reviewResult.value.creativity_score,
          reviewResult.value.commercial_value_score,
          reviewResult.value.writing_quality_score,
          reviewResult.value.dialogue_quality_score
        ],
        name: '当前章节',
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: 'rgba(59, 130, 246, 0.3)'
        },
        lineStyle: {
          color: '#3b82f6',
          width: 2
        },
        emphasis: {
          lineStyle: {
            width: 4
          },
          itemStyle: {
            color: '#1d4ed8'
          }
        }
      }]
    }],
    backgroundColor: 'transparent'
  }

  // 设置配置项
  radarChart.setOption(option)

  // 响应式处理
  window.addEventListener('resize', () => {
    radarChart?.resize()
  })
}

// 加载章节评估
const loadChapterReview = async () => {
  if (!props.chapterContent) {
    error.value = '章节内容为空，无法进行评估'
    return
  }

  loading.value = true
  error.value = ''
  reviewResult.value = null

  try {
    const { generateChapterReview, getChapterReview } = await import('@/services/chapterReview')

    // 如果有章节ID，先尝试从数据库获取已保存的评估结果
    if (props.chapterId) {
      const savedReview = await getChapterReview(props.chapterId)
      if (savedReview) {
        reviewResult.value = savedReview
        loading.value = false
        return
      }
    }

    // 如果没有保存的评估结果，生成新的评估
    const context = {
      content: props.chapterContent,
      globalSettings: props.globalSettings,
      chapterTitle: props.chapterTitle,
      bookId: props.bookId
    }

    reviewResult.value = await generateChapterReview(context, undefined, props.chapterId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '评估失败，请检查网络连接和配置'
  } finally {
    loading.value = false
  }
}

// 重置状态
const resetState = () => {
  loading.value = false
  error.value = ''
  reviewResult.value = null

  // 清理ECharts实例
  if (radarChart) {
    radarChart.dispose()
    radarChart = null
  }
}

// 处理关闭
const handleCancel = () => {
  emit('update:visible', false)
  emit('close')
}

// 处理重试
const handleRetry = async () => {
  resetState()
  loading.value = true  // 设置加载状态为true，显示评估中提示

  // 重新评估时强制生成新的评估结果
  try {
    const { generateChapterReview } = await import('@/services/chapterReview')

    const context = {
      content: props.chapterContent,
      globalSettings: props.globalSettings,
      chapterTitle: props.chapterTitle,
      bookId: props.bookId
    }

    reviewResult.value = await generateChapterReview(context, undefined, props.chapterId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '重新评估失败，请检查网络连接和配置'
  } finally {
    loading.value = false
  }
}

// 计算总分（八个维度的平均值）
const calculateOverallScore = (result: ChapterReviewResult): number => {
  const scores = [
    result.plot_progression_score,
    result.character_performance_score,
    result.emotional_value_score,
    result.reading_pace_score,
    result.creativity_score,
    result.commercial_value_score,
    result.writing_quality_score || 5,
    result.dialogue_quality_score || 5
  ]
  const sum = scores.reduce((total, score) => total + score, 0)
  return Math.round((sum / scores.length) * 10) / 10 // 保留一位小数
}

// 根据分数获取点评描述
const getScoreComment = (score: number): string => {
  if (score >= 8.5) {
    return '🔥 爆款潜质！优秀章节，有望成为热门作品！'
  } else if (score >= 7.5) {
    return '😊 优秀！章节质量很高，继续保持！'
  } else if (score >= 6.5) {
    return '😐 良好！有不错的基础，优化后潜力更大'
  } else if (score >= 5.5) {
    return '📚 合格！基础内容达标，建议重点优化'
  } else {
    return '🔧 需要改进！建议重新打磨后再发布'
  }
}

</script>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* 模态框过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active>div,
.modal-leave-active>div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from>div,
.modal-leave-to>div {
  transform: scale(0.95);
  opacity: 0;
}
</style>