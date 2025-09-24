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

  /**
   * 语义搜索（基于含义而非关键词）
   */
  async semanticSearch(
    bookId: number,
    queryText: string,
    options: SearchOptions = {}
  ): Promise<UnifiedSearchResult> {
    // 可以在这里添加语义搜索的特殊处理
    // 例如：查询扩展、同义词处理等
    return this.searchInBook(bookId, queryText, options)
  }

  /**
   * 混合搜索（结合语义和关键词）
   */
  async hybridSearch(
    bookId: number,
    queryText: string,
    options: SearchOptions = {}
  ): Promise<UnifiedSearchResult> {
    // 先进行向量搜索
    const vectorResults = await this.searchInBook(bookId, queryText, options)

    // 可以在这里添加关键词搜索的增强
    // 例如：结合文本匹配、模糊搜索等

    return vectorResults
  }

  /**
   * 获取书籍的搜索统计信息
   */
  async getSearchStats(bookId: number): Promise<{
    chapterStats: {
      totalChapters: number
      chaptersWithMemory: number
      totalChunks: number
      totalTokens: number
    }
    settingStats: {
      totalSettings: number
      settingsWithMemory: number
      totalTokens: number
      starredSettingsWithMemory: number
    }
    overallStats: {
      searchableItems: number
      totalTokens: number
      lastUpdated?: string
    }
  }> {
    try {
      const [chapterStats, settingStats] = await Promise.all([
        this.chapterMemoryService.getBookMemoryStats(bookId),
        this.settingMemoryService.getBookSettingMemoryStats(bookId)
      ])

      const searchableItems = chapterStats.chaptersWithMemory + settingStats.settingsWithMemory
      const totalTokens = chapterStats.totalTokens + settingStats.totalTokens

      return {
        chapterStats,
        settingStats,
        overallStats: {
          searchableItems,
          totalTokens,
          lastUpdated: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('获取搜索统计失败:', error)
      return {
        chapterStats: {
          totalChapters: 0,
          chaptersWithMemory: 0,
          totalChunks: 0,
          totalTokens: 0
        },
        settingStats: {
          totalSettings: 0,
          settingsWithMemory: 0,
          totalTokens: 0,
          starredSettingsWithMemory: 0
        },
        overallStats: {
          searchableItems: 0,
          totalTokens: 0
        }
      }
    }
  }

  /**
   * 搜索建议（自动完成）
   */
  async getSearchSuggestions(
    bookId: number,
    partialQuery: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      // 基于部分查询生成搜索建议
      // 这里可以基于已有的向量数据生成相关建议
      const results = await this.searchInBook(bookId, partialQuery, {
        chapterLimit: limit,
        settingLimit: limit,
        minSimilarity: 0.3
      })

      // 提取关键短语作为建议
      const suggestions = new Set<string>()

      results.results.slice(0, limit).forEach(result => {
        // 从标题和内容中提取关键词
        const titleWords = result.title.split(/\s+/).slice(0, 3)
        const contentWords = result.content.split(/\s+/).slice(0, 5)

        const allWords = [...titleWords, ...contentWords]
        allWords.forEach(word => {
          if (word.length > 1 && word.toLowerCase().includes(partialQuery.toLowerCase())) {
            suggestions.add(word)
          }
        })
      })

      return Array.from(suggestions).slice(0, limit)
    } catch (error) {
      console.error('获取搜索建议失败:', error)
      return []
    }
  }

  /**
   * 相关内容推荐
   */
  async getRelatedContent(
    bookId: number,
    referenceText: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const results = await this.searchInBook(bookId, referenceText, {
        ...options,
        minSimilarity: 0.2, // 降低阈值以获取更多相关内容
        chapterLimit: 10,
        settingLimit: 5
      })

      return results.results
    } catch (error) {
      console.error('获取相关内容失败:', error)
      return []
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

/**
 * 便捷函数：语义搜索
 */
export async function semanticSearch(
  bookId: number,
  queryText: string,
  featureConfig: FeatureConfig,
  options?: SearchOptions
): Promise<UnifiedSearchResult> {
  const service = createVectorSearchService(featureConfig)
  return service.semanticSearch(bookId, queryText, options)
}

/**
 * 便捷函数：获取相关内容
 */
export async function getRelatedContent(
  bookId: number,
  referenceText: string,
  featureConfig: FeatureConfig,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const service = createVectorSearchService(featureConfig)
  return service.getRelatedContent(bookId, referenceText, options)
}