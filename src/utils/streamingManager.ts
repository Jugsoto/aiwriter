/**
 * 全局流式输出管理器
 * 用于管理所有的流式输出请求，确保同时只有一个流式输出在运行
 */
export class StreamingManager {
  private static instance: StreamingManager | null = null
  private currentController: AbortController | null = null
  private currentType: string | null = null
  private listeners: Set<(isStreaming: boolean, type: string | null) => void> = new Set()

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): StreamingManager {
    if (!StreamingManager.instance) {
      StreamingManager.instance = new StreamingManager()
    }
    return StreamingManager.instance
  }

  /**
   * 开始新的流式输出
   * @param type 流式输出类型（如：'writing', 'chat' 等）
   * @returns AbortController 用于终止当前流式输出
   */
  startStreaming(type: string): AbortController {
    // 如果已有流式输出在运行，先终止它
    if (this.currentController) {
      this.currentController.abort()
    }

    // 创建新的控制器
    const controller = new AbortController()
    this.currentController = controller
    this.currentType = type

    // 通知监听器
    this.notifyListeners(true, type)

    // 监听控制器终止事件
    controller.signal.addEventListener('abort', () => {
      if (this.currentController === controller) {
        this.currentController = null
        this.currentType = null
        this.notifyListeners(false, null)
      }
    })

    return controller
  }

  /**
   * 停止当前的流式输出
   */
  stopStreaming(): void {
    if (this.currentController) {
      console.log(`StreamingManager: 停止${this.currentType}流式输出`)
      console.log(`[DEBUG] currentController before abort:`, this.currentController)
      const controller = this.currentController
      console.log(`[DEBUG] assigned controller variable:`, controller)
      this.currentController.abort()
      console.log(`[DEBUG] currentController after abort:`, this.currentController)
      // 注意：abort事件监听器会处理状态清理
    } else {
      console.log('StreamingManager: 没有活动的流式输出可以停止')
    }
  }

  /**
   * 检查是否正在流式输出
   */
  isStreaming(): boolean {
    return this.currentController !== null
  }

  /**
   * 获取当前流式输出类型
   */
  getCurrentType(): string | null {
    return this.currentType
  }

  /**
   * 添加状态变化监听器
   */
  addListener(listener: (isStreaming: boolean, type: string | null) => void): void {
    this.listeners.add(listener)
  }

  /**
   * 移除状态变化监听器
   */
  removeListener(listener: (isStreaming: boolean, type: string | null) => void): void {
    this.listeners.delete(listener)
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(isStreaming: boolean, type: string | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(isStreaming, type)
      } catch (error) {
        console.error('流式输出监听器错误:', error)
      }
    })
  }
}

/**
 * 全局流式输出管理器实例
 */
export const streamingManager = StreamingManager.getInstance()