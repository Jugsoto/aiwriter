import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, getAllBooks, createBook, updateBook, deleteBook, closeDatabase } from './database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
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

  
  win.webContents.setWindowOpenHandler(({ url }) => {
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

ipcMain.handle('create-book', (event, data: { name: string }) => {
  return createBook(data)
})

ipcMain.handle('update-book', (event, id: number, data: { name: string }) => {
  return updateBook(id, data)
})

ipcMain.handle('delete-book', (event, id: number) => {
  deleteBook(id)
  return { success: true }
})

// 应用退出时关闭数据库
app.on('before-quit', () => {
  closeDatabase()
})
