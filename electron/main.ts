import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import {
  initDatabase,
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
  closeDatabase,
  getChaptersByBookId,
  getChapterById,
  createChapter,
  updateChapter,
  updateChapterOrder,
  deleteChapter,
  getSettingsByBookId,
  getSettingsByType,
  getSettingById,
  createSetting,
  updateSetting,
  deleteSetting,
  toggleSettingStar,
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getModelsByProviderId,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  getAllFeatureConfigs,
  updateFeatureConfig
} from './database'
import { initializeDefaultProviders } from './initializer'

let win: InstanceType<typeof BrowserWindow> | null = null

// ES模块中创建__dirname等效变量
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth:800,
    minHeight:600,
    frame: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, '../dist-electron/preload.js')
    },
    icon: path.join(__dirname, '../public/logo.ico')
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  
  win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.on('closed', () => {
    win = null
  })
}

app.whenReady().then(async () => {
  try {
    // 初始化数据库
    initDatabase()
    
    // 初始化默认供应商和模型数据
    console.log('Initializing default providers and models...')
    const initSuccess = await initializeDefaultProviders()
    
    if (initSuccess) {
      console.log('Default providers initialization completed')
    } else {
      console.log('Default providers initialization skipped or failed')
    }
    
    // 创建窗口
    createWindow()
  } catch (error) {
    console.error('Failed to initialize application:', error)
    // 即使初始化失败，也尝试创建窗口
    createWindow()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// 获取应用数据目录路径
ipcMain.handle('get-app-data-path', () => {
  return app.getPath('userData')
})

// 打开文件夹
ipcMain.handle('open-folder', (_event: any, folderPath: string) => {
  shell.openPath(folderPath)
  return { success: true }
})

// 获取文件大小
ipcMain.handle('get-file-size', (_event: any, filePath: string) => {
  try {
    const stats = fs.statSync(filePath)
    return { size: stats.size, success: true }
  } catch (error) {
    console.error('Failed to get file size:', error)
    return { size: 0, success: false }
  }
})

// 递归计算文件夹大小
function getFolderSize(folderPath: string): number {
  let totalSize = 0
  try {
    const files = fs.readdirSync(folderPath)
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const stats = fs.statSync(filePath)
      if (stats.isDirectory()) {
        totalSize += getFolderSize(filePath)
      } else {
        totalSize += stats.size
      }
    }
  } catch (error) {
    console.error('Failed to calculate folder size:', error)
  }
  return totalSize
}

// 获取文件夹大小
ipcMain.handle('get-folder-size', (_event: any, folderPath: string) => {
  try {
    const size = getFolderSize(folderPath)
    return { size, success: true }
  } catch (error) {
    console.error('Failed to get folder size:', error)
    return { size: 0, success: false }
  }
})


ipcMain.handle('window-minimize', () => {
  win?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  win?.close()
})

// 书籍相关IPC处理
ipcMain.handle('get-books', () => {
  return getAllBooks()
})

ipcMain.handle('create-book', (_event: any, data: { name: string }) => {
  return createBook(data)
})

ipcMain.handle('update-book', (_event: any, id: number, data: { name: string }) => {
  return updateBook(id, data)
})

ipcMain.handle('delete-book', (_event: any, id: number) => {
  deleteBook(id)
  return { success: true }
})

// 章节相关IPC处理
ipcMain.handle('get-chapters', (_event: any, bookId: number) => {
  return getChaptersByBookId(bookId)
})

ipcMain.handle('get-chapter', (_event: any, id: number) => {
  return getChapterById(id)
})

ipcMain.handle('create-chapter', (_event: any, data: { book_id: number; title: string; content?: string; summary?: string; order_index?: number }) => {
  return createChapter(data)
})

ipcMain.handle('update-chapter', (_event: any, id: number, data: { title?: string; content?: string; summary?: string; order_index?: number }) => {
  return updateChapter(id, data)
})

ipcMain.handle('update-chapter-order', (_event: any, id: number, orderIndex: number) => {
  return updateChapterOrder(id, orderIndex)
})

ipcMain.handle('delete-chapter', (_event: any, id: number) => {
  deleteChapter(id)
  return { success: true }
})

// 设定相关IPC处理
ipcMain.handle('get-settings', (_event: any, bookId: number) => {
  return getSettingsByBookId(bookId)
})

ipcMain.handle('get-settings-by-type', (_event: any, bookId: number, type: string) => {
  return getSettingsByType(bookId, type)
})

ipcMain.handle('get-setting', (_event: any, id: number) => {
  return getSettingById(id)
})

ipcMain.handle('create-setting', (_event: any, data: { book_id: number; type: string; name: string; content?: string; status?: string; starred?: boolean }) => {
  return createSetting(data)
})

ipcMain.handle('update-setting', (_event: any, id: number, data: { type?: string; name?: string; content?: string; status?: string; starred?: boolean }) => {
  return updateSetting(id, data)
})

ipcMain.handle('delete-setting', (_event: any, id: number) => {
  deleteSetting(id)
  return { success: true }
})

ipcMain.handle('toggle-setting-star', (_event: any, id: number) => {
  return toggleSettingStar(id)
})

// 供应商相关IPC处理
ipcMain.handle('get-providers', () => {
  return getAllProviders()
})

ipcMain.handle('get-provider', (_event: any, id: number) => {
  return getProviderById(id)
})

ipcMain.handle('create-provider', (_event: any, data: { name: string; url: string; key: string }) => {
  return createProvider(data)
})

ipcMain.handle('update-provider', (_event: any, id: number, data: { name?: string; url?: string; key?: string }) => {
  return updateProvider(id, data)
})

ipcMain.handle('delete-provider', (_event: any, id: number) => {
  deleteProvider(id)
  return { success: true }
})

// 模型相关IPC处理
ipcMain.handle('get-models', (_event: any, providerId: number) => {
  return getModelsByProviderId(providerId)
})

ipcMain.handle('get-model', (_event: any, id: number) => {
  return getModelById(id)
})

ipcMain.handle('create-model', (_event: any, data: { provider_id: number; model: string; tags?: string }) => {
  return createModel(data)
})

ipcMain.handle('update-model', (_event: any, id: number, data: { provider_id?: number; model?: string; tags?: string }) => {
  return updateModel(id, data)
})

ipcMain.handle('delete-model', (_event: any, id: number) => {
  deleteModel(id)
  return { success: true }
})

// 重置数据 - 只删除数据库文件，保留软件本身数据
ipcMain.handle('reset-data', async () => {
  try {
    // 关闭数据库连接
    closeDatabase()
    
    // 获取数据库文件路径
    const dbPath = path.join(app.getPath('userData'), 'aiwriter.db')
    
    // 检查数据库文件是否存在
    if (fs.existsSync(dbPath)) {
      // 删除数据库文件
      fs.unlinkSync(dbPath)
      console.log('Database file deleted successfully:', dbPath)
    } else {
      console.log('Database file not found:', dbPath)
    }
    
    // 重新初始化数据库（这会重新创建空的数据库文件）
    initDatabase()
    
    console.log('Data reset completed successfully - only user data cleared')
    
    // 延迟重启，确保数据库操作完成
    setTimeout(() => {
      app.relaunch()
      app.quit()
    }, 1000)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to reset data:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

// 功能配置相关IPC处理
ipcMain.handle('get-feature-configs', () => {
  return getAllFeatureConfigs()
})

ipcMain.handle('update-feature-config', (_event: any, featureName: string, data: { provider_id?: number; model_id?: number; temperature?: number; top_p?: number }) => {
  return updateFeatureConfig(featureName, data)
})


// 应用退出时关闭数据库
app.on('before-quit', () => {
  closeDatabase()
})
