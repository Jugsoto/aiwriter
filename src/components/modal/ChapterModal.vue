<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="bg-[var(--bg-primary)] rounded-2xl p-6 w-full max-w-md mx-4 border border-[var(--border-color)] shadow-2xl">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {{ isEdit ? '编辑章节' : '新建章节' }}
      </h3>

      <div class="mb-4">
        <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          章节名称
        </label>
        <input v-model="formData.title" type="text"
          class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入章节名称" @keyup.enter="handleConfirm" />
      </div>

      <div class="flex justify-end gap-3">
        <button @click="handleCancel"
          class="px-4 py-1.5 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
          取消
        </button>
        <button @click="handleConfirm" :disabled="!formData.title.trim()"
          class="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ isEdit ? '保存' : '创建' }}
        </button>
      </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  visible: boolean
  isEdit?: boolean
  initialData?: {
    title: string
  }
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', data: { title: string }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  isEdit: false,
  initialData: () => ({ title: '' })
})

const emit = defineEmits<Emits>()

const formData = ref({
  title: ''
})

// 监听visible变化，初始化表单数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value.title = props.initialData?.title || ''
  }
})

const handleConfirm = () => {
  if (!formData.value.title.trim()) return

  emit('confirm', { title: formData.value.title.trim() })
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
/* 模态框过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>