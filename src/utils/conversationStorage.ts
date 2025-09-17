import type { Conversation, Message } from './types'

export class ConversationStorage {
  private static readonly STORAGE_KEY_PREFIX = 'copilot-conversations-'
  private static readonly MAX_CONVERSATIONS = 10

  /**
   * 获取存储键
   */
  private static getStorageKey(bookId: number): string {
    return `${this.STORAGE_KEY_PREFIX}${bookId}`
  }

  /**
   * 加载对话历史
   */
  static loadConversations(bookId: number): Conversation[] {
    try {
      const key = this.getStorageKey(bookId)
      const data = localStorage.getItem(key)
      if (!data) {
        return []
      }

      const conversations = JSON.parse(data) as Conversation[]
      
      // 恢复Date对象
      const restoredConversations = conversations.map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }))
      
      // 按更新时间降序排列，最新的在上
      const sortedConversations = restoredConversations.sort((a, b) => {
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      })
      return sortedConversations
    } catch (error) {
      console.error('加载对话历史失败:', error)
      return []
    }
  }

  /**
   * 保存对话历史
   */
  static saveConversations(bookId: number, conversations: Conversation[]): void {
    try {
      const key = this.getStorageKey(bookId)
      
      // 限制最多10条记录，保留最新的（已经排序，取前10条）
      const limitedConversations = conversations.slice(0, this.MAX_CONVERSATIONS)
      
      localStorage.setItem(key, JSON.stringify(limitedConversations))
    } catch (error) {
      console.error('保存对话历史失败:', error)
    }
  }

  /**
   * 添加新对话
   */
  static addConversation(bookId: number, conversation: Conversation): void {
    const conversations = this.loadConversations(bookId)
    conversations.push(conversation)
    this.saveConversations(bookId, conversations)
  }

  /**
   * 更新对话
   */
  static updateConversation(bookId: number, conversationId: string, messages: Message[]): void {
    const conversations = this.loadConversations(bookId)
    
    const index = conversations.findIndex(c => c.id === conversationId)
    if (index !== -1) {
      conversations[index].messages = messages
      conversations[index].updatedAt = new Date()
      this.saveConversations(bookId, conversations)
    }
  }

  /**
   * 删除对话
   */
  static deleteConversation(bookId: number, conversationId: string): void {
    const conversations = this.loadConversations(bookId)
    const filtered = conversations.filter(c => c.id !== conversationId)
    this.saveConversations(bookId, filtered)
  }

  /**
   * 获取最新对话
   */
  static getLatestConversation(bookId: number): Conversation | null {
    const conversations = this.loadConversations(bookId)
    return conversations.length > 0 ? conversations[0] : null
  }

  /**
   * 生成对话标题（基于第一条用户消息）
   */
  static generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(msg => msg.role === 'user')
    if (!firstUserMessage) return '新对话'
    
    const content = firstUserMessage.content.trim()
    if (content.length <= 20) return content
    
    return content.substring(0, 20) + '...'
  }

  /**
   * 创建新对话
   */
  static createNewConversation(bookId: number, messages: Message[] = []): Conversation {
    const now = new Date()
    return {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateTitle(messages),
      messages,
      bookId,
      createdAt: now,
      updatedAt: now
    }
  }
}