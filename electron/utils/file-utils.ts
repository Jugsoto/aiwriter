/**
 * 文件操作工具
 */

import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export class FileUtils {
  /**
   * 递归计算文件夹大小
   */
  static getFolderSize(folderPath: string): number {
    let totalSize = 0
    try {
      const files = fs.readdirSync(folderPath)
      for (const file of files) {
        const filePath = path.join(folderPath, file)
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
          totalSize += this.getFolderSize(filePath)
        } else {
          totalSize += stats.size
        }
      }
    } catch (error) {
      console.error('Failed to calculate folder size:', error)
    }
    return totalSize
  }

  /**
   * 获取文件大小
   */
  static getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath)
      return stats.size
    } catch (error) {
      console.error('Failed to get file size:', error)
      return 0
    }
  }

  /**
   * 检查文件是否存在
   */
  static fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath)
    } catch (error) {
      return false
    }
  }

  /**
   * 检查路径是否为目录
   */
  static isDirectory(filePath: string): boolean {
    try {
      const stats = fs.statSync(filePath)
      return stats.isDirectory()
    } catch (error) {
      return false
    }
  }

  /**
   * 检查路径是否为文件
   */
  static isFile(filePath: string): boolean {
    try {
      const stats = fs.statSync(filePath)
      return stats.isFile()
    } catch (error) {
      return false
    }
  }

  /**
   * 创建目录（如果不存在）
   */
  static ensureDirectoryExists(dirPath: string): void {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
    } catch (error) {
      console.error('Failed to create directory:', error)
      throw error
    }
  }

  /**
   * 读取文件内容
   */
  static readFile(filePath: string, encoding: BufferEncoding = 'utf8'): string {
    try {
      return fs.readFileSync(filePath, encoding)
    } catch (error) {
      console.error('Failed to read file:', error)
      throw error
    }
  }

  /**
   * 写入文件内容
   */
  static writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): void {
    try {
      // 确保目录存在
      this.ensureDirectoryExists(path.dirname(filePath))
      fs.writeFileSync(filePath, content, encoding)
    } catch (error) {
      console.error('Failed to write file:', error)
      throw error
    }
  }

  /**
   * 追加文件内容
   */
  static appendFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): void {
    try {
      // 确保目录存在
      this.ensureDirectoryExists(path.dirname(filePath))
      fs.appendFileSync(filePath, content, encoding)
    } catch (error) {
      console.error('Failed to append file:', error)
      throw error
    }
  }

  /**
   * 删除文件或目录
   */
  static deletePath(targetPath: string): void {
    try {
      if (fs.existsSync(targetPath)) {
        if (fs.statSync(targetPath).isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true })
        } else {
          fs.unlinkSync(targetPath)
        }
      }
    } catch (error) {
      console.error('Failed to delete path:', error)
      throw error
    }
  }

  /**
   * 复制文件
   */
  static copyFile(sourcePath: string, targetPath: string): void {
    try {
      // 确保目标目录存在
      this.ensureDirectoryExists(path.dirname(targetPath))
      fs.copyFileSync(sourcePath, targetPath)
    } catch (error) {
      console.error('Failed to copy file:', error)
      throw error
    }
  }

  /**
   * 移动文件
   */
  static moveFile(sourcePath: string, targetPath: string): void {
    try {
      // 确保目标目录存在
      this.ensureDirectoryExists(path.dirname(targetPath))
      fs.renameSync(sourcePath, targetPath)
    } catch (error) {
      console.error('Failed to move file:', error)
      throw error
    }
  }

  /**
   * 获取用户数据目录
   */
  static getUserDataPath(): string {
    return app.getPath('userData')
  }

  /**
   * 获取应用版本
   */
  static getAppVersion(): string {
    return app.getVersion()
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 获取文件扩展名
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase()
  }

  /**
   * 获取文件名（不含扩展名）
   */
  static getFileName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath))
  }

  /**
   * 获取文件名（含扩展名）
   */
  static getFileNameWithExtension(filePath: string): string {
    return path.basename(filePath)
  }

  /**
   * 获取目录路径
   */
  static getDirectoryPath(filePath: string): string {
    return path.dirname(filePath)
  }

  /**
   * 获取相对路径
   */
  static getRelativePath(fromPath: string, toPath: string): string {
    return path.relative(fromPath, toPath)
  }

  /**
   * 获取绝对路径
   */
  static getAbsolutePath(filePath: string): string {
    return path.resolve(filePath)
  }

  /**
   * 连接路径
   */
  static joinPath(...paths: string[]): string {
    return path.join(...paths)
  }

  /**
   * 生成唯一文件名
   */
  static generateUniqueFileName(dirPath: string, fileName: string): string {
    const ext = this.getFileExtension(fileName)
    const name = this.getFileName(fileName)
    let counter = 1
    let uniqueFileName = fileName

    while (fs.existsSync(path.join(dirPath, uniqueFileName))) {
      uniqueFileName = `${name}_${counter}${ext ? '.' + ext : ''}`
      counter++
    }

    return uniqueFileName
  }

  /**
   * 检查文件是否可读
   */
  static isReadable(filePath: string): boolean {
    try {
      fs.accessSync(filePath, fs.constants.R_OK)
      return true
    } catch {
      return false
    }
  }

  /**
   * 检查文件是否可写
   */
  static isWritable(filePath: string): boolean {
    try {
      fs.accessSync(filePath, fs.constants.W_OK)
      return true
    } catch {
      return false
    }
  }
}

export default FileUtils