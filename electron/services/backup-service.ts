import { closeDatabase, getDbPath, resetDatabaseConnection } from '../database/connection'
import { dialog, app } from 'electron'
import JSZip from 'jszip'
import fs from 'fs'
import { getAllBooks } from '../database/models/book'
import { getChaptersByBookId } from '../database/models/chapter'
import { getSettingsByBookId } from '../database/models/setting'
import { getAllProviders } from '../database/models/provider'
import { getAllPrompts } from '../database/models/prompt'
import { getAllUsageStatistics } from '../database/models/usage'

export class BackupService {
  // 数据备份功能 - 创建ZIP压缩包
  static async backupData(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      // 获取数据库文件路径
      const dbPath = getDbPath()

      // 检查数据库文件是否存在
      if (!fs.existsSync(dbPath)) {
        return { success: false, error: '数据库文件不存在' }
      }

      // 显示保存对话框，让用户选择备份位置
      const result = await dialog.showSaveDialog({
        title: '备份数据',
        defaultPath: `aiwriter_backup_${new Date().toISOString().slice(0, 10)}.zip`,
        filters: [
          { name: 'ZIP Files', extensions: ['zip'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled) {
        return { success: false, error: '用户取消了备份操作' }
      }

      // 创建 ZIP 文件
      const zip = new JSZip()

      // 添加数据库文件到 ZIP
      const dbData = fs.readFileSync(dbPath)
      zip.file('aiwriter.db', dbData)

      // 添加应用配置信息
      const appInfo = {
        version: app.getVersion(),
        platform: process.platform,
        backupDate: new Date().toISOString(),
        userDataPath: app.getPath('userData')
      }
      zip.file('app_info.json', JSON.stringify(appInfo, null, 2))

      // 生成 ZIP 内容
      const zipContent = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })

      // 保存 ZIP 文件
      fs.writeFileSync(result.filePath!, zipContent)

      console.log('数据备份成功:', result.filePath)
      return { success: true, backupPath: result.filePath }
    } catch (error) {
      console.error('数据备份失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '备份数据时发生未知错误' }
    }
  }

  // 数据恢复功能 - 从ZIP包恢复
  static async restoreData(): Promise<{ success: boolean; error?: string }> {
    try {
      // 显示打开对话框，让用户选择备份文件
      const result = await dialog.showOpenDialog({
        title: '恢复数据',
        filters: [
          { name: 'ZIP Files', extensions: ['zip'] },
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

      // 读取并验证 ZIP 文件
      let zip: JSZip
      try {
        const zipData = fs.readFileSync(backupPath)
        zip = await JSZip.loadAsync(zipData)
      } catch {
        return { success: false, error: '无效的备份文件格式，请选择有效的ZIP备份包' }
      }

      // 检查ZIP文件中是否包含数据库文件
      const dbFile = zip.file('aiwriter.db')

      if (!dbFile) {
        return { success: false, error: '备份文件中缺少数据库文件' }
      }

      // 关闭数据库连接
      closeDatabase()

      // 获取当前数据库文件路径
      const dbPath = getDbPath()

      // 创建当前数据库的备份（以防恢复失败）
      const tempBackupPath = `${dbPath}.backup_${Date.now()}`
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tempBackupPath)
      }

      try {
        // 从ZIP中提取数据库文件
        const dbContent = await dbFile.async('nodebuffer')
        fs.writeFileSync(dbPath, dbContent)

        // 重新初始化数据库连接
        resetDatabaseConnection()

        console.log('数据恢复成功')
        return { success: true }
      } catch (error) {
        // 如果恢复失败，尝试恢复原数据库
        if (fs.existsSync(tempBackupPath)) {
          fs.copyFileSync(tempBackupPath, dbPath)
          resetDatabaseConnection()
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
  }

  // 重置数据 - 删除数据库文件和本地存储数据，保留软件本身数据
  static async resetData(): Promise<{ success: boolean; error?: string }> {
    try {

      // 关闭数据库连接
      closeDatabase()

      // 获取数据库文件路径
      const dbPath = getDbPath()

      // 检查数据库文件是否存在
      if (fs.existsSync(dbPath)) {
        // 删除数据库文件
        fs.unlinkSync(dbPath)
        console.log('Database file deleted successfully:', dbPath)
      } else {
        console.log('Database file not found:', dbPath)
      }

      console.log('Data reset completed successfully. Application will quit.')

      // 退出应用程序
      app.quit()

      // 应用程序即将退出，此返回值可能不会被前端接收
      return { success: true }
    } catch (error) {
      console.error('Failed to reset data:', error)
      // 如果重置失败，尝试重新连接数据库以保持应用可用
      resetDatabaseConnection()
      return { success: false, error: error instanceof Error ? error.message : '重置数据时发生未知错误' }
    }
  }

  // 验证备份文件
  static async validateBackupFile(backupPath: string): Promise<{ valid: boolean; error?: string; info?: any }> {
    try {
      if (!fs.existsSync(backupPath)) {
        return { valid: false, error: '备份文件不存在' }
      }

      // 读取 ZIP 文件
      const zipData = fs.readFileSync(backupPath)
      const zip = await JSZip.loadAsync(zipData)

      // 检查必要文件
      const dbFile = zip.file('aiwriter.db')
      if (!dbFile) {
        return { valid: false, error: '备份文件中缺少数据库文件' }
      }

      const appInfoFile = zip.file('app_info.json')
      let appInfo = null

      if (appInfoFile) {
        try {
          const appInfoContent = await appInfoFile.async('string')
          appInfo = JSON.parse(appInfoContent)
        } catch {
          // 如果无法解析app_info.json，继续但不返回错误
        }
      }

      return {
        valid: true,
        info: {
          backupDate: appInfo?.backupDate || '未知',
          version: appInfo?.version || '未知',
          platform: appInfo?.platform || '未知'
        }
      }
    } catch (error) {
      console.error('Failed to validate backup file:', error)
      return { valid: false, error: `无效的备份文件格式: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  }

  // 获取数据统计信息
  static async getDataStatistics(): Promise<{
    booksCount: number
    chaptersCount: number
    settingsCount: number
    providersCount: number
    promptsCount: number
    usageCount: number
    dbSize: number
  }> {
    try {
      const books = getAllBooks()
      const providers = getAllProviders()
      const prompts = getAllPrompts()
      const usageStatistics = getAllUsageStatistics()

      let chaptersCount = 0
      let settingsCount = 0

      books.forEach(book => {
        chaptersCount += getChaptersByBookId(book.id).length
        settingsCount += getSettingsByBookId(book.id).length
      })

      // 获取数据库文件大小
      const dbPath = getDbPath()
      let dbSize = 0
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath)
        dbSize = stats.size
      }

      return {
        booksCount: books.length,
        chaptersCount,
        settingsCount,
        providersCount: providers.length,
        promptsCount: prompts.length,
        usageCount: usageStatistics.length,
        dbSize
      }
    } catch (error) {
      console.error('Failed to get data statistics:', error)
      // 返回默认值
      return {
        booksCount: 0,
        chaptersCount: 0,
        settingsCount: 0,
        providersCount: 0,
        promptsCount: 0,
        usageCount: 0,
        dbSize: 0
      }
    }
  }
}