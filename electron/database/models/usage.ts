import { getDatabase } from '../connection'
import { getProviderById } from './provider'
import { getModelById } from './model'

// 数据接口定义
export interface UsageStatistic {
  id: number
  timestamp: string
  provider_id: number
  model_id: number
  feature_name: string
  mode: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

export interface CreateUsageStatisticData {
  provider_id: number
  model_id: number
  feature_name: string
  mode: string
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
}

// 创建用量统计记录
export function createUsageStatistic(data: CreateUsageStatisticData): UsageStatistic {
  const db = getDatabase()

  // 验证供应商和模型是否存在
  const provider = getProviderById(data.provider_id)
  if (!provider) {
    throw new Error(`供应商ID ${data.provider_id} 不存在，无法创建用量统计`)
  }

  const model = getModelById(data.model_id)
  if (!model) {
    throw new Error(`模型ID ${data.model_id} 不存在，无法创建用量统计`)
  }

  const stmt = db.prepare(`
    INSERT INTO usage_statistics (provider_id, model_id, feature_name, mode, input_tokens, output_tokens, total_tokens)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.provider_id,
    data.model_id,
    data.feature_name,
    data.mode,
    data.input_tokens || 0,
    data.output_tokens || 0,
    data.total_tokens || 0
  )

  return getUsageStatisticById(result.lastInsertRowid as number)!
}

// 根据ID获取用量统计记录
export function getUsageStatisticById(id: number): UsageStatistic | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM usage_statistics WHERE id = ?')
  return stmt.get(id) as UsageStatistic | undefined
}

// 获取所有用量统计记录
export function getAllUsageStatistics(): UsageStatistic[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT us.*, p.name as provider_name, m.model as model_name
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    JOIN models m ON us.model_id = m.id
    ORDER BY us.timestamp DESC
  `)
  return stmt.all() as UsageStatistic[]
}

// 获取指定时间范围内的用量统计记录
export function getUsageStatisticsByDateRange(startDate: string, endDate: string): UsageStatistic[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT us.*, p.name as provider_name, m.model as model_name
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    JOIN models m ON us.model_id = m.id
    WHERE us.timestamp >= ? AND us.timestamp <= ?
    ORDER BY us.timestamp DESC
  `)
  return stmt.all(startDate, endDate) as UsageStatistic[]
}

// 获取指定供应商的用量统计记录
export function getUsageStatisticsByProvider(providerId: number): UsageStatistic[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT us.*, p.name as provider_name, m.model as model_name
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    JOIN models m ON us.model_id = m.id
    WHERE us.provider_id = ?
    ORDER BY us.timestamp DESC
  `)
  return stmt.all(providerId) as UsageStatistic[]
}

// 获取指定模型的用量统计记录
export function getUsageStatisticsByModel(modelId: number): UsageStatistic[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT us.*, p.name as provider_name, m.model as model_name
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    JOIN models m ON us.model_id = m.id
    WHERE us.model_id = ?
    ORDER BY us.timestamp DESC
  `)
  return stmt.all(modelId) as UsageStatistic[]
}

// 获取用量统计汇总信息
export function getUsageStatisticsSummary(): {
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  providers: Array<{
    provider_id: number
    provider_name: string
    total_calls: number
    total_tokens: number
  }>
  models: Array<{
    model_id: number
    model_name: string
    provider_name: string
    total_calls: number
    total_tokens: number
  }>
} {
  const db = getDatabase()

  // 获取总体统计
  const totalStats = db.prepare(`
    SELECT
      COUNT(*) as total_calls,
      SUM(input_tokens) as total_input_tokens,
      SUM(output_tokens) as total_output_tokens,
      SUM(total_tokens) as total_tokens
    FROM usage_statistics
  `).get() as {
    total_calls: number
    total_input_tokens: number
    total_output_tokens: number
    total_tokens: number
  }

  // 获取按供应商统计
  const providerStats = db.prepare(`
    SELECT
      us.provider_id,
      p.name as provider_name,
      COUNT(*) as total_calls,
      SUM(us.total_tokens) as total_tokens
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    GROUP BY us.provider_id, p.name
    ORDER BY total_tokens DESC
  `).all() as Array<{
    provider_id: number
    provider_name: string
    total_calls: number
    total_tokens: number
  }>

  // 获取按模型统计
  const modelStats = db.prepare(`
    SELECT
      us.model_id,
      m.model as model_name,
      p.name as provider_name,
      COUNT(*) as total_calls,
      SUM(us.total_tokens) as total_tokens
    FROM usage_statistics us
    JOIN models m ON us.model_id = m.id
    JOIN providers p ON us.provider_id = p.id
    GROUP BY us.model_id, m.model, p.name
    ORDER BY total_tokens DESC
  `).all() as Array<{
    model_id: number
    model_name: string
    provider_name: string
    total_calls: number
    total_tokens: number
  }>

  return {
    total_calls: totalStats.total_calls || 0,
    total_input_tokens: totalStats.total_input_tokens || 0,
    total_output_tokens: totalStats.total_output_tokens || 0,
    total_tokens: totalStats.total_tokens || 0,
    providers: providerStats,
    models: modelStats
  }
}

// 重置数据库 - 删除所有用量统计数据
export function resetUsageStatistics(): void {
  try {
    const db = getDatabase()

    // 删除所有用量统计数据
    db.exec('DELETE FROM usage_statistics')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name = "usage_statistics"')

    console.log('Usage statistics table reset successfully')
  } catch (error) {
    console.error('Failed to reset usage statistics table:', error)
    throw error
  }
}