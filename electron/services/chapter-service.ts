import {
  Chapter,
  CreateChapterData,
  UpdateChapterData,
  getChaptersByBookId,
  getChapterById,
  createChapter,
  updateChapter,
  updateChapterOrder,
  deleteChapter
} from '../database/models/chapter'
import { getBookById } from '../database/models/book'
import { ChapterVector, createChapterVector, deleteChapterVectorsByChapterId } from '../database/models/vector'

export class ChapterService {
  // 根据书籍ID获取所有章节
  static async getChaptersByBookId(bookId: number): Promise<Chapter[]> {
    try {
      // 验证书籍是否存在
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      return getChaptersByBookId(bookId)
    } catch (error) {
      console.error(`Failed to get chapters for book ${bookId}:`, error)
      throw new Error(`获取章节列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 根据ID获取章节
  static async getChapterById(id: number): Promise<Chapter | null> {
    try {
      const chapter = getChapterById(id)
      if (!chapter) {
        return null
      }
      return chapter
    } catch (error) {
      console.error(`Failed to get chapter ${id}:`, error)
      throw new Error(`获取章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 创建新章节
  static async createChapter(data: CreateChapterData): Promise<Chapter> {
    try {
      // 验证书籍是否存在
      const book = getBookById(data.book_id)
      if (!book) {
        throw new Error(`书籍ID ${data.book_id} 不存在`)
      }

      if (!data.title || data.title.trim() === '') {
        throw new Error('章节标题不能为空')
      }

      return createChapter({
        book_id: data.book_id,
        title: data.title.trim(),
        content: data.content || '',
        summary: data.summary || '',
        review_data: data.review_data || '',
        order_index: data.order_index
      })
    } catch (error) {
      console.error('Failed to create chapter:', error)
      throw new Error(`创建章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 更新章节
  static async updateChapter(id: number, data: UpdateChapterData): Promise<Chapter> {
    try {
      const existingChapter = getChapterById(id)
      if (!existingChapter) {
        throw new Error(`章节ID ${id} 不存在`)
      }

      const updateData: UpdateChapterData = {}
      if (data.title !== undefined) {
        if (!data.title || data.title.trim() === '') {
          throw new Error('章节标题不能为空')
        }
        updateData.title = data.title.trim()
      }
      if (data.content !== undefined) {
        updateData.content = data.content
      }
      if (data.summary !== undefined) {
        updateData.summary = data.summary
      }
      if (data.review_data !== undefined) {
        updateData.review_data = data.review_data
      }
      if (data.order_index !== undefined) {
        updateData.order_index = data.order_index
      }

      return updateChapter(id, updateData)
    } catch (error) {
      console.error(`Failed to update chapter ${id}:`, error)
      throw new Error(`更新章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 更新章节排序
  static async updateChapterOrder(id: number, orderIndex: number): Promise<Chapter> {
    try {
      const existingChapter = getChapterById(id)
      if (!existingChapter) {
        throw new Error(`章节ID ${id} 不存在`)
      }

      if (orderIndex < 0) {
        throw new Error('排序索引不能为负数')
      }

      return updateChapterOrder(id, orderIndex)
    } catch (error) {
      console.error(`Failed to update chapter order ${id}:`, error)
      throw new Error(`更新章节排序失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除章节
  static async deleteChapter(id: number): Promise<void> {
    try {
      const existingChapter = getChapterById(id)
      if (!existingChapter) {
        throw new Error(`章节ID ${id} 不存在`)
      }

      // 删除章节相关的向量数据
      deleteChapterVectorsByChapterId(id)

      deleteChapter(id)
    } catch (error) {
      console.error(`Failed to delete chapter ${id}:`, error)
      throw new Error(`删除章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 批量更新章节排序
  static async batchUpdateChapterOrder(updates: Array<{ id: number; orderIndex: number }>): Promise<Chapter[]> {
    try {
      const results: Chapter[] = []

      for (const update of updates) {
        const chapter = await this.updateChapterOrder(update.id, update.orderIndex)
        results.push(chapter)
      }

      return results
    } catch (error) {
      console.error('Failed to batch update chapter order:', error)
      throw new Error(`批量更新章节排序失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 创建章节向量
  static async createChapterVectors(data: Array<{
    book_id: number
    chapter_id: number
    chunk_index: number
    chunk_text: string
    embedding: Buffer
    token_count?: number
  }>): Promise<ChapterVector[]> {
    try {
      const vectors: ChapterVector[] = []

      for (const vectorData of data) {
        // 验证书籍和章节是否存在
        const book = getBookById(vectorData.book_id)
        if (!book) {
          throw new Error(`书籍ID ${vectorData.book_id} 不存在`)
        }

        const chapter = getChapterById(vectorData.chapter_id)
        if (!chapter) {
          throw new Error(`章节ID ${vectorData.chapter_id} 不存在`)
        }

        const vector = createChapterVector(vectorData)
        vectors.push(vector)
      }

      return vectors
    } catch (error) {
      console.error('Failed to create chapter vectors:', error)
      throw new Error(`创建章节向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 获取章节内容统计
  static async getChapterContentStats(id: number): Promise<{
    wordCount: number
    charCount: number
    lineCount: number
  }> {
    try {
      const chapter = getChapterById(id)
      if (!chapter) {
        throw new Error(`章节ID ${id} 不存在`)
      }

      const content = chapter.content || ''

      // 计算字数（中英文）
      const wordCount = content.length
      const charCount = content.replace(/\s/g, '').length
      const lineCount = content.split('\n').length

      return {
        wordCount,
        charCount,
        lineCount
      }
    } catch (error) {
      console.error(`Failed to get chapter content stats ${id}:`, error)
      throw new Error(`获取章节内容统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 复制章节
  static async duplicateChapter(id: number, newTitle?: string): Promise<Chapter> {
    try {
      const originalChapter = getChapterById(id)
      if (!originalChapter) {
        throw new Error(`章节ID ${id} 不存在`)
      }

      const title = newTitle || `${originalChapter.title} - 副本`

      // 获取该章节的下一个排序位置
      const chapters = getChaptersByBookId(originalChapter.book_id)
      const maxOrder = Math.max(...chapters.map(ch => ch.order_index), 0)

      return createChapter({
        book_id: originalChapter.book_id,
        title,
        content: originalChapter.content,
        summary: originalChapter.summary,
        review_data: originalChapter.review_data,
        order_index: maxOrder + 1
      })
    } catch (error) {
      console.error(`Failed to duplicate chapter ${id}:`, error)
      throw new Error(`复制章节失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}