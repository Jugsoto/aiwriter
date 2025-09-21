<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="fixed inset-0" @click="handleCancel"></div>
    <div class="bg-[var(--bg-primary)] rounded-xl p-4 w-96 border border-[var(--border-color)] shadow-lg relative">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
        选择要测试的模型
      </h3>
      <div class="max-h-64 overflow-y-auto">
        <div v-if="models.length === 0" class="text-center py-4 text-[var(--text-secondary)]">
          暂无模型，请先添加模型
        </div>
        <div v-else>
          <div v-for="model in models" :key="model.id"
            class="p-2 m-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] hover:border-[var(--theme-bg)] cursor-pointer transition-colors"
            @click="handleModelSelect(model)">
            <div class="font-medium text-[var(--text-primary)]">{{ model.model }}</div>
          </div>
        </div>
      </div>
      <div class="flex gap-3 justify-end mt-2">
        <button @click="handleCancel"
          class="px-4 py-1.5 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Model } from '@/electron.d'

defineProps<{
  visible: boolean
  models: Model[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [model: Model]
}>()

// 处理模型选择
const handleModelSelect = (model: Model) => {
  emit('select', model)
  emit('update:visible', false)
}

// 处理取消
const handleCancel = () => {
  emit('update:visible', false)
}
</script>