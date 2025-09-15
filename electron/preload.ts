const { contextBridge, ipcRenderer } = require('electron')

const api = {
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // 书籍相关API
  getBooks: () => ipcRenderer.invoke('get-books'),
  createBook: (data: { name: string }) => ipcRenderer.invoke('create-book', data),
  updateBook: (id: number, data: { name?: string; global_settings?: string }) => ipcRenderer.invoke('update-book', id, data),
  deleteBook: (id: number) => ipcRenderer.invoke('delete-book', id),
  
  // 章节相关API
  getChapters: (bookId: number) => ipcRenderer.invoke('get-chapters', bookId),
  getChapter: (id: number) => ipcRenderer.invoke('get-chapter', id),
  createChapter: (data: { book_id: number; title: string; content?: string; summary?: string; order_index?: number }) => ipcRenderer.invoke('create-chapter', data),
  updateChapter: (id: number, data: { title?: string; content?: string; summary?: string; order_index?: number }) => ipcRenderer.invoke('update-chapter', id, data),
  updateChapterOrder: (id: number, orderIndex: number) => ipcRenderer.invoke('update-chapter-order', id, orderIndex),
  deleteChapter: (id: number) => ipcRenderer.invoke('delete-chapter', id),
  
  // 设定相关API
  getSettings: (bookId: number) => ipcRenderer.invoke('get-settings', bookId),
  getSettingsByType: (bookId: number, type: string) => ipcRenderer.invoke('get-settings-by-type', bookId, type),
  getSetting: (id: number) => ipcRenderer.invoke('get-setting', id),
  createSetting: (data: { book_id: number; type: string; name: string; content?: string; status?: string; starred?: boolean }) => ipcRenderer.invoke('create-setting', data),
  updateSetting: (id: number, data: { type?: string; name?: string; content?: string; status?: string; starred?: boolean }) => ipcRenderer.invoke('update-setting', id, data),
  deleteSetting: (id: number) => ipcRenderer.invoke('delete-setting', id),
  toggleSettingStar: (id: number) => ipcRenderer.invoke('toggle-setting-star', id),
  
  // 数据设置相关API
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),
  getFileSize: (filePath: string) => ipcRenderer.invoke('get-file-size', filePath),
  getFolderSize: (folderPath: string) => ipcRenderer.invoke('get-folder-size', folderPath),
  resetData: () => ipcRenderer.invoke('reset-data')
}

contextBridge.exposeInMainWorld('electronAPI', api)
