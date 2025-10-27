import { ipcMain } from 'electron'
import { ProviderService } from '../services/provider-service'
import { getProviderById } from '../database/models/provider'

export function registerProviderHandlers(): void {
  console.log('Registering provider handlers...')

  ipcMain.handle('get-providers', async () => {
    try {
      return await ProviderService.getAllProviders()
    } catch (error) {
      console.error('Error in get-providers handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-provider', async (_event, id: number) => {
    try {
      return getProviderById(id)
    } catch (error) {
      console.error('Error in get-provider handler:', error)
      throw error
    }
  })

  ipcMain.handle('create-provider', async (_event, data: { name: string; url: string; key: string; is_builtin?: number }) => {
    try {
      return await ProviderService.createProvider(data)
    } catch (error) {
      console.error('Error in create-provider handler:', error)
      throw error
    }
  })

  ipcMain.handle('update-provider', async (_event, id: number, data: { name?: string; url?: string; key?: string; is_builtin?: number }) => {
    try {
      return await ProviderService.updateProvider(id, data)
    } catch (error) {
      console.error('Error in update-provider handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-provider', async (_event, id: number) => {
    try {
      await ProviderService.deleteProvider(id)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-provider handler:', error)
      throw error
    }
  })

  console.log('Provider handlers registered')
}