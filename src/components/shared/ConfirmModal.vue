<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="fixed inset-0" @click="handleCancel"></div>
    <div
      class="bg-[var(--bg-primary)] rounded-xl p-6 w-full max-w-md mx-4 border-2 border-[var(--border-color)] shadow-lg relative">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {{ title }}
      </h3>

      <div class="mb-6">
        <p class="text-[var(--text-secondary)] leading-relaxed">
          {{ message }}
        </p>
        <p v-if="description" class="text-sm text-[var(--text-tertiary)] mt-2">
          {{ description }}
        </p>
      </div>

      <div class="flex gap-3 justify-end">
        <button type="button" @click="handleCancel"
          class="px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--hover-bg)] transition-colors"
          :disabled="loading">
          {{ cancelText }}
        </button>
        <button type="button" @click="handleConfirm" :disabled="loading"
          class="px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" :class="dangerous
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-[var(--theme-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-hover)]'">
          {{ loading ? confirmLoadingText : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  title?: string
  message: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmLoadingText?: string
  dangerous?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '确认操作',
  confirmText: '确认',
  cancelText: '取消',
  confirmLoadingText: '处理中...',
  dangerous: false,
  loading: false
})

const emit = defineEmits<Emits>()

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return

  if (event.key === 'Escape') {
    handleCancel()
  } else if (event.key === 'Enter' && !props.loading) {
    handleConfirm()
  }
}

// 生命周期管理
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听visible变化，处理焦点和滚动
watch(() => props.visible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>