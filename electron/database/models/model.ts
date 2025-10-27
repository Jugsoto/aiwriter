import { getDatabase } from '../connection'
import { getProviderById } from './provider'

// 数据接口定义
export interface Model {
  id: number
  provider_id: number
  model: string
  tags: string
  created_at: string
  updated_at: string
}

export interface CreateModelData {
  provider_id: number
  model: string
  tags?: string
}

export interface UpdateModelData {
  provider_id?: number
  model?: string
  tags?: string
}

// 根据供应商ID获取所有模型
export function getModelsByProviderId(providerId: number): Model[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM models
    WHERE provider_id = ?
    ORDER BY model
  `)
  return stmt.all(providerId) as Model[]
}

// 根据ID获取模型
export function getModelById(id: number): Model | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM models WHERE id = ?')
  return stmt.get(id) as Model | undefined
}

// 创建新模型
export function createModel(data: CreateModelData): Model {
  const db = getDatabase()

  // 验证供应商是否存在
  const provider = getProviderById(data.provider_id)
  if (!provider) {
    throw new Error(`供应商ID ${data.provider_id} 不存在，无法创建模型`)
  }

  const stmt = db.prepare(`
    INSERT INTO models (provider_id, model, tags)
    VALUES (?, ?, ?)
  `)
  const result = stmt.run(
    data.provider_id,
    data.model,
    data.tags || ''
  )

  return getModelById(result.lastInsertRowid as number)!
}

// 更新模型
export function updateModel(id: number, data: UpdateModelData): Model {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.provider_id !== undefined) {
    fields.push('provider_id = ?')
    values.push(data.provider_id)
  }
  if (data.model !== undefined) {
    fields.push('model = ?')
    values.push(data.model)
  }
  if (data.tags !== undefined) {
    fields.push('tags = ?')
    values.push(data.tags)
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE models SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)
  }

  return getModelById(id)!
}

// 删除模型
export function deleteModel(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM models WHERE id = ?')
  stmt.run(id)
}

// 重置数据库 - 删除所有模型
export function resetModels(): void {
  try {
    const db = getDatabase()

    // 删除所有模型
    db.exec('DELETE FROM models')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name = "models"')

    console.log('Models table reset successfully')
  } catch (error) {
    console.error('Failed to reset models table:', error)
    throw error
  }
}