/**
 * 提示词管理服务
 * 提供提示词的CRUD操作和选择管理功能
 */

import type { Prompt, PromptSelection } from '../electron'

// 获取所有提示词
export async function getAllPrompts(): Promise<Prompt[]> {
  try {
    const prompts = await window.electronAPI.getPrompts()
    return prompts || []
  } catch (error) {
    console.error('获取所有提示词失败:', error)
    throw error
  }
}

// 根据分类获取提示词
export async function getPromptsByCategory(category: string): Promise<Prompt[]> {
  try {
    const prompts = await window.electronAPI.getPromptsByCategory(category)
    return prompts || []
  } catch (error) {
    console.error(`获取分类 ${category} 的提示词失败:`, error)
    throw error
  }
}

// 根据ID获取提示词
export async function getPromptById(id: number): Promise<Prompt | undefined> {
  try {
    const prompt = await window.electronAPI.getPrompt(id)
    return prompt
  } catch (error) {
    console.error(`获取提示词 ${id} 失败:`, error)
    throw error
  }
}

// 创建新提示词
export async function createPrompt(data: {
  name: string
  content: string
  category: string
  is_default?: number
  description?: string
  author?: string
  version?: string
  url?: string
}): Promise<Prompt> {
  try {
    const prompt = await window.electronAPI.createPrompt(data)
    return prompt
  } catch (error) {
    console.error('创建提示词失败:', error)
    throw error
  }
}

// 更新提示词
export async function updatePrompt(id: number, data: {
  name?: string
  content?: string
  category?: string
  is_default?: number
  description?: string
  author?: string
  version?: string
  url?: string
}): Promise<Prompt> {
  try {
    const prompt = await window.electronAPI.updatePrompt(id, data)
    return prompt
  } catch (error) {
    console.error(`更新提示词 ${id} 失败:`, error)
    throw error
  }
}

// 删除提示词
export async function deletePrompt(id: number): Promise<void> {
  try {
    await window.electronAPI.deletePrompt(id)
  } catch (error) {
    console.error(`删除提示词 ${id} 失败:`, error)
    throw error
  }
}

// 获取提示词选择
export async function getPromptSelection(category: string): Promise<PromptSelection | undefined> {
  try {
    const selection = await window.electronAPI.getPromptSelection(category)
    return selection
  } catch (error) {
    console.error(`获取分类 ${category} 的提示词选择失败:`, error)
    throw error
  }
}

// 获取所有提示词选择
export async function getAllPromptSelections(): Promise<PromptSelection[]> {
  try {
    const selections = await window.electronAPI.getAllPromptSelections()
    return selections || []
  } catch (error) {
    console.error('获取所有提示词选择失败:', error)
    throw error
  }
}

// 设置提示词选择
export async function setPromptSelection(data: {
  category: string
  prompt_id: number
}): Promise<PromptSelection> {
  try {
    const selection = await window.electronAPI.setPromptSelection(data)
    return selection
  } catch (error) {
    console.error(`设置提示词选择失败:`, error)
    throw error
  }
}

// 删除提示词选择
export async function deletePromptSelection(category: string): Promise<void> {
  try {
    await window.electronAPI.deletePromptSelection(category)
  } catch (error) {
    console.error(`删除分类 ${category} 的提示词选择失败:`, error)
    throw error
  }
}

// 获取分类的默认提示词
export async function getDefaultPromptByCategory(category: string): Promise<Prompt | undefined> {
  try {
    const prompt = await window.electronAPI.getDefaultPromptByCategory(category)
    return prompt
  } catch (error) {
    console.error(`获取分类 ${category} 的默认提示词失败:`, error)
    throw error
  }
}

// 获取分类的已选择提示词
export async function getSelectedPromptByCategory(category: string): Promise<Prompt | undefined> {
  try {
    const prompt = await window.electronAPI.getSelectedPromptByCategory(category)
    return prompt
  } catch ( error) {
    console.error(`获取分类 ${category} 的已选择提示词失败:`, error)
    throw error
  }
}

// 设置分类的默认提示词
export async function setDefaultPromptForCategory(category: string, promptId: number): Promise<void> {
  try {
    await window.electronAPI.setDefaultPromptForCategory(category, promptId)
  } catch (error) {
    console.error(`设置分类 ${category} 的默认提示词失败:`, error)
    throw error
  }
}

// 提示词分类定义
export const PROMPT_CATEGORIES = [
  {
    key: 'chapter_outline',
    name: '章节细纲',
    description: '用于生成章节详细大纲的提示词',
    icon: 'FileText'
  },
  {
    key: 'content_writing',
    name: '正文写作',
    description: '用于正文内容创作的提示词',
    icon: 'PenTool'
  },
  {
    key: 'chapter_continuation',
    name: '章节续写',
    description: '用于续写章节内容的提示词',
    icon: 'FastForward'
  },
  {
    key: 'chapter_review',
    name: '章节评估',
    description: '用于评估章节质量的提示词',
    icon: 'Award'
  }
] as const

export type PromptCategory = typeof PROMPT_CATEGORIES[number]['key']

// 获取图标组件
export function getCategoryIcon(iconName: string) {
  // 这里返回图标组件，实际使用时需要在组件中导入对应的图标
  return iconName
}