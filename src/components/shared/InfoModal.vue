<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="fixed inset-0" @click="handleClose"></div>
    <div
      class="bg-[var(--bg-primary)] rounded-xl p-6 w-full max-w-lg mx-4 border-2 border-[var(--border-color)] shadow-lg relative">
      <div class="flex items-center mb-4">
        <Info class="w-6 h-6 text-blue-500 mr-3" />
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">
          {{ title }}
        </h3>
      </div>

      <div class="mb-6">
        <p class="text-[var(--text-secondary)] leading-relaxed">
          {{ message }}
        </p>
      </div>

      <div class="flex gap-3 justify-end">
        <button type="button" @click="handleClose"
          class="px-4 py-1.5 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
          {{ closeText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { Info } from 'lucide-vue-next'

interface Props {
  visible: boolean
  title?: string
  message: string
  closeText?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '信息',
  closeText: '关闭'
})

const emit = defineEmits<Emits>()

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return

  if (event.key === 'Escape') {
    handleClose()
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

const handleClose = () => {
  emit('close')
  emit('update:visible', false)
}
</script>