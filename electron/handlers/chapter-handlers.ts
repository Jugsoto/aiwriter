import { ipcMain } from 'electron'
import { ChapterService } from '../services/chapter-service'

/**
 * 注册章节相关的IPC处理器
 */
export function registerChapterHandlers(): void {
  console.log('Registering chapter handlers...')

  // 获取章节列表
  ipcMain.handle('get-chapters', async (_event, bookId: number) => {
    try {
      return await ChapterService.getChaptersByBookId(bookId)
    } catch (error) {
      console.error('Error in get-chapters handler:', error)
      throw error
    }
  })

  // 获取单个章节
  ipcMain.handle('get-chapter', async (_event, id: number) => {
    try {
      return await ChapterService.getChapterById(id)
    } catch (error) {
      console.error('Error in get-chapter handler:', error)
      throw error
    }
  })

  // 创建章节
  ipcMain.handle('create-chapter', async (_event, data: {
    book_id: number;
    title: string;
    content?: string;
    summary?: string;
    order_index?: number
  }) => {
    try {
      return await ChapterService.createChapter(data)
    } catch (error) {
      console.error('Error in create-chapter handler:', error)
      throw error
    }
  })

  // 更新章节
  ipcMain.handle('update-chapter', async (_event, id: number, data: {
    title?: string;
    content?: string;
    summary?: string;
    review_data?: string;
    order_index?: number
  }) => {
    try {
      return await ChapterService.updateChapter(id, data)
    } catch (error) {
      console.error('Error in update-chapter handler:', error)
      throw error
    }
  })

  // 更新章节排序
  ipcMain.handle('update-chapter-order', async (_event, id: number, orderIndex: number) => {
    try {
      return await ChapterService.updateChapterOrder(id, orderIndex)
    } catch (error) {
      console.error('Error in update-chapter-order handler:', error)
      throw error
    }
  })

  // 删除章节
  ipcMain.handle('delete-chapter', async (_event, id: number) => {
    try {
      await ChapterService.deleteChapter(id)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-chapter handler:', error)
      throw error
    }
  })

  console.log('Chapter handlers registered')
}