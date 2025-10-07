import { ref } from 'vue'

export interface ErrorModalOptions {
  title?: string
  message: string
  errorDetails?: string
  closeText?: string
}

export function useErrorModal() {
  const visible = ref(false)
  const title = ref('错误')
  const message = ref('')
  const errorDetails = ref('')
  const closeText = ref('关闭')

  const showErrorModal = (options: ErrorModalOptions) => {
    title.value = options.title || '错误'
    message.value = options.message
    errorDetails.value = options.errorDetails || ''
    closeText.value = options.closeText || '关闭'
    visible.value = true
  }

  const hideErrorModal = () => {
    visible.value = false
  }

  return {
    visible,
    title,
    message,
    errorDetails,
    closeText,
    showErrorModal,
    hideErrorModal
  }
}