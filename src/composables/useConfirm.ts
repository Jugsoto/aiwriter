import { ref, h, render } from 'vue'
import type { VNode } from 'vue'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'

export interface ConfirmOptions {
  title?: string
  message: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmLoadingText?: string
  dangerous?: boolean
}

let globalInstance: VNode | null = null
let resolvePromise: ((value: boolean) => void) | null = null

/**
 * 显示确认对话框
 * @param options 确认对话框配置
 * @returns Promise<boolean> 用户是否确认
 */
export async function showConfirm(options: ConfirmOptions): Promise<boolean> {
  // 如果已经有对话框在显示，先关闭它
  if (globalInstance) {
    destroyConfirm()
  }

  return new Promise<boolean>((resolve) => {
    resolvePromise = resolve
    
    // 创建容器元素
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    // 创建组件实例
    const vnode = h(ConfirmModal, {
      visible: true,
      title: options.title || '确认操作',
      message: options.message,
      description: options.description,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      confirmLoadingText: options.confirmLoadingText,
      dangerous: options.dangerous || false,
      loading: false,
      'onUpdate:visible': (visible: boolean) => {
        if (!visible) {
          destroyConfirm()
          if (resolvePromise) {
            resolvePromise(false)
            resolvePromise = null
          }
        }
      },
      onConfirm: () => {
        destroyConfirm()
        if (resolvePromise) {
          resolvePromise(true)
          resolvePromise = null
        }
      },
      onCancel: () => {
        destroyConfirm()
        if (resolvePromise) {
          resolvePromise(false)
          resolvePromise = null
        }
      }
    })
    
    globalInstance = vnode
    render(vnode, container)
  })
}

/**
 * 销毁确认对话框
 */
function destroyConfirm() {
  if (globalInstance) {
    render(null, globalInstance.el?.parentElement as Element)
    if (globalInstance.el?.parentElement) {
      document.body.removeChild(globalInstance.el.parentElement)
    }
    globalInstance = null
  }
}

/**
 * 在组件内部使用的确认对话框组合式函数
 * @returns 包含showConfirm函数的对象
 */
export function useConfirm() {
  const visible = ref(false)
  const options = ref<ConfirmOptions>({ message: '' })
  const loading = ref(false)
  
  let componentResolve: ((value: boolean) => void) | null = null

  const showComponentConfirm = (confirmOptions: ConfirmOptions): Promise<boolean> => {
    options.value = confirmOptions
    visible.value = true
    loading.value = false
    
    return new Promise<boolean>((resolve) => {
      componentResolve = resolve
    })
  }

  const handleConfirm = () => {
    visible.value = false
    if (componentResolve) {
      componentResolve(true)
      componentResolve = null
    }
  }

  const handleCancel = () => {
    visible.value = false
    if (componentResolve) {
      componentResolve(false)
      componentResolve = null
    }
  }

  return {
    visible,
    options,
    loading,
    showConfirm: showComponentConfirm,
    handleConfirm,
    handleCancel
  }
}

// 导出全局确认函数
export { showConfirm as confirm }