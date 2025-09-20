<template>
  <div
    class="absolute top-12 right-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg w-64 z-50">
    <!-- 头部 -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
      <h3 class="text-sm font-medium text-[var(--text-primary)]">Copilot 设置</h3>
      <button @click="$emit('close')" class="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors">
        <X class="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>

    <!-- 设置内容 -->
    <div class="p-4 space-y-3">
      <!-- 上下文长度设置 -->
      <div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)]">
        <label class="block text-xs font-medium text-[var(--text-secondary)] mb-2">
          上下文长度: {{ contextLength }}
        </label>
        <input v-model.number="contextLength" type="range" min="1" max="10" step="1"
          class="w-full h-2 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer">
        <div class="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
          <span>1</span>
          <span>10</span>
        </div>
        <p class="text-xs text-[var(--text-secondary)] mt-2">
          控制AI对话时参考前文对话的数量
        </p>
      </div>

      <!-- 前文章节数量设置 -->
      <div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)]">
        <label class="block text-xs font-medium text-[var(--text-secondary)] mb-2">
          前文章节数量: {{ previousChapterCount }}
        </label>
        <input v-model.number="previousChapterCount" type="range" min="1" max="3" step="1"
          class="w-full h-2 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer">
        <div class="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
          <span>1</span>
          <span>2</span>
          <span>3</span>
        </div>
        <p class="text-xs text-[var(--text-secondary)] mt-2">
          控制AI参考的前文章节数量
        </p>
      </div>

      <!-- 前文章节梗概数量设置 -->
      <div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)]">
        <label class="block text-xs font-medium text-[var(--text-secondary)] mb-2">
          前文章节梗概数量: {{ chapterSummaryCount }}
        </label>
        <input v-model.number="chapterSummaryCount" type="range" min="3" max="10" step="1"
          class="w-full h-2 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer">
        <div class="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
          <span>3</span>
          <span>10</span>
        </div>
        <p class="text-xs text-[var(--text-secondary)] mt-2">
          控制AI参考的前文章节梗概数量
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { X } from 'lucide-vue-next'

// 定义props
const props = defineProps<{
  bookId: number
}>()

// 定义emits
const emit = defineEmits<{
  close: []
  saved: [settings: CopilotSettings]
}>()

// 设置接口
interface CopilotSettings {
  contextLength: number
  previousChapterCount: number  // 前文章节数量 (1-3)
  chapterSummaryCount: number   // 前文章节梗概数量 (3-10)
}

// 响应式数据
const contextLength = ref<number>(3)
const previousChapterCount = ref<number>(1)
const chapterSummaryCount = ref<number>(5)
const originalSettings = ref<CopilotSettings>({
  contextLength: 3,
  previousChapterCount: 1,
  chapterSummaryCount: 5
})

// 自动保存防抖
let saveTimeout: NodeJS.Timeout | null = null
const saveDelay = 500 // 500ms 延迟

// 获取设置存储键
const getSettingsKey = (bookId: number): string => {
  return `copilot-settings-${bookId}`
}

// 加载设置
const loadSettings = () => {
  try {
    const settingsKey = getSettingsKey(props.bookId)
    const savedSettings = localStorage.getItem(settingsKey)

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as CopilotSettings
      contextLength.value = parsed.contextLength
      originalSettings.value = { ...parsed }
    } else {
      // 使用默认值
      const defaultSettings: CopilotSettings = {
        contextLength: 3,
        previousChapterCount: 1,
        chapterSummaryCount: 5
      }
      contextLength.value = defaultSettings.contextLength
      previousChapterCount.value = defaultSettings.previousChapterCount
      chapterSummaryCount.value = defaultSettings.chapterSummaryCount
      originalSettings.value = { ...defaultSettings }
    }
  } catch (error) {
    console.error('加载Copilot设置失败:', error)
    // 使用默认值
    const defaultSettings: CopilotSettings = {
      contextLength: 3,
      previousChapterCount: 1,
      chapterSummaryCount: 5
    }
    contextLength.value = defaultSettings.contextLength
    previousChapterCount.value = defaultSettings.previousChapterCount
    chapterSummaryCount.value = defaultSettings.chapterSummaryCount
    originalSettings.value = { ...defaultSettings }
  }
}

// 自动保存设置
const autoSaveSettings = () => {
  // 清除之前的定时器
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  // 设置新的定时器
  saveTimeout = setTimeout(() => {
    try {
      const settings: CopilotSettings = {
        contextLength: contextLength.value,
        previousChapterCount: previousChapterCount.value,
        chapterSummaryCount: chapterSummaryCount.value
      }

      const settingsKey = getSettingsKey(props.bookId)
      localStorage.setItem(settingsKey, JSON.stringify(settings))

      originalSettings.value = { ...settings }

      // 触发保存事件
      emit('saved', settings)
    } catch (error) {
      console.error('自动保存Copilot设置失败:', error)
    }
  }, saveDelay)
}

// 监听设置变化
watch(contextLength, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    autoSaveSettings()
  }
})

watch(previousChapterCount, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    autoSaveSettings()
  }
})

watch(chapterSummaryCount, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    autoSaveSettings()
  }
})

// 初始化
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
/* 自定义滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--theme-bg);
  cursor: pointer;
  border: 2px solid var(--bg-primary);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--theme-bg);
  cursor: pointer;
  border: 2px solid var(--bg-primary);
}
</style>