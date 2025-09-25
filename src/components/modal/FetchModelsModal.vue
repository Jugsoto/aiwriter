<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <div
      class="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">获取模型列表</h3>
        <button @click="$emit('close')"
          class="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="models.length === 0" class="text-center py-8 text-[var(--text-secondary)]">
          暂无可用模型
        </div>

        <div v-else class="space-y-2">
          <div v-for="model in models" :key="model"
            class="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] hover:border-[var(--theme-bg)] transition-colors">
            <div class="flex-1 font-medium text-[var(--text-primary)]">{{ model }}</div>
            <button @click="handleModelAction(model)"
              class="w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200"
              :class="getModelButtonClass(model)" :title="getModelButtonTitle(model)">
              <component :is="getModelButtonIcon(model)" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-4">
        <button @click="$emit('close')"
          class="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--hover-bg)] transition-all duration-200">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, Plus, Minus } from 'lucide-vue-next'

interface Props {
  visible: boolean
  models: string[]
  existingModels: Array<{ id: number; model: string; tags: string }>
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'add-model', model: string): void
  (e: 'remove-model', model: string): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 检查模型是否已存在
const isModelExists = (modelName: string): boolean => {
  return props.existingModels.some(existing => existing.model === modelName)
}

// 获取模型按钮样式
const getModelButtonClass = (model: string): string => {
  if (isModelExists(model)) {
    return 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200'
  } else {
    return 'bg-green-100 text-green-600 border-green-200 hover:bg-green-200'
  }
}

// 获取模型按钮图标
const getModelButtonIcon = (model: string) => {
  return isModelExists(model) ? Minus : Plus
}

// 获取模型按钮标题
const getModelButtonTitle = (model: string): string => {
  return isModelExists(model) ? '删除模型' : '添加模型'
}

// 处理模型操作
const handleModelAction = (model: string) => {
  if (!isModelExists(model)) {
    emit('add-model', model)
  } else {
    emit('remove-model', model)
  }
}
</script>