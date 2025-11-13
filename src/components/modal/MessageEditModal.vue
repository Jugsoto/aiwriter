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
        编辑消息
      </h3>

      <div class="mb-4 flex-1">
        <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          消息内容
        </label>
        <textarea v-model="editedContent"
          class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 resize-none"
          placeholder="请输入消息内容..." rows="10"></textarea>
      </div>

      <div class="flex justify-end gap-3">
        <button @click="handleCancel"
          class="px-4 py-1.5 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
          取消
        </button>
        <button @click="handleConfirm"
          class="px-4 py-1.5 bg-[var(--theme-bg)] text-white rounded-lg hover:bg-blue-700 transition-colors">
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
import type { Message } from '../../utils/types'

interface Props {
  visible: boolean
  message: Message | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', message: Message): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  message: null
})

const emit = defineEmits<Emits>()

// 编辑的内容
const editedContent = ref('')

// 监听visible变化，初始化编辑内容
watch(() => props.visible, (newVal) => {
  if (newVal && props.message) {
    editedContent.value = props.message.content
  }
})

// 处理确认
const handleConfirm = () => {
  if (props.message && editedContent.value.trim()) {
    const updatedMessage = {
      ...props.message,
      content: editedContent.value.trim()
    }
    emit('confirm', updatedMessage)
    emit('update:visible', false)
  }
}

// 处理取消
const handleCancel = () => {
  editedContent.value = ''
  emit('cancel')
  emit('update:visible', false)
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return

  if (event.key === 'Escape') {
    handleCancel()
  } else if (event.key === 'Enter' && event.ctrlKey) {
    // Ctrl+Enter 保存
    handleConfirm()
  }
}

// 监听键盘事件
watch(() => props.visible, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})
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