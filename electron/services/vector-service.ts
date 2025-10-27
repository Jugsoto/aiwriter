import {
  ChapterVector,
  CreateChapterVectorData,
  UpdateChapterVectorData,
  getChapterVectorsByChapterId,
  getChapterVectorsByBookId,
  createChapterVector,
  getChapterVectorById,
  updateChapterVector,
  deleteChapterVectorsByChapterId,
  deleteChapterVectorsByBookId,
  searchSimilarChapterVectors,
  SettingVector,
  CreateSettingVectorData,
  UpdateSettingVectorData,
  getSettingVectorBySettingId,
  getSettingVectorsByBookId,
  createSettingVector,
  getSettingVectorById,
  updateSettingVector,
  deleteSettingVectorBySettingId,
  deleteSettingVectorsByBookId,
  searchSimilarSettingVectors
} from '../database/models/vector'
import { getBookById } from '../database/models/book'
import { getChapterById } from '../database/models/chapter'
import { getSettingById } from '../database/models/setting'

export class VectorService {
  // === 章节向量相关操作 ===

  // 根据章节ID获取所有向量
  static async getChapterVectorsByChapterId(chapterId: number): Promise<ChapterVector[]> {
    try {
      const chapter = getChapterById(chapterId)
      if (!chapter) {
        throw new Error(`章节ID ${chapterId} 不存在`)
      }

      return getChapterVectorsByChapterId(chapterId)
    } catch (error) {
      console.error(`Failed to get chapter vectors ${chapterId}:`, error)
      throw new Error(`获取章节向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 根据书籍ID获取所有向量
  static async getChapterVectorsByBookId(bookId: number): Promise<ChapterVector[]> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      return getChapterVectorsByBookId(bookId)
    } catch (error) {
      console.error(`Failed to get chapter vectors by book ${bookId}:`, error)
      throw new Error(`获取书籍章节向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 创建章节向量
  static async createChapterVector(data: CreateChapterVectorData): Promise<ChapterVector> {
    try {
      // 验证书籍和章节是否存在
      const book = getBookById(data.book_id)
      if (!book) {
        throw new Error(`书籍ID ${data.book_id} 不存在`)
      }

      const chapter = getChapterById(data.chapter_id)
      if (!chapter) {
        throw new Error(`章节ID ${data.chapter_id} 不存在`)
      }

      if (data.chunk_index < 0) {
        throw new Error('向量索引不能为负数')
      }

      if (!data.chunk_text || data.chunk_text.trim() === '') {
        throw new Error('向量文本不能为空')
      }

      if (!data.embedding || data.embedding.length === 0) {
        throw new Error('向量数据不能为空')
      }

      return createChapterVector(data)
    } catch (error) {
      console.error('Failed to create chapter vector:', error)
      throw new Error(`创建章节向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 批量创建章节向量
  static async batchCreateChapterVectors(dataList: CreateChapterVectorData[]): Promise<ChapterVector[]> {
    try {
      const results: ChapterVector[] = []

      for (const data of dataList) {
        const vector = await this.createChapterVector(data)
        results.push(vector)
      }

      return results
    } catch (error) {
      console.error('Failed to batch create chapter vectors:', error)
      throw new Error(`批量创建章节向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 更新章节向量
  static async updateChapterVector(id: number, data: UpdateChapterVectorData): Promise<ChapterVector> {
    try {
      const existingVector = getChapterVectorById(id)
      if (!existingVector) {
        throw new Error(`章节向量ID ${id} 不存在`)
      }

      const updateData: UpdateChapterVectorData = {}

      if (data.chunk_text !== undefined) {
        if (!data.chunk_text || data.chunk_text.trim() === '') {
          throw new Error('向量文本不能为空')
        }
        updateData.chunk_text = data.chunk_text
      }

      if (data.embedding !== undefined) {
        if (!data.embedding || data.embedding.length === 0) {
          throw new Error('向量数据不能为空')
        }
        updateData.embedding = data.embedding
      }

      if (data.token_count !== undefined) {
        if (data.token_count < 0) {
          throw new Error('令牌数量不能为负数')
        }
        updateData.token_count = data.token_count
      }

      return updateChapterVector(id, updateData)
    } catch (error) {
      console.error(`Failed to update chapter vector ${id}:`, error)
      throw new Error(`更新章节向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除章节的所有向量
  static async deleteChapterVectorsByChapterId(chapterId: number): Promise<void> {
    try {
      const chapter = getChapterById(chapterId)
      if (!chapter) {
        throw new Error(`章节ID ${chapterId} 不存在`)
      }

      deleteChapterVectorsByChapterId(chapterId)
    } catch (error) {
      console.error(`Failed to delete chapter vectors ${chapterId}:`, error)
      throw new Error(`删除章节向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除书籍的所有章节向量
  static async deleteChapterVectorsByBookId(bookId: number): Promise<void> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      deleteChapterVectorsByBookId(bookId)
    } catch (error) {
      console.error(`Failed to delete chapter vectors by book ${bookId}:`, error)
      throw new Error(`删除书籍章节向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // === 设定向量相关操作 ===

  // 根据设定ID获取向量
  static async getSettingVectorBySettingId(settingId: number): Promise<SettingVector | null> {
    try {
      const setting = getSettingById(settingId)
      if (!setting) {
        throw new Error(`设定ID ${settingId} 不存在`)
      }

      const vector = getSettingVectorBySettingId(settingId)
      return vector || null
    } catch (error) {
      console.error(`Failed to get setting vector ${settingId}:`, error)
      throw new Error(`获取设定向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 根据书籍ID获取所有设定向量
  static async getSettingVectorsByBookId(bookId: number): Promise<SettingVector[]> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      return getSettingVectorsByBookId(bookId)
    } catch (error) {
      console.error(`Failed to get setting vectors by book ${bookId}:`, error)
      throw new Error(`获取书籍设定向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 创建设定向量
  static async createSettingVector(data: CreateSettingVectorData): Promise<SettingVector> {
    try {
      // 验证书籍和设定是否存在
      const book = getBookById(data.book_id)
      if (!book) {
        throw new Error(`书籍ID ${data.book_id} 不存在`)
      }

      const setting = getSettingById(data.setting_id)
      if (!setting) {
        throw new Error(`设定ID ${data.setting_id} 不存在`)
      }

      if (!data.setting_content || data.setting_content.trim() === '') {
        throw new Error('设定内容不能为空')
      }

      if (!data.embedding || data.embedding.length === 0) {
        throw new Error('向量数据不能为空')
      }

      return createSettingVector(data)
    } catch (error) {
      console.error('Failed to create setting vector:', error)
      throw new Error(`创建设定向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 更新设定向量
  static async updateSettingVector(id: number, data: UpdateSettingVectorData): Promise<SettingVector> {
    try {
      const existingVector = getSettingVectorById(id)
      if (!existingVector) {
        throw new Error(`设定向量ID ${id} 不存在`)
      }

      const updateData: UpdateSettingVectorData = {}

      if (data.setting_content !== undefined) {
        if (!data.setting_content || data.setting_content.trim() === '') {
          throw new Error('设定内容不能为空')
        }
        updateData.setting_content = data.setting_content
      }

      if (data.embedding !== undefined) {
        if (!data.embedding || data.embedding.length === 0) {
          throw new Error('向量数据不能为空')
        }
        updateData.embedding = data.embedding
      }

      if (data.token_count !== undefined) {
        if (data.token_count < 0) {
          throw new Error('令牌数量不能为负数')
        }
        updateData.token_count = data.token_count
      }

      return updateSettingVector(id, updateData)
    } catch (error) {
      console.error(`Failed to update setting vector ${id}:`, error)
      throw new Error(`更新设定向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除设定向量
  static async deleteSettingVectorBySettingId(settingId: number): Promise<void> {
    try {
      const setting = getSettingById(settingId)
      if (!setting) {
        throw new Error(`设定ID ${settingId} 不存在`)
      }

      deleteSettingVectorBySettingId(settingId)
    } catch (error) {
      console.error(`Failed to delete setting vector ${settingId}:`, error)
      throw new Error(`删除设定向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除书籍的所有设定向量
  static async deleteSettingVectorsByBookId(bookId: number): Promise<void> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      deleteSettingVectorsByBookId(bookId)
    } catch (error) {
      console.error(`Failed to delete setting vectors by book ${bookId}:`, error)
      throw new Error(`删除书籍设定向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // === 向量搜索相关操作 ===

  // 在书籍内搜索相似的文本块
  static async searchSimilarChapterVectors(
    bookId: number,
    queryEmbedding: Buffer,
    limit: number = 5,
    excludeChapterId?: number
  ): Promise<ChapterVector[]> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      if (limit <= 0) {
        throw new Error('搜索结果数量必须大于0')
      }

      return searchSimilarChapterVectors(bookId, queryEmbedding, limit, excludeChapterId)
    } catch (error) {
      console.error(`Failed to search similar chapter vectors in book ${bookId}:`, error)
      throw new Error(`搜索相似章节向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 在书籍内搜索相似的设定
  static async searchSimilarSettingVectors(
    bookId: number,
    queryEmbedding: Buffer,
    limit: number = 3
  ): Promise<SettingVector[]> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      if (limit <= 0) {
        throw new Error('搜索结果数量必须大于0')
      }

      return searchSimilarSettingVectors(bookId, queryEmbedding, limit)
    } catch (error) {
      console.error(`Failed to search similar setting vectors in book ${bookId}:`, error)
      throw new Error(`搜索相似设定向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // === 向量管理相关操作 ===

  // 获取书籍的向量统计信息
  static async getBookVectorStatistics(bookId: number): Promise<{
    chapterVectorsCount: number
    settingVectorsCount: number
    totalTokens: number
  }> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      const chapterVectors = getChapterVectorsByBookId(bookId)
      const settingVectors = getSettingVectorsByBookId(bookId)

      const chapterTokens = chapterVectors.reduce((total, vector) => total + vector.token_count, 0)
      const settingTokens = settingVectors.reduce((total, vector) => total + vector.token_count, 0)

      return {
        chapterVectorsCount: chapterVectors.length,
        settingVectorsCount: settingVectors.length,
        totalTokens: chapterTokens + settingTokens
      }
    } catch (error) {
      console.error(`Failed to get book vector statistics ${bookId}:`, error)
      throw new Error(`获取书籍向量统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 清理书籍的向量数据
  static async clearBookVectors(bookId: number): Promise<void> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }

      await this.deleteChapterVectorsByBookId(bookId)
      await this.deleteSettingVectorsByBookId(bookId)
    } catch (error) {
      console.error(`Failed to clear book vectors ${bookId}:`, error)
      throw new Error(`清理书籍向量数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}