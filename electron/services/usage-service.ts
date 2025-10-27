import {
  UsageStatistic,
  CreateUsageStatisticData,
  createUsageStatistic,
  getAllUsageStatistics,
  getUsageStatisticsByDateRange,
  getUsageStatisticsByProvider,
  getUsageStatisticsByModel,
  getUsageStatisticsSummary
} from '../database/models/usage'

export class UsageService {
  static async createUsageStatistic(data: CreateUsageStatisticData): Promise<UsageStatistic> {
    try {
      if (!data.feature_name || data.feature_name.trim() === '') {
        throw new Error('功能名称不能为空')
      }
      if (!data.mode || data.mode.trim() === '') {
        throw new Error('使用模式不能为空')
      }
      return createUsageStatistic(data)
    } catch (error) {
      throw new Error(`创建用量统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async getAllUsageStatistics(): Promise<UsageStatistic[]> {
    try {
      return getAllUsageStatistics()
    } catch (error) {
      throw new Error(`获取用量统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async getUsageStatisticsByDateRange(startDate: string, endDate: string): Promise<UsageStatistic[]> {
    try {
      return getUsageStatisticsByDateRange(startDate, endDate)
    } catch (error) {
      throw new Error(`获取日期范围用量统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async getUsageStatisticsByProvider(providerId: number): Promise<UsageStatistic[]> {
    try {
      return getUsageStatisticsByProvider(providerId)
    } catch (error) {
      throw new Error(`获取供应商用量统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async getUsageStatisticsByModel(modelId: number): Promise<UsageStatistic[]> {
    try {
      return getUsageStatisticsByModel(modelId)
    } catch (error) {
      throw new Error(`获取模型用量统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  static async getUsageStatisticsSummary() {
    try {
      return getUsageStatisticsSummary()
    } catch (error) {
      throw new Error(`获取用量统计汇总失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}