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
  deleteChapter
} from './database'

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

app.whenReady().then(() => {
  initDatabase()
  createWindow()
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

// 应用退出时关闭数据库
app.on('before-quit', () => {
  closeDatabase()
})
