import {
  Provider,
  CreateProviderData,
  UpdateProviderData,
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider
} from '../database/models/provider'

export class ProviderService {
  static async getAllProviders(): Promise<Provider[]> {
    try {
      return getAllProviders()
    } catch (error) {
      throw new Error(`获取供应商列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async createProvider(data: CreateProviderData): Promise<Provider> {
    try {
      if (!data.name || data.name.trim() === '') {
        throw new Error('供应商名称不能为空')
      }
      // 允许URL和Key为空，用户可以在右侧配置
      return createProvider(data)
    } catch (error) {
      throw new Error(`创建供应商失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async updateProvider(id: number, data: UpdateProviderData): Promise<Provider> {
    try {
      const existing = getProviderById(id)
      if (!existing) {
        throw new Error(`供应商ID ${id} 不存在`)
      }
      return updateProvider(id, data)
    } catch (error) {
      throw new Error(`更新供应商失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async deleteProvider(id: number): Promise<void> {
    try {
      const existing = getProviderById(id)
      if (!existing) {
        throw new Error(`供应商ID ${id} 不存在`)
      }
      if (existing.is_builtin === 1) {
        throw new Error('不能删除内置供应商')
      }
      deleteProvider(id)
    } catch (error) {
      throw new Error(`删除供应商失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}