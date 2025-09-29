<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/50" @click="handleCancel"></div>

    <!-- 模态窗口内容 -->
    <div
      class="bg-[var(--bg-primary)] rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col border-2 border-[var(--border-color)] shadow-lg relative z-10">

      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-[var(--text-primary)]">
          章节评估结果
        </h3>
        <button @click="handleCancel"
          class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-[var(--text-secondary)]">正在评估章节内容...</span>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-500 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p class="text-[var(--text-secondary)] mb-4">{{ error }}</p>
        <button @click="handleRetry"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          重试
        </button>
      </div>

      <!-- 评估结果 -->
      <div v-else-if="reviewResult" class="flex-1 overflow-y-auto">
        <!-- 评分卡片 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ reviewResult.overall_score }}/10</div>
            <div class="text-sm text-[var(--text-secondary)] mt-1">总体评分</div>
          </div>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ reviewResult.plot_score }}/10</div>
            <div class="text-sm text-[var(--text-secondary)] mt-1">情节评分</div>
          </div>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-600">{{ reviewResult.character_score }}/10</div>
            <div class="text-sm text-[var(--text-secondary)] mt-1">人物评分</div>
          </div>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-orange-600">{{ reviewResult.writing_score }}/10</div>
            <div class="text-sm text-[var(--text-secondary)] mt-1">文笔评分</div>
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
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <ul class="space-y-2">
              <li v-for="(strength, index) in reviewResult.strengths" :key="index" class="flex items-start">
                <svg class="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd" />
                </svg>
                <span class="text-[var(--text-primary)]">{{ strength }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 改进建议 -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3">改进建议</h4>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ul class="space-y-2">
              <li v-for="(suggestion, index) in reviewResult.suggestions" :key="index" class="flex items-start">
                <svg class="w-4 h-4 text-yellow-500 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd" />
                </svg>
                <span class="text-[var(--text-primary)]">{{ suggestion }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 修改方向 -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-[var(--text-primary)] mb-3">修改方向</h4>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul class="space-y-2">
              <li v-for="(direction, index) in reviewResult.improvement_directions" :key="index"
                class="flex items-start">
                <svg class="w-4 h-4 text-blue-500 mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                    clip-rule="evenodd" />
                </svg>
                <span class="text-[var(--text-primary)]">{{ direction }}</span>
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