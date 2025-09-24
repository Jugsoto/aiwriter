<template>
  <div
    class="p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center gap-2">
    <div class="flex items-center gap-2">
      <button @click="saveContent" :disabled="!hasChanges || saving"
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        保存
      </button>
      <button @click="generateSummary" :disabled="!currentChapter || !currentChapter.content || isGeneratingSummary"
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <span v-if="isGeneratingSummary"
          class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
        {{ isGeneratingSummary ? '生成中...' : '梗概' }}
      </button>
      <button @click="updateMemory" :disabled="!currentChapter || !currentChapter.content || isUpdatingMemory"
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <span v-if="isUpdatingMemory"
          class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
        {{ isUpdatingMemory ? '更新中...' : '更新记忆' }}
      </button>
      <button
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        按钮3
      </button>
      <!-- 停止流式输出按钮 - 仅在流式写作时显示 -->
      <button v-if="isStreaming" @click="stopStreaming"
        class="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-300 bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors animate-pulse">
        <span class="w-2 h-2 bg-red-500 rounded-full"></span>
        停止写作
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Chapter } from '@/electron.d'
import { createChapterMemoryService } from '@/services/chapterMemory'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { ref } from 'vue'

// 定义props
const props = defineProps({
  currentChapter: {
    type: Object as () => Chapter | null,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  },
  lastSaved: {
    type: Boolean,
    default: false
  },
  hasChanges: {
    type: Boolean,
    default: false
  },
  isStreaming: {
    type: Boolean,
    default: false
  },
  isGeneratingSummary: {
    type: Boolean,
    default: false
  }
})

// 定义emits
const emit = defineEmits<{
  saveContent: []
  stopStreaming: []
  generateSummary: [summary: string]
  updateMemoryStart: []
  updateMemoryEnd: [success: boolean]
}>()

// 状态管理
const featureConfigsStore = useFeatureConfigsStore()
const isUpdatingMemory = ref(false)

// 更新章节记忆
const updateMemory = async () => {
  if (!props.currentChapter || !props.currentChapter.content) return

  try {
    isUpdatingMemory.value = true
    emit('updateMemoryStart') // 发出记忆更新开始事件

    // 获取嵌入功能配置
    const configs = featureConfigsStore.configs
    const embeddingConfig = configs.find(c => c.feature_name === 'embedding_model')
    if (!embeddingConfig) {
      throw new Error('请先配置嵌入服务')
    }

    // 创建章节记忆服务
    const memoryService = createChapterMemoryService(embeddingConfig)

    // 显示进度提示
    const toast = {
      show: false,
      message: '',
      type: 'info' as 'info' | 'success' | 'error'
    }

    // 更新章节记忆
    const result = await memoryService.updateChapterMemory(props.currentChapter, {
      onProgress: (progress: number, total: number) => {
        console.log(`更新记忆进度: ${progress}/${total}`)
      },
      onError: (error) => {
        console.error('更新记忆失败:', error)
        toast.message = `更新记忆失败: ${error.message}`
        toast.type = 'error'
        toast.show = true
      }
    })

    if (result.success) {
      // 成功时只通过事件通知父组件，由父组件处理显示逻辑
      emit('updateMemoryEnd', true) // 发出记忆更新成功事件
    } else {
      // 错误时通过事件通知父组件，由父组件使用错误模态窗处理
      emit('updateMemoryEnd', false) // 发出记忆更新失败事件
    }
  } catch (error) {
    console.error('更新记忆失败:', error)
    // 错误通过事件传递给父组件处理，父组件可以使用错误模态窗显示
    emit('updateMemoryEnd', false) // 发出记忆更新失败事件
  } finally {
    isUpdatingMemory.value = false
  }
}

// 保存内容
const saveContent = () => {
  emit('saveContent')
}

// 停止流式输出
const stopStreaming = () => {
  emit('stopStreaming')
}

// 生成章节梗概
const generateSummary = async () => {
  if (!props.currentChapter || !props.currentChapter.content) return

  // 触发自定义事件，通知父组件开始生成梗概
  emit('generateSummary', '')
}
</script>