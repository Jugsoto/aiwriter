import { ref } from 'vue'

export interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

export function useToast() {
  const toastVisible = ref(false)
  const toastMessage = ref('')
  const toastType = ref<'success' | 'error' | 'info'>('success')
  let toastTimeout: NodeJS.Timeout | null = null

  function showToast(options: ToastOptions) {
    // 清除之前的定时器
    if (toastTimeout) {
      clearTimeout(toastTimeout)
      toastTimeout = null
    }

    toastMessage.value = options.message
    toastType.value = options.type || 'success'
    toastVisible.value = true

    // 自动隐藏，duration为0时不自动隐藏
    const duration = options.duration !== undefined ? options.duration : 2000
    if (duration > 0) {
      toastTimeout = setTimeout(() => {
        toastVisible.value = false
        toastTimeout = null
      }, duration)
    }
  }

  function hideToast() {
    if (toastTimeout) {
      clearTimeout(toastTimeout)
      toastTimeout = null
    }
    toastVisible.value = false
  }

  return {
    toastVisible,
    toastMessage,
    toastType,
    showToast,
    hideToast
  }
}