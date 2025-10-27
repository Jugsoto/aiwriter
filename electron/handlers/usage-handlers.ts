import { ipcMain } from 'electron'
import { UsageService } from '../services/usage-service'
import { FeatureConfigService } from '../services/feature-config-service'

export function registerUsageHandlers(): void {
  console.log('Registering usage handlers...')

  ipcMain.handle('create-usage-statistic', async (_event, data: {
    provider_id: number;
    model_id: number;
    feature_name: string;
    mode: string;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number
  }) => {
    try {
      return await UsageService.createUsageStatistic(data)
    } catch (error) {
      console.error('Error in create-usage-statistic handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-usage-statistics', async () => {
    try {
      return await UsageService.getAllUsageStatistics()
    } catch (error) {
      console.error('Error in get-usage-statistics handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-usage-statistics-by-date-range', async (_event, startDate: string, endDate: string) => {
    try {
      return await UsageService.getUsageStatisticsByDateRange(startDate, endDate)
    } catch (error) {
      console.error('Error in get-usage-statistics-by-date-range handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-usage-statistics-by-provider', async (_event, providerId: number) => {
    try {
      return await UsageService.getUsageStatisticsByProvider(providerId)
    } catch (error) {
      console.error('Error in get-usage-statistics-by-provider handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-usage-statistics-by-model', async (_event, modelId: number) => {
    try {
      return await UsageService.getUsageStatisticsByModel(modelId)
    } catch (error) {
      console.error('Error in get-usage-statistics-by-model handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-usage-statistics-summary', async () => {
    try {
      return await UsageService.getUsageStatisticsSummary()
    } catch (error) {
      console.error('Error in get-usage-statistics-summary handler:', error)
      throw error
    }
  })

  // 功能配置相关处理器
  ipcMain.handle('get-feature-configs', async () => {
    try {
      return await FeatureConfigService.getAllFeatureConfigs()
    } catch (error) {
      console.error('Error in get-feature-configs handler:', error)
      throw error
    }
  })

  ipcMain.handle('update-feature-config', async (_event, featureName: string, data: {
    provider_id?: number;
    model_id?: number;
    temperature?: number
  }) => {
    try {
      return await FeatureConfigService.updateFeatureConfig(featureName, data)
    } catch (error) {
      console.error('Error in update-feature-config handler:', error)
      throw error
    }
  })

  console.log('Usage handlers registered')
}