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
  const stmt = db.prepare('SELECT * FROM providers ORDER BY name ASC')
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
    ORDER BY model ASC
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
  initializeFeatureNames,
  getFeatureConfigById
}

// 功能配置相关操作函数

// 初始化功能名称（只创建不存在的功能配置，供应商和模型为空）
function initializeFeatureNames(featureNames: string[]): void {
  // 检查每个功能名称是否存在，如果不存在则创建空配置
  for (const featureName of featureNames) {
    const existingConfig = getFeatureConfigByName(featureName)
    if (!existingConfig) {
      // 创建空配置，供应商和模型ID为0，使用默认参数
      createFeatureConfig({
        feature_name: featureName,
        provider_id: 0,  // 空供应商
        model_id: 0,     // 空模型
        temperature: 0.7,
        top_p: 0.1
      })
      console.log(`Created default config for feature: ${featureName}`)
    }
  }
  
  console.log('Feature names initialization completed')
}

// 获取所有功能配置
function getAllFeatureConfigs(): FeatureConfig[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT fc.*, p.name as provider_name, m.model as model_name
    FROM feature_configs fc
    JOIN providers p ON fc.provider_id = p.id
    JOIN models m ON fc.model_id = m.id
    ORDER BY fc.feature_name ASC
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

