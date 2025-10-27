import { ipcMain } from 'electron'
import { ModelService } from '../services/model-service'
import { getModelById } from '../database/models/model'

export function registerModelHandlers(): void {
  console.log('Registering model handlers...')

  ipcMain.handle('get-models', async (_event, providerId: number) => {
    try {
      return await ModelService.getModelsByProviderId(providerId)
    } catch (error) {
      console.error('Error in get-models handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-model', async (_event, id: number) => {
    try {
      return getModelById(id)
    } catch (error) {
      console.error('Error in get-model handler:', error)
      throw error
    }
  })

  ipcMain.handle('create-model', async (_event, data: { provider_id: number; model: string; tags?: string }) => {
    try {
      return await ModelService.createModel(data)
    } catch (error) {
      console.error('Error in create-model handler:', error)
      throw error
    }
  })

  ipcMain.handle('update-model', async (_event, id: number, data: { provider_id?: number; model?: string; tags?: string }) => {
    try {
      return await ModelService.updateModel(id, data)
    } catch (error) {
      console.error('Error in update-model handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-model', async (_event, id: number) => {
    try {
      await ModelService.deleteModel(id)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-model handler:', error)
      throw error
    }
  })

  console.log('Model handlers registered')
}