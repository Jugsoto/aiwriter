import { getDatabase } from '../connection'

// 数据接口定义
export interface Provider {
  id: number
  name: string
  url: string
  key: string
  is_builtin: number
  created_at: string
  updated_at: string
}

export interface CreateProviderData {
  name: string
  url: string
  key: string
  is_builtin?: number
}

export interface UpdateProviderData {
  name?: string
  url?: string
  key?: string
  is_builtin?: number
}

// 获取所有供应商
export function getAllProviders(): Provider[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM providers ORDER BY name')
  return stmt.all() as Provider[]
}

// 根据ID获取供应商
export function getProviderById(id: number): Provider | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM providers WHERE id = ?')
  return stmt.get(id) as Provider | undefined
}

// 创建新供应商
export function createProvider(data: CreateProviderData): Provider {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO providers (name, url, key, is_builtin) VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(data.name, data.url, data.key, data.is_builtin ?? 0)

  return getProviderById(result.lastInsertRowid as number)!
}

// 更新供应商
export function updateProvider(id: number, data: UpdateProviderData): Provider {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.url !== undefined) {
    fields.push('url = ?')
    values.push(data.url)
  }
  if (data.key !== undefined) {
    fields.push('key = ?')
    values.push(data.key)
  }
  if (data.is_builtin !== undefined) {
    fields.push('is_builtin = ?')
    values.push(data.is_builtin)
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE providers SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)
  }

  return getProviderById(id)!
}

// 删除供应商
export function deleteProvider(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM providers WHERE id = ?')
  stmt.run(id)
}

// 重置数据库 - 删除所有供应商
export function resetProviders(): void {
  try {
    const db = getDatabase()

    // 删除所有供应商
    db.exec('DELETE FROM providers')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name = "providers"')

    console.log('Providers table reset successfully')
  } catch (error) {
    console.error('Failed to reset providers table:', error)
    throw error
  }
}