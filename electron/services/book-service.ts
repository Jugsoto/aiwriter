import {
  Book,
  CreateBookData,
  UpdateBookData,
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} from '../database/models/book'
import { Chapter, createChapter, getChaptersByBookId } from '../database/models/chapter'
import { getSettingsByBookId } from '../database/models/setting'
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'
import { dialog } from 'electron'

export class BookService {
  // 获取所有书籍
  static async getAllBooks(): Promise<Book[]> {
    try {
      return getAllBooks()
    } catch (error) {
      console.error('Failed to get all books:', error)
      throw new Error(`获取书籍列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 根据ID获取书籍
  static async getBookById(id: number): Promise<Book | null> {
    try {
      const book = getBookById(id)
      if (!book) {
        throw new Error(`书籍ID ${id} 不存在`)
      }
      return book
    } catch (error) {
      console.error(`Failed to get book ${id}:`, error)
      throw new Error(`获取书籍失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 创建书籍
  static async createBook(data: CreateBookData): Promise<Book> {
    try {
      if (!data.name || data.name.trim() === '') {
        throw new Error('书籍名称不能为空')
      }

      return createBook({
        name: data.name.trim()
      })
    } catch (error) {
      console.error('Failed to create book:', error)
      throw new Error(`创建书籍失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 更新书籍
  static async updateBook(id: number, data: UpdateBookData): Promise<Book> {
    try {
      const existingBook = getBookById(id)
      if (!existingBook) {
        throw new Error(`书籍ID ${id} 不存在`)
      }

      const updateData: UpdateBookData = {}
      if (data.name !== undefined) {
        if (!data.name || data.name.trim() === '') {
          throw new Error('书籍名称不能为空')
        }
        updateData.name = data.name.trim()
      }
      if (data.global_settings !== undefined) {
        updateData.global_settings = data.global_settings
      }

      return updateBook(id, updateData)
    } catch (error) {
      console.error(`Failed to update book ${id}:`, error)
      throw new Error(`更新书籍失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除书籍
  static async deleteBook(id: number): Promise<void> {
    try {
      const existingBook = getBookById(id)
      if (!existingBook) {
        throw new Error(`书籍ID ${id} 不存在`)
      }

      deleteBook(id)
    } catch (error) {
      console.error(`Failed to delete book ${id}:`, error)
      throw new Error(`删除书籍失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 导出书籍
  static async exportBook(bookId: number): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // 获取书籍信息
      const book = getBookById(bookId)
      if (!book) {
        return { success: false, error: '书籍不存在' }
      }

      // 获取书籍的所有章节
      const chapters = await this.getBookChapters(bookId)

      // 创建 ZIP 文件
      const zip = new JSZip()

      // 添加章节文件到 ZIP
      chapters.forEach((chapter, index) => {
        // 文件名格式：数字_章节名.txt
        const fileName = `${index + 1}_${chapter.title}.txt`
        // 只保存章节内容，不需要其他数据
        zip.file(fileName, chapter.content)
      })

      // 生成 ZIP 内容
      const zipContent = await zip.generateAsync({ type: 'nodebuffer' })

      // 显示保存对话框
      const result = await dialog.showSaveDialog({
        title: '导出书籍',
        defaultPath: `${book.name}.zip`,
        filters: [
          { name: 'ZIP Files', extensions: ['zip'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled) {
        return { success: false, error: '用户取消了导出操作' }
      }

      // 保存 ZIP 文件
      fs.writeFileSync(result.filePath!, zipContent)

      console.log('书籍导出成功:', result.filePath)
      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('书籍导出失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '导出书籍时发生未知错误' }
    }
  }

  // 导入书籍
  static async importBook(): Promise<{ success: boolean; bookId?: number; error?: string }> {
    try {
      // 显示打开对话框，让用户选择 ZIP 文件
      const result = await dialog.showOpenDialog({
        title: '导入书籍',
        filters: [
          { name: 'ZIP Files', extensions: ['zip'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      })

      if (result.canceled) {
        return { success: false, error: '用户取消了导入操作' }
      }

      const zipPath = result.filePaths[0]

      // 读取 ZIP 文件
      const zipData = fs.readFileSync(zipPath)
      const zip = await JSZip.loadAsync(zipData)

      // 从文件名中提取书籍名（去掉 .zip 后缀）
      const fileName = path.basename(zipPath, '.zip')

      // 创建新书籍
      const newBook = await this.createBook({ name: fileName })

      // 处理 ZIP 文件中的章节
      const chapterPromises: Promise<void>[] = []
      let chapterIndex = 0

      zip.forEach((relativePath: string, file: JSZip.JSZipObject) => {
        if (!file.dir && relativePath.endsWith('.txt')) {
          chapterPromises.push(
            (async () => {
              try {
                // 获取文件内容
                const content = await file.async('string')

                // 从文件名中提取章节名（去掉数字前缀和下划线）
                const fileName = path.basename(relativePath, '.txt')
                const title = fileName.replace(/^\d+_/, '')

                // 这里需要导入chapter service来创建章节
                // 为了避免循环依赖，我们直接调用数据库函数
                // 为了避免循环依赖，我们直接调用数据库函数
                await createChapter({
                  book_id: newBook.id,
                  title: title,
                  content: content,
                  order_index: chapterIndex
                })

                chapterIndex++
              } catch (error) {
                console.error(`处理章节文件 ${relativePath} 失败:`, error)
              }
            })()
          )
        }
      })

      // 等待所有章节处理完成
      await Promise.all(chapterPromises)

      console.log('书籍导入成功，书籍ID:', newBook.id)
      return { success: true, bookId: newBook.id }
    } catch (error) {
      console.error('书籍导入失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '导入书籍时发生未知错误' }
    }
  }

  // 获取书籍的章节（内部方法，避免循环依赖）
  private static async getBookChapters(bookId: number): Promise<Chapter[]> {
    return getChaptersByBookId(bookId)
  }

  // 获取书籍的统计信息
  static async getBookStatistics(bookId: number): Promise<{
    chapterCount: number
    settingCount: number
    totalWords: number
  }> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      // 获取章节数量
      const chapters = await this.getBookChapters(bookId)
      const chapterCount = chapters.length

      // 获取设定数量
      // 获取设定数量
      const settings = getSettingsByBookId(bookId)
      const settingCount = settings.length

      // 计算总字数
      const totalWords = chapters.reduce((total, chapter) => {
        return total + (chapter.content ? chapter.content.length : 0)
      }, 0)

      return {
        chapterCount,
        settingCount,
        totalWords
      }
    } catch (error) {
      console.error(`Failed to get book statistics ${bookId}:`, error)
      throw new Error(`获取书籍统计信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}