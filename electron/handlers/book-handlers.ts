import { ipcMain } from 'electron'
import { BookService } from '../services/book-service'

/**
 * 注册书籍相关的IPC处理器
 */
export function registerBookHandlers(): void {
  console.log('Registering book handlers...')

  // 获取所有书籍
  ipcMain.handle('get-books', async () => {
    try {
      return await BookService.getAllBooks()
    } catch (error) {
      console.error('Error in get-books handler:', error)
      throw error
    }
  })

  // 创建书籍
  ipcMain.handle('create-book', async (_event, data: { name: string }) => {
    try {
      return await BookService.createBook(data)
    } catch (error) {
      console.error('Error in create-book handler:', error)
      throw error
    }
  })

  // 更新书籍
  ipcMain.handle('update-book', async (_event, id: number, data: { name?: string; global_settings?: string }) => {
    try {
      return await BookService.updateBook(id, data)
    } catch (error) {
      console.error('Error in update-book handler:', error)
      throw error
    }
  })

  // 删除书籍
  ipcMain.handle('delete-book', async (_event, id: number) => {
    try {
      await BookService.deleteBook(id)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-book handler:', error)
      throw error
    }
  })

  // 导出书籍
  ipcMain.handle('export-book', async (_event, bookId: number) => {
    try {
      return await BookService.exportBook(bookId)
    } catch (error) {
      console.error('Error in export-book handler:', error)
      throw error
    }
  })

  // 导入书籍
  ipcMain.handle('import-book', async () => {
    try {
      return await BookService.importBook()
    } catch (error) {
      console.error('Error in import-book handler:', error)
      throw error
    }
  })

  console.log('Book handlers registered')
}