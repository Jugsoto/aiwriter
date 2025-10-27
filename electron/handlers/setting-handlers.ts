import { ipcMain } from 'electron'
import { SettingService } from '../services/setting-service'

export function registerSettingHandlers(): void {
  console.log('Registering setting handlers...')

  ipcMain.handle('get-settings', async (_event, bookId: number) => {
    try {
      return await SettingService.getSettingsByBookId(bookId)
    } catch (error) {
      console.error('Error in get-settings handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-settings-by-type', async (_event, bookId: number, type: string) => {
    try {
      return await SettingService.getSettingsByType(bookId, type)
    } catch (error) {
      console.error('Error in get-settings-by-type handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-setting', async (_event, id: number) => {
    try {
      return await SettingService.getSettingById(id)
    } catch (error) {
      console.error('Error in get-setting handler:', error)
      throw error
    }
  })

  ipcMain.handle('create-setting', async (_event, data: {
    book_id: number;
    type: string;
    name: string;
    content?: string;
    status?: string;
    starred?: boolean
  }) => {
    try {
      return await SettingService.createSetting(data)
    } catch (error) {
      console.error('Error in create-setting handler:', error)
      throw error
    }
  })

  ipcMain.handle('update-setting', async (_event, id: number, data: {
    type?: string;
    name?: string;
    content?: string;
    status?: string;
    starred?: boolean
  }) => {
    try {
      return await SettingService.updateSetting(id, data)
    } catch (error) {
      console.error('Error in update-setting handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-setting', async (_event, id: number) => {
    try {
      await SettingService.deleteSetting(id)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-setting handler:', error)
      throw error
    }
  })

  ipcMain.handle('toggle-setting-star', async (_event, id: number) => {
    try {
      return await SettingService.toggleSettingStar(id)
    } catch (error) {
      console.error('Error in toggle-setting-star handler:', error)
      throw error
    }
  })

  console.log('Setting handlers registered')
}