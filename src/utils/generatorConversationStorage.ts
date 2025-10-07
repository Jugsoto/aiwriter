import type { Conversation, Message } from './types'

export class GeneratorConversationStorage {
  private static readonly STORAGE_KEY_PREFIX = 'generator-conversations-'
  private static readonly MAX_CONVERSATIONS = 10

  /**
   * 获取存储键
   */
  private static getStorageKey(generatorType: string): string {
    return `${this.STORAGE_KEY_PREFIX}${generatorType}`
  }

  /**
   * 加载对话历史
   */
  static loadConversations(generatorType: string): Conversation[] {
    try {
      const key = this.getStorageKey(generatorType)
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
          timestamp: new Date(msg.timestamp),
          // 确保思考相关的字段也被正确恢复
          reasoningContent: msg.reasoningContent || '',
          isReasoning: msg.isReasoning || false,
          showReasoning: msg.showReasoning || false
        }))
      }))
      
      // 按更新时间降序排列，最新的在上
      const sortedConversations = restoredConversations.sort((a, b) => {
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      })
      return sortedConversations
    } catch (error) {
      console.error('加载生成器对话历史失败:', error)
      return []
    }
  }

  /**
   * 保存对话历史
   */
  static saveConversations(generatorType: string, conversations: Conversation[]): void {
    try {
      const key = this.getStorageKey(generatorType)
      
      // 限制最多10条记录，保留最新的（已经排序，取前10条）
      const limitedConversations = conversations.slice(0, this.MAX_CONVERSATIONS)
      
      localStorage.setItem(key, JSON.stringify(limitedConversations))
    } catch (error) {
      console.error('保存生成器对话历史失败:', error)
    }
  }

  /**
   * 添加新对话
   */
  static addConversation(generatorType: string, conversation: Conversation): void {
    const conversations = this.loadConversations(generatorType)
    conversations.push(conversation)
    this.saveConversations(generatorType, conversations)
  }

  /**
   * 更新对话
   */
  static updateConversation(generatorType: string, conversationId: string, messages: Message[]): void {
    const conversations = this.loadConversations(generatorType)
    
    const index = conversations.findIndex(c => c.id === conversationId)
    if (index !== -1) {
      conversations[index].messages = messages
      conversations[index].updatedAt = new Date()
      this.saveConversations(generatorType, conversations)
    }
  }

  /**
   * 删除对话
   */
  static deleteConversation(generatorType: string, conversationId: string): void {
    const conversations = this.loadConversations(generatorType)
    const filtered = conversations.filter(c => c.id !== conversationId)
    this.saveConversations(generatorType, filtered)
  }

  /**
   * 获取最新对话
   */
  static getLatestConversation(generatorType: string): Conversation | null {
    const conversations = this.loadConversations(generatorType)
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
  static createNewConversation(generatorType: string, messages: Message[] = []): Conversation {
    const now = new Date()
    return {
      id: `${generatorType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateTitle(messages),
      messages,
      bookId: this.getGeneratorBookId(generatorType),
      createdAt: now,
      updatedAt: now
    }
  }

  /**
   * 获取生成器对应的bookId
   */
  private static getGeneratorBookId(generatorType: string): number {
    // 使用生成器类型作为bookId，确保不同类型的生成器有独立的对话历史
    return `generator-${generatorType}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  }
}