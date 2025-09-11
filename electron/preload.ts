const { contextBridge, ipcRenderer } = require('electron')

const api = {
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // 书籍相关API
  getBooks: () => ipcRenderer.invoke('get-books'),
  createBook: (data: { name: string }) => ipcRenderer.invoke('create-book', data),
  updateBook: (id: number, data: { name: string }) => ipcRenderer.invoke('update-book', id, data),
  deleteBook: (id: number) => ipcRenderer.invoke('delete-book', id)
}

contextBridge.exposeInMainWorld('electronAPI', api)
