import { ipcMain, app, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { BackupService } from '../services/backup-service'
import { VectorService } from '../services/vector-service'
import { updateService } from '../services/update-service'

export function registerSystemHandlers(): void {
  console.log('Registering system handlers...')

  // 获取应用版本
  ipcMain.handle('get-app-version', () => {
    try {
      return app.getVersion()
    } catch (error) {
      console.error('Error in get-app-version handler:', error)
      throw error
    }
  })

  // 获取应用更新状态
  ipcMain.handle('app-update:get-state', () => {
    try {
      return updateService.getState()
    } catch (error) {
      console.error('Error in app-update:get-state handler:', error)
      throw error
    }
  })

  // 手动检查更新
  ipcMain.handle('app-update:check', async () => {
    try {
      return await updateService.checkForUpdates(true)
    } catch (error) {
      console.error('Error in app-update:check handler:', error)
      throw error
    }
  })

  // 下载更新
  ipcMain.handle('app-update:download', async () => {
    try {
      return await updateService.downloadUpdate()
    } catch (error) {
      console.error('Error in app-update:download handler:', error)
      throw error
    }
  })

  // 安装更新
  ipcMain.handle('app-update:install', () => {
    try {
      return updateService.installUpdate()
    } catch (error) {
      console.error('Error in app-update:install handler:', error)
      throw error
    }
  })

  // 打开外部链接
  ipcMain.handle('open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url)
    } catch (error) {
      console.error('Error in open-external handler:', error)
      throw error
    }
  })

  // 获取应用数据目录路径
  ipcMain.handle('get-app-data-path', () => {
    try {
      return app.getPath('userData')
    } catch (error) {
      console.error('Error in get-app-data-path handler:', error)
      throw error
    }
  })

  // 打开文件夹
  ipcMain.handle('open-folder', async (_event, folderPath: string) => {
    try {
      await shell.openPath(folderPath)
      return { success: true }
    } catch (error) {
      console.error('Error in open-folder handler:', error)
      throw error
    }
  })

  // 获取文件大小
  ipcMain.handle('get-file-size', async (_event, filePath: string) => {
    try {
      const stats = fs.statSync(filePath)
      return { size: stats.size, success: true }
    } catch (error) {
      console.error('Failed to get file size:', error)
      return { size: 0, success: false }
    }
  })

  // 获取文件夹大小
  ipcMain.handle('get-folder-size', async (_event, folderPath: string) => {
    try {
      const size = getFolderSize(folderPath)
      return { size, success: true }
    } catch (error) {
      console.error('Failed to get folder size:', error)
      return { size: 0, success: false }
    }
  })

  // 数据备份
  ipcMain.handle('backup-data', async () => {
    try {
      return await BackupService.backupData()
    } catch (error) {
      console.error('Error in backup-data handler:', error)
      throw error
    }
  })

  // 数据恢复
  ipcMain.handle('restore-data', async () => {
    try {
      return await BackupService.restoreData()
    } catch (error) {
      console.error('Error in restore-data handler:', error)
      throw error
    }
  })

  // 重置数据
  ipcMain.handle('reset-data', async () => {
    try {
      return await BackupService.resetData()
    } catch (error) {
      console.error('Error in reset-data handler:', error)
      throw error
    }
  })

  // 向量相关处理器
  ipcMain.handle('create-chapter-vector', async (_event, data: {
    book_id: number;
    chapter_id: number;
    chunk_index: number;
    chunk_text: string;
    embedding: Buffer;
    token_count: number
  }) => {
    try {
      return await VectorService.createChapterVector(data)
    } catch (error) {
      console.error('Error in create-chapter-vector handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-chapter-vectors-by-book-id', async (_event, bookId: number) => {
    try {
      return await VectorService.getChapterVectorsByBookId(bookId)
    } catch (error) {
      console.error('Error in get-chapter-vectors-by-book-id handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-chapter-vectors-by-chapter-id', async (_event, chapterId: number) => {
    try {
      return await VectorService.getChapterVectorsByChapterId(chapterId)
    } catch (error) {
      console.error('Error in get-chapter-vectors-by-chapter-id handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-chapter-vectors-by-chapter-id', async (_event, chapterId: number) => {
    try {
      await VectorService.deleteChapterVectorsByChapterId(chapterId)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-chapter-vectors-by-chapter-id handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-chapter-vectors-by-book-id', async (_event, bookId: number) => {
    try {
      await VectorService.deleteChapterVectorsByBookId(bookId)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-chapter-vectors-by-book-id handler:', error)
      throw error
    }
  })

  ipcMain.handle('search-similar-chapter-vectors', async (_event, bookId: number, queryEmbedding: Buffer, limit: number, excludeChapterId?: number) => {
    try {
      return await VectorService.searchSimilarChapterVectors(bookId, queryEmbedding, limit, excludeChapterId)
    } catch (error) {
      console.error('Error in search-similar-chapter-vectors handler:', error)
      throw error
    }
  })

  ipcMain.handle('create-setting-vector', async (_event, data: {
    book_id: number;
    setting_id: number;
    setting_content: string;
    embedding: Buffer;
    token_count: number
  }) => {
    try {
      return await VectorService.createSettingVector(data)
    } catch (error) {
      console.error('Error in create-setting-vector handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-setting-vector-by-setting-id', async (_event, settingId: number) => {
    try {
      return await VectorService.getSettingVectorBySettingId(settingId)
    } catch (error) {
      console.error('Error in get-setting-vector-by-setting-id handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-setting-vectors-by-book-id', async (_event, bookId: number) => {
    try {
      return await VectorService.getSettingVectorsByBookId(bookId)
    } catch (error) {
      console.error('Error in get-setting-vectors-by-book-id handler:', error)
      throw error
    }
  })

  ipcMain.handle('update-setting-vector', async (_event, settingId: number, data: {
    setting_content?: string;
    embedding?: Buffer;
    token_count?: number
  }) => {
    try {
      return await VectorService.updateSettingVector(settingId, data)
    } catch (error) {
      console.error('Error in update-setting-vector handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-setting-vector-by-setting-id', async (_event, settingId: number) => {
    try {
      await VectorService.deleteSettingVectorBySettingId(settingId)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-setting-vector-by-setting-id handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-setting-vectors-by-book-id', async (_event, bookId: number) => {
    try {
      await VectorService.deleteSettingVectorsByBookId(bookId)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-setting-vectors-by-book-id handler:', error)
      throw error
    }
  })

  ipcMain.handle('search-similar-setting-vectors', async (_event, bookId: number, queryEmbedding: Buffer, limit: number) => {
    try {
      return await VectorService.searchSimilarSettingVectors(bookId, queryEmbedding, limit)
    } catch (error) {
      console.error('Error in search-similar-setting-vectors handler:', error)
      throw error
    }
  })

  console.log('System handlers registered')
}

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
