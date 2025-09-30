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
            评估维度：情节推进、人物表现、情绪价值、阅读节奏
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
      <div v-else-if="reviewResult" class="flex-1 overflow-y-auto">
        <!-- 总分显示 -->
        <div class="mb-6">
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-center text-white">
            <div class="text-3xl font-bold mb-2">{{ calculateOverallScore(reviewResult) }}/10</div>
            <div class="text-lg">综合评分</div>
            <div class="text-sm opacity-80 mt-1">{{ getScoreComment(calculateOverallScore(reviewResult)) }}</div>
          </div>
        </div>

        <!-- 四个维度评分卡片 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ reviewResult.plot_progression_score }}/10</div>
            <div class="text-sm text-[var(--text-secondary)] mt-1">情节推进</div>
          </div>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ reviewResult.character_performance_score }}/10</div>
            <div class="text-sm text-[var(--text-secondary)] mt-1">人物表现</div>
          </div>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-600">{{ reviewResult.emotional_value_score }}/10</div>
            <div class="text-sm text-[var(--text-secondary)] mt-1">情绪价值</div>
          </div>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-orange-600">{{ reviewResult.reading_pace_score }}/10</div>
            <div class="text-sm text-[var(--text-secondary)] mt-1">阅读节奏</div>
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
            <ul class="space-y-2">
              <li v-for="(pitfall, index) in reviewResult.pitfalls" :key="index" class="flex items-start">
                <AlertCircle class="w-4 h-4 text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                <span class="text-[var(--text-primary)]">{{ pitfall }}</span>
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
      <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
        <button @click="handleCancel"
          class="px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
          关闭
        </button>
        <button v-if="reviewResult" @click="handleRetry"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          重新评估
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, TriangleAlert, CheckCircle, AlertCircle, Lightbulb } from 'lucide-vue-next'
import type { ChapterReviewResult } from '@/services/chapterReview'

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

// 监听visible变化，初始化数据
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await loadChapterReview()
  } else {
    // 关闭时重置状态
    resetState()
  }
})

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
    console.error('章节评估失败:', err)
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
    console.error('重新评估失败:', err)
    error.value = err instanceof Error ? err.message : '重新评估失败，请检查网络连接和配置'
  } finally {
    loading.value = false
  }
}

// 计算总分（四个维度的平均值）
const calculateOverallScore = (result: ChapterReviewResult): number => {
  const scores = [
    result.plot_progression_score,
    result.character_performance_score,
    result.emotional_value_score,
    result.reading_pace_score
  ]
  const sum = scores.reduce((total, score) => total + score, 0)
  return Math.round((sum / scores.length) * 10) / 10 // 保留一位小数
}

// 根据分数获取点评描述
const getScoreComment = (score: number): string => {
  if (score >= 8) {
    return '😊 优秀！章节内容质量很高，继续保持！'
  } else if (score >= 6) {
    return '😐 良好！章节内容有不错的基础，还有提升空间'
  } else {
    return '😔 需要改进！章节内容需要进一步优化和完善'
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