// 番茄小说排行榜相关类型定义

export interface Book {
  bookName: string
  author: string
  read_count: string
  wordNumber: string
  creationStatus: string
  bookId?: string
  category?: string
  abstract?: string
  thumbUri?: string
}

export interface DecodedBook {
  bookName: string
  author: string
  readCount: number
  wordCount: number
  status: '连载中' | '已完结'
  bookId?: string
  category?: string
  abstract?: string
  thumbUri?: string
}

export interface RankListResponse {
  data: {
    book_list: Book[]
  }
}

// 排行榜分类
export interface SubCategory {
  id: number
  name: string
}

// 排行榜主榜单
export interface MainBoard {
  id: string
  name: string
  gender: 0 | 1  // 0=女频, 1=男频
  type: 1 | 2    // 1=新书榜, 2=阅读榜
  subCategories: SubCategory[]
}
