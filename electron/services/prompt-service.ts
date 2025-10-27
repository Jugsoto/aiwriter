import {
  Prompt,
  CreatePromptData,
  UpdatePromptData,
  PromptSelection,
  CreatePromptSelectionData,
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
} from '../database/models/prompt'

export class PromptService {
  // 获取所有提示词
  static async getAllPrompts(): Promise<Prompt[]> {
    try {
      return getAllPrompts()
    } catch (error) {
      console.error('Failed to get all prompts:', error)
      throw new Error(`获取提示词列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 根据分类获取提示词
  static async getPromptsByCategory(category: string): Promise<Prompt[]> {
    try {
      if (!category || category.trim() === '') {
        throw new Error('分类名称不能为空')
      }

      return getPromptsByCategory(category.trim())
    } catch (error) {
      console.error(`Failed to get prompts by category ${category}:`, error)
      throw new Error(`获取分类提示词失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 根据ID获取提示词
  static async getPromptById(id: number): Promise<Prompt | null> {
    try {
      const prompt = getPromptById(id)
      if (!prompt) {
        return null
      }
      return prompt
    } catch (error) {
      console.error(`Failed to get prompt ${id}:`, error)
      throw new Error(`获取提示词失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 创建新提示词
  static async createPrompt(data: CreatePromptData): Promise<Prompt> {
    try {
      if (!data.name || data.name.trim() === '') {
        throw new Error('提示词名称不能为空')
      }

      if (!data.content || data.content.trim() === '') {
        throw new Error('提示词内容不能为空')
      }

      if (!data.category || data.category.trim() === '') {
        throw new Error('提示词分类不能为空')
      }

      return createPrompt({
        name: data.name.trim(),
        content: data.content.trim(),
        category: data.category.trim(),
        is_default: data.is_default ?? 0,
        description: data.description || '',
        author: data.author || '',
        version: data.version || '',
        url: data.url || ''
      })
    } catch (error) {
      console.error('Failed to create prompt:', error)
      throw new Error(`创建提示词失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 更新提示词
  static async updatePrompt(id: number, data: UpdatePromptData): Promise<Prompt> {
    try {
      const existingPrompt = getPromptById(id)
      if (!existingPrompt) {
        throw new Error(`提示词ID ${id} 不存在`)
      }

      const updateData: UpdatePromptData = {}

      if (data.name !== undefined) {
        if (!data.name || data.name.trim() === '') {
          throw new Error('提示词名称不能为空')
        }
        updateData.name = data.name.trim()
      }

      if (data.content !== undefined) {
        if (!data.content || data.content.trim() === '') {
          throw new Error('提示词内容不能为空')
        }
        updateData.content = data.content.trim()
      }

      if (data.category !== undefined) {
        if (!data.category || data.category.trim() === '') {
          throw new Error('提示词分类不能为空')
        }
        updateData.category = data.category.trim()
      }

      if (data.is_default !== undefined) {
        updateData.is_default = data.is_default
      }

      if (data.description !== undefined) {
        updateData.description = data.description
      }

      if (data.author !== undefined) {
        updateData.author = data.author
      }

      if (data.version !== undefined) {
        updateData.version = data.version
      }

      if (data.url !== undefined) {
        updateData.url = data.url
      }

      return updatePrompt(id, updateData)
    } catch (error) {
      console.error(`Failed to update prompt ${id}:`, error)
      throw new Error(`更新提示词失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除提示词
  static async deletePrompt(id: number): Promise<void> {
    try {
      const existingPrompt = getPromptById(id)
      if (!existingPrompt) {
        throw new Error(`提示词ID ${id} 不存在`)
      }

      // 检查是否是默认提示词
      if (existingPrompt.is_default === 1) {
        throw new Error('不能删除默认提示词')
      }

      // 检查是否有分类选择了此提示词
      const selections = getAllPromptSelections()
      const usedSelections = selections.filter(selection => selection.prompt_id === id)
      if (usedSelections.length > 0) {
        throw new Error('提示词正在被分类使用，无法删除')
      }

      deletePrompt(id)
    } catch (error) {
      console.error(`Failed to delete prompt ${id}:`, error)
      throw new Error(`删除提示词失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 获取提示词选择
  static async getPromptSelection(category: string): Promise<PromptSelection | null> {
    try {
      if (!category || category.trim() === '') {
        throw new Error('分类名称不能为空')
      }

      const selection = getPromptSelectionByCategory(category.trim())
      return selection || null
    } catch (error) {
      console.error(`Failed to get prompt selection for category ${category}:`, error)
      throw new Error(`获取提示词选择失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 获取所有提示词选择
  static async getAllPromptSelections(): Promise<PromptSelection[]> {
    try {
      return getAllPromptSelections()
    } catch (error) {
      console.error('Failed to get all prompt selections:', error)
      throw new Error(`获取所有提示词选择失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 设置提示词选择
  static async setPromptSelection(data: CreatePromptSelectionData): Promise<PromptSelection> {
    try {
      if (!data.category || data.category.trim() === '') {
        throw new Error('分类名称不能为空')
      }

      // 验证提示词是否存在
      const prompt = getPromptById(data.prompt_id)
      if (!prompt) {
        throw new Error(`提示词ID ${data.prompt_id} 不存在`)
      }

      return setPromptSelection({
        category: data.category.trim(),
        prompt_id: data.prompt_id
      })
    } catch (error) {
      console.error('Failed to set prompt selection:', error)
      throw new Error(`设置提示词选择失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除提示词选择
  static async deletePromptSelection(category: string): Promise<void> {
    try {
      if (!category || category.trim() === '') {
        throw new Error('分类名称不能为空')
      }

      deletePromptSelection(category.trim())
    } catch (error) {
      console.error(`Failed to delete prompt selection for category ${category}:`, error)
      throw new Error(`删除提示词选择失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 获取分类的默认提示词
  static async getDefaultPromptByCategory(category: string): Promise<Prompt | null> {
    try {
      if (!category || category.trim() === '') {
        throw new Error('分类名称不能为空')
      }

      const prompt = getDefaultPromptByCategory(category.trim())
      return prompt || null
    } catch (error) {
      console.error(`Failed to get default prompt for category ${category}:`, error)
      throw new Error(`获取默认提示词失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 获取分类的已选择提示词
  static async getSelectedPromptByCategory(category: string): Promise<Prompt | null> {
    try {
      if (!category || category.trim() === '') {
        throw new Error('分类名称不能为空')
      }

      const prompt = getSelectedPromptByCategory(category.trim())
      return prompt || null
    } catch (error) {
      console.error(`Failed to get selected prompt for category ${category}:`, error)
      throw new Error(`获取已选择提示词失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 设置分类的默认提示词
  static async setDefaultPromptForCategory(category: string, promptId: number): Promise<void> {
    try {
      if (!category || category.trim() === '') {
        throw new Error('分类名称不能为空')
      }

      // 验证提示词是否存在
      const prompt = getPromptById(promptId)
      if (!prompt) {
        throw new Error(`提示词ID ${promptId} 不存在`)
      }

      setDefaultPromptForCategory(category.trim(), promptId)
    } catch (error) {
      console.error(`Failed to set default prompt for category ${category}:`, error)
      throw new Error(`设置默认提示词失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 获取提示词分类列表
  static async getPromptCategories(): Promise<string[]> {
    try {
      const prompts = getAllPrompts()
      const categories = [...new Set(prompts.map(prompt => prompt.category))]
      return categories.sort()
    } catch (error) {
      console.error('Failed to get prompt categories:', error)
      throw new Error(`获取提示词分类失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 复制提示词
  static async duplicatePrompt(id: number, newName?: string): Promise<Prompt> {
    try {
      const originalPrompt = getPromptById(id)
      if (!originalPrompt) {
        throw new Error(`提示词ID ${id} 不存在`)
      }

      const name = newName || `${originalPrompt.name} - 副本`

      return createPrompt({
        name: name.trim(),
        content: originalPrompt.content,
        category: originalPrompt.category,
        is_default: 0, // 复制的提示词默认不是默认提示词
        description: originalPrompt.description,
        author: originalPrompt.author,
        version: originalPrompt.version,
        url: originalPrompt.url
      })
    } catch (error) {
      console.error(`Failed to duplicate prompt ${id}:`, error)
      throw new Error(`复制提示词失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}