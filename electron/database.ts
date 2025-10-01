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
function getDbPath(): string {
  return path.join(app.getPath('userData'), 'aiwriter.db')
}

// 获取数据库实例
function getDatabase(): any {
  if (!db) {
    const dbPath = getDbPath()
    db = new Database(dbPath)

    // 启用外键约束
    db.pragma('foreign_keys = ON')
    console.log('Foreign key constraints enabled')

    // 加载 vec0 扩展
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
        db.loadExtension(vec0Path)
        console.log('Successfully loaded vec0 extension from:', vec0Path)
      } else {
        console.warn('vec0.dll not found at:', vec0Path)
      }
    } catch (error) {
      console.error('Failed to load vec0 extension:', error)
    }
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
        review_data TEXT DEFAULT '',
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
      )
    `)
    
    // 创建设定表
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        content TEXT DEFAULT '',
        status TEXT DEFAULT '',
        starred INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
      )
    `)
    
    // 创建索引以提高查询性能
    db.exec('CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters (book_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters (book_id, order_index)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_settings_book_id ON settings (book_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_settings_type ON settings (book_id, type)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_settings_starred ON settings (book_id, starred)')
    
    // 创建供应商表
    db.exec(`
      CREATE TABLE IF NOT EXISTS providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        key TEXT NOT NULL,
        is_builtin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 创建模型表
    db.exec(`
      CREATE TABLE IF NOT EXISTS models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER NOT NULL,
        model TEXT NOT NULL,
        tags TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE
      )
    `)
    
    // 创建模型表索引
    db.exec('CREATE INDEX IF NOT EXISTS idx_models_provider_id ON models (provider_id)')
    
    // 创建功能配置表
    db.exec(`
      CREATE TABLE IF NOT EXISTS feature_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_name TEXT NOT NULL,
        provider_id INTEGER NOT NULL,
        model_id INTEGER NOT NULL,
        temperature REAL DEFAULT 0.7,
        top_p REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE,
        FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE,
        UNIQUE(feature_name)
      )
    `)
    
    // 创建功能配置表索引
    db.exec('CREATE INDEX IF NOT EXISTS idx_feature_configs_feature_name ON feature_configs (feature_name)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_feature_configs_provider_id ON feature_configs (provider_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_feature_configs_model_id ON feature_configs (model_id)')
    
    // 创建用量统计表
    db.exec(`
      CREATE TABLE IF NOT EXISTS usage_statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        provider_id INTEGER NOT NULL,
        model_id INTEGER NOT NULL,
        feature_name TEXT NOT NULL,
        mode TEXT NOT NULL,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE,
        FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE
      )
    `)
    
    // 创建用量统计表索引
    db.exec('CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_statistics (timestamp)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_usage_provider_id ON usage_statistics (provider_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_usage_model_id ON usage_statistics (model_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_usage_feature_name ON usage_statistics (feature_name)')

    // 创建章节向量存储表（使用 vec0 的向量类型）
    db.exec(`
      CREATE TABLE IF NOT EXISTS chapter_vectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        chapter_id INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding BLOB NOT NULL,
        token_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
        FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE CASCADE,
        UNIQUE(book_id, chapter_id, chunk_index)
      )
    `)

    // 创建设定向量存储表（使用 vec0 的向量类型）
    db.exec(`
      CREATE TABLE IF NOT EXISTS setting_vectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        setting_id INTEGER NOT NULL,
        setting_content TEXT NOT NULL,
        embedding BLOB NOT NULL,
        token_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
        FOREIGN KEY (setting_id) REFERENCES settings (id) ON DELETE CASCADE,
        UNIQUE(book_id, setting_id)
      )
    `)

    // 创建向量表索引
    db.exec('CREATE INDEX IF NOT EXISTS idx_chapter_vectors_book_id ON chapter_vectors (book_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_chapter_vectors_chapter_id ON chapter_vectors (chapter_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_setting_vectors_book_id ON setting_vectors (book_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_setting_vectors_setting_id ON setting_vectors (setting_id)')
    
    // 创建提示词表
    db.exec(`
      CREATE TABLE IF NOT EXISTS prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        description TEXT DEFAULT '',
        author TEXT DEFAULT '',
        version TEXT DEFAULT '',
        url TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 创建提示词选择表
    db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_selections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL UNIQUE,
        prompt_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prompt_id) REFERENCES prompts (id) ON DELETE CASCADE
      )
    `)
    
    // 创建提示词表索引
    db.exec('CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts (category)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_prompts_is_default ON prompts (category, is_default)')
    
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

// 设定相关操作
interface Setting {
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

interface CreateSettingData {
  book_id: number
  type: string
  name: string
  content?: string
  status?: string
  starred?: boolean
}

interface UpdateSettingData {
  type?: string
  name?: string
  content?: string
  status?: string
  starred?: boolean
}

// 设定相关操作
interface Setting {
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

interface CreateSettingData {
  book_id: number
  type: string
  name: string
  content?: string
  status?: string
  starred?: boolean
}

interface UpdateSettingData {
  type?: string
  name?: string
  content?: string
  status?: string
  starred?: boolean
}

// 供应商相关操作
interface Provider {
  id: number
  name: string
  url: string
  key: string
  is_builtin: number
  created_at: string
  updated_at: string
}

interface CreateProviderData {
  name: string
  url: string
  key: string
  is_builtin?: number
}

interface UpdateProviderData {
  name?: string
  url?: string
  key?: string
  is_builtin?: number
}

// 模型相关操作
interface Model {
  id: number
  provider_id: number
  model: string
  tags: string
  created_at: string
  updated_at: string
}

interface CreateModelData {
  provider_id: number
  model: string
  tags?: string
}

interface UpdateModelData {
  provider_id?: number
  model?: string
  tags?: string
}

// 功能配置相关操作
interface FeatureConfig {
  id: number
  feature_name: string
  provider_id: number
  model_id: number
  temperature: number
  top_p: number
  created_at: string
  updated_at: string
}

interface CreateFeatureConfigData {
  feature_name: string
  provider_id: number
  model_id: number
  temperature?: number
  top_p?: number
}

interface UpdateFeatureConfigData {
  provider_id?: number
  model_id?: number
  temperature?: number
  top_p?: number
}

// 用量统计相关操作
interface UsageStatistic {
  id: number
  timestamp: string
  provider_id: number
  model_id: number
  feature_name: string
  mode: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

interface CreateUsageStatisticData {
  provider_id: number
  model_id: number
  feature_name: string
  mode: string
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
}

// 章节相关操作
interface Chapter {
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

interface CreateChapterData {
  book_id: number
  title: string
  content?: string
  summary?: string
  review_data?: string
  order_index?: number
}

interface UpdateChapterData {
  title?: string
  content?: string
  summary?: string
  review_data?: string
  order_index?: number
}

// 章节向量相关操作
interface ChapterVector {
  id: number
  book_id: number
  chapter_id: number
  chunk_index: number
  chunk_text: string
  embedding: Buffer
  token_count: number
  created_at: string
  updated_at: string
}

interface CreateChapterVectorData {
  book_id: number
  chapter_id: number
  chunk_index: number
  chunk_text: string
  embedding: Buffer
  token_count?: number
}

interface UpdateChapterVectorData {
  chunk_text?: string
  embedding?: Buffer
  token_count?: number
}

// 设定向量相关操作
interface SettingVector {
  id: number
  book_id: number
  setting_id: number
  setting_content: string
  embedding: Buffer
  token_count: number
  created_at: string
  updated_at: string
}

interface CreateSettingVectorData {
  book_id: number
  setting_id: number
  setting_content: string
  embedding: Buffer
  token_count?: number
}

interface UpdateSettingVectorData {
  setting_content?: string
  embedding?: Buffer
  token_count?: number
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
    
    // 删除所有设定
    db.exec('DELETE FROM settings')
    
    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name IN ("books", "chapters", "settings")')
    
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

// 设定相关操作函数

// 根据书籍ID获取所有设定
function getSettingsByBookId(bookId: number): Setting[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM settings
    WHERE book_id = ?
    ORDER BY starred DESC, updated_at DESC
  `)
  return stmt.all(bookId) as Setting[]
}

// 根据书籍ID和类型获取设定
function getSettingsByType(bookId: number, type: string): Setting[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM settings
    WHERE book_id = ? AND type = ?
    ORDER BY starred DESC, updated_at DESC
  `)
  return stmt.all(bookId, type) as Setting[]
}

// 根据ID获取设定
function getSettingById(id: number): Setting | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM settings WHERE id = ?')
  return stmt.get(id) as Setting | undefined
}

// 创建新设定
function createSetting(data: CreateSettingData): Setting {
  const db = getDatabase()
  
  // 首先验证书籍是否存在
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
function updateSetting(id: number, data: UpdateSettingData): Setting {
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
function deleteSetting(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM settings WHERE id = ?')
  stmt.run(id)
}

// 切换设定星标状态
function toggleSettingStar(id: number): Setting {
  const db = getDatabase()
  const stmt = db.prepare(`
    UPDATE settings
    SET starred = CASE WHEN starred = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(id)
  
  return getSettingById(id)!
}

// 供应商相关操作函数

// 获取所有供应商
function getAllProviders(): Provider[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM providers')
  return stmt.all() as Provider[]
}

// 根据ID获取供应商
function getProviderById(id: number): Provider | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM providers WHERE id = ?')
  return stmt.get(id) as Provider | undefined
}

// 创建新供应商
function createProvider(data: CreateProviderData): Provider {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO providers (name, url, key, is_builtin) VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(data.name, data.url, data.key, data.is_builtin ?? 0)
  
  return getProviderById(result.lastInsertRowid as number)!
}

// 更新供应商
function updateProvider(id: number, data: UpdateProviderData): Provider {
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
function deleteProvider(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM providers WHERE id = ?')
  stmt.run(id)
}

// 模型相关操作函数

// 根据供应商ID获取所有模型
function getModelsByProviderId(providerId: number): Model[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM models
    WHERE provider_id = ?
  `)
  return stmt.all(providerId) as Model[]
}

// 根据ID获取模型
function getModelById(id: number): Model | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM models WHERE id = ?')
  return stmt.get(id) as Model | undefined
}

// 创建新模型
function createModel(data: CreateModelData): Model {
  const db = getDatabase()
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
function updateModel(id: number, data: UpdateModelData): Model {
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
function deleteModel(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM models WHERE id = ?')
  stmt.run(id)
}

// 功能配置相关操作函数

// 获取所有功能配置
function getAllFeatureConfigs(): FeatureConfig[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT fc.*, p.name as provider_name, m.model as model_name
    FROM feature_configs fc
    JOIN providers p ON fc.provider_id = p.id
    JOIN models m ON fc.model_id = m.id
  `)
  return stmt.all() as FeatureConfig[]
}

// 根据功能名称获取配置
function getFeatureConfigByName(featureName: string): FeatureConfig | undefined {
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
function createFeatureConfig(data: CreateFeatureConfigData): FeatureConfig {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO feature_configs (feature_name, provider_id, model_id, temperature, top_p)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.feature_name,
    data.provider_id,
    data.model_id,
    data.temperature ?? 0.7,
    data.top_p ?? 1.0
  )
  
  return getFeatureConfigById(result.lastInsertRowid as number)!
}

// 根据ID获取功能配置
function getFeatureConfigById(id: number): FeatureConfig | undefined {
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
function updateFeatureConfig(featureName: string, data: UpdateFeatureConfigData): FeatureConfig {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.provider_id !== undefined) {
    fields.push('provider_id = ?')
    values.push(data.provider_id)
  }
  if (data.model_id !== undefined) {
    fields.push('model_id = ?')
    values.push(data.model_id)
  }
  if (data.temperature !== undefined) {
    fields.push('temperature = ?')
    values.push(data.temperature)
  }
  if (data.top_p !== undefined) {
    fields.push('top_p = ?')
    values.push(data.top_p)
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

// 用量统计相关操作函数

// 创建用量统计记录
function createUsageStatistic(data: CreateUsageStatisticData): UsageStatistic {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO usage_statistics (provider_id, model_id, feature_name, mode, input_tokens, output_tokens, total_tokens)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.provider_id,
    data.model_id,
    data.feature_name,
    data.mode,
    data.input_tokens || 0,
    data.output_tokens || 0,
    data.total_tokens || 0
  )
  
  return getUsageStatisticById(result.lastInsertRowid as number)!
}

// 根据ID获取用量统计记录
function getUsageStatisticById(id: number): UsageStatistic | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM usage_statistics WHERE id = ?')
  return stmt.get(id) as UsageStatistic | undefined
}

// 获取所有用量统计记录
function getAllUsageStatistics(): UsageStatistic[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT us.*, p.name as provider_name, m.model as model_name
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    JOIN models m ON us.model_id = m.id
    ORDER BY us.timestamp DESC
  `)
  return stmt.all() as UsageStatistic[]
}

// 获取指定时间范围内的用量统计记录
function getUsageStatisticsByDateRange(startDate: string, endDate: string): UsageStatistic[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT us.*, p.name as provider_name, m.model as model_name
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    JOIN models m ON us.model_id = m.id
    WHERE us.timestamp >= ? AND us.timestamp <= ?
    ORDER BY us.timestamp DESC
  `)
  return stmt.all(startDate, endDate) as UsageStatistic[]
}

// 获取指定供应商的用量统计记录
function getUsageStatisticsByProvider(providerId: number): UsageStatistic[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT us.*, p.name as provider_name, m.model as model_name
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    JOIN models m ON us.model_id = m.id
    WHERE us.provider_id = ?
    ORDER BY us.timestamp DESC
  `)
  return stmt.all(providerId) as UsageStatistic[]
}

// 获取指定模型的用量统计记录
function getUsageStatisticsByModel(modelId: number): UsageStatistic[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT us.*, p.name as provider_name, m.model as model_name
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    JOIN models m ON us.model_id = m.id
    WHERE us.model_id = ?
    ORDER BY us.timestamp DESC
  `)
  return stmt.all(modelId) as UsageStatistic[]
}

// 获取用量统计汇总信息
function getUsageStatisticsSummary(): {
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  providers: Array<{
    provider_id: number
    provider_name: string
    total_calls: number
    total_tokens: number
  }>
  models: Array<{
    model_id: number
    model_name: string
    provider_name: string
    total_calls: number
    total_tokens: number
  }>
} {
  const db = getDatabase()
  
  // 获取总体统计
  const totalStats = db.prepare(`
    SELECT
      COUNT(*) as total_calls,
      SUM(input_tokens) as total_input_tokens,
      SUM(output_tokens) as total_output_tokens,
      SUM(total_tokens) as total_tokens
    FROM usage_statistics
  `).get() as {
    total_calls: number
    total_input_tokens: number
    total_output_tokens: number
    total_tokens: number
  }
  
  // 获取按供应商统计
  const providerStats = db.prepare(`
    SELECT
      us.provider_id,
      p.name as provider_name,
      COUNT(*) as total_calls,
      SUM(us.total_tokens) as total_tokens
    FROM usage_statistics us
    JOIN providers p ON us.provider_id = p.id
    GROUP BY us.provider_id, p.name
    ORDER BY total_tokens DESC
  `).all() as Array<{
    provider_id: number
    provider_name: string
    total_calls: number
    total_tokens: number
  }>
  
  // 获取按模型统计
  const modelStats = db.prepare(`
    SELECT
      us.model_id,
      m.model as model_name,
      p.name as provider_name,
      COUNT(*) as total_calls,
      SUM(us.total_tokens) as total_tokens
    FROM usage_statistics us
    JOIN models m ON us.model_id = m.id
    JOIN providers p ON us.provider_id = p.id
    GROUP BY us.model_id, m.model, p.name
    ORDER BY total_tokens DESC
  `).all() as Array<{
    model_id: number
    model_name: string
    provider_name: string
    total_calls: number
    total_tokens: number
  }>
  
  return {
    total_calls: totalStats.total_calls || 0,
    total_input_tokens: totalStats.total_input_tokens || 0,
    total_output_tokens: totalStats.total_output_tokens || 0,
    total_tokens: totalStats.total_tokens || 0,
    providers: providerStats,
    models: modelStats
  }
}

// 章节向量相关操作函数

// 根据章节ID获取所有向量
function getChapterVectorsByChapterId(chapterId: number): ChapterVector[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM chapter_vectors
    WHERE chapter_id = ?
    ORDER BY chunk_index ASC
  `)
  return stmt.all(chapterId) as ChapterVector[]
}

// 根据书籍ID获取所有向量
function getChapterVectorsByBookId(bookId: number): ChapterVector[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM chapter_vectors
    WHERE book_id = ?
    ORDER BY chapter_id ASC, chunk_index ASC
  `)
  return stmt.all(bookId) as ChapterVector[]
}

// 创建章节向量
function createChapterVector(data: CreateChapterVectorData): ChapterVector {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO chapter_vectors (book_id, chapter_id, chunk_index, chunk_text, embedding, token_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.book_id,
    data.chapter_id,
    data.chunk_index,
    data.chunk_text,
    data.embedding,
    data.token_count || 0
  )

  return getChapterVectorById(result.lastInsertRowid as number)!
}

// 根据ID获取章节向量
function getChapterVectorById(id: number): ChapterVector | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM chapter_vectors WHERE id = ?')
  return stmt.get(id) as ChapterVector | undefined
}

// 更新章节向量
function updateChapterVector(id: number, data: UpdateChapterVectorData): ChapterVector {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.chunk_text !== undefined) {
    fields.push('chunk_text = ?')
    values.push(data.chunk_text)
  }
  if (data.embedding !== undefined) {
    fields.push('embedding = ?')
    values.push(data.embedding)
  }
  if (data.token_count !== undefined) {
    fields.push('token_count = ?')
    values.push(data.token_count)
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE chapter_vectors SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)
  }

  return getChapterVectorById(id)!
}

// 删除章节向量
function deleteChapterVector(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM chapter_vectors WHERE id = ?')
  stmt.run(id)
}

// 删除章节的所有向量
function deleteChapterVectorsByChapterId(chapterId: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM chapter_vectors WHERE chapter_id = ?')
  stmt.run(chapterId)
}

// 删除书籍的所有章节向量
function deleteChapterVectorsByBookId(bookId: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM chapter_vectors WHERE book_id = ?')
  stmt.run(bookId)
}

// 设定向量相关操作函数

// 根据设定ID获取向量
function getSettingVectorBySettingId(settingId: number): SettingVector | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM setting_vectors WHERE setting_id = ?')
  return stmt.get(settingId) as SettingVector | undefined
}

// 根据书籍ID获取所有设定向量
function getSettingVectorsByBookId(bookId: number): SettingVector[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM setting_vectors
    WHERE book_id = ?
    ORDER BY created_at ASC
  `)
  return stmt.all(bookId) as SettingVector[]
}

// 创建设定向量
function createSettingVector(data: CreateSettingVectorData): SettingVector {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO setting_vectors (book_id, setting_id, setting_content, embedding, token_count)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.book_id,
    data.setting_id,
    data.setting_content,
    data.embedding,
    data.token_count || 0
  )

  return getSettingVectorById(result.lastInsertRowid as number)!
}

// 根据ID获取设定向量
function getSettingVectorById(id: number): SettingVector | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM setting_vectors WHERE id = ?')
  return stmt.get(id) as SettingVector | undefined
}

// 更新设定向量
function updateSettingVector(id: number, data: UpdateSettingVectorData): SettingVector {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.setting_content !== undefined) {
    fields.push('setting_content = ?')
    values.push(data.setting_content)
  }
  if (data.embedding !== undefined) {
    fields.push('embedding = ?')
    values.push(data.embedding)
  }
  if (data.token_count !== undefined) {
    fields.push('token_count = ?')
    values.push(data.token_count)
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE setting_vectors SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)
  }

  return getSettingVectorById(id)!
}

// 删除设定向量
function deleteSettingVector(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM setting_vectors WHERE id = ?')
  stmt.run(id)
}

// 根据设定ID删除向量
function deleteSettingVectorBySettingId(settingId: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM setting_vectors WHERE setting_id = ?')
  stmt.run(settingId)
}

// 删除书籍的所有设定向量
function deleteSettingVectorsByBookId(bookId: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM setting_vectors WHERE book_id = ?')
  stmt.run(bookId)
}

// 向量相似度搜索函数
// 注意：这里需要根据实际的向量数据库和相似度计算方法来实现
// 由于SQLite没有内置的向量相似度函数，这里提供基本的接口

// 在书籍内搜索相似的文本块
function searchSimilarChapterVectors(
  bookId: number,
  queryEmbedding: Buffer,
  limit: number = 5,
  excludeChapterId?: number
): ChapterVector[] {
  const db = getDatabase()

  try {
    // 使用 vec0 的向量相似度搜索功能
    const stmt = db.prepare(`
      SELECT
        cv.*,
        vec_distance_L2(cv.embedding, ?) as distance
      FROM chapter_vectors cv
      WHERE cv.book_id = ? ${excludeChapterId ? 'AND cv.chapter_id != ?' : ''}
      ORDER BY distance ASC
      LIMIT ?
    `)

    const params = excludeChapterId
      ? [queryEmbedding, bookId, excludeChapterId, limit]
      : [queryEmbedding, bookId, limit]
    return stmt.all(...params) as ChapterVector[]
  } catch (error) {
    console.error('Vector search failed, falling back to simple search:', error)
    // 如果 vec0 不可用，返回空数组
    return []
  }
}

// 在书籍内搜索相似的设定
function searchSimilarSettingVectors(
  bookId: number,
  queryEmbedding: Buffer,
  limit: number = 3
): SettingVector[] {
  const db = getDatabase()

  try {
    // 使用 vec0 的向量相似度搜索功能
    const stmt = db.prepare(`
      SELECT
        sv.*,
        vec_distance_L2(sv.embedding, ?) as distance
      FROM setting_vectors sv
      WHERE sv.book_id = ?
      ORDER BY distance ASC
      LIMIT ?
    `)

    return stmt.all(queryEmbedding, bookId, limit) as SettingVector[]
  } catch (error) {
    console.error('Vector search failed, falling back to simple search:', error)
    // 如果 vec0 不可用，返回空数组
    return []
  }
}

// 提示词相关数据结构
interface Prompt {
  id: number
  name: string
  content: string
  category: string
  is_default: number
  description: string
  author: string
  version: string
  url: string
  created_at: string
  updated_at: string
}

interface CreatePromptData {
  name: string
  content: string
  category: string
  is_default?: number
  description?: string
  author?: string
  version?: string
  url?: string
}

interface UpdatePromptData {
  name?: string
  content?: string
  category?: string
  is_default?: number
  description?: string
  author?: string
  version?: string
  url?: string
}

interface PromptSelection {
  id: number
  category: string
  prompt_id: number
  created_at: string
  updated_at: string
}

interface CreatePromptSelectionData {
  category: string
  prompt_id: number
}

// 获取所有提示词
function getAllPrompts(): Prompt[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompts ORDER BY category, is_default DESC, name')
  return stmt.all() as Prompt[]
}

// 根据分类获取提示词
function getPromptsByCategory(category: string): Prompt[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompts WHERE category = ? ORDER BY is_default DESC, name')
  return stmt.all(category) as Prompt[]
}

// 根据ID获取提示词
function getPromptById(id: number): Prompt | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompts WHERE id = ?')
  return stmt.get(id) as Prompt | undefined
}

// 创建新提示词
function createPrompt(data: CreatePromptData): Prompt {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO prompts (name, content, category, is_default, description, author, version, url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.name,
    data.content,
    data.category,
    data.is_default ?? 0,
    data.description || '',
    data.author || '',
    data.version || '',
    data.url || ''
  )
  
  return getPromptById(result.lastInsertRowid as number)!
}

// 更新提示词
function updatePrompt(id: number, data: UpdatePromptData): Prompt {
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.content !== undefined) {
    fields.push('content = ?')
    values.push(data.content)
  }
  if (data.category !== undefined) {
    fields.push('category = ?')
    values.push(data.category)
  }
  if (data.is_default !== undefined) {
    fields.push('is_default = ?')
    values.push(data.is_default)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }
  if (data.author !== undefined) {
    fields.push('author = ?')
    values.push(data.author)
  }
  if (data.version !== undefined) {
    fields.push('version = ?')
    values.push(data.version)
  }
  if (data.url !== undefined) {
    fields.push('url = ?')
    values.push(data.url)
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE prompts SET ${fields.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)
  }

  return getPromptById(id)!
}

// 删除提示词
function deletePrompt(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM prompts WHERE id = ?')
  stmt.run(id)
}

// 获取提示词选择
function getPromptSelectionByCategory(category: string): PromptSelection | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompt_selections WHERE category = ?')
  return stmt.get(category) as PromptSelection | undefined
}

// 获取所有提示词选择
function getAllPromptSelections(): PromptSelection[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompt_selections')
  return stmt.all() as PromptSelection[]
}

// 创建或更新提示词选择
function setPromptSelection(data: CreatePromptSelectionData): PromptSelection {
  const db = getDatabase()
  
  // 检查是否已存在该分类的选择
  const existing = getPromptSelectionByCategory(data.category)
  
  if (existing) {
    // 更新现有选择
    const stmt = db.prepare(`
      UPDATE prompt_selections SET prompt_id = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ?
    `)
    stmt.run(data.prompt_id, data.category)
    return getPromptSelectionByCategory(data.category)!
  } else {
    // 创建新选择
    const stmt = db.prepare(`
      INSERT INTO prompt_selections (category, prompt_id) VALUES (?, ?)
    `)
    const result = stmt.run(data.category, data.prompt_id)
    
    const stmt2 = db.prepare('SELECT * FROM prompt_selections WHERE id = ?')
    return stmt2.get(result.lastInsertRowid) as PromptSelection
  }
}

// 删除提示词选择
function deletePromptSelection(category: string): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM prompt_selections WHERE category = ?')
  stmt.run(category)
}

// 获取分类的默认提示词
function getDefaultPromptByCategory(category: string): Prompt | undefined {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT p.* FROM prompts p
    WHERE p.category = ? AND p.is_default = 1
    ORDER BY p.id
    LIMIT 1
  `)
  return stmt.get(category) as Prompt | undefined
}

// 获取分类的已选择提示词
function getSelectedPromptByCategory(category: string): Prompt | undefined {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT p.* FROM prompts p
    JOIN prompt_selections ps ON p.id = ps.prompt_id
    WHERE ps.category = ?
    LIMIT 1
  `)
  return stmt.get(category) as Prompt | undefined
}

// 设置分类的默认提示词
function setDefaultPromptForCategory(category: string, promptId: number): void {
  const db = getDatabase()
  
  // 首先将该分类下所有提示词的is_default设为0
  const stmt1 = db.prepare('UPDATE prompts SET is_default = 0 WHERE category = ?')
  stmt1.run(category)
  
  // 然后将指定提示词的is_default设为1
  const stmt2 = db.prepare('UPDATE prompts SET is_default = 1 WHERE id = ?')
  stmt2.run(promptId)
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
  resetDatabase,
  getSettingsByBookId,
  getSettingsByType,
  getSettingById,
  createSetting,
  updateSetting,
  deleteSetting,
  toggleSettingStar,
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getModelsByProviderId,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  getAllFeatureConfigs,
  getFeatureConfigByName,
  createFeatureConfig,
  updateFeatureConfig,
  getFeatureConfigById,
  createUsageStatistic,
  getUsageStatisticById,
  getAllUsageStatistics,
  getUsageStatisticsByDateRange,
  getUsageStatisticsByProvider,
  getUsageStatisticsByModel,
  getUsageStatisticsSummary,
  // 章节向量相关
  getChapterVectorsByChapterId,
  getChapterVectorsByBookId,
  createChapterVector,
  getChapterVectorById,
  updateChapterVector,
  deleteChapterVector,
  deleteChapterVectorsByChapterId,
  deleteChapterVectorsByBookId,
  // 设定向量相关
  getSettingVectorBySettingId,
  getSettingVectorsByBookId,
  createSettingVector,
  getSettingVectorById,
  updateSettingVector,
  deleteSettingVector,
  deleteSettingVectorBySettingId,
  deleteSettingVectorsByBookId,
  // 向量搜索
  searchSimilarChapterVectors,
  searchSimilarSettingVectors,
  // 提示词相关
  getAllPrompts,
  getPromptsByCategory,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  getPromptSelectionByCategory,
  getAllPromptSelections,
  setPromptSelection,
  deletePromptSelection,
  getDefaultPromptByCategory,
  getSelectedPromptByCategory,
  setDefaultPromptForCategory
}