import { ipcMain } from 'electron'

let mainWindow: any = null

export function registerWindowHandlers(): void {
  console.log('Registering window handlers...')

  // 窗口最小化
  ipcMain.handle('window-minimize', () => {
    try {
      if (mainWindow) {
        mainWindow.minimize()
      }
    } catch (error) {
      console.error('Error in window-minimize handler:', error)
      throw error
    }
  })

  // 窗口最大化/还原
  ipcMain.handle('window-maximize', () => {
    try {
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
      }
    } catch (error) {
      console.error('Error in window-maximize handler:', error)
      throw error
    }
  })

  // 关闭窗口
  ipcMain.handle('window-close', () => {
    try {
      if (mainWindow) {
        mainWindow.close()
      }
    } catch (error) {
      console.error('Error in window-close handler:', error)
      throw error
    }
  })

  console.log('Window handlers registered')
}

/**
 * 设置主窗口实例
 */
export function setMainWindow(window: any): void {
  mainWindow = window
}

/**
 * 获取主窗口实例
 */
export function getMainWindow(): any {
  return mainWindow
}