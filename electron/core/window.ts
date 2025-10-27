import { BrowserWindow, shell, app } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { setMainWindow } from '../handlers/window-handlers'

// ES模块中创建__dirname等效变量
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let mainWindow: BrowserWindow | null = null

/**
 * 创建主窗口
 */
export function createMainWindow(): BrowserWindow {
  // 如果窗口已存在，则返回现有窗口
  if (mainWindow) {
    return mainWindow
  }

  // 创建新的浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(app.getAppPath(), 'dist-electron/preload.js')
    },
    icon: path.join(__dirname, '../../public/logo.ico')
  })

  // 设置主窗口实例到处理器模块
  setMainWindow(mainWindow)

  // 根据环境加载页面
  if (VITE_DEV_SERVER_URL) {
    // 开发环境：加载开发服务器
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    // 打开开发者工具
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // 生产环境：加载构建后的文件
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'))
  }

  // 处理窗口打开链接事件
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null
    // 清理处理器中的窗口引用
    setMainWindow(null)
  })

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  return mainWindow
}

/**
 * 获取主窗口实例
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

/**
 * 关闭主窗口
 */
export function closeMainWindow(): void {
  if (mainWindow) {
    mainWindow.close()
    mainWindow = null
  }
}

/**
 * 检查主窗口是否存在
 */
export function hasMainWindow(): boolean {
  return mainWindow !== null && !mainWindow.isDestroyed()
}

/**
 * 显示主窗口
 */
export function showMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
    mainWindow.show()
  }
}

/**
 * 隐藏主窗口
 */
export function hideMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
}

/**
 * 最小化主窗口
 */
export function minimizeMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize()
  }
}

/**
 * 最大化/还原主窗口
 */
export function toggleMaximizeMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
}