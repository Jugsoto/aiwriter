import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

// 获取数据库文件路径
const dbPath = path.join(app.getPath('userData'), 'aiwriter.db')

// 创建数据库连接
const db = new Database(dbPath)

// 初始化数据库表
function initDatabase() {
  try {
    console.log('Initializing database at:', dbPath)
    
    // 创建书籍表
    db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
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
  created_at: string
  updated_at: string
}

interface CreateBookData {
  name: string
}

interface UpdateBookData {
  name: string
}

// 获取所有书籍
function getAllBooks(): Book[] {
  const stmt = db.prepare('SELECT * FROM books ORDER BY updated_at DESC')
  return stmt.all() as Book[]
}

// 根据ID获取书籍
function getBookById(id: number): Book | undefined {
  const stmt = db.prepare('SELECT * FROM books WHERE id = ?')
  return stmt.get(id) as Book | undefined
}

// 创建新书籍
function createBook(data: CreateBookData): Book {
  const stmt = db.prepare(`
    INSERT INTO books (name) VALUES (?)
  `)
  const result = stmt.run(data.name)
  
  // 返回新创建的书籍
  return getBookById(result.lastInsertRowid as number)!
}

// 更新书籍
function updateBook(id: number, data: UpdateBookData): Book {
  const stmt = db.prepare(`
    UPDATE books SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `)
  stmt.run(data.name, id)
  
  return getBookById(id)!
}

// 删除书籍
function deleteBook(id: number): void {
  const stmt = db.prepare('DELETE FROM books WHERE id = ?')
  stmt.run(id)
}

// 关闭数据库连接
function closeDatabase() {
  db.close()
}

export {
  initDatabase,
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  closeDatabase,
  type Book,
  type CreateBookData,
  type UpdateBookData
}
