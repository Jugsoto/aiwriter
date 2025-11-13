<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="bg-[var(--bg-primary)] rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col border border-[var(--border-color)] shadow-2xl">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
        编辑全局设定
      </h3>

      <div class="mb-4 flex-1 flex flex-col">
        <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          全局设定（内容在每次对话时自动追加的前文中，帮助提供一致性的世界观）
        </label>
        <textarea v-model="formData.global_settings"
          class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 resize-none"
          placeholder="请输入全局设定，合理的输入小说类型，剧情主线、故事背景、特殊设计等..." rows="12"></textarea>
      </div>

      <div class="flex justify-end gap-3">
        <button @click="handleCancel"
          class="px-4 py-1.5 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
          取消
        </button>
        <button @click="handleConfirm"
          class="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          保存
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
  initialData?: {
    global_settings: string
  }
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', data: { global_settings: string }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  initialData: () => ({ global_settings: '' })
})

const emit = defineEmits<Emits>()

const formData = ref({
  global_settings: ''
})

// 监听visible变化，初始化表单数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value.global_settings = props.initialData?.global_settings || ''
  }
})

const handleConfirm = () => {
  emit('confirm', { global_settings: formData.value.global_settings })
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