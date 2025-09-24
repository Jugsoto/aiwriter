/**
 * 章节记忆服务
 * 负责章节的文本分块、嵌入生成和向量存储
 */

import type { Chapter } from '@/electron.d'
import type { FeatureConfig } from '@/electron.d'
import { createTextChunks } from './textChunk'
import { generateBatchEmbeddings, generateEmbedding } from './embedding'

export interface ChapterMemoryUpdateOptions {
  chunkSize?: number
  overlap?: number
  onProgress?: (progress: number, total: number) => void
  onError?: (error: Error) => void
}

export interface ChapterMemoryResult {
  chapterId: number
  bookId: number
  chunkCount: number
  totalTokens: number
  success: boolean
  error?: string
}

export interface SimilarChunkResult {
  chunkId: number
  chapterId: number
  chapterTitle: string
  chunkText: string
  similarity: number
  chunkIndex: number
}

/**
 * 章节记忆服务类
 */
export class ChapterMemoryService {
  private featureConfig: FeatureConfig

  constructor(featureConfig: FeatureConfig) {
    this.featureConfig = featureConfig
  }

  /**
   * 更新章节记忆
   */
  async updateChapterMemory(
    chapter: Chapter,
    options: ChapterMemoryUpdateOptions = {}
  ): Promise<ChapterMemoryResult> {
    try {
      if (!chapter.content || chapter.content.trim().length === 0) {
        return {
          chapterId: chapter.id,
          bookId: chapter.book_id,
          chunkCount: 0,
          totalTokens: 0,
          success: false,
          error: '章节内容为空'
        }
      }

      // 1. 删除该章节的旧向量数据
      await this.deleteChapterVectors(chapter.id)

      // 2. 文本分块
      const chunks = createTextChunks(chapter.content, {
        chunkSize: options.chunkSize || 300,
        overlap: options.overlap || 50
      })

      if (chunks.length === 0) {
        return {
          chapterId: chapter.id,
          bookId: chapter.book_id,
          chunkCount: 0,
          totalTokens: 0,
          success: false,
          error: '文本分块失败'
        }
      }

      // 3. 生成嵌入向量
      const chunkTexts = chunks.map(chunk => chunk.text)
      options.onProgress?.(1, chunks.length + 1) // 分块完成

      const embeddings = await generateBatchEmbeddings(chunkTexts, this.featureConfig)
      options.onProgress?.(chunks.length, chunks.length + 1) // 嵌入生成完成

      // 4. 存储向量数据
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = embeddings[i]

        await this.storeChapterVector({
          bookId: chapter.book_id,
          chapterId: chapter.id,
          chunkIndex: chunk.index,
          chunkText: chunk.text,
          embedding: embedding.embedding,
          tokenCount: chunk.tokenCount
        })

        options.onProgress?.(i + 1, chunks.length)
      }

      const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0)

      return {
        chapterId: chapter.id,
        bookId: chapter.book_id,
        chunkCount: chunks.length,
        totalTokens,
        success: true
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      options.onError?.(new Error(errorMessage))

      return {
        chapterId: chapter.id,
        bookId: chapter.book_id,
        chunkCount: 0,
        totalTokens: 0,
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * 批量更新多个章节的记忆
   */
  async updateBatchChapterMemory(
    chapters: Chapter[],
    options: ChapterMemoryUpdateOptions = {}
  ): Promise<ChapterMemoryResult[]> {
    const results: ChapterMemoryResult[] = []

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i]
      const result = await this.updateChapterMemory(chapter, {
        ...options,
        onProgress: (progress, total) => {
          options.onProgress?.(i + progress / total, chapters.length)
        }
      })

      results.push(result)

      // 如果某个章节更新失败，继续处理其他章节
      if (!result.success) {
        console.error(`章节 ${chapter.id} 记忆更新失败:`, result.error)
      }
    }

    return results
  }

  /**
   * 在书籍内搜索相似的文本块
   */
  async searchSimilarChunks(
    bookId: number,
    queryText: string,
    limit: number = 5,
    excludeChapterId?: number
  ): Promise<SimilarChunkResult[]> {
    try {
      // 1. 为查询文本生成嵌入
      const queryEmbedding = await generateEmbedding(queryText, this.featureConfig)

      // 2. 在数据库中搜索相似的向量
      const similarVectors = await this.searchSimilarVectors(
        bookId,
        queryEmbedding.embedding,
        limit,
        excludeChapterId
      )

      // 3. 格式化结果
      const results: SimilarChunkResult[] = []

      for (const vector of similarVectors) {
        // 获取章节信息
        const chapter = await this.getChapterById(vector.chapter_id)
        if (!chapter) continue

        results.push({
          chunkId: vector.id,
          chapterId: vector.chapter_id,
          chapterTitle: chapter.title,
          chunkText: vector.chunk_text,
          similarity: 1 - (vector.distance || 1), // 转换距离为相似度
          chunkIndex: vector.chunk_index
        })
      }

      // 按相似度排序
      return results.sort((a, b) => b.similarity - a.similarity)
    } catch (error) {
      console.error('搜索相似文本块失败:', error)
      return []
    }
  }

  /**
   * 获取书籍的记忆统计信息
   */
  async getBookMemoryStats(bookId: number): Promise<{
    totalChapters: number
    totalChunks: number
    totalTokens: number
    avgChunkSize: number
    chaptersWithMemory: number
  }> {
    try {
      const vectors = await this.getChapterVectorsByBookId(bookId)

      const totalChunks = vectors.length
      const totalTokens = vectors.reduce((sum, v) => sum + v.token_count, 0)
      const chapterIds = [...new Set(vectors.map(v => v.chapter_id))]
      const chaptersWithMemory = chapterIds.length

      // 获取书籍总章节数
      const chapters = await this.getChaptersByBookId(bookId)
      const totalChapters = chapters.length

      const avgChunkSize = totalChunks > 0 ? totalTokens / totalChunks : 0

      return {
        totalChapters,
        totalChunks,
        totalTokens,
        avgChunkSize,
        chaptersWithMemory
      }
    } catch (error) {
      console.error('获取书籍记忆统计失败:', error)
      return {
        totalChapters: 0,
        totalChunks: 0,
        totalTokens: 0,
        avgChunkSize: 0,
        chaptersWithMemory: 0
      }
    }
  }

  /**
   * 删除章节的所有向量数据
   */
  private async deleteChapterVectors(chapterId: number): Promise<void> {
    try {
      console.log('删除章节向量:', chapterId)
      const result = await window.electronAPI.deleteChapterVectorsByChapterId(chapterId)
      if (!result.success) {
        throw new Error('删除章节向量失败')
      }
    } catch (error) {
      console.error('删除章节向量失败:', error)
      throw error
    }
  }

  /**
   * 存储章节向量
   */
  private async storeChapterVector(data: {
    bookId: number
    chapterId: number
    chunkIndex: number
    chunkText: string
    embedding: number[]
    tokenCount: number
  }): Promise<void> {
    try {
      // 转换为 Uint8Array，根据 API 定义
      const embeddingArray = new Uint8Array(
        new Float32Array(data.embedding).buffer
      )
      
      console.log('存储章节向量:', {
        ...data,
        embedding: `Uint8Array(${embeddingArray.length} bytes)`
      })
      
      await window.electronAPI.createChapterVector({
        book_id: data.bookId,
        chapter_id: data.chapterId,
        chunk_index: data.chunkIndex,
        chunk_text: data.chunkText,
        embedding: embeddingArray, // 使用 Uint8Array
        token_count: data.tokenCount
      })
    } catch (error) {
      console.error('存储章节向量失败:', error)
      throw error
    }
  }

  /**
   * 搜索相似向量
   */
  private async searchSimilarVectors(
    bookId: number,
    queryEmbedding: number[],
    limit: number,
    excludeChapterId?: number
  ): Promise<any[]> {
    try {
      // 转换为 Uint8Array，统一使用 Uint8Array
      const embeddingArray = new Uint8Array(
        new Float32Array(queryEmbedding).buffer
      )

      console.log('搜索相似向量:', {
        bookId,
        limit,
        excludeChapterId,
        embeddingLength: queryEmbedding.length
      })
      
      return await window.electronAPI.searchSimilarChapterVectors(
        bookId,
        embeddingArray, // 使用 Uint8Array
        limit,
        excludeChapterId
      )
    } catch (error) {
      console.error('搜索相似向量失败:', error)
      return []
    }
  }

  /**
   * 获取章节信息
   */
  private async getChapterById(chapterId: number): Promise<Chapter | null> {
    try {
      const chapter = await window.electronAPI.getChapter(chapterId)
      return chapter || null
    } catch (error) {
      console.error('获取章节信息失败:', error)
      return null
    }
  }

  /**
   * 获取书籍的所有章节
   */
  private async getChaptersByBookId(bookId: number): Promise<Chapter[]> {
    try {
      return await window.electronAPI.getChapters(bookId)
    } catch (error) {
      console.error('获取书籍章节失败:', error)
      return []
    }
  }

  /**
   * 获取书籍的所有向量
   */
  private async getChapterVectorsByBookId(bookId: number): Promise<any[]> {
    try {
      console.log('获取书籍向量:', bookId)
      return await window.electronAPI.getChapterVectorsByBookId(bookId)
    } catch (error) {
      console.error('获取书籍向量失败:', error)
      return []
    }
  }
}

/**
 * 创建章节记忆服务实例
 */
export function createChapterMemoryService(featureConfig: FeatureConfig): ChapterMemoryService {
  return new ChapterMemoryService(featureConfig)
}

/**
 * 便捷函数：更新单个章节记忆
 */
export async function updateChapterMemory(
  chapter: Chapter,
  featureConfig: FeatureConfig,
  options?: ChapterMemoryUpdateOptions
): Promise<ChapterMemoryResult> {
  const service = createChapterMemoryService(featureConfig)
  return service.updateChapterMemory(chapter, options)
}

/**
 * 便捷函数：搜索相似文本块
 */
export async function searchSimilarChunks(
  bookId: number,
  queryText: string,
  featureConfig: FeatureConfig,
  limit?: number,
  excludeChapterId?: number
): Promise<SimilarChunkResult[]> {
  const service = createChapterMemoryService(featureConfig)
  return service.searchSimilarChunks(bookId, queryText, limit, excludeChapterId)
}