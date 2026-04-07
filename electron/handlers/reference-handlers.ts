import { ipcMain } from 'electron'
import { ReferenceService } from '../services/reference-service'

export function registerReferenceHandlers(): void {
  console.log('Registering reference library handlers...')

  ipcMain.handle('get-references', async (_event, bookId: number) => {
    try {
      return await ReferenceService.getReferencesByBookId(bookId)
    } catch (error) {
      console.error('Error in get-references handler:', error)
      throw error
    }
  })

  ipcMain.handle('get-reference', async (_event, id: number) => {
    try {
      return await ReferenceService.getReferenceById(id)
    } catch (error) {
      console.error('Error in get-reference handler:', error)
      throw error
    }
  })

  ipcMain.handle('create-reference', async (_event, data: {
    book_id: number;
    title: string;
    content: string;
    file_type?: string;
    source_type?: 'manual' | 'import' | 'chapter';
    source_path?: string;
    tags?: string[];
    starred?: boolean;
    metadata?: Record<string, any>
  }) => {
    try {
      return await ReferenceService.createReference(data)
    } catch (error) {
      console.error('Error in create-reference handler:', error)
      throw error
    }
  })

  ipcMain.handle('update-reference', async (_event, id: number, data: {
    title?: string;
    content?: string;
    file_type?: string;
    source_type?: 'manual' | 'import' | 'chapter';
    source_path?: string;
    tags?: string[];
    starred?: boolean;
    metadata?: Record<string, any>
  }) => {
    try {
      return await ReferenceService.updateReference(id, data)
    } catch (error) {
      console.error('Error in update-reference handler:', error)
      throw error
    }
  })

  ipcMain.handle('delete-reference', async (_event, id: number) => {
    try {
      await ReferenceService.deleteReference(id)
      return { success: true }
    } catch (error) {
      console.error('Error in delete-reference handler:', error)
      throw error
    }
  })

  ipcMain.handle('toggle-reference-star', async (_event, id: number) => {
    try {
      return await ReferenceService.toggleReferenceStar(id)
    } catch (error) {
      console.error('Error in toggle-reference-star handler:', error)
      throw error
    }
  })

  ipcMain.handle('search-references', async (_event, bookId: number, query: string, fileType?: string, starredOnly?: boolean) => {
    try {
      return await ReferenceService.searchReferences(bookId, query, fileType, starredOnly)
    } catch (error) {
      console.error('Error in search-references handler:', error)
      throw error
    }
  })

  ipcMain.handle('batch-create-references', async (_event, references: Array<{
    book_id: number;
    title: string;
    content: string;
    file_type?: string;
    source_type?: 'manual' | 'import' | 'chapter';
    source_path?: string;
    tags?: string[];
    starred?: boolean;
    metadata?: Record<string, any>
  }>) => {
    try {
      return await ReferenceService.batchCreateReferences(references)
    } catch (error) {
      console.error('Error in batch-create-references handler:', error)
      throw error
    }
  })

  console.log('Reference library handlers registered')
}
