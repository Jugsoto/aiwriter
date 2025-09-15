declare global {
  interface Window {
    electronAPI: {
      // 窗口控制
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      
      // 书籍相关API
      getBooks: () => Promise<Book[]>
      createBook: (data: { name: string }) => Promise<Book>
      updateBook: (id: number, data: { name?: string; global_settings?: string }) => Promise<Book>
      deleteBook: (id: number) => Promise<{ success: boolean }>
      
      // 章节相关API
      getChapters: (bookId: number) => Promise<Chapter[]>
      getChapter: (id: number) => Promise<Chapter | undefined>
      createChapter: (data: { book_id: number; title: string; content?: string; summary?: string; order_index?: number }) => Promise<Chapter>
      updateChapter: (id: number, data: { title?: string; content?: string; summary?: string; order_index?: number }) => Promise<Chapter>
      updateChapterOrder: (id: number, orderIndex: number) => Promise<Chapter>
      deleteChapter: (id: number) => Promise<{ success: boolean }>
      
      // 设定相关API
      getSettings: (bookId: number) => Promise<Setting[]>
      getSettingsByType: (bookId: number, type: string) => Promise<Setting[]>
      getSetting: (id: number) => Promise<Setting | undefined>
      createSetting: (data: { book_id: number; type: string; name: string; content?: string; status?: string; starred?: boolean }) => Promise<Setting>
      updateSetting: (id: number, data: { type?: string; name?: string; content?: string; status?: string; starred?: boolean }) => Promise<Setting>
      deleteSetting: (id: number) => Promise<{ success: boolean }>
      toggleSettingStar: (id: number) => Promise<Setting>
      
      // 数据设置相关API
      getAppDataPath: () => Promise<string>
      openFolder: (folderPath: string) => Promise<{ success: boolean }>
      getFileSize: (filePath: string) => Promise<{ size: number; success: boolean }>
      getFolderSize: (folderPath: string) => Promise<{ size: number; success: boolean }>
      resetData: () => Promise<{ success: boolean; error?: string }>
    }
  }
}

// 书籍类型定义
export interface Book {
  id: number
  name: string
  global_settings: string
  created_at: string
  updated_at: string
}

// 章节类型定义
export interface Chapter {
  id: number
  book_id: number
  title: string
  content: string
  summary: string
  order_index: number
  created_at: string
  updated_at: string
}

// 设定类型定义
export interface Setting {
  id: number
  book_id: number
  type: string
  name: string
  content: string
  status: string
  starred: boolean
  created_at: string
  updated_at: string
}

// export {}
