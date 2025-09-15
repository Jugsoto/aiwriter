<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="fixed inset-0 bg-black bg-opacity-50" @click="handleClose"></div>
    <div
      class="bg-[var(--bg-primary)] rounded-xl p-6 w-full max-w-lg mx-4 border-2 border-[var(--border-color)] shadow-lg relative">
      <div class="flex items-center mb-4">
        <CircleAlert class="w-6 h-6 text-red-500 mr-3" />
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">
          {{ title }}
        </h3>
      </div>

      <div class="mb-6">
        <p class="text-[var(--text-secondary)] leading-relaxed">
          {{ message }}
        </p>
        <p v-if="errorDetails" class="text-sm text-[var(--text-tertiary)] mt-2">
          查看下方错误详情获取更多信息
        </p>
        <div v-if="errorDetails"
          class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)] mt-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-[var(--text-primary)]">错误详情：</span>
            <button @click="copyErrorDetails"
              class="text-xs text-[var(--theme-bg)] hover:text-[var(--theme-hover)] transition-colors flex items-center">
              <Copy class="w-4 h-4 mr-1" />
              复制
            </button>
          </div>
          <pre
            class="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{{ errorDetails }}</pre>
        </div>
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
import { CircleAlert, Copy } from 'lucide-vue-next'

interface Props {
  visible: boolean
  title?: string
  message: string
  errorDetails?: string
  closeText?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '错误',
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

// 复制错误详情到剪贴板
const copyErrorDetails = async () => {
  if (!props.errorDetails) return

  try {
    await navigator.clipboard.writeText(props.errorDetails)
    // 可以在这里添加一个轻提示，表示已复制成功
    console.log('错误详情已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：使用旧的复制方法
    const textArea = document.createElement('textarea')
    textArea.value = props.errorDetails
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
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