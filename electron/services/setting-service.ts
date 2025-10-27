import {
  Setting,
  CreateSettingData,
  UpdateSettingData,
  getSettingsByBookId,
  getSettingsByType,
  getSettingById,
  createSetting,
  updateSetting,
  deleteSetting,
  toggleSettingStar
} from '../database/models/setting'
import { getBookById } from '../database/models/book'

export class SettingService {
  static async getSettingsByBookId(bookId: number): Promise<Setting[]> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }
      return getSettingsByBookId(bookId)
    } catch (error) {
      throw new Error(`获取设定列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async getSettingsByType(bookId: number, type: string): Promise<Setting[]> {
    try {
      const book = getBookById(bookId)
      if (!book) {
        throw new Error(`书籍ID ${bookId} 不存在`)
      }
      return getSettingsByType(bookId, type)
    } catch (error) {
      throw new Error(`获取分类设定失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async getSettingById(id: number): Promise<Setting> {
    try {
      const setting = getSettingById(id)
      if (!setting) {
        throw new Error(`设定ID ${id} 不存在`)
      }
      return setting
    } catch (error) {
      throw new Error(`获取设定失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async createSetting(data: CreateSettingData): Promise<Setting> {
    try {
      if (!data.name || data.name.trim() === '') {
        throw new Error('设定名称不能为空')
      }
      if (!data.type || data.type.trim() === '') {
        throw new Error('设定类型不能为空')
      }
      return createSetting(data)
    } catch (error) {
      throw new Error(`创建设定失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async updateSetting(id: number, data: UpdateSettingData): Promise<Setting> {
    try {
      const existing = getSettingById(id)
      if (!existing) {
        throw new Error(`设定ID ${id} 不存在`)
      }
      return updateSetting(id, data)
    } catch (error) {
      throw new Error(`更新设定失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async deleteSetting(id: number): Promise<void> {
    try {
      const existing = getSettingById(id)
      if (!existing) {
        throw new Error(`设定ID ${id} 不存在`)
      }
      deleteSetting(id)
    } catch (error) {
      throw new Error(`删除设定失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async toggleSettingStar(id: number): Promise<Setting> {
    try {
      const existing = getSettingById(id)
      if (!existing) {
        throw new Error(`设定ID ${id} 不存在`)
      }
      return toggleSettingStar(id)
    } catch (error) {
      throw new Error(`切换设定星标失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}