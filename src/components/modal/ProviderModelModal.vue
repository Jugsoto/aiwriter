<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="bg-[var(--bg-primary)] rounded-xl p-6 w-96 border border-[var(--border-color)] shadow-lg">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
        添加{{ type === 'provider' ? '供应商' : '模型' }}
      </h3>
      <div class="space-y-4">
        <div v-if="type === 'provider'">
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">供应商名称</label>
          <input v-model="formData.name" type="text" placeholder="请输入供应商名称"
            class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] transition-colors" />
        </div>
        <div v-else>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">模型名称</label>
          <input v-model="formData.model" type="text" placeholder="请输入模型名称"
            class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] transition-colors" />
        </div>
      </div>
      <div class="flex justify-end space-x-3 mt-6">
        <button @click="handleCancel"
          class="px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
          取消
        </button>
        <button @click="handleConfirm" :disabled="!isValid"
          class="px-4 py-2 bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
          添加
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  visible: boolean
  type: 'provider' | 'model'
}

interface Emit {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', data: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

// 表单数据
const formData = ref({
  name: '',
  model: ''
})

// 表单验证
const isValid = computed(() => {
  if (props.type === 'provider') {
    return formData.value.name.trim() !== ''
  } else {
    return formData.value.model.trim() !== ''
  }
})

// 处理确认
const handleConfirm = () => {
  if (!isValid.value) return

  const data = props.type === 'provider'
    ? { name: formData.value.name.trim() }
    : { model: formData.value.model.trim() }

  emit('confirm', data)
  resetForm()
}

// 处理取消
const handleCancel = () => {
  emit('cancel')
  resetForm()
}

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    model: ''
  }
  emit('update:visible', false)
}
</script>