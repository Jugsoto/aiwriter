import {
  Model,
  CreateModelData,
  UpdateModelData,
  getModelsByProviderId,
  getModelById,
  createModel,
  updateModel,
  deleteModel
} from '../database/models/model'

export class ModelService {
  static async getModelsByProviderId(providerId: number): Promise<Model[]> {
    try {
      return getModelsByProviderId(providerId)
    } catch (error) {
      throw new Error(`获取模型列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async createModel(data: CreateModelData): Promise<Model> {
    try {
      if (!data.model || data.model.trim() === '') {
        throw new Error('模型名称不能为空')
      }
      return createModel(data)
    } catch (error) {
      throw new Error(`创建模型失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async updateModel(id: number, data: UpdateModelData): Promise<Model> {
    try {
      const existing = getModelById(id)
      if (!existing) {
        throw new Error(`模型ID ${id} 不存在`)
      }
      return updateModel(id, data)
    } catch (error) {
      throw new Error(`更新模型失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async deleteModel(id: number): Promise<void> {
    try {
      const existing = getModelById(id)
      if (!existing) {
        throw new Error(`模型ID ${id} 不存在`)
      }
      deleteModel(id)
    } catch (error) {
      throw new Error(`删除模型失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}