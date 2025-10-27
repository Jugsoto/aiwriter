import * as electron from 'electron'
import { electronApp } from './core/app'
import { createMainWindow } from './core/window'
import { logInfo, logError } from './utils/logger'

/**
 * Electron主进程入口文件
 * 精简版本，主要负责应用程序生命周期管理
 */

// 确保只有一个应用实例
const gotTheLock = electron.app.requestSingleInstanceLock()

if (!gotTheLock) {
  electron.app.quit()
} else {
  electron.app.on('second-instance', () => {
    // 当运行第二个实例时，将会聚焦到主窗口
    const mainWindow = electron.BrowserWindow.getFocusedWindow() || createMainWindow()
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
}

/**
 * 应用准备就绪
 */
electron.app.whenReady().then(async () => {
  try {
    logInfo('应用程序启动')

    // 初始化应用程序
    await electronApp.initialize()

    logInfo('应用程序启动完成')
  } catch (error) {
    logError('应用程序启动失败', error)

    // 即使初始化失败，也尝试创建窗口
    try {
      createMainWindow()
      logInfo('基础窗口创建完成')
    } catch (windowError) {
      logError('创建基础窗口失败', windowError)
      electron.app.quit()
    }
  }
})

/**
 * 所有窗口关闭
 */
electron.app.on('window-all-closed', () => {
  // 在 macOS 上，应用及其菜单栏通常保持活跃状态，
  // 直到用户明确使用 Cmd + Q 退出
  if (process.platform !== 'darwin') {
    electron.app.quit()
  }
})

/**
 * 应用激活
 */
electron.app.on('activate', () => {
  // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

/**
 * 应用退出前
 */
electron.app.on('before-quit', async () => {
  try {
    logInfo('应用程序正在关闭...')

    // 关闭应用程序
    await electronApp.shutdown()

    logInfo('应用程序关闭完成')
  } catch (error) {
    logError('应用程序关闭时发生错误', error)
  }
})

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
  logError('未捕获的异常', error)
  console.error('Uncaught Exception:', error)
})

/**
 * 处理未处理的 Promise 拒绝
 */
process.on('unhandledRejection', (reason, promise) => {
  logError('未处理的Promise拒绝', { reason, promise })
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// 导出电子应用实例供其他文件使用
export { electronApp }