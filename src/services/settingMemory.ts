/**
 * 设定记忆服务
 * 负责设定（角色、世界观等）的嵌入生成和向量存储
 */

import type { Setting } from '@/electron.d'
import type { FeatureConfig } from '@/electron.d'
import { generateEmbedding } from './embedding'

export interface SettingMemoryUpdateOptions {
  onProgress?: (progress: number, total: number) => void
  onError?: (error: Error) => void
}

export interface SettingMemoryResult {
  settingId: number
  bookId: number
  tokenCount: number
  success: boolean
  error?: string
}

export interface SimilarSettingResult {
  settingId: number
  settingName: string
  settingType: string
  settingContent: string
  similarity: number
  starred: boolean
}

/**
 * 设定记忆服务类
 */
export class SettingMemoryService {
  private featureConfig: FeatureConfig

  constructor(featureConfig: FeatureConfig) {
    this.featureConfig = featureConfig
  }

  /**
   * 构建设定文本内容（用于向量化）
   * 将设定的名称、内容和状态拼接成一个完整的文本
   */
  private buildSettingText(setting: Setting): string {
    const parts: string[] = []

    // 添加设定名称（必须有）
    if (setting.name?.trim()) {
      parts.push(`设定名称：${setting.name.trim()}`)
    } else {
      return '' // 没有名称，返回空
    }

    // 添加设定内容
    if (setting.content?.trim()) {
      parts.push(`设定内容：${setting.content.trim()}`)
    }

    // 添加设定状态
    if (setting.status?.trim()) {
      parts.push(`当前状态：${setting.status.trim()}`)
    }

    return parts.join('\n\n')
  }

  /**
   * 更新设定记忆
   */
  async updateSettingMemory(
    setting: Setting,
    options: SettingMemoryUpdateOptions = {}
  ): Promise<SettingMemoryResult> {
    try {
      console.log('开始更新设定记忆:', {
        settingId: setting.id,
        bookId: setting.book_id,
        contentLength: setting.content?.length || 0
      })

      // 构建设定文本（包含名称、内容、状态）
      const settingText = this.buildSettingText(setting)
      
      if (!settingText || settingText.trim().length === 0) {
        console.warn('设定文本为空，跳过向量更新')
        return {
          settingId: setting.id,
          bookId: setting.book_id,
          tokenCount: 0,
          success: false,
          error: '设定文本为空'
        }
      }

      console.log('构建的设定文本:', {
        settingId: setting.id,
        textLength: settingText.length,
        hasName: !!setting.name?.trim(),
        hasContent: !!setting.content?.trim(),
        hasStatus: !!setting.status?.trim()
      })

      options.onProgress?.(1, 2) // 开始处理

      // 1. 生成嵌入向量
      console.log('生成嵌入向量...')
      const embedding = await generateEmbedding(settingText, this.featureConfig)
      console.log('嵌入向量生成成功:', {
        tokenCount: embedding.tokenCount,
        model: embedding.model,
        embeddingLength: embedding.embedding.length
      })
      options.onProgress?.(2, 2) // 嵌入生成完成

      // 2. 存储或更新向量数据
      console.log('存储向量数据...')
      await this.storeSettingVector({
        bookId: setting.book_id,
        settingId: setting.id,
        settingContent: settingText, // 存储拼接后的文本
        embedding: embedding.embedding,
        tokenCount: embedding.tokenCount
      })
      console.log('向量数据存储成功')

      return {
        settingId: setting.id,
        bookId: setting.book_id,
        tokenCount: embedding.tokenCount,
        success: true
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      console.error('更新设定记忆失败:', errorMessage, {
        settingId: setting.id,
        bookId: setting.book_id
      })
      options.onError?.(new Error(errorMessage))

      return {
        settingId: setting.id,
        bookId: setting.book_id,
        tokenCount: 0,
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * 批量更新多个设定的记忆
   */
  async updateBatchSettingMemory(
    settings: Setting[],
    options: SettingMemoryUpdateOptions = {}
  ): Promise<SettingMemoryResult[]> {
    const results: SettingMemoryResult[] = []

    for (let i = 0; i < settings.length; i++) {
      const setting = settings[i]
      const result = await this.updateSettingMemory(setting, {
        ...options,
        onProgress: (progress, total) => {
          options.onProgress?.(i + progress / total, settings.length)
        }
      })

      results.push(result)

      // 如果某个设定更新失败，继续处理其他设定
      if (!result.success) {
        console.error(`设定 ${setting.id} 记忆更新失败:`, result.error)
      }
    }

    return results
  }

  /**
   * 在书籍内搜索相似的设定
   */
  async searchSimilarSettings(
    bookId: number,
    queryText: string,
    limit: number = 5,
    excludeSettingId?: number,
    settingType?: string
  ): Promise<SimilarSettingResult[]> {
    try {
      // 1. 为查询文本生成嵌入
      const queryEmbedding = await generateEmbedding(queryText, this.featureConfig)

      // 2. 在数据库中搜索相似的向量
      const similarVectors = await this.searchSimilarVectors(
        bookId,
        queryEmbedding.embedding,
        limit,
        excludeSettingId,
        settingType
      )

      // 3. 格式化结果
      const results: SimilarSettingResult[] = []

      for (const vector of similarVectors) {
        // 获取设定信息
        const setting = await this.getSettingById(vector.setting_id)
        if (!setting) continue

        results.push({
          settingId: setting.id,
          settingName: setting.name,
          settingType: setting.type,
          settingContent: vector.setting_content,
          similarity: 1 - (vector.distance || 1), // 转换距离为相似度
          starred: setting.starred
        })
      }

      // 按相似度排序
      return results.sort((a, b) => b.similarity - a.similarity)
    } catch (error) {
      console.error('搜索相似设定失败:', error)
      return []
    }
  }

  /**
   * 获取书籍的设定记忆统计信息
   */
  async getBookSettingMemoryStats(bookId: number): Promise<{
    totalSettings: number
    settingsWithMemory: number
    totalTokens: number
    avgTokensPerSetting: number
    starredSettingsWithMemory: number
    byType: Record<string, {
      count: number
      withMemory: number
      tokens: number
    }>
  }> {
    try {
      const vectors = await this.getSettingVectorsByBookId(bookId)
      const settings = await this.getSettingsByBookId(bookId)

      const totalSettings = settings.length
      const settingsWithMemory = vectors.length
      const totalTokens = vectors.reduce((sum, v) => sum + v.token_count, 0)
      const avgTokensPerSetting = settingsWithMemory > 0 ? totalTokens / settingsWithMemory : 0

      // 获取有记忆的星标设定数量
      const settingIdsWithMemory = vectors.map(v => v.setting_id)
      const starredSettings = settings.filter(s =>
        settingIdsWithMemory.includes(s.id) && s.starred
      )
      const starredSettingsWithMemory = starredSettings.length

      // 按类型统计
      const byType: Record<string, { count: number; withMemory: number; tokens: number }> = {}

      for (const setting of settings) {
        if (!byType[setting.type]) {
          byType[setting.type] = { count: 0, withMemory: 0, tokens: 0 }
        }
        byType[setting.type].count++
      }

      // 统计每种类型的向量数据
      for (const vector of vectors) {
        const setting = settings.find(s => s.id === vector.setting_id)
        if (setting) {
          byType[setting.type].withMemory++
          byType[setting.type].tokens += vector.token_count
        }
      }

      return {
        totalSettings,
        settingsWithMemory,
        totalTokens,
        avgTokensPerSetting,
        starredSettingsWithMemory,
        byType
      }
    } catch (error) {
      console.error('获取书籍设定记忆统计失败:', error)
      return {
        totalSettings: 0,
        settingsWithMemory: 0,
        totalTokens: 0,
        avgTokensPerSetting: 0,
        starredSettingsWithMemory: 0,
        byType: {}
      }
    }
  }

  /**
   * 存储设定向量
   */
  private async storeSettingVector(data: {
    bookId: number
    settingId: number
    settingContent: string
    embedding: number[]
    tokenCount: number
  }): Promise<void> {
    try {
      console.log('开始存储设定向量:', {
        bookId: data.bookId,
        settingId: data.settingId,
        contentLength: data.settingContent.length,
        tokenCount: data.tokenCount
      })

      // 转换为 Uint8Array
      const embeddingArray = new Uint8Array(
        new Float32Array(data.embedding).buffer
      )

      console.log('嵌入向量转换成功:', `Uint8Array(${embeddingArray.length} bytes)`)

      // 先尝试获取现有向量
      console.log('检查现有向量...')
      const existingVector = await this.getSettingVectorBySettingId(data.settingId)

      if (existingVector) {
        console.log('找到现有向量，执行更新操作')
        // 更新现有向量
        await window.electronAPI.updateSettingVector(data.settingId, {
          setting_content: data.settingContent,
          embedding: embeddingArray,
          token_count: data.tokenCount
        })
        console.log('向量更新成功')
      } else {
        console.log('未找到现有向量，执行创建操作')
        // 创建新向量
        await window.electronAPI.createSettingVector({
          book_id: data.bookId,
          setting_id: data.settingId,
          setting_content: data.settingContent,
          embedding: embeddingArray,
          token_count: data.tokenCount
        })
        console.log('向量创建成功')
      }
    } catch (error) {
      console.error('存储设定向量失败:', error)
      throw new Error(`存储设定向量失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 搜索相似向量
   */
  private async searchSimilarVectors(
    bookId: number,
    queryEmbedding: number[],
    limit: number,
    excludeSettingId?: number,
    settingType?: string
  ): Promise<any[]> {
    try {
      // 转换为 Uint8Array
      const embeddingArray = new Uint8Array(
        new Float32Array(queryEmbedding).buffer
      )

      console.log('搜索相似设定向量:', {
        bookId,
        limit,
        excludeSettingId,
        settingType,
        embeddingLength: queryEmbedding.length
      })

      return await window.electronAPI.searchSimilarSettingVectors(
        bookId,
        embeddingArray, // 使用 Uint8Array
        limit,
      )
    } catch (error) {
      console.error('搜索相似设定向量失败:', error)
      return []
    }
  }

  /**
   * 获取设定信息
   */
  private async getSettingById(settingId: number): Promise<Setting | null> {
    try {
      const setting = await window.electronAPI.getSetting(settingId)
      return setting || null
    } catch (error) {
      console.error('获取设定信息失败:', error)
      return null
    }
  }

  /**
   * 获取书籍的所有设定
   */
  private async getSettingsByBookId(bookId: number): Promise<Setting[]> {
    try {
      return await window.electronAPI.getSettings(bookId)
    } catch (error) {
      console.error('获取书籍设定失败:', error)
      return []
    }
  }

  /**
   * 获取设定向量
   */
  private async getSettingVectorBySettingId(settingId: number): Promise<any | null> {
    try {
      console.log('获取设定向量:', settingId)
      return await window.electronAPI.getSettingVectorBySettingId(settingId)
    } catch (error) {
      console.error('获取设定向量失败:', error)
      return null
    }
  }

  /**
   * 获取书籍的所有设定向量
   */
  private async getSettingVectorsByBookId(bookId: number): Promise<any[]> {
    try {
      console.log('获取书籍设定向量:', bookId)
      return await window.electronAPI.getSettingVectorsByBookId(bookId)
    } catch (error) {
      console.error('获取书籍设定向量失败:', error)
      return []
    }
  }
}

/**
 * 创建设定记忆服务实例
 */
export function createSettingMemoryService(featureConfig: FeatureConfig): SettingMemoryService {
  return new SettingMemoryService(featureConfig)
}

/**
 * 便捷函数：更新单个设定记忆
 */
export async function updateSettingMemory(
  setting: Setting,
  featureConfig: FeatureConfig,
  options?: SettingMemoryUpdateOptions
): Promise<SettingMemoryResult> {
  const service = createSettingMemoryService(featureConfig)
  return service.updateSettingMemory(setting, options)
}

/**
 * 便捷函数：搜索相似设定
 */
export async function searchSimilarSettings(
  bookId: number,
  queryText: string,
  featureConfig: FeatureConfig,
  limit?: number,
  excludeSettingId?: number,
  settingType?: string
): Promise<SimilarSettingResult[]> {
  const service = createSettingMemoryService(featureConfig)
  return service.searchSimilarSettings(bookId, queryText, limit, excludeSettingId, settingType)
}