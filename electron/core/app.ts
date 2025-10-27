import { app } from 'electron'
import { createMainWindow } from './window'
import { closeDatabase } from '../database'
import { initializeSystem } from '../init'
import { registerAllHandlers, removeAllHandlers } from '../handlers'

/**
 * 应用程序类
 */
export class ElectronApp {
  private isInitialized = false

  /**
   * 初始化应用程序
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Electron application...')

      // 注册所有IPC处理器
      registerAllHandlers()

      // 初始化系统（包括数据库、默认数据等）
      console.log('Initializing system...')
      await initializeSystem()

      // 创建主窗口
      console.log('Creating main window...')
      createMainWindow()

      this.isInitialized = true
      console.log('Electron application initialized successfully')
    } catch (error) {
      console.error('Failed to initialize application:', error)
      // 即使初始化失败，也尝试创建窗口
      createMainWindow()
    }
  }

  /**
   * 关闭应用程序
   */
  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down Electron application...')

      // 移除所有IPC处理器
      removeAllHandlers()

      // 关闭数据库连接
      closeDatabase()

      console.log('Electron application shutdown completed')
    } catch (error) {
      console.error('Error during application shutdown:', error)
    }
  }

  /**
   * 检查是否已初始化
   */
  isAppInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * 重新启动应用程序
   */
  restart(): void {
    console.log('Restarting application...')
    app.relaunch()
    app.quit()
  }
}

// 创建应用实例
export const electronApp = new ElectronApp()