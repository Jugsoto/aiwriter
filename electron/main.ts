import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
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
  updateFeatureConfig,
  createUsageStatistic,
  getAllUsageStatistics,
  getUsageStatisticsByDateRange,
  getUsageStatisticsByProvider,
  getUsageStatisticsByModel,
  getUsageStatisticsSummary,
  // 章节向量相关
  createChapterVector,
  getChapterVectorsByBookId,
  getChapterVectorsByChapterId,
  deleteChapterVectorsByChapterId,
  deleteChapterVectorsByBookId,
  searchSimilarChapterVectors,
  // 设定向量相关
  createSettingVector,
  getSettingVectorBySettingId,
  getSettingVectorsByBookId,
  updateSettingVector,
  deleteSettingVectorBySettingId,
  deleteSettingVectorsByBookId,
  searchSimilarSettingVectors,
  // 提示词相关
  getAllPrompts,
  getPromptsByCategory,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  getPromptSelectionByCategory,
  getAllPromptSelections,
  setPromptSelection,
  deletePromptSelection,
  getDefaultPromptByCategory,
  getSelectedPromptByCategory,
  setDefaultPromptForCategory
} from './database'
import { initializeDefaultProviders } from './initializer'
import { initializeDefaultPrompts } from './promptInitializer'

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
    win.webContents.openDevTools({mode:'detach'})
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
    
    // 初始化默认提示词
    console.log('Initializing default prompts...')
    const promptInitSuccess = await initializeDefaultPrompts()
    
    if (promptInitSuccess) {
      console.log('Default prompts initialization completed')
    } else {
      console.log('Default prompts initialization skipped or failed')
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

// 打开外部链接
ipcMain.handle('open-external', (_event: any, url: string) => {
  shell.openExternal(url)
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

// 重置数据 - 删除数据库文件和本地存储数据，保留软件本身数据
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
    
    // 清除浏览器本地存储数据
    if (win && win.webContents) {
      try {
        // 清除 localStorage
        await win.webContents.executeJavaScript(`
          // 清除所有本地存储数据
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('copilot-conversations-') || key.startsWith('copilot-settings-')) {
              localStorage.removeItem(key);
            }
          });
          console.log('Local storage data cleared successfully');
        `)
        console.log('Browser local storage cleared successfully')
      } catch (storageError) {
        console.error('Failed to clear browser local storage:', storageError)
        // 不中断重置过程，继续执行
      }
    }
    
    // 重新初始化数据库（这会重新创建空的数据库文件）
    initDatabase()
    
    console.log('Data reset completed successfully - user data and local storage cleared')
    
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

// 数据备份功能
ipcMain.handle('backup-data', async () => {
  try {
    // 获取数据库文件路径
    const dbPath = path.join(app.getPath('userData'), 'aiwriter.db')
    
    // 检查数据库文件是否存在
    if (!fs.existsSync(dbPath)) {
      return { success: false, error: '数据库文件不存在' }
    }
    
    // 显示保存对话框，让用户选择备份位置
    const result = await dialog.showSaveDialog({
      title: '备份数据',
      defaultPath: `aiwriter_backup_${new Date().toISOString().slice(0, 10)}.db`,
      filters: [
        { name: 'Database Files', extensions: ['db'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    if (result.canceled) {
      return { success: false, error: '用户取消了备份操作' }
    }
    
    // 复制数据库文件到备份位置
    fs.copyFileSync(dbPath, result.filePath!)
    
    console.log('数据备份成功:', result.filePath)
    return { success: true, backupPath: result.filePath }
  } catch (error) {
    console.error('数据备份失败:', error)
    return { success: false, error: error instanceof Error ? error.message : '备份数据时发生未知错误' }
  }
})

// 数据恢复功能
ipcMain.handle('restore-data', async () => {
  try {
    // 显示打开对话框，让用户选择备份文件
    const result = await dialog.showOpenDialog({
      title: '恢复数据',
      filters: [
        { name: 'Database Files', extensions: ['db'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    
    if (result.canceled) {
      return { success: false, error: '用户取消了恢复操作' }
    }
    
    const backupPath = result.filePaths[0]
    
    // 验证备份文件是否存在
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: '备份文件不存在' }
    }
    
    // 关闭数据库连接
    closeDatabase()
    
    // 获取当前数据库文件路径
    const dbPath = path.join(app.getPath('userData'), 'aiwriter.db')
    
    // 创建当前数据库的备份（以防恢复失败）
    const tempBackupPath = `${dbPath}.backup_${Date.now()}`
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, tempBackupPath)
    }
    
    try {
      // 复制备份文件到数据库位置
      fs.copyFileSync(backupPath, dbPath)
      
      // 重新初始化数据库连接
      initDatabase()
      
      console.log('数据恢复成功')
      return { success: true }
    } catch (error) {
      // 如果恢复失败，尝试恢复原数据库
      if (fs.existsSync(tempBackupPath)) {
        fs.copyFileSync(tempBackupPath, dbPath)
      }
      throw error
    } finally {
      // 清理临时备份文件
      if (fs.existsSync(tempBackupPath)) {
        fs.unlinkSync(tempBackupPath)
      }
    }
  } catch (error) {
    console.error('数据恢复失败:', error)
    return { success: false, error: error instanceof Error ? error.message : '恢复数据时发生未知错误' }
  }
})

// 功能配置相关IPC处理
ipcMain.handle('get-feature-configs', () => {
  return getAllFeatureConfigs()
})

ipcMain.handle('update-feature-config', (_event: any, featureName: string, data: { provider_id?: number; model_id?: number; temperature?: number; top_p?: number }) => {
  return updateFeatureConfig(featureName, data)
})

// 用量统计相关IPC处理
ipcMain.handle('create-usage-statistic', (_event: any, data: { provider_id: number; model_id: number; feature_name: string; mode: string; input_tokens?: number; output_tokens?: number; total_tokens?: number }) => {
  return createUsageStatistic(data)
})

ipcMain.handle('get-usage-statistics', () => {
  return getAllUsageStatistics()
})

ipcMain.handle('get-usage-statistics-by-date-range', (_event: any, startDate: string, endDate: string) => {
  return getUsageStatisticsByDateRange(startDate, endDate)
})

ipcMain.handle('get-usage-statistics-by-provider', (_event: any, providerId: number) => {
  return getUsageStatisticsByProvider(providerId)
})

ipcMain.handle('get-usage-statistics-by-model', (_event: any, modelId: number) => {
  return getUsageStatisticsByModel(modelId)
})

ipcMain.handle('get-usage-statistics-summary', () => {
  return getUsageStatisticsSummary()
})

// 章节向量相关IPC处理
ipcMain.handle('create-chapter-vector', (_event: any, data: { book_id: number; chapter_id: number; chunk_index: number; chunk_text: string; embedding: Buffer; token_count: number }) => {
  return createChapterVector(data)
})

ipcMain.handle('get-chapter-vectors-by-book-id', (_event: any, bookId: number) => {
  return getChapterVectorsByBookId(bookId)
})

ipcMain.handle('get-chapter-vectors-by-chapter-id', (_event: any, chapterId: number) => {
  return getChapterVectorsByChapterId(chapterId)
})

ipcMain.handle('delete-chapter-vectors-by-chapter-id', (_event: any, chapterId: number) => {
  deleteChapterVectorsByChapterId(chapterId)
  return { success: true }
})

ipcMain.handle('delete-chapter-vectors-by-book-id', (_event: any, bookId: number) => {
  deleteChapterVectorsByBookId(bookId)
  return { success: true }
})

ipcMain.handle('search-similar-chapter-vectors', (_event: any, bookId: number, queryEmbedding: Buffer, limit: number, excludeChapterId?: number) => {
  return searchSimilarChapterVectors(bookId, queryEmbedding, limit, excludeChapterId)
})

// 设定向量相关IPC处理
ipcMain.handle('create-setting-vector', (_event: any, data: { book_id: number; setting_id: number; setting_content: string; embedding: Buffer; token_count: number }) => {
  return createSettingVector(data)
})

ipcMain.handle('get-setting-vector-by-setting-id', (_event: any, settingId: number) => {
  return getSettingVectorBySettingId(settingId)
})

ipcMain.handle('get-setting-vectors-by-book-id', (_event: any, bookId: number) => {
  return getSettingVectorsByBookId(bookId)
})

ipcMain.handle('update-setting-vector', (_event: any, settingId: number, data: { setting_content?: string; embedding?: Buffer; token_count?: number }) => {
  return updateSettingVector(settingId, data)
})

ipcMain.handle('delete-setting-vector-by-setting-id', (_event: any, settingId: number) => {
  deleteSettingVectorBySettingId(settingId)
  return { success: true }
})

ipcMain.handle('delete-setting-vectors-by-book-id', (_event: any, bookId: number) => {
  deleteSettingVectorsByBookId(bookId)
  return { success: true }
})

ipcMain.handle('search-similar-setting-vectors', (_event: any, bookId: number, queryEmbedding: Buffer, limit: number) => {
  return searchSimilarSettingVectors(bookId, queryEmbedding, limit)
})

// 提示词相关IPC处理
ipcMain.handle('get-prompts', () => {
  return getAllPrompts()
})

ipcMain.handle('get-prompts-by-category', (_event: any, category: string) => {
  return getPromptsByCategory(category)
})

ipcMain.handle('get-prompt', (_event: any, id: number) => {
  return getPromptById(id)
})

ipcMain.handle('create-prompt', (_event: any, data: { name: string; content: string; category: string; is_default?: number; description?: string; author?: string; version?: string; url?: string }) => {
  return createPrompt(data)
})

ipcMain.handle('update-prompt', (_event: any, id: number, data: { name?: string; content?: string; category?: string; is_default?: number; description?: string; author?: string; version?: string; url?: string }) => {
  return updatePrompt(id, data)
})

ipcMain.handle('delete-prompt', (_event: any, id: number) => {
  deletePrompt(id)
  return { success: true }
})

ipcMain.handle('get-prompt-selection', (_event: any, category: string) => {
  return getPromptSelectionByCategory(category)
})

ipcMain.handle('get-all-prompt-selections', () => {
  return getAllPromptSelections()
})

ipcMain.handle('set-prompt-selection', (_event: any, data: { category: string; prompt_id: number }) => {
  return setPromptSelection(data)
})

ipcMain.handle('delete-prompt-selection', (_event: any, category: string) => {
  deletePromptSelection(category)
  return { success: true }
})

ipcMain.handle('get-default-prompt-by-category', (_event: any, category: string) => {
  return getDefaultPromptByCategory(category)
})

ipcMain.handle('get-selected-prompt-by-category', (_event: any, category: string) => {
  return getSelectedPromptByCategory(category)
})

ipcMain.handle('set-default-prompt-for-category', (_event: any, category: string, promptId: number) => {
  setDefaultPromptForCategory(category, promptId)
  return { success: true }
})

// 应用退出时关闭数据库
app.on('before-quit', () => {
  closeDatabase()
})
