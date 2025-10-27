import { getDatabase } from '../connection'

// 数据接口定义
export interface Prompt {
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

export interface CreatePromptData {
  name: string
  content: string
  category: string
  is_default?: number
  description?: string
  author?: string
  version?: string
  url?: string
}

export interface UpdatePromptData {
  name?: string
  content?: string
  category?: string
  is_default?: number
  description?: string
  author?: string
  version?: string
  url?: string
}

export interface PromptSelection {
  id: number
  category: string
  prompt_id: number
  created_at: string
  updated_at: string
}

export interface CreatePromptSelectionData {
  category: string
  prompt_id: number
}

// 获取所有提示词
export function getAllPrompts(): Prompt[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompts ORDER BY category, is_default DESC, name')
  return stmt.all() as Prompt[]
}

// 根据分类获取提示词
export function getPromptsByCategory(category: string): Prompt[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompts WHERE category = ? ORDER BY is_default DESC, name')
  return stmt.all(category) as Prompt[]
}

// 根据ID获取提示词
export function getPromptById(id: number): Prompt | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompts WHERE id = ?')
  return stmt.get(id) as Prompt | undefined
}

// 创建新提示词
export function createPrompt(data: CreatePromptData): Prompt {
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
export function updatePrompt(id: number, data: UpdatePromptData): Prompt {
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
export function deletePrompt(id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM prompts WHERE id = ?')
  stmt.run(id)
}

// 获取提示词选择
export function getPromptSelectionByCategory(category: string): PromptSelection | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompt_selections WHERE category = ?')
  return stmt.get(category) as PromptSelection | undefined
}

// 获取所有提示词选择
export function getAllPromptSelections(): PromptSelection[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM prompt_selections')
  return stmt.all() as PromptSelection[]
}

// 创建或更新提示词选择
export function setPromptSelection(data: CreatePromptSelectionData): PromptSelection {
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
export function deletePromptSelection(category: string): void {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM prompt_selections WHERE category = ?')
  stmt.run(category)
}

// 获取分类的默认提示词
export function getDefaultPromptByCategory(category: string): Prompt | undefined {
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
export function getSelectedPromptByCategory(category: string): Prompt | undefined {
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
export function setDefaultPromptForCategory(category: string, promptId: number): void {
  const db = getDatabase()

  // 首先将该分类下所有提示词的is_default设为0
  const stmt1 = db.prepare('UPDATE prompts SET is_default = 0 WHERE category = ?')
  stmt1.run(category)

  // 然后将指定提示词的is_default设为1
  const stmt2 = db.prepare('UPDATE prompts SET is_default = 1 WHERE id = ?')
  stmt2.run(promptId)
}

// 重置数据库 - 删除所有提示词相关数据
export function resetPrompts(): void {
  try {
    const db = getDatabase()

    // 删除所有提示词选择
    db.exec('DELETE FROM prompt_selections')
    // 删除所有提示词
    db.exec('DELETE FROM prompts')

    // 重置自增ID
    db.exec('DELETE FROM sqlite_sequence WHERE name IN ("prompts", "prompt_selections")')

    console.log('Prompts tables reset successfully')
  } catch (error) {
    console.error('Failed to reset prompts tables:', error)
    throw error
  }
}