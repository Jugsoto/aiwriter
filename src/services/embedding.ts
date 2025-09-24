/**
 * 嵌入服务
 * 为文本生成向量嵌入，用于向量检索
 */

import type { FeatureConfig } from '@/electron.d'
import { OpenAI } from 'openai'

export interface EmbeddingResult {
  embedding: number[]
  tokenCount: number
  model: string
}

/**
 * 嵌入服务类
 */
export class EmbeddingService {
  private featureConfig: FeatureConfig

  constructor(featureConfig: FeatureConfig) {
    this.featureConfig = featureConfig

  }

  /**
   * 为单个文本生成嵌入
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      // 获取配置的供应商和模型信息
        const provider = await window.electronAPI.getProvider(this.featureConfig.provider_id)
       const model = await window.electronAPI.getModel(this.featureConfig.model_id)

      if (!provider || !model) {
        throw new Error('未找到配置的供应商或模型')
      }

      // 创建 OpenAI 客户端，支持兼容的 API
      const openai = new OpenAI({
        apiKey: provider.key,
        baseURL: provider.url.endsWith('/embeddings') ? provider.url.replace('/embeddings', '') : provider.url,
        dangerouslyAllowBrowser: true
      })

      // 调用嵌入 API
      const response = await openai.embeddings.create({
        model: model.model,
        input: text,
        encoding_format: 'float'
      })

      // 获取嵌入向量
      const embedding = response.data[0].embedding
      const tokenCount = response.usage?.total_tokens || 0

      // 记录用量统计
      if (response.usage) {
        try {
          await window.electronAPI.createUsageStatistic({
            provider_id: this.featureConfig.provider_id,
            model_id: this.featureConfig.model_id,
            feature_name: this.featureConfig.feature_name,
            mode: 'embedding',
            input_tokens: response.usage.prompt_tokens,
            output_tokens: 0, // 嵌入模型没有输出token
            total_tokens: response.usage.total_tokens
          })
        } catch (error) {
          console.error('记录嵌入用量统计失败:', error)
        }
      }

      return {
        embedding,
        tokenCount: tokenCount,
        model: model.model
      }
    } catch (error) {
      console.error('生成嵌入失败:', error)
      throw new Error(`生成嵌入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量为多个文本生成嵌入
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = []

    // 并行处理多个文本，但限制并发数
    const batchSize = 5 // 每批处理5个文本
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const batchPromises = batch.map(text => this.generateEmbedding(text))
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }


  /**
   * 计算向量之间的余弦相似度
   */
  static cosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('向量维度不匹配')
    }

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0)
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0))
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0))

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0
    }

    return dotProduct / (magnitude1 * magnitude2)
  }

  /**
   * 计算向量之间的欧几里得距离
   */
  static euclideanDistance(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('向量维度不匹配')
    }

    const sumOfSquares = vector1.reduce((sum, val, i) => {
      const diff = val - vector2[i]
      return sum + diff * diff
    }, 0)

    return Math.sqrt(sumOfSquares)
  }

  /**
   * 将向量转换为Buffer以便存储
   */
  static vectorToBuffer(vector: number[]): Buffer {
    const buffer = Buffer.alloc(vector.length * 4) // 每个float32占4字节
    for (let i = 0; i < vector.length; i++) {
      buffer.writeFloatLE(vector[i], i * 4)
    }
    return buffer
  }

  /**
   * 将Buffer转换为向量
   */
  static bufferToVector(buffer: Buffer): number[] {
    const vector: number[] = []
    for (let i = 0; i < buffer.length; i += 4) {
      vector.push(buffer.readFloatLE(i))
    }
    return vector
  }
}

/**
 * 创建嵌入服务实例
 */
export function createEmbeddingService(featureConfig: FeatureConfig, ): EmbeddingService {
  return new EmbeddingService(featureConfig)
}

/**
 * 便捷函数：生成单个嵌入
 */
export async function generateEmbedding(
  text: string,
  featureConfig: FeatureConfig,
): Promise<EmbeddingResult> {
  const service = createEmbeddingService(featureConfig)
  return service.generateEmbedding(text)
}

/**
 * 便捷函数：批量生成嵌入
 */
export async function generateBatchEmbeddings(
  texts: string[],
  featureConfig: FeatureConfig,
): Promise<EmbeddingResult[]> {
  const service = createEmbeddingService(featureConfig)
  return service.generateBatchEmbeddings(texts)
}