import { ipcMain } from 'electron'

/**
 * IPC路由管理器
 * 用于管理和组织IPC通道的路由
 */
export class IPCRouter {
  private routes = new Map<string, (...args: any[]) => Promise<any>>()

  /**
   * 注册IPC路由
   */
  register(channel: string, handler: (...args: any[]) => Promise<any>): void {
    if (this.routes.has(channel)) {
      console.warn(`IPC channel ${channel} is already registered, overwriting...`)
    }

    this.routes.set(channel, handler)

    ipcMain.handle(channel, async (_event, ...args) => {
      try {
        return await handler(...args)
      } catch (error) {
        console.error(`Error in IPC handler for channel ${channel}:`, error)
        // 重新抛出错误，让调用者处理
        throw error
      }
    })

    console.log(`IPC route registered: ${channel}`)
  }

  /**
   * 注销IPC路由
   */
  unregister(channel: string): void {
    if (this.routes.has(channel)) {
      ipcMain.removeHandler(channel)
      this.routes.delete(channel)
      console.log(`IPC route unregistered: ${channel}`)
    }
  }

  /**
   * 检查路由是否存在
   */
  has(channel: string): boolean {
    return this.routes.has(channel)
  }

  /**
   * 获取所有已注册的路由
   */
  getRoutes(): string[] {
    return Array.from(this.routes.keys())
  }

  /**
   * 清除所有路由
   */
  clear(): void {
    for (const channel of this.routes.keys()) {
      ipcMain.removeHandler(channel)
    }
    this.routes.clear()
    console.log('All IPC routes cleared')
  }
}

// 创建全局IPC路由实例
export const ipcRouter = new IPCRouter()

// 导出便捷方法
export const registerIPCRoute = (channel: string, handler: (...args: any[]) => Promise<any>) => {
  ipcRouter.register(channel, handler)
}

export const unregisterIPCRoute = (channel: string) => {
  ipcRouter.unregister(channel)
}

export const hasIPCRoute = (channel: string): boolean => {
  return ipcRouter.has(channel)
}

export const getIPCRoutes = (): string[] => {
  return ipcRouter.getRoutes()
}

export const clearAllIPCRoutes = (): void => {
  ipcRouter.clear()
}