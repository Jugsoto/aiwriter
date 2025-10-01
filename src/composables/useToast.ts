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

  function showToast(options: ToastOptions) {
    toastMessage.value = options.message
    toastType.value = options.type || 'success'
    toastVisible.value = true

    // 自动隐藏
    setTimeout(() => {
      toastVisible.value = false
    }, options.duration || 2000)
  }

  return {
    toastVisible,
    toastMessage,
    toastType,
    showToast
  }
}