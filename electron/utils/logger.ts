/**
 * 日志工具
 */

import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  data?: any
}

/**
 * 日志管理器类
 */
export class Logger {
  private static instance: Logger
  private logLevel: LogLevel = LogLevel.INFO
  private logFile: string | undefined
  private maxFileSize: number = 10 * 1024 * 1024 // 10MB
  private maxLogFiles: number = 5

  private constructor() {
    // 延迟初始化日志文件路径
  }

  /**
   * 获取日志管理器实例
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * 初始化日志文件路径
   */
  private initializeLogFilePath(): void {
    if (!this.logFile) {
      try {
        this.logFile = path.join(app.getPath('userData'), 'app.log')
        this.initializeLogFile()
      } catch (error) {
        // 如果app还未准备好，使用临时路径
        console.warn('无法获取 userData 路径，将使用临时日志文件:', error)
        this.logFile = path.join(process.cwd(), 'app.log')
      }
    }
  }

  /**
   * 初始化日志文件
   */
  private initializeLogFile(): void {
    try {
      // 检查日志文件大小，如果超过限制则轮转
      const logFile = this.logFile
      if (logFile && fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile)
        if (stats.size > this.maxFileSize) {
          this.rotateLogFile()
        }
      }
    } catch (error) {
      console.error('初始化日志文件失败:', error)
    }
  }

  /**
   * 轮转日志文件
   */
  private rotateLogFile(): void {
    const logFile = this.logFile
    if (!logFile) {
      return
    }
    try {
      // 删除最旧的日志文件
      const oldestLogFile = `${logFile}.${this.maxLogFiles}`
      if (fs.existsSync(oldestLogFile)) {
        fs.unlinkSync(oldestLogFile)
      }

      // 轮移现有日志文件
      for (let i = this.maxLogFiles - 1; i >= 1; i--) {
        const currentLogFile = i === 1 ? logFile : `${logFile}.${i}`
        const nextLogFile = `${logFile}.${i + 1}`

        if (fs.existsSync(currentLogFile)) {
          fs.renameSync(currentLogFile, nextLogFile)
        }
      }
    } catch (error) {
      console.error('轮转日志文件失败:', error)
    }
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  /**
   * 格式化日志条目
   */
  private formatLogEntry(level: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    }
  }

  /**
   * 写入日志到文件
   */
  private writeToFile(logEntry: LogEntry): void {
    try {
      this.initializeLogFilePath()
      if (this.logFile) {
        const logLine = JSON.stringify(logEntry) + '\n'
        fs.appendFileSync(this.logFile, logLine, 'utf8')
      }
    } catch (error) {
      console.error('写入日志文件失败:', error)
    }
  }

  /**
   * 输出日志
   */
  private log(level: LogLevel, levelName: string, message: string, data?: any): void {
    if (level <= this.logLevel) {
      const logEntry = this.formatLogEntry(levelName, message, data)

      // 输出到控制台
      const consoleMessage = `[${logEntry.timestamp}] [${levelName}] ${message}`
      switch (level) {
        case LogLevel.ERROR:
          console.error(consoleMessage, data || '')
          break
        case LogLevel.WARN:
          console.warn(consoleMessage, data || '')
          break
        case LogLevel.INFO:
          console.info(consoleMessage, data || '')
          break
        case LogLevel.DEBUG:
          console.debug(consoleMessage, data || '')
          break
      }

      // 写入文件
      this.writeToFile(logEntry)
    }
  }

  /**
   * 错误日志
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, data)
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, data)
  }

  /**
   * 信息日志
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, data)
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data)
  }

  /**
   * 获取日志文件路径
   */
  getLogFilePath(): string {
    this.initializeLogFilePath()
    return this.logFile || 'app.log'
  }

  /**
   * 清理旧日志文件
   */
  cleanOldLogs(): void {
    try {
      this.initializeLogFilePath()
      if (this.logFile) {
        for (let i = 2; i <= this.maxLogFiles; i++) {
          const logFile = `${this.logFile}.${i}`
          if (fs.existsSync(logFile)) {
            fs.unlinkSync(logFile)
          }
        }
      }
    } catch (error) {
      this.error('清理旧日志文件失败', error)
    }
  }

  /**
   * 读取日志文件内容
   */
  readLogFile(lines?: number): string[] {
    try {
      this.initializeLogFilePath()
      if (!this.logFile || !fs.existsSync(this.logFile)) {
        return []
      }

      const content = fs.readFileSync(this.logFile, 'utf8')
      const logLines = content.split('\n').filter(line => line.trim())

      if (lines && lines > 0) {
        return logLines.slice(-lines)
      }

      return logLines
    } catch (error) {
      this.error('读取日志文件失败', error)
      return []
    }
  }
}

// 导出日志管理器实例
export const logger = Logger.getInstance()

// 导出便捷函数
export const logError = (message: string, data?: any) => logger.error(message, data)
export const logWarn = (message: string, data?: any) => logger.warn(message, data)
export const logInfo = (message: string, data?: any) => logger.info(message, data)
export const logDebug = (message: string, data?: any) => logger.debug(message, data)

// 在开发环境中设置调试级别
if (process.env.NODE_ENV === 'development') {
  logger.setLogLevel(LogLevel.DEBUG)
}