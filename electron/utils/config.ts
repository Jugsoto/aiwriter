/**
 * 应用配置管理工具
 */

import { app } from 'electron'
import path from 'path'

export interface AppConfig {
  development: {
    port: number
    hotReload: boolean
    devTools: boolean
  }
  database: {
    name: string
    backupRetention: number // 备份保留天数
  }
  window: {
    width: number
    height: number
    minWidth: number
    minHeight: number
    frame: boolean
    transparent: boolean
  }
  features: {
    autoSave: boolean
    autoSaveInterval: number // 自动保存间隔（毫秒）
    vectorSearch: boolean
  }
}

// 默认配置
const DEFAULT_CONFIG: AppConfig = {
  development: {
    port: 5173,
    hotReload: true,
    devTools: true
  },
  database: {
    name: 'aiwriter.db',
    backupRetention: 7
  },
  window: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: false
  },
  features: {
    autoSave: true,
    autoSaveInterval: 300000, // 5分钟
    vectorSearch: true
  }
}

/**
 * 配置管理器类
 */
export class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig

  private constructor() {
    this.config = { ...DEFAULT_CONFIG }
    this.loadConfig()
  }

  /**
   * 获取配置管理器实例
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  /**
   * 获取配置文件路径
   */
  private getConfigPath(): string {
    return path.join(app.getPath('userData'), 'config.json')
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const fs = require('fs')
      const configPath = this.getConfigPath()

      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8')
        const userConfig = JSON.parse(configData)
        this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig)
        console.log('配置加载成功')
      } else {
        this.saveConfig()
        console.log('使用默认配置并创建配置文件')
      }
    } catch (error) {
      console.error('加载配置失败，使用默认配置:', error)
      this.config = { ...DEFAULT_CONFIG }
    }
  }

  /**
   * 保存配置
   */
  saveConfig(): void {
    try {
      const fs = require('fs')
      const configPath = this.getConfigPath()
      const configData = JSON.stringify(this.config, null, 2)
      fs.writeFileSync(configPath, configData, 'utf8')
      console.log('配置保存成功')
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  /**
   * 合并配置
   */
  private mergeConfig(defaultConfig: AppConfig, userConfig: Partial<AppConfig>): AppConfig {
    return {
      development: { ...defaultConfig.development, ...userConfig.development },
      database: { ...defaultConfig.database, ...userConfig.database },
      window: { ...defaultConfig.window, ...userConfig.window },
      features: { ...defaultConfig.features, ...userConfig.features }
    }
  }

  /**
   * 获取完整配置
   */
  getConfig(): AppConfig {
    return { ...this.config }
  }

  /**
   * 获取开发配置
   */
  getDevelopmentConfig() {
    return this.config.development
  }

  /**
   * 获取数据库配置
   */
  getDatabaseConfig() {
    return this.config.database
  }

  /**
   * 获取窗口配置
   */
  getWindowConfig() {
    return this.config.window
  }

  /**
   * 获取功能配置
   */
  getFeaturesConfig() {
    return this.config.features
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AppConfig>): void {
    this.config = this.mergeConfig(this.config, config)
    this.saveConfig()
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.config = { ...DEFAULT_CONFIG }
    this.saveConfig()
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  /**
   * 检查是否为生产环境
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }
}

// 导出配置管理器实例
export const configManager = ConfigManager.getInstance()

// 导出便捷函数
export const getConfig = () => configManager.getConfig()
export const getDevelopmentConfig = () => configManager.getDevelopmentConfig()
export const getDatabaseConfig = () => configManager.getDatabaseConfig()
export const getWindowConfig = () => configManager.getWindowConfig()
export const getFeaturesConfig = () => configManager.getFeaturesConfig()
export const updateConfig = (config: Partial<AppConfig>) => configManager.updateConfig(config)
export const isDevelopment = () => configManager.isDevelopment()
export const isProduction = () => configManager.isProduction()