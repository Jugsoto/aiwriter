/**
 * 向量搜索服务
 * 提供统一的搜索接口，支持在书籍内搜索章节文本块和设定
 */

import type { FeatureConfig } from '@/electron.d'
import type { SimilarChunkResult } from './chapterMemory'
import type { SimilarSettingResult } from './settingMemory'
import { createChapterMemoryService } from './chapterMemory'
import { createSettingMemoryService } from './settingMemory'

export interface SearchOptions {
  chapterLimit?: number
  settingLimit?: number
  excludeChapterId?: number
  minSimilarity?: number
  includeChapters?: boolean
  includeSettings?: boolean
}

export interface SearchResult {
  type: 'chapter' | 'setting'
  id: number
  title: string
  content: string
  similarity: number
  metadata?: {
    chapterId?: number
    chapterTitle?: string
    chunkIndex?: number
    settingType?: string
    starred?: boolean
  }
}

export interface UnifiedSearchResult {
  query: string
  bookId: number
  results: SearchResult[]
  totalResults: number
  topResults: {
    chapters: SimilarChunkResult[]
    settings: SimilarSettingResult[]
  }
  executionTime: number
}

/**
 * 向量搜索服务类
 */
export class VectorSearchService {
  private chapterMemoryService: ReturnType<typeof createChapterMemoryService>
  private settingMemoryService: ReturnType<typeof createSettingMemoryService>

  constructor(featureConfig: FeatureConfig) {
    this.chapterMemoryService = createChapterMemoryService(featureConfig)
    this.settingMemoryService = createSettingMemoryService(featureConfig)
  }

  /**
   * 在书籍内统一搜索
   */
  async searchInBook(
    bookId: number,
    queryText: string,
    options: SearchOptions = {}
  ): Promise<UnifiedSearchResult> {
    const startTime = Date.now()

    const {
      chapterLimit = 5,
      settingLimit = 3,
      excludeChapterId,
      minSimilarity = 0.1,
      includeChapters = true,
      includeSettings = true
    } = options

    const results: SearchResult[] = []
    let topChapters: SimilarChunkResult[] = []
    let topSettings: SimilarSettingResult[] = []

    try {
      // 并行搜索章节和设定
      const [chapterResults, settingResults] = await Promise.allSettled([
        includeChapters
          ? this.chapterMemoryService.searchSimilarChunks(
              bookId,
              queryText,
              chapterLimit,
              excludeChapterId
            )
          : Promise.resolve([]),
        includeSettings
          ? this.settingMemoryService.searchSimilarSettings(
              bookId,
              queryText,
              settingLimit
            )
          : Promise.resolve([])
      ])

      // 处理章节搜索结果
      if (chapterResults.status === 'fulfilled') {
        topChapters = chapterResults.value
        topChapters.forEach(result => {
          if (result.similarity >= minSimilarity) {
            results.push({
              type: 'chapter',
              id: result.chunkId,
              title: `章节: ${result.chapterTitle}`,
              content: result.chunkText,
              similarity: result.similarity,
              metadata: {
                chapterId: result.chapterId,
                chapterTitle: result.chapterTitle,
                chunkIndex: result.chunkIndex
              }
            })
          }
        })
      } else {
        console.error('章节搜索失败:', chapterResults.reason)
      }

      // 处理设定搜索结果
      if (settingResults.status === 'fulfilled') {
        topSettings = settingResults.value
        topSettings.forEach(result => {
          if (result.similarity >= minSimilarity) {
            results.push({
              type: 'setting',
              id: result.settingId,
              title: `设定: ${result.settingName}`,
              content: result.settingContent,
              similarity: result.similarity,
              metadata: {
                settingType: result.settingType,
                starred: result.starred
              }
            })
          }
        })
      } else {
        console.error('设定搜索失败:', settingResults.reason)
      }

      // 按相似度排序
      results.sort((a, b) => b.similarity - a.similarity)

      const executionTime = Date.now() - startTime

      return {
        query: queryText,
        bookId,
        results,
        totalResults: results.length,
        topResults: {
          chapters: topChapters,
          settings: topSettings
        },
        executionTime
      }
    } catch (error) {
      console.error('搜索失败:', error)
      const executionTime = Date.now() - startTime

      return {
        query: queryText,
        bookId,
        results: [],
        totalResults: 0,
        topResults: {
          chapters: [],
          settings: []
        },
        executionTime
      }
    }
  }

}

/**
 * 创建向量搜索服务实例
 */
export function createVectorSearchService(featureConfig: FeatureConfig): VectorSearchService {
  return new VectorSearchService(featureConfig)
}

/**
 * 便捷函数：在书籍内搜索
 */
export async function searchInBook(
  bookId: number,
  queryText: string,
  featureConfig: FeatureConfig,
  options?: SearchOptions
): Promise<UnifiedSearchResult> {
  const service = createVectorSearchService(featureConfig)
  return service.searchInBook(bookId, queryText, options)
}
