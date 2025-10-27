import { getDatabase } from '../connection'

// 数据接口定义
export interface Book {
  id: number
  name: string
  global_settings: string
  created_at: string
  updated_at: string
}

export interface CreateBookData {
  name: string
}

export interface UpdateBookData {
  name?: string
  global_settings?: string
}

// 获取所有书籍
export function getAllBooks(): Book[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM books ORDER BY updated_at DESC')
  return stmt.all() as Book[]
}

// 根据ID获取书籍
export function getBookById(id: number): Book | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM books WHERE id = ?')
  return stmt.get(id) as Book | undefined
}

// 创建新书籍
export function createBook(data: CreateBookData): Book {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO books (name, global_settings) VALUES (?, ?)
  `)
  const result = stmt.run(data.name, '')

  // 返回新创建的书籍
  return getBookById(result.lastInsertRowid as number)!
}

// 更新书籍
export function updateBook(id: number, data: UpdateBookData): Book {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.global_settings !== undefined) {
    fields.push('global_settings = ?')
    values.push(data.global_settings)
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE books SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)
  }

  return getBookById(id)!
}

// 删除书籍
export function deleteBook(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM books WHERE id = ?')
  stmt.run(id)
}

// 重置数据库 - 删除所有数据
export function resetBooks(): void {
  try {
    const db = getDatabase()

    // 删除所有书籍（级联删除相关数据）
    db.exec('DELETE FROM books')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name = "books"')

    console.log('Books table reset successfully')
  } catch (error) {
    console.error('Failed to reset books table:', error)
    throw error
  }
}