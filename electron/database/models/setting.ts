import { getDatabase } from '../connection'
import { getBookById } from './book'

// 数据接口定义
export interface Setting {
  id: number
  book_id: number
  type: string
  name: string
  content: string
  status: string
  starred: boolean
  created_at: string
  updated_at: string
}

export interface CreateSettingData {
  book_id: number
  type: string
  name: string
  content?: string
  status?: string
  starred?: boolean
}

export interface UpdateSettingData {
  type?: string
  name?: string
  content?: string
  status?: string
  starred?: boolean
}

// 根据书籍ID获取所有设定
export function getSettingsByBookId(bookId: number): Setting[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM settings
    WHERE book_id = ?
    ORDER BY starred DESC, updated_at DESC
  `)
  return stmt.all(bookId) as Setting[]
}

// 根据书籍ID和类型获取设定
export function getSettingsByType(bookId: number, type: string): Setting[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM settings
    WHERE book_id = ? AND type = ?
    ORDER BY starred DESC, updated_at DESC
  `)
  return stmt.all(bookId, type) as Setting[]
}

// 根据ID获取设定
export function getSettingById(id: number): Setting | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM settings WHERE id = ?')
  return stmt.get(id) as Setting | undefined
}

// 创建新设定
export function createSetting(data: CreateSettingData): Setting {
  const db = getDatabase()

  // 验证书籍是否存在
  const book = getBookById(data.book_id)
  if (!book) {
    throw new Error(`书籍ID ${data.book_id} 不存在，无法创建设定`)
  }

  const stmt = db.prepare(`
    INSERT INTO settings (book_id, type, name, content, status, starred)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.book_id,
    data.type,
    data.name,
    data.content || '',
    data.status || '',
    data.starred ? 1 : 0
  )

  return getSettingById(result.lastInsertRowid as number)!
}

// 更新设定
export function updateSetting(id: number, data: UpdateSettingData): Setting {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.type !== undefined) {
    fields.push('type = ?')
    values.push(data.type)
  }
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.content !== undefined) {
    fields.push('content = ?')
    values.push(data.content)
  }
  if (data.status !== undefined) {
    fields.push('status = ?')
    values.push(data.status)
  }
  if (data.starred !== undefined) {
    fields.push('starred = ?')
    values.push(data.starred ? 1 : 0)
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE settings SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)
  }

  return getSettingById(id)!
}

// 删除设定
export function deleteSetting(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM settings WHERE id = ?')
  stmt.run(id)
}

// 切换设定星标状态
export function toggleSettingStar(id: number): Setting {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE settings
    SET starred = CASE WHEN starred = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(id)

  return getSettingById(id)!
}

// 重置数据库 - 删除所有设定
export function resetSettings(): void {
  try {
    const db = getDatabase()

    // 删除所有设定
    db.exec('DELETE FROM settings')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name = "settings"')

    console.log('Settings table reset successfully')
  } catch (error) {
    console.error('Failed to reset settings table:', error)
    throw error
  }
}