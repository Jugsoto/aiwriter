import {
  FeatureConfig,
  CreateFeatureConfigData,
  UpdateFeatureConfigData,
  getAllFeatureConfigs,
  createFeatureConfig,
  updateFeatureConfig
} from '../database/models/feature-config'

export class FeatureConfigService {
  static async getAllFeatureConfigs(): Promise<FeatureConfig[]> {
    try {
      return getAllFeatureConfigs()
    } catch (error) {
      throw new Error(`获取功能配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async updateFeatureConfig(featureName: string, data: UpdateFeatureConfigData): Promise<FeatureConfig> {
    try {
      if (!featureName || featureName.trim() === '') {
        throw new Error('功能名称不能为空')
      }
      return updateFeatureConfig(featureName, data)
    } catch (error) {
      throw new Error(`更新功能配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async createFeatureConfig(data: CreateFeatureConfigData): Promise<FeatureConfig> {
    try {
      if (!data.feature_name || data.feature_name.trim() === '') {
        throw new Error('功能名称不能为空')
      }
      return createFeatureConfig(data)
    } catch (error) {
      throw new Error(`创建功能配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}