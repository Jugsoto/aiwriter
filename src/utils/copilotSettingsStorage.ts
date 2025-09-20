import type { CopilotSettings } from './types'

export class CopilotSettingsStorage {
  private static readonly STORAGE_KEY_PREFIX = 'copilot-settings-'

  /**
   * 获取存储键
   */
  private static getStorageKey(bookId: number): string {
    return `${this.STORAGE_KEY_PREFIX}${bookId}`
  }

  /**
   * 加载Copilot设置
   */
  static loadSettings(bookId: number): CopilotSettings {
    try {
      const key = this.getStorageKey(bookId)
      const savedSettings = localStorage.getItem(key)

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as CopilotSettings
        return parsed
      }
    } catch (error) {
      console.error('加载Copilot设置失败:', error)
    }

    // 返回默认设置
    return {
      contextLength: 3,
      previousChapterCount: 1,
      chapterSummaryCount: 5
    }
  }

  /**
   * 保存Copilot设置
   */
  static saveSettings(bookId: number, settings: CopilotSettings): void {
    try {
      const key = this.getStorageKey(bookId)
      localStorage.setItem(key, JSON.stringify(settings))
    } catch (error) {
      console.error('保存Copilot设置失败:', error)
    }
  }

  /**
   * 实时保存设置（无延迟）
   */
  static saveSettingsRealtime(bookId: number, settings: CopilotSettings): void {
    this.saveSettings(bookId, settings)
  }

  /**
   * 更新单个设置项
   */
  static updateSetting<K extends keyof CopilotSettings>(
    bookId: number,
    key: K,
    value: CopilotSettings[K]
  ): CopilotSettings {
    const currentSettings = this.loadSettings(bookId)
    currentSettings[key] = value
    this.saveSettingsRealtime(bookId, currentSettings)
    return currentSettings
  }

  /**
   * 获取默认设置
   */
  static getDefaultSettings(): CopilotSettings {
    return {
      contextLength: 3,
      previousChapterCount: 1,
      chapterSummaryCount: 5
    }
  }

  /**
   * 重置设置为默认值
   */
  static resetToDefault(bookId: number): CopilotSettings {
    const defaultSettings = this.getDefaultSettings()
    this.saveSettingsRealtime(bookId, defaultSettings)
    return defaultSettings
  }

  /**
   * 检查设置是否存在
   */
  static hasSettings(bookId: number): boolean {
    try {
      const key = this.getStorageKey(bookId)
      return localStorage.getItem(key) !== null
    } catch (error) {
      console.error('检查Copilot设置存在性失败:', error)
      return false
    }
  }

  /**
   * 删除设置
   */
  static deleteSettings(bookId: number): void {
    try {
      const key = this.getStorageKey(bookId)
      localStorage.removeItem(key)
    } catch (error) {
      console.error('删除Copilot设置失败:', error)
    }
  }
}