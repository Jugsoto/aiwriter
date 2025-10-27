import { getDatabase } from '../connection'

// 数据接口定义
export interface Chapter {
  id: number
  book_id: number
  title: string
  content: string
  summary: string
  review_data: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface CreateChapterData {
  book_id: number
  title: string
  content?: string
  summary?: string
  review_data?: string
  order_index?: number
}

export interface UpdateChapterData {
  title?: string
  content?: string
  summary?: string
  review_data?: string
  order_index?: number
}

// 根据书籍ID获取所有章节
export function getChaptersByBookId(bookId: number): Chapter[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM chapters
    WHERE book_id = ?
    ORDER BY order_index ASC, created_at ASC
  `)
  return stmt.all(bookId) as Chapter[]
}

// 根据ID获取章节
export function getChapterById(id: number): Chapter | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM chapters WHERE id = ?')
  return stmt.get(id) as Chapter | undefined
}

// 创建新章节
export function createChapter(data: CreateChapterData): Chapter {
  const db = getDatabase()
  // 获取当前书籍的最大order_index
  const maxOrderStmt = db.prepare(`
    SELECT MAX(order_index) as max_order FROM chapters WHERE book_id = ?
  `)
  const result = maxOrderStmt.get(data.book_id) as { max_order: number | null }
  const nextOrder = (result.max_order ?? -1) + 1

  const stmt = db.prepare(`
    INSERT INTO chapters (book_id, title, content, summary, review_data, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const runResult = stmt.run(
    data.book_id,
    data.title,
    data.content || '',
    data.summary || '',
    data.review_data || '',
    data.order_index ?? nextOrder
  )

  return getChapterById(runResult.lastInsertRowid as number)!
}

// 更新章节
export function updateChapter(id: number, data: UpdateChapterData): Chapter {
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
  if (data.summary !== undefined) {
    fields.push('summary = ?')
    values.push(data.summary)
  }
  if (data.review_data !== undefined) {
    fields.push('review_data = ?')
    values.push(data.review_data)
  }
  if (data.order_index !== undefined) {
    fields.push('order_index = ?')
    values.push(data.order_index)
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE chapters SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)
  }

  return getChapterById(id)!
}

// 更新章节排序
export function updateChapterOrder(id: number, orderIndex: number): Chapter {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE chapters SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `)
  stmt.run(orderIndex, id)

  return getChapterById(id)!
}

// 删除章节
export function deleteChapter(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM chapters WHERE id = ?')
  stmt.run(id)
}

// 重置数据库 - 删除所有章节
export function resetChapters(): void {
  try {
    const db = getDatabase()

    // 删除所有章节
    db.exec('DELETE FROM chapters')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name = "chapters"')

    console.log('Chapters table reset successfully')
  } catch (error) {
    console.error('Failed to reset chapters table:', error)
    throw error
  }
}