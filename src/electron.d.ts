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
      updateBook: (id: number, data: { name: string }) => Promise<Book>
      deleteBook: (id: number) => Promise<{ success: boolean }>
    }
  }
}

// 书籍类型定义
export interface Book {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export {}
