<template>
  <div
    class="absolute top-12 right-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg p-4 w-64 z-50">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-medium text-[var(--text-primary)]">Copilot 设置</h3>
      <button @click="$emit('close')" class="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors">
        <X class="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>

    <div class="space-y-4">
      <!-- 上下文长度设置 -->
      <div>
        <label class="block text-xs font-medium text-[var(--text-secondary)] mb-2">
          上下文长度: {{ contextLength }}
        </label>
        <input v-model.number="contextLength" type="range" min="1" max="10" step="1"
          class="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer">
        <div class="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
          <span>1</span>
          <span>10</span>
        </div>
        <p class="text-xs text-[var(--text-secondary)] mt-1">
          控制AI对话时参考前文对话的数量
        </p>
      </div>

      <!-- 保存按钮 -->
      <div class="flex justify-end pt-2">
        <button @click="saveSettings" :disabled="!hasChanges"
          class="px-3 py-1.5 bg-[var(--theme-bg)] text-[var(--theme-text)] text-xs rounded hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
}

// 响应式数据
const contextLength = ref<number>(3)
const originalSettings = ref<CopilotSettings>({
  contextLength: 3
})

// 计算属性
const hasChanges = computed(() => {
  return contextLength.value !== originalSettings.value.contextLength
})

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
        contextLength: 3
      }
      contextLength.value = defaultSettings.contextLength
      originalSettings.value = { ...defaultSettings }
    }
  } catch (error) {
    console.error('加载Copilot设置失败:', error)
    // 使用默认值
    const defaultSettings: CopilotSettings = {
      contextLength: 3
    }
    contextLength.value = defaultSettings.contextLength
    originalSettings.value = { ...defaultSettings }
  }
}

// 保存设置
const saveSettings = () => {
  try {
    const settings: CopilotSettings = {
      contextLength: contextLength.value
    }

    const settingsKey = getSettingsKey(props.bookId)
    localStorage.setItem(settingsKey, JSON.stringify(settings))

    originalSettings.value = { ...settings }

    // 触发保存事件
    emit('saved', settings)

    // 关闭设置面板
    emit('close')
  } catch (error) {
    console.error('保存Copilot设置失败:', error)
  }
}

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