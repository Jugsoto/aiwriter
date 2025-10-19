/**
 * 编辑历史记录管理工具
 * 用于管理章节内容的撤销/恢复功能，数据存储在 localStorage 中
 */

export interface EditorHistoryRecord {
  id: string
  chapterId: number
  content: string
  timestamp: number
  description?: string
}

export interface ChapterHistory {
  chapterId: number
  records: EditorHistoryRecord[]
  currentIndex: number
}

export class EditorHistoryManager {
  private static readonly STORAGE_KEY = 'editor_history'
  private static readonly MAX_RECORDS_PER_CHAPTER = 100
  private static readonly MAX_CHAPTERS = 20

  /**
   * 获取所有章节的历史记录
   */
  private static getAllHistories(): ChapterHistory[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取编辑历史记录失败:', error)
      return []
    }
  }

  /**
   * 保存所有历史记录到 localStorage
   */
  private static saveAllHistories(histories: ChapterHistory[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(histories))
    } catch (error) {
      console.error('保存编辑历史记录失败:', error)
    }
  }

  /**
   * 获取指定章节的历史记录
   */
  private static getChapterHistory(chapterId: number): ChapterHistory | null {
    const histories = this.getAllHistories()
    return histories.find(h => h.chapterId === chapterId) || null
  }

  /**
   * 更新或创建章节历史记录
   */
  private static updateChapterHistory(chapterHistory: ChapterHistory): void {
    const histories = this.getAllHistories()
    const existingIndex = histories.findIndex(h => h.chapterId === chapterHistory.chapterId)

    if (existingIndex >= 0) {
      histories[existingIndex] = chapterHistory
    } else {
      histories.push(chapterHistory)
      // 限制章节数量
      if (histories.length > this.MAX_CHAPTERS) {
        histories.splice(0, histories.length - this.MAX_CHAPTERS)
      }
    }

    this.saveAllHistories(histories)
  }

  /**
   * 添加新的编辑记录
   */
  static addRecord(
    chapterId: number,
    content: string,
    description?: string
  ): void {
    let chapterHistory = this.getChapterHistory(chapterId)

    if (!chapterHistory) {
      chapterHistory = {
        chapterId,
        records: [],
        currentIndex: -1
      }
    }

    // 如果当前不在最新记录，删除当前位置之后的所有记录
    if (chapterHistory.currentIndex < chapterHistory.records.length - 1) {
      chapterHistory.records = chapterHistory.records.slice(0, chapterHistory.currentIndex + 1)
    }

    // 添加新记录
    const newRecord: EditorHistoryRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chapterId,
      content,
      timestamp: Date.now(),
      description
    }

    chapterHistory.records.push(newRecord)
    chapterHistory.currentIndex = chapterHistory.records.length - 1

    // 限制记录数量
    if (chapterHistory.records.length > this.MAX_RECORDS_PER_CHAPTER) {
      chapterHistory.records.shift()
      chapterHistory.currentIndex--
    }

    this.updateChapterHistory(chapterHistory)
  }

  /**
   * 获取当前记录的内容
   */
  static getCurrentContent(chapterId: number): string | null {
    const chapterHistory = this.getChapterHistory(chapterId)
    if (!chapterHistory || chapterHistory.currentIndex < 0 || chapterHistory.currentIndex >= chapterHistory.records.length) {
      return null
    }

    return chapterHistory.records[chapterHistory.currentIndex].content
  }

  /**
   * 检查是否可以撤销
   */
  static canUndo(chapterId: number): boolean {
    const chapterHistory = this.getChapterHistory(chapterId)
    return !!(chapterHistory && chapterHistory.currentIndex > 0)
  }

  /**
   * 检查是否可以恢复
   */
  static canRedo(chapterId: number): boolean {
    const chapterHistory = this.getChapterHistory(chapterId)
    return !!(chapterHistory && chapterHistory.currentIndex < chapterHistory.records.length - 1)
  }

  /**
   * 撤销操作
   */
  static undo(chapterId: number): string | null {
    const chapterHistory = this.getChapterHistory(chapterId)
    if (!chapterHistory || chapterHistory.currentIndex <= 0) {
      return null
    }

    chapterHistory.currentIndex--
    this.updateChapterHistory(chapterHistory)

    return chapterHistory.records[chapterHistory.currentIndex].content
  }

  /**
   * 恢复操作
   */
  static redo(chapterId: number): string | null {
    const chapterHistory = this.getChapterHistory(chapterId)
    if (!chapterHistory || chapterHistory.currentIndex >= chapterHistory.records.length - 1) {
      return null
    }

    chapterHistory.currentIndex++
    this.updateChapterHistory(chapterHistory)

    return chapterHistory.records[chapterHistory.currentIndex].content
  }

  /**
   * 初始化章节历史记录（当切换到新章节时调用）
   */
  static initializeChapter(chapterId: number, initialContent: string): void {
    let chapterHistory = this.getChapterHistory(chapterId)

    if (!chapterHistory) {
      chapterHistory = {
        chapterId,
        records: [],
        currentIndex: -1
      }
    }

    // 如果没有记录或者当前记录内容与初始内容不同，添加初始记录
    if (chapterHistory.records.length === 0 ||
        chapterHistory.records[chapterHistory.currentIndex].content !== initialContent) {

      this.addRecord(chapterId, initialContent, '章节初始内容')
    }
  }

  /**
   * 在保存时更新当前记录的内容
   */
  static updateCurrentRecord(chapterId: number, content: string): void {
    const chapterHistory = this.getChapterHistory(chapterId)
    if (!chapterHistory || chapterHistory.currentIndex < 0 || chapterHistory.currentIndex >= chapterHistory.records.length) {
      return
    }

    // 只有当内容发生变化时才更新
    if (chapterHistory.records[chapterHistory.currentIndex].content !== content) {
      chapterHistory.records[chapterHistory.currentIndex] = {
        ...chapterHistory.records[chapterHistory.currentIndex],
        content,
        timestamp: Date.now(),
        description: chapterHistory.records[chapterHistory.currentIndex].description || '自动保存'
      }
      this.updateChapterHistory(chapterHistory)
    }
  }

  /**
   * 获取章节的历史记录列表（用于显示历史记录）
   */
  static getHistoryList(chapterId: number): EditorHistoryRecord[] {
    const chapterHistory = this.getChapterHistory(chapterId)
    return chapterHistory ? chapterHistory.records : []
  }

  /**
   * 清理指定章节的历史记录
   */
  static clearChapterHistory(chapterId: number): void {
    const histories = this.getAllHistories()
    const filteredHistories = histories.filter(h => h.chapterId !== chapterId)
    this.saveAllHistories(filteredHistories)
  }

  /**
   * 清理所有历史记录
   */
  static clearAllHistories(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * 获取存储统计信息
   */
  static getStorageStats(): { totalChapters: number; totalRecords: number; storageSize: string } {
    const histories = this.getAllHistories()
    const totalRecords = histories.reduce((sum, h) => sum + h.records.length, 0)
    const storageData = localStorage.getItem(this.STORAGE_KEY) || ''
    const storageSize = `${(new Blob([storageData]).size / 1024).toFixed(2)} KB`

    return {
      totalChapters: histories.length,
      totalRecords,
      storageSize
    }
  }
}