// 番茄小说排行榜API服务

import type { Book, DecodedBook, RankListResponse, MainBoard, SubCategory } from '../types/leaderboard'
import { decodeText } from '../utils/fanqieDecoder'

// 男频分类列表
const MALE_CATEGORIES: SubCategory[] = [
  { id: 1141, name: '西方玄幻' },
  { id: 1140, name: '东方仙侠' },
  { id: 8, name: '科幻末世' },
  { id: 261, name: '都市日常' },
  { id: 124, name: '都市修真' },
  { id: 1014, name: '都市高武' },
  { id: 273, name: '历史古代' },
  { id: 27, name: '战神赘婿' },
  { id: 263, name: '都市种田' },
  { id: 258, name: '传统玄幻' },
  { id: 272, name: '历史脑洞' },
  { id: 539, name: '悬疑脑洞' },
  { id: 262, name: '都市脑洞' },
  { id: 257, name: '玄幻脑洞' },
  { id: 751, name: '悬疑灵异' },
  { id: 504, name: '抗战谍战' },
  { id: 746, name: '游戏体育' },
  { id: 718, name: '动漫衍生' },
  { id: 1016, name: '男频衍生' }
]

// 女频分类列表
const FEMALE_CATEGORIES: SubCategory[] = [
  { id: 1139, name: '古风世情' },
  { id: 8, name: '科幻末世' },
  { id: 746, name: '游戏体育' },
  { id: 1015, name: '女频衍生' },
  { id: 248, name: '玄幻言情' },
  { id: 23, name: '种田' },
  { id: 79, name: '年代' },
  { id: 267, name: '现言脑洞' },
  { id: 246, name: '宫斗宅斗' },
  { id: 539, name: '悬疑脑洞' },
  { id: 253, name: '古言脑洞' },
  { id: 24, name: '快穿' },
  { id: 749, name: '青春甜宠' },
  { id: 745, name: '星光璀璨' },
  { id: 747, name: '女频悬疑' },
  { id: 750, name: '职场婚恋' },
  { id: 748, name: '豪门总裁' },
  { id: 1017, name: '民国言情' }
]

// 四个主榜单
export const MAIN_BOARDS: MainBoard[] = [
  {
    id: 'male-reading',
    name: '男频阅读榜',
    gender: 1,
    type: 2,
    subCategories: MALE_CATEGORIES
  },
  {
    id: 'male-new',
    name: '男频新书榜',
    gender: 1,
    type: 1,
    subCategories: MALE_CATEGORIES
  },
  {
    id: 'female-reading',
    name: '女频阅读榜',
    gender: 0,
    type: 2,
    subCategories: FEMALE_CATEGORIES
  },
  {
    id: 'female-new',
    name: '女频新书榜',
    gender: 0,
    type: 1,
    subCategories: FEMALE_CATEGORIES
  }
]

/**
 * 获取排行榜数据
 * @param gender 性别 0=女频, 1=男频
 * @param type 类型 1=新书榜, 2=阅读榜
 * @param categoryId 分类ID
 * @param offset 偏移量
 * @param limit 限制数量
 * @returns 解码后的书籍列表
 */
export async function fetchLeaderboard(
  gender: 0 | 1,
  type: 1 | 2,
  categoryId: number,
  offset: number = 0,
  limit: number = 30
): Promise<DecodedBook[]> {
  try {
    // 使用Electron IPC调用主进程来获取数据，避免CORS问题
    const data: RankListResponse = await window.electronAPI.fetchLeaderboard({
      gender,
      type,
      categoryId,
      offset,
      limit
    })

    if (!data.data || !data.data.book_list) {
      throw new Error('Invalid response format')
    }

    // 解码并转换书籍数据
    const decodedBooks: DecodedBook[] = data.data.book_list.map((book: Book) => {
      const bookName = decodeText(book.bookName)
      const author = decodeText(book.author)
      const readCount = parseInt(book.read_count.replace(/,/g, '')) || 0
      const wordCount = parseInt((book.wordNumber || '0').replace(/,/g, '')) || 0
      const status = book.creationStatus === '1' ? '连载中' : '已完结'

      return {
        bookName,
        author,
        readCount,
        wordCount,
        status,
        bookId: book.bookId
      }
    })

    return decodedBooks
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    throw error
  }
}

