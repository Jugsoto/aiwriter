<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/50" @click="handleCancel"></div>

    <!-- 模态窗口内容 -->
    <div
      class="bg-[var(--bg-primary)] rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] min-h-[400px] flex flex-col border-2 border-[var(--border-color)] shadow-lg relative z-10">

      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-[var(--text-primary)]">
          章节评估结果
        </h3>
        <button @click="handleCancel"
          class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- AI生成时的评估中提示 -->
      <div v-if="loading" class="flex-1 flex flex-col items-center justify-center py-12">
        <div class="text-center max-w-md">
          <!-- 居中显示的加载动画 -->
          <div class="flex justify-center mb-6">
            <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>

          <!-- 优化评估中提示文案 -->
          <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3">神笔AI正在评估中</h4>
          <p class="text-[var(--text-secondary)] mb-4">
            正在深度分析章节内容，请耐心等待...
          </p>

          <div class="text-sm text-[var(--text-secondary)] opacity-80">
            评估维度：情节推进、人物表现、情绪价值、阅读节奏、创意新颖、商业价值
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-500 mb-4">
          <TriangleAlert class="w-12 h-12 mx-auto" />
        </div>
        <p class="text-[var(--text-secondary)] mb-4">{{ error }}</p>
        <button @click="handleRetry"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          重试
        </button>
      </div>

      <!-- 评估结果 -->
      <div v-else-if="reviewResult" class="flex-1 overflow-y-auto mb-4">
        <!-- 总分显示 -->
        <div class="mb-6">
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-center text-white">
            <div class="text-3xl font-bold mb-2">{{ calculateOverallScore(reviewResult) }}/10</div>
            <div class="text-lg">综合评分</div>
            <div class="text-sm opacity-80 mt-1">{{ getScoreComment(calculateOverallScore(reviewResult)) }}</div>
          </div>
        </div>

        <!-- ECharts雷达图展示六大维度评分 -->
        <div class="mb-6">
          <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
            <div class="flex flex-col lg:flex-row items-center justify-center gap-6">
              <!-- 左侧维度卡片 -->
              <div class="grid grid-cols-1 gap-3 w-full lg:w-auto">
                <div
                  class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700 transition-all hover:shadow-md">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-medium text-blue-700 dark:text-blue-300">情节推进</span>
                    <span class="text-lg font-bold text-blue-600">{{ reviewResult.plot_progression_score }}/10</span>
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
                    <span class="text-lg font-bold text-purple-600">{{ reviewResult.emotional_value_score }}/10</span>
                  </div>
                  <div class="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1.5">
                    <div class="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                      :style="{ width: `${reviewResult.emotional_value_score * 10}%` }"></div>
                  </div>
                </div>
              </div>

              <!-- ECharts雷达图 -->
              <div class="flex justify-center">
                <div ref="radarChartRef" style="width: 350px; height: 350px;" class="w-full max-w-[350px] h-auto"></div>
              </div>

              <!-- 右侧维度卡片 -->
              <div class="grid grid-cols-1 gap-3 w-full lg:w-auto">
                <div
                  class="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700 transition-all hover:shadow-md">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-medium text-orange-700 dark:text-orange-300">阅读节奏</span>
                    <span class="text-lg font-bold text-orange-600">{{ reviewResult.reading_pace_score }}/10</span>
                  </div>
                  <div class="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-1.5">
                    <div class="bg-orange-600 h-1.5 rounded-full transition-all duration-500"
                      :style="{ width: `${reviewResult.reading_pace_score * 10}%` }"></div>
                  </div>
                </div>
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
                    <span class="text-lg font-bold text-red-600">{{ reviewResult.commercial_value_score }}/10</span>
                  </div>
                  <div class="w-full bg-red-200 dark:bg-red-800 rounded-full h-1.5">
                    <div class="bg-red-600 h-1.5 rounded-full transition-all duration-500"
                      :style="{ width: `${reviewResult.commercial_value_score * 10}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 综合评价 -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3">综合评价</h4>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4">
            <p class="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{{ reviewResult.overall_evaluation
            }}</p>
          </div>
        </div>

        <!-- 优点分析 -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3">优点分析</h4>
          <div class="bg-[var(--strength-bg)] border border-[var(--strength-border)] rounded-lg p-4">
            <ul class="space-y-2">
              <li v-for="(strength, index) in reviewResult.strengths" :key="index" class="flex items-start">
                <CheckCircle class="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span class="text-[var(--text-primary)]">{{ strength }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 问题与不足 -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3">问题与不足</h4>
          <div class="bg-[var(--pitfall-bg)] border border-[var(--pitfall-border)] rounded-lg p-4">
            <ul class="space-y-3">
              <li v-for="(pitfall, index) in reviewResult.pitfalls" :key="index" class="flex flex-col gap-1">
                <div class="flex items-start">
                  <AlertCircle class="w-4 h-4 text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                  <span class="text-[var(--text-primary)] font-medium">{{ pitfall.content }}</span>
                </div>
                <div v-if="pitfall.position" class="ml-6 text-sm text-[var(--text-secondary)]">
                  <span class="font-medium">位置：</span>{{ pitfall.position }}
                </div>
                <div v-if="pitfall.suggestion"
                  class="ml-6 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-2 border-blue-400">
                  <span class="font-medium">修改建议：</span>{{ pitfall.suggestion }}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- 改进建议 -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3">改进建议</h4>
          <div class="bg-[var(--suggestion-bg)] border border-[var(--suggestion-border)] rounded-lg p-4">
            <ul class="space-y-2">
              <li v-for="(suggestion, index) in reviewResult.improvement_suggestions" :key="index"
                class="flex items-start">
                <Lightbulb class="w-4 h-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span class="text-[var(--text-primary)]">{{ suggestion }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div v-if="reviewResult" class="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)] mt-auto">
        <button @click="handleRetry"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          重新评估
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { X, TriangleAlert, CheckCircle, AlertCircle, Lightbulb } from 'lucide-vue-next'
import type { ChapterReviewResult } from '@/services/chapterReview'
import * as echarts from 'echarts'

interface Props {
  visible: boolean
  chapterContent: string
  globalSettings?: string
  chapterTitle?: string
  chapterId?: number
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
  chapterId: undefined
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
        color: 'var(--text-primary)'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const dimensionNames = ['情节推进', '人物表现', '情绪价值', '阅读节奏', '创意新颖', '商业价值']
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
        { name: '商业价值', max: 10 }
      ],
      shape: 'polygon',
      radius: 140,
      splitNumber: 5,
      name: {
        textStyle: {
          color: 'var(--text-primary)',
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
          color: 'var(--border-color)'
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
          color: 'var(--border-color)'
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
          reviewResult.value.commercial_value_score
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
      chapterTitle: props.chapterTitle
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
      chapterTitle: props.chapterTitle
    }

    reviewResult.value = await generateChapterReview(context, undefined, props.chapterId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '重新评估失败，请检查网络连接和配置'
  } finally {
    loading.value = false
  }
}

// 计算总分（六个维度的平均值）
const calculateOverallScore = (result: ChapterReviewResult): number => {
  const scores = [
    result.plot_progression_score,
    result.character_performance_score,
    result.emotional_value_score,
    result.reading_pace_score,
    result.creativity_score,
    result.commercial_value_score
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
</style>