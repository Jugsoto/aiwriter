import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 数据库实例变量
let db: Database.Database | null = null

// 获取数据库文件路径
export function getDbPath(): string {
  return path.join(app.getPath('userData'), 'aiwriter.db')
}

// 获取数据库实例
export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = getDbPath()
    db = new Database(dbPath)

    // 启用外键约束
    db.pragma('foreign_keys = ON')
    console.log('Foreign key constraints enabled')

    // 加载 vec0 扩展
    loadVectorExtension()
  }
  return db!
}

// 加载向量扩展
function loadVectorExtension(): void {
  try {
    // 开发环境和生产环境的 vec0.dll 路径不同
    let vec0Path: string
    if (app.isPackaged) {
      // 生产环境：从 resources 目录加载
      vec0Path = path.join(process.resourcesPath, 'vec0.dll')
    } else {
      // 开发环境：从项目 resources 目录加载
      vec0Path = path.join(__dirname, '..', 'resources', 'vec0.dll')
    }

    // 检查文件是否存在
    if (fs.existsSync(vec0Path)) {
      db!.loadExtension(vec0Path)
      console.log('Successfully loaded vec0 extension from:', vec0Path)
    } else {
      console.warn('vec0.dll not found at:', vec0Path)
    }
  } catch (error) {
    console.error('Failed to load vec0 extension:', error)
  }
}

// 关闭数据库连接
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

// 重置数据库连接（用于错误恢复）
export function resetDatabaseConnection(): void {
  closeDatabase()
  getDatabase()
}