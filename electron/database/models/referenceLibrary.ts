import { getDatabase } from '../connection'
import { getBookById } from './book'

// 数据接口定义
export interface ReferenceLibrary {
  id: number
  book_id: number
  title: string
  content: string
  file_type: string
  source_type: 'manual' | 'import' | 'chapter'
  source_path: string
  tags: string // JSON array string
  starred: boolean
  metadata: string // JSON string
  created_at: string
  updated_at: string
}

export interface CreateReferenceData {
  book_id: number
  title: string
  content: string
  file_type?: string
  source_type?: 'manual' | 'import' | 'chapter'
  source_path?: string
  tags?: string[]
  starred?: boolean
  metadata?: Record<string, any>
}

export interface UpdateReferenceData {
  title?: string
  content?: string
  file_type?: string
  source_type?: 'manual' | 'import' | 'chapter'
  source_path?: string
  tags?: string[]
  starred?: boolean
  metadata?: Record<string, any>
}

// 根据书籍ID获取所有资料
export function getReferencesByBookId(bookId: number): ReferenceLibrary[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM reference_library
    WHERE book_id = ?
    ORDER BY starred DESC, updated_at DESC
  `)
  return stmt.all(bookId) as ReferenceLibrary[]
}

// 根据ID获取资料
export function getReferenceById(id: number): ReferenceLibrary | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM reference_library WHERE id = ?')
  return stmt.get(id) as ReferenceLibrary | undefined
}

// 创建新资料
export function createReference(data: CreateReferenceData): ReferenceLibrary {
  const db = getDatabase()

  // 验证书籍是否存在
  const book = getBookById(data.book_id)
  if (!book) {
    throw new Error(`书籍ID ${data.book_id} 不存在，无法创建资料`)
  }

  const stmt = db.prepare(`
    INSERT INTO reference_library (
      book_id, title, content, file_type, source_type, source_path,
      tags, starred, metadata
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.book_id,
    data.title,
    data.content,
    data.file_type || 'txt',
    data.source_type || 'manual',
    data.source_path || '',
    data.tags ? JSON.stringify(data.tags) : '[]',
    data.starred ? 1 : 0,
    data.metadata ? JSON.stringify(data.metadata) : '{}'
  )

  return getReferenceById(result.lastInsertRowid as number)!
}

// 更新资料
export function updateReference(id: number, data: UpdateReferenceData): ReferenceLibrary {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.title !== undefined) {
    fields.push('title = ?')
    values.push(data.title)
  }
  if (data.content !== undefined) {
    fields.push('content = ?')
    values.push(data.content)
  }
  if (data.file_type !== undefined) {
    fields.push('file_type = ?')
    values.push(data.file_type)
  }
  if (data.source_type !== undefined) {
    fields.push('source_type = ?')
    values.push(data.source_type)
  }
  if (data.source_path !== undefined) {
    fields.push('source_path = ?')
    values.push(data.source_path)
  }
  if (data.tags !== undefined) {
    fields.push('tags = ?')
    values.push(JSON.stringify(data.tags))
  }
  if (data.starred !== undefined) {
    fields.push('starred = ?')
    values.push(data.starred ? 1 : 0)
  }
  if (data.metadata !== undefined) {
    fields.push('metadata = ?')
    values.push(JSON.stringify(data.metadata))
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE reference_library SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)
  }

  return getReferenceById(id)!
}

// 删除资料
export function deleteReference(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM reference_library WHERE id = ?')
  stmt.run(id)
}

// 切换资料星标状态
export function toggleReferenceStar(id: number): ReferenceLibrary {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE reference_library
    SET starred = CASE WHEN starred = 1 THEN 0 ELSE 1 END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(id)

  return getReferenceById(id)!
}

// 搜索资料（根据标题和内容）
export function searchReferences(
  bookId: number,
  query: string,
  fileType?: string,
  starredOnly?: boolean
): ReferenceLibrary[] {
  const db = getDatabase()

  let sql = `
    SELECT * FROM reference_library
    WHERE book_id = ?
  `
  const params: any[] = [bookId]

  if (query) {
    sql += ` AND (title LIKE ? OR content LIKE ?)`
    const searchQuery = `%${query}%`
    params.push(searchQuery, searchQuery)
  }

  if (fileType) {
    sql += ` AND file_type = ?`
    params.push(fileType)
  }

  if (starredOnly) {
    sql += ` AND starred = 1`
  }

  sql += ` ORDER BY starred DESC, updated_at DESC`

  const stmt = db.prepare(sql)
  return stmt.all(...params) as ReferenceLibrary[]
}

// 批量创建资料（用于导入）
export function batchCreateReferences(
  references: CreateReferenceData[]
): ReferenceLibrary[] {
  const db = getDatabase()
  const createdReferences: ReferenceLibrary[] = []

  // 开始事务
  const transaction = db.transaction(() => {
    for (const data of references) {
      const created = createReference(data)
      createdReferences.push(created)
    }
  })

  try {
    transaction()
    return createdReferences
  } catch (error) {
    console.error('批量创建资料失败:', error)
    throw error
  }
}

// 重置数据库 - 删除所有资料
export function resetReferences(): void {
  try {
    const db = getDatabase()

    // 删除所有资料
    db.exec('DELETE FROM reference_library')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name = "reference_library"')

    console.log('Reference library table reset successfully')
  } catch (error) {
    console.error('Failed to reset reference library table:', error)
    throw error
  }
}
