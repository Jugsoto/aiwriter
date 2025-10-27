import { getDatabase } from '../connection'
import { getProviderById } from './provider'
import { getModelById } from './model'

// 数据接口定义
export interface FeatureConfig {
  id: number
  feature_name: string
  provider_id: number
  model_id: number
  temperature: number
  created_at: string
  updated_at: string
}

export interface CreateFeatureConfigData {
  feature_name: string
  provider_id: number
  model_id: number
  temperature?: number
}

export interface UpdateFeatureConfigData {
  provider_id?: number
  model_id?: number
  temperature?: number
}

// 获取所有功能配置
export function getAllFeatureConfigs(): FeatureConfig[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT fc.*, p.name as provider_name, m.model as model_name
    FROM feature_configs fc
    JOIN providers p ON fc.provider_id = p.id
    JOIN models m ON fc.model_id = m.id
    ORDER BY fc.feature_name
  `)
  return stmt.all() as FeatureConfig[]
}

// 根据功能名称获取配置
export function getFeatureConfigByName(featureName: string): FeatureConfig | undefined {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT fc.*, p.name as provider_name, m.model as model_name
    FROM feature_configs fc
    JOIN providers p ON fc.provider_id = p.id
    JOIN models m ON fc.model_id = m.id
    WHERE fc.feature_name = ?
  `)
  return stmt.get(featureName) as FeatureConfig | undefined
}

// 创建功能配置
export function createFeatureConfig(data: CreateFeatureConfigData): FeatureConfig {
  const db = getDatabase()

  // 验证供应商和模型是否存在
  const provider = getProviderById(data.provider_id)
  if (!provider) {
    throw new Error(`供应商ID ${data.provider_id} 不存在，无法创建功能配置`)
  }

  const model = getModelById(data.model_id)
  if (!model) {
    throw new Error(`模型ID ${data.model_id} 不存在，无法创建功能配置`)
  }

  const stmt = db.prepare(`
    INSERT INTO feature_configs (feature_name, provider_id, model_id, temperature)
    VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.feature_name,
    data.provider_id,
    data.model_id,
    data.temperature ?? 0.7
  )

  return getFeatureConfigById(result.lastInsertRowid as number)!
}

// 根据ID获取功能配置
export function getFeatureConfigById(id: number): FeatureConfig | undefined {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT fc.*, p.name as provider_name, m.model as model_name
    FROM feature_configs fc
    JOIN providers p ON fc.provider_id = p.id
    JOIN models m ON fc.model_id = m.id
    WHERE fc.id = ?
  `)
  return stmt.get(id) as FeatureConfig | undefined
}

// 更新功能配置
export function updateFeatureConfig(featureName: string, data: UpdateFeatureConfigData): FeatureConfig {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.provider_id !== undefined) {
    // 验证供应商是否存在
    const provider = getProviderById(data.provider_id)
    if (!provider) {
      throw new Error(`供应商ID ${data.provider_id} 不存在，无法更新功能配置`)
    }
    fields.push('provider_id = ?')
    values.push(data.provider_id)
  }

  if (data.model_id !== undefined) {
    // 验证模型是否存在
    const model = getModelById(data.model_id)
    if (!model) {
      throw new Error(`模型ID ${data.model_id} 不存在，无法更新功能配置`)
    }
    fields.push('model_id = ?')
    values.push(data.model_id)
  }

  if (data.temperature !== undefined) {
    fields.push('temperature = ?')
    values.push(data.temperature)
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(featureName)

    const stmt = db.prepare(`
      UPDATE feature_configs SET ${fields.join(', ')} WHERE feature_name = ?
    `)
    stmt.run(...values)
  }

  return getFeatureConfigByName(featureName)!
}

// 删除功能配置
export function deleteFeatureConfig(featureName: string): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM feature_configs WHERE feature_name = ?')
  stmt.run(featureName)
}

// 重置数据库 - 删除所有功能配置
export function resetFeatureConfigs(): void {
  try {
    const db = getDatabase()

    // 删除所有功能配置
    db.exec('DELETE FROM feature_configs')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name = "feature_configs"')

    console.log('Feature configs table reset successfully')
  } catch (error) {
    console.error('Failed to reset feature configs table:', error)
    throw error
  }
}