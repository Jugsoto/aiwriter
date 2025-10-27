import { ipcMain } from 'electron'
import { PromptService } from '../services/prompt-service'

export function registerPromptHandlers(): void {
  console.log('Registering prompt handlers...')

  ipcMain.handle('get-prompts', async () => {
    try {
      return await PromptService.getAllPrompts()
    } catch (error) {
      console.error('Error in get-prompts handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-prompts-by-category', async (_event, category: string) => {
    try {
      return await PromptService.getPromptsByCategory(category)
    } catch (error) {
      console.error('Error in get-prompts-by-category handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-prompt', async (_event, id: number) => {
    try {
      return await PromptService.getPromptById(id)
    } catch (error) {
      console.error('Error in get-prompt handler:', error)
      throw error
    }
  })

  ipcMain.handle('create-prompt', async (_event, data: {
    name: string;
    content: string;
    category: string;
    is_default?: number;
    description?: string;
    author?: string;
    version?: string;
    url?: string
  }) => {
    try {
      return await PromptService.createPrompt(data)
    } catch (error) {
      console.error('Error in create-prompt handler:', error)
      throw error
    }
  })

  ipcMain.handle('update-prompt', async (_event, id: number, data: {
    name?: string;
    content?: string;
    category?: string;
    is_default?: number;
    description?: string;
    author?: string;
    version?: string;
    url?: string
  }) => {
    try {
      return await PromptService.updatePrompt(id, data)
    } catch (error) {
      console.error('Error in update-prompt handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-prompt', async (_event, id: number) => {
    try {
      await PromptService.deletePrompt(id)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-prompt handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-prompt-selection', async (_event, category: string) => {
    try {
      return await PromptService.getPromptSelection(category)
    } catch (error) {
      console.error('Error in get-prompt-selection handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-all-prompt-selections', async () => {
    try {
      return await PromptService.getAllPromptSelections()
    } catch (error) {
      console.error('Error in get-all-prompt-selections handler:', error)
      throw error
    }
  })

  ipcMain.handle('set-prompt-selection', async (_event, data: { category: string; prompt_id: number }) => {
    try {
      return await PromptService.setPromptSelection(data)
    } catch (error) {
      console.error('Error in set-prompt-selection handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-prompt-selection', async (_event, category: string) => {
    try {
      await PromptService.deletePromptSelection(category)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-prompt-selection handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-default-prompt-by-category', async (_event, category: string) => {
    try {
      return await PromptService.getDefaultPromptByCategory(category)
    } catch (error) {
      console.error('Error in get-default-prompt-by-category handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-selected-prompt-by-category', async (_event, category: string) => {
    try {
      return await PromptService.getSelectedPromptByCategory(category)
    } catch (error) {
      console.error('Error in get-selected-prompt-by-category handler:', error)
      throw error
    }
  })

  ipcMain.handle('set-default-prompt-for-category', async (_event, category: string, promptId: number) => {
    try {
      await PromptService.setDefaultPromptForCategory(category, promptId)
      return { success: true }
    } catch (error) {
      console.error('Error in set-default-prompt-for-category handler:', error)
      throw error
    }
  })

  console.log('Prompt handlers registered')
}