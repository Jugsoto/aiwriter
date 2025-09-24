/**
 * 文本分块服务
 * 将长文本分割成指定长度的块，用于向量化和检索
 */

export interface TextChunk {
  text: string
  index: number
  tokenCount: number
}

export interface ChunkOptions {
  chunkSize?: number // 每个块的字符数，默认300
  overlap?: number // 块之间的重叠字符数，默认50
  separator?: string // 分隔符，默认为句号、问号、感叹号等
  minChunkSize?: number // 最小块大小，默认100
}

/**
 * 文本分块类
 */
export class TextChunker {
  private options: Required<ChunkOptions>

  constructor(options: ChunkOptions = {}) {
    this.options = {
      chunkSize: options.chunkSize || 300,
      overlap: options.overlap || 50,
      separator: options.separator || '[。！？；\n]',
      minChunkSize: options.minChunkSize || 100
    }
  }

  /**
   * 简单估算文本的token数量
   * 使用中文字符平均每个字符1.5个token的经验值
   */
  public estimateTokenCount(text: string): number {
    // 移除多余的空白字符
    const cleanText = text.replace(/\s+/g, ' ').trim()
    // 中文通常每个字符对应1.5个token，英文通常每个单词对应1.3个token
    const chineseCharCount = (cleanText.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWordCount = (cleanText.match(/[a-zA-Z]+/g) || []).length
    const otherCharCount = cleanText.length - chineseCharCount - englishWordCount

    return Math.ceil(chineseCharCount * 1.5 + englishWordCount * 1.3 + otherCharCount * 1.0)
  }

  /**
   * 智能分割文本，尽量在句子边界分割
   */
  private splitBySentences(text: string): string[] {
    const sentences = text.split(new RegExp(this.options.separator))
    return sentences.map(s => s.trim()).filter(s => s.length > 0)
  }

  /**
   * 创建文本块
   */
  public createChunks(text: string): TextChunk[] {
    if (!text || text.trim().length === 0) {
      return []
    }

    const chunks: TextChunk[] = []
    let currentIndex = 0

    // 如果文本较短，直接作为一个块
    if (text.length <= this.options.chunkSize) {
      return [{
        text: text.trim(),
        index: 0,
        tokenCount: this.estimateTokenCount(text)
      }]
    }

    // 智能分块处理
    while (currentIndex < text.length) {
      let chunkText = ''
      let endIndex = Math.min(currentIndex + this.options.chunkSize, text.length)

      // 尝试在句子边界分割
      if (endIndex < text.length) {
        // 查找最近的句子分隔符
        const substring = text.substring(currentIndex, endIndex)
        const sentences = this.splitBySentences(substring)

        if (sentences.length > 1) {
          // 使用完整句子作为块
          chunkText = sentences.slice(0, -1).join('。')
          endIndex = currentIndex + chunkText.length
        } else {
          // 没有找到句子分隔符，在空白字符处分割
          const lastSpace = substring.lastIndexOf(' ')
          if (lastSpace > this.options.minChunkSize) {
            chunkText = substring.substring(0, lastSpace)
            endIndex = currentIndex + lastSpace
          } else {
            chunkText = substring
          }
        }
      } else {
        chunkText = text.substring(currentIndex)
      }

      // 清理文本
      chunkText = chunkText.trim()

      if (chunkText.length >= this.options.minChunkSize) {
        chunks.push({
          text: chunkText,
          index: chunks.length,
          tokenCount: this.estimateTokenCount(chunkText)
        })
      }

      currentIndex = endIndex
    }

    return chunks
  }

  /**
   * 带重叠的分块
   */
  public createChunksWithOverlap(text: string): TextChunk[] {
    const chunks: TextChunk[] = []
    const chunkSize = this.options.chunkSize
    const overlap = this.options.overlap

    if (!text || text.trim().length === 0) {
      return []
    }

    let startIndex = 0

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length)
      let chunkText = text.substring(startIndex, endIndex)

      // 智能截断，避免在句子中间断开
      if (endIndex < text.length) {
        const sentences = this.splitBySentences(chunkText)
        if (sentences.length > 1) {
          chunkText = sentences.slice(0, -1).join('。')
        }
      }

      chunkText = chunkText.trim()

      if (chunkText.length >= this.options.minChunkSize) {
        chunks.push({
          text: chunkText,
          index: chunks.length,
          tokenCount: this.estimateTokenCount(chunkText)
        })
      }

      // 移动到下一个块，考虑重叠
      startIndex = endIndex - overlap

      // 避免无限循环
      if (startIndex >= text.length - overlap) {
        break
      }
    }

    return chunks
  }

  /**
   * 按段落分块
   */
  public createChunksByParagraphs(text: string): TextChunk[] {
    const paragraphs = text.split(/\n\s*\n/)
    const chunks: TextChunk[] = []
    let currentChunk = ''
    let chunkIndex = 0

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim()
      if (!trimmed) continue

      // 如果段落较短，合并到当前块
      if (trimmed.length < this.options.minChunkSize) {
        if (currentChunk) {
          currentChunk += '\n\n' + trimmed
        } else {
          currentChunk = trimmed
        }
        continue
      }

      // 处理当前累积的块
      if (currentChunk) {
        chunks.push({
          text: currentChunk,
          index: chunkIndex++,
          tokenCount: this.estimateTokenCount(currentChunk)
        })
        currentChunk = ''
      }

      // 如果段落很长，需要进一步分割
      if (trimmed.length > this.options.chunkSize) {
        const subChunks = this.createChunks(trimmed)
        for (const subChunk of subChunks) {
          chunks.push({
            text: subChunk.text,
            index: chunkIndex++,
            tokenCount: subChunk.tokenCount
          })
        }
      } else {
        chunks.push({
          text: trimmed,
          index: chunkIndex++,
          tokenCount: this.estimateTokenCount(trimmed)
        })
      }
    }

    // 处理最后一个累积的块
    if (currentChunk) {
      chunks.push({
        text: currentChunk,
        index: chunkIndex,
        tokenCount: this.estimateTokenCount(currentChunk)
      })
    }

    return chunks
  }

  /**
   * 获取推荐的分块方法
   */
  public recommendChunkMethod(text: string): 'simple' | 'overlap' | 'paragraph' {
    // 检查是否有明显的段落结构
    const hasParagraphs = text.split(/\n\s*\n/).length > 2
    const avgParagraphLength = text.split(/\n\s*\n/)
      .filter(p => p.trim().length > 0)
      .reduce((sum, p) => sum + p.length, 0) / text.split(/\n\s*\n/).length

    if (hasParagraphs && avgParagraphLength <= this.options.chunkSize) {
      return 'paragraph'
    }

    // 对于较长的文本，使用重叠分块
    if (text.length > this.options.chunkSize * 3) {
      return 'overlap'
    }

    return 'simple'
  }

  /**
   * 智能分块（自动选择最佳方法）
   */
  public createSmartChunks(text: string): TextChunk[] {
    const method = this.recommendChunkMethod(text)

    switch (method) {
      case 'paragraph':
        return this.createChunksByParagraphs(text)
      case 'overlap':
        return this.createChunksWithOverlap(text)
      default:
        return this.createChunks(text)
    }
  }
}

/**
 * 默认分块器实例
 */
export const textChunker = new TextChunker()

/**
 * 便捷函数：创建文本块
 */
export function createTextChunks(text: string, options?: ChunkOptions): TextChunk[] {
  const chunker = new TextChunker(options)
  return chunker.createSmartChunks(text)
}

/**
 * 便捷函数：估算token数量
 */
export function estimateTokens(text: string): number {
  return textChunker.estimateTokenCount(text)
}