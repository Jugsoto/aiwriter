import {
  ReferenceLibrary,
  CreateReferenceData,
  UpdateReferenceData,
  getReferencesByBookId,
  getReferenceById,
  createReference,
  updateReference,
  deleteReference,
  toggleReferenceStar,
  searchReferences,
  batchCreateReferences
} from '../database/models/referenceLibrary'
import { getBookById } from '../database/models/book'

export class ReferenceService {
  static async getReferencesByBookId(bookId: number): Promise<ReferenceLibrary[]> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }
      return getReferencesByBookId(bookId)
    } catch (error) {
      throw new Error(`获取资料库列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async getReferenceById(id: number): Promise<ReferenceLibrary> {
    try {
      const reference = getReferenceById(id)
      if (!reference) {
        throw new Error(`资料ID ${id} 不存在`)
      }
      return reference
    } catch (error) {
      throw new Error(`获取资料失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async createReference(data: CreateReferenceData): Promise<ReferenceLibrary> {
    try {
      if (!data.title || data.title.trim() === '') {
        throw new Error('资料标题不能为空')
      }
      if (!data.content || data.content.trim() === '') {
        throw new Error('资料内容不能为空')
      }
      return createReference(data)
    } catch (error) {
      throw new Error(`创建资料失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async updateReference(id: number, data: UpdateReferenceData): Promise<ReferenceLibrary> {
    try {
      const existing = getReferenceById(id)
      if (!existing) {
        throw new Error(`资料ID ${id} 不存在`)
      }
      return updateReference(id, data)
    } catch (error) {
      throw new Error(`更新资料失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async deleteReference(id: number): Promise<void> {
    try {
      const existing = getReferenceById(id)
      if (!existing) {
        throw new Error(`资料ID ${id} 不存在`)
      }
      deleteReference(id)
    } catch (error) {
      throw new Error(`删除资料失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async toggleReferenceStar(id: number): Promise<ReferenceLibrary> {
    try {
      const existing = getReferenceById(id)
      if (!existing) {
        throw new Error(`资料ID ${id} 不存在`)
      }
      return toggleReferenceStar(id)
    } catch (error) {
      throw new Error(`切换资料星标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async searchReferences(
    bookId: number,
    query: string,
    fileType?: string,
    starredOnly?: boolean
  ): Promise<ReferenceLibrary[]> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }
      return searchReferences(bookId, query, fileType, starredOnly)
    } catch (error) {
      throw new Error(`搜索资料失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async batchCreateReferences(
    references: CreateReferenceData[]
  ): Promise<ReferenceLibrary[]> {
    try {
      if (references.length === 0) {
        throw new Error('资料列表不能为空')
      }
      return batchCreateReferences(references)
    } catch (error) {
      throw new Error(`批量创建资料失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}
