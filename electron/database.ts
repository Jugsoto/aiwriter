import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

// 数据库实例变量
let db: Database.Database | null = null

// 获取数据库文件路径
function getDbPath(): string {
  return path.join(app.getPath('userData'), 'aiwriter.db')
}

// 获取数据库实例
function getDatabase(): any {
  if (!db) {
    const dbPath = getDbPath()
    db = new Database(dbPath)
  }
  return db
}

// 初始化数据库表
function initDatabase() {
  try {
    const dbPath = getDbPath()
    const db = getDatabase()
    console.log('Initializing database at:', dbPath)
    
    // 创建书籍表
    db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        global_settings TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 创建章节表
    db.exec(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        summary TEXT DEFAULT '',
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
      )
    `)
    
    // 创建索引以提高查询性能
    db.exec('CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters (book_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters (book_id, order_index)')
    
    // 检查现有数据
    const count = db.prepare('SELECT COUNT(*) as count FROM books').get() as { count: number }
    console.log(`Database initialized successfully with ${count.count} existing books`)
    
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// 书籍相关操作
interface Book {
  id: number
  name: string
  global_settings: string
  created_at: string
  updated_at: string
}

interface CreateBookData {
  name: string
}

interface UpdateBookData {
  name?: string
  global_settings?: string
}

// 章节相关操作
interface Chapter {
  id: number
  book_id: number
  title: string
  content: string
  summary: string
  order_index: number
  created_at: string
  updated_at: string
}

interface CreateChapterData {
  book_id: number
  title: string
  content?: string
  summary?: string
  order_index?: number
}

interface UpdateChapterData {
  title?: string
  content?: string
  summary?: string
  order_index?: number
}

// 获取所有书籍
function getAllBooks(): Book[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM books ORDER BY updated_at DESC')
  return stmt.all() as Book[]
}

// 根据ID获取书籍
function getBookById(id: number): Book | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM books WHERE id = ?')
  return stmt.get(id) as Book | undefined
}

// 创建新书籍
function createBook(data: CreateBookData): Book {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO books (name, global_settings) VALUES (?, ?)
  `)
  const result = stmt.run(data.name, '')

  // 返回新创建的书籍
  return getBookById(result.lastInsertRowid as number)!
}

// 更新书籍
function updateBook(id: number, data: UpdateBookData): Book {
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
function deleteBook(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM books WHERE id = ?')
  stmt.run(id)
}

// 章节相关操作

// 根据书籍ID获取所有章节
function getChaptersByBookId(bookId: number): Chapter[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM chapters
    WHERE book_id = ?
    ORDER BY order_index ASC, created_at ASC
  `)
  return stmt.all(bookId) as Chapter[]
}

// 根据ID获取章节
function getChapterById(id: number): Chapter | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM chapters WHERE id = ?')
  return stmt.get(id) as Chapter | undefined
}

// 创建新章节
function createChapter(data: CreateChapterData): Chapter {
  const db = getDatabase()
  // 获取当前书籍的最大order_index
  const maxOrderStmt = db.prepare(`
    SELECT MAX(order_index) as max_order FROM chapters WHERE book_id = ?
  `)
  const result = maxOrderStmt.get(data.book_id) as { max_order: number | null }
  const nextOrder = (result.max_order ?? -1) + 1

  const stmt = db.prepare(`
    INSERT INTO chapters (book_id, title, content, summary, order_index)
    VALUES (?, ?, ?, ?, ?)
  `)
  const runResult = stmt.run(
    data.book_id,
    data.title,
    data.content || '',
    data.summary || '',
    data.order_index ?? nextOrder
  )
  
  return getChapterById(runResult.lastInsertRowid as number)!
}

// 更新章节
function updateChapter(id: number, data: UpdateChapterData): Chapter {
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
function updateChapterOrder(id: number, orderIndex: number): Chapter {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE chapters SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `)
  stmt.run(orderIndex, id)
  
  return getChapterById(id)!
}

// 删除章节
function deleteChapter(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM chapters WHERE id = ?')
  stmt.run(id)
}

// 重置数据库 - 删除所有数据
function resetDatabase(): void {
  try {
    const db = getDatabase()
    
    // 删除所有章节
    db.exec('DELETE FROM chapters')
    
    // 删除所有书籍
    db.exec('DELETE FROM books')
    
    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name IN ("books", "chapters")')
    
    console.log('Database reset successfully')
  } catch (error) {
    console.error('Failed to reset database:', error)
    throw error
  }
}

// 关闭数据库连接
function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

export {
  initDatabase,
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  closeDatabase,
  getChaptersByBookId,
  getChapterById,
  createChapter,
  updateChapter,
  updateChapterOrder,
  deleteChapter,
  resetDatabase
}
