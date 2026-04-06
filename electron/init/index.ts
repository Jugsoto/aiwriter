/**
 * 初始化模块入口文件
 * 协调各个子系统的初始化顺序
 */

import { initializeDatabase } from '../database'
import { initializeDefaultProviders, migrateToFlagshipModel } from './provider-init'
import { cleanupDeprecatedProviders } from './provider-cleanup'
import { initializeDefaultPrompts } from './prompt-init'

/**
 * 初始化系统
 * 按照正确的顺序初始化各个组件
 */
export async function initializeSystem(): Promise<void> {
  try {
    console.log('开始初始化系统...')

    // 1. 首先初始化数据库
    console.log('初始化数据库...')
    initializeDatabase()
    console.log('数据库初始化完成')

    // 2. 初始化默认供应商和模型
    console.log('初始化默认供应商...')
    const providerInitSuccess = await initializeDefaultProviders()
    if (providerInitSuccess) {
      console.log('默认供应商初始化完成')
    } else {
      console.log('默认供应商初始化跳过或失败')
    }

    // 2.5. 迁移旧的功能配置到新的旗舰模型
    console.log('检查并迁移功能配置...')
    migrateToFlagshipModel()
    console.log('功能配置迁移检查完成')

    console.log('清理停服供应商...')
    cleanupDeprecatedProviders()
    console.log('停服供应商清理完成')

    // 3. 初始化默认提示词
    console.log('初始化默认提示词...')
    const promptInitSuccess = await initializeDefaultPrompts()
    if (promptInitSuccess) {
      console.log('默认提示词初始化完成')
    } else {
      console.log('默认提示词初始化跳过或失败')
    }

    console.log('系统初始化完成')
  } catch (error) {
    console.error('系统初始化失败:', error)
    throw error
  }
}

/**
 * 获取系统初始化状态
 */
export function getSystemInitializationStatus(): {
  isDatabaseInitialized: boolean
  providerStatus: {
    hasProviders: boolean
    providerCount: number
    isFirstRun: boolean
  }
  promptStatus: {
    hasPrompts: boolean
    promptCount: number
    isFirstRun: boolean
  }
} {
  // 获取供应商初始化状态
  const { getProviderInitializationStatus } = require('./provider-init')
  const providerStatus = getProviderInitializationStatus()

  // 获取提示词初始化状态
  const { getPromptInitializationStatus } = require('./prompt-init')
  const promptStatus = getPromptInitializationStatus()

  return {
    // 这里可以添加数据库状态检查
    isDatabaseInitialized: true, // 如果没有错误，数据库已初始化
    providerStatus,
    promptStatus
  }
}

/**
 * 重置系统（删除所有数据并重新初始化）
 */
export async function resetSystem(): Promise<void> {
  try {
    console.log('开始重置系统...')

    // 这里可以添加数据清理逻辑
    // 然后重新初始化
    await initializeSystem()

    console.log('系统重置完成')
  } catch (error) {
    console.error('系统重置失败:', error)
    throw error
  }
}