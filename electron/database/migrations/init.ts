import { getDatabase } from '../connection'

// 数据库表结构定义
const TABLE_SCHEMAS = [
  // 创建书籍表
  `CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    global_settings TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 创建章节表
  `CREATE TABLE IF NOT EXISTS chapters (
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
  )`,

  // 创建设定表
  `CREATE TABLE IF NOT EXISTS settings (
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
  )`,

  // 创建供应商表
  `CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    key TEXT NOT NULL,
    is_builtin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 创建模型表
  `CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    model TEXT NOT NULL,
    tags TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE
  )`,

  // 创建功能配置表
  `CREATE TABLE IF NOT EXISTS feature_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    provider_id INTEGER NOT NULL,
    model_id INTEGER NOT NULL,
    temperature REAL DEFAULT 0.7,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE,
    UNIQUE(feature_name)
  )`,

  // 创建用量统计表
  `CREATE TABLE IF NOT EXISTS usage_statistics (
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
  )`,

  // 创建章节向量存储表
  `CREATE TABLE IF NOT EXISTS chapter_vectors (
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
  )`,

  // 创建设定向量存储表
  `CREATE TABLE IF NOT EXISTS setting_vectors (
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
  )`,

  // 创建提示词表
  `CREATE TABLE IF NOT EXISTS prompts (
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
  )`,

  // 创建提示词选择表
  `CREATE TABLE IF NOT EXISTS prompt_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL UNIQUE,
    prompt_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts (id) ON DELETE CASCADE
  )`
]

// 数据库索引定义
const INDEX_SCHEMAS = [
  'CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters (book_id)',
  'CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters (book_id, order_index)',
  'CREATE INDEX IF NOT EXISTS idx_settings_book_id ON settings (book_id)',
  'CREATE INDEX IF NOT EXISTS idx_settings_type ON settings (book_id, type)',
  'CREATE INDEX IF NOT EXISTS idx_settings_starred ON settings (book_id, starred)',
  'CREATE INDEX IF NOT EXISTS idx_models_provider_id ON models (provider_id)',
  'CREATE INDEX IF NOT EXISTS idx_feature_configs_feature_name ON feature_configs (feature_name)',
  'CREATE INDEX IF NOT EXISTS idx_feature_configs_provider_id ON feature_configs (provider_id)',
  'CREATE INDEX IF NOT EXISTS idx_feature_configs_model_id ON feature_configs (model_id)',
  'CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_statistics (timestamp)',
  'CREATE INDEX IF NOT EXISTS idx_usage_provider_id ON usage_statistics (provider_id)',
  'CREATE INDEX IF NOT EXISTS idx_usage_model_id ON usage_statistics (model_id)',
  'CREATE INDEX IF NOT EXISTS idx_usage_feature_name ON usage_statistics (feature_name)',
  'CREATE INDEX IF NOT EXISTS idx_chapter_vectors_book_id ON chapter_vectors (book_id)',
  'CREATE INDEX IF NOT EXISTS idx_chapter_vectors_chapter_id ON chapter_vectors (chapter_id)',
  'CREATE INDEX IF NOT EXISTS idx_setting_vectors_book_id ON setting_vectors (book_id)',
  'CREATE INDEX IF NOT EXISTS idx_setting_vectors_setting_id ON setting_vectors (setting_id)',
  'CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts (category)',
  'CREATE INDEX IF NOT EXISTS idx_prompts_is_default ON prompts (category, is_default)'
]

// 初始化数据库表结构
export function initializeDatabase(): void {
  try {
    const db = getDatabase()
    db.pragma('journal_mode = WAL')
    console.log(`Initializing database at: ${db.name}`)

    // 创建所有表
    for (const schema of TABLE_SCHEMAS) {
      db.exec(schema)
    }

    // 创建所有索引
    for (const schema of INDEX_SCHEMAS) {
      db.exec(schema)
    }

    // 检查现有数据
    const count = db.prepare('SELECT COUNT(*) as count FROM books').get() as { count: number }
    console.log(`Database initialized successfully with ${count.count} existing books`)

  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// 获取数据库版本信息
export function getDatabaseVersion(): string {
  const db = getDatabase()
  const result = db.prepare('SELECT sqlite_version() as version').get() as { version: string }
  return result.version
}