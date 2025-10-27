import { getDatabase } from '../connection'

// 数据接口定义
export interface ChapterVector {
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

export interface CreateChapterVectorData {
  book_id: number
  chapter_id: number
  chunk_index: number
  chunk_text: string
  embedding: Buffer
  token_count?: number
}

export interface UpdateChapterVectorData {
  chunk_text?: string
  embedding?: Buffer
  token_count?: number
}

export interface SettingVector {
  id: number
  book_id: number
  setting_id: number
  setting_content: string
  embedding: Buffer
  token_count: number
  created_at: string
  updated_at: string
}

export interface CreateSettingVectorData {
  book_id: number
  setting_id: number
  setting_content: string
  embedding: Buffer
  token_count?: number
}

export interface UpdateSettingVectorData {
  setting_content?: string
  embedding?: Buffer
  token_count?: number
}

// 章节向量相关操作

// 根据章节ID获取所有向量
export function getChapterVectorsByChapterId(chapterId: number): ChapterVector[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM chapter_vectors
    WHERE chapter_id = ?
    ORDER BY chunk_index ASC
  `)
  return stmt.all(chapterId) as ChapterVector[]
}

// 根据书籍ID获取所有向量
export function getChapterVectorsByBookId(bookId: number): ChapterVector[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM chapter_vectors
    WHERE book_id = ?
    ORDER BY chapter_id ASC, chunk_index ASC
  `)
  return stmt.all(bookId) as ChapterVector[]
}

// 创建章节向量
export function createChapterVector(data: CreateChapterVectorData): ChapterVector {
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
export function getChapterVectorById(id: number): ChapterVector | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM chapter_vectors WHERE id = ?')
  return stmt.get(id) as ChapterVector | undefined
}

// 更新章节向量
export function updateChapterVector(id: number, data: UpdateChapterVectorData): ChapterVector {
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
export function deleteChapterVector(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM chapter_vectors WHERE id = ?')
  stmt.run(id)
}

// 删除章节的所有向量
export function deleteChapterVectorsByChapterId(chapterId: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM chapter_vectors WHERE chapter_id = ?')
  stmt.run(chapterId)
}

// 删除书籍的所有章节向量
export function deleteChapterVectorsByBookId(bookId: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM chapter_vectors WHERE book_id = ?')
  stmt.run(bookId)
}

// 设定向量相关操作

// 根据设定ID获取向量
export function getSettingVectorBySettingId(settingId: number): SettingVector | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM setting_vectors WHERE setting_id = ?')
  return stmt.get(settingId) as SettingVector | undefined
}

// 根据书籍ID获取所有设定向量
export function getSettingVectorsByBookId(bookId: number): SettingVector[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM setting_vectors
    WHERE book_id = ?
    ORDER BY created_at ASC
  `)
  return stmt.all(bookId) as SettingVector[]
}

// 创建设定向量
export function createSettingVector(data: CreateSettingVectorData): SettingVector {
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
export function getSettingVectorById(id: number): SettingVector | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM setting_vectors WHERE id = ?')
  return stmt.get(id) as SettingVector | undefined
}

// 更新设定向量
export function updateSettingVector(id: number, data: UpdateSettingVectorData): SettingVector {
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
export function deleteSettingVector(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM setting_vectors WHERE id = ?')
  stmt.run(id)
}

// 根据设定ID删除向量
export function deleteSettingVectorBySettingId(settingId: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM setting_vectors WHERE setting_id = ?')
  stmt.run(settingId)
}

// 删除书籍的所有设定向量
export function deleteSettingVectorsByBookId(bookId: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM setting_vectors WHERE book_id = ?')
  stmt.run(bookId)
}

// 向量相似度搜索函数

// 在书籍内搜索相似的文本块
export function searchSimilarChapterVectors(
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
export function searchSimilarSettingVectors(
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

// 重置数据库 - 删除所有向量数据
export function resetVectors(): void {
  try {
    const db = getDatabase()

    // 删除所有向量数据
    db.exec('DELETE FROM chapter_vectors')
    db.exec('DELETE FROM setting_vectors')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name IN ("chapter_vectors", "setting_vectors")')

    console.log('Vector tables reset successfully')
  } catch (error) {
    console.error('Failed to reset vector tables:', error)
    throw error
  }
}