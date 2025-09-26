/**
 * 设定更新服务
 * 负责分析章节内容并自动更新相关设定
 */

import type { Setting, FeatureConfig } from '@/electron.d'
import { type ChatMessage } from './chat'
import { SETTING_UPDATE_SYSTEM_PROMPT } from './prompts'
import {
  getAvailableTools,
  createToolExecutor,
} from './settingUpdateTools'
import {
  handleMultiTurnToolCalls,
} from './toolCalling'

export interface SettingUpdateContext {
  chapterContent: string
  bookId: number
  settings: Setting[] // 书籍的所有设定
}

export interface SettingUpdateResult {
  success: boolean
  message: string
  updatedSettings: number[]
  addedSettings: number[]
  details?: string
}

/**
 * 构建设定更新分析的用户提示词
 */
export function buildSettingUpdatePrompt(context: SettingUpdateContext): string {
  const { chapterContent, settings } = context
  
  let prompt = `请分析以下章节内容，识别其中涉及的所有设定元素（人物、世界观、物品、组织等），并与现有设定进行对比分析。\n\n`
  
  prompt += `章节内容：\n${chapterContent}\n\n`
  
  prompt += `现有设定列表：\n`
  if (settings.length > 0) {
    settings.forEach((setting, index) => {
      prompt += `${index + 1}. [${setting.type}] ${setting.name} (ID: ${setting.id})${setting.starred ? ' ★' : ''}\n`
    })
  } else {
    prompt += '暂无现有设定\n'
  }
  
  prompt += `\n请按照以下步骤进行分析：\n`
  prompt += `1. 仔细阅读章节内容，列出所有涉及的设定元素\n`
  prompt += `2. 对于每个设定元素：\n`
  prompt += `   - 如果存在对应设定，使用 read_setting 工具读取详细信息\n`
  prompt += `   - 对比章节内容与设定内容的差异\n`
  prompt += `   - 如有需要，使用 update_setting 工具更新设定\n`
  prompt += `   - 如果是全新的设定，使用 add_setting 工具添加\n`
  prompt += `3. 完成所有操作后，提供简要总结\n`
  
  return prompt
}


/**
 * 执行设定更新分析
 */
export async function analyzeAndUpdateSettings(
  context: SettingUpdateContext,
  featureConfig: FeatureConfig
): Promise<SettingUpdateResult> {
  try {
    const toolExecutor = createToolExecutor()
    const updatedSettings: number[] = []
    const addedSettings: number[] = []
    
    // 构建用户提示词
    const userPrompt = buildSettingUpdatePrompt(context)
    
    // 构建消息数组
    const messages: ChatMessage[] = [
      { role: 'system', content: SETTING_UPDATE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]
    
    // 获取可用工具
    const tools = getAvailableTools()
    
    // 使用多轮工具调用处理
    const response = await handleMultiTurnToolCalls(
      messages,
      tools,
      featureConfig,
      toolExecutor,
      10 // 最大迭代次数
    )
    
    console.log('AI分析响应:', response.content)
    
    // 返回结果
    return {
      success: true,
      message: `设定更新完成。更新了 ${updatedSettings.length} 个设定，添加了 ${addedSettings.length} 个新设定。`,
      updatedSettings,
      addedSettings,
      details: response.content
    }
    
  } catch (error) {
    console.error('设定更新分析失败:', error)
    return {
      success: false,
      message: `设定更新失败: ${error instanceof Error ? error.message : '未知错误'}`,
      updatedSettings: [],
      addedSettings: []
    }
  }
}

/**
 * 获取设定更新功能配置
 */
export async function getSettingUpdateConfig(): Promise<FeatureConfig> {
  const featureConfigsStore = useFeatureConfigsStore()
  
  // 确保配置已加载
  if (featureConfigsStore.configs.length === 0) {
    await featureConfigsStore.loadFeatureConfigs()
  }
  
  // 优先使用内容写作配置，如果没有则使用通用聊天配置
  let config = featureConfigsStore.getConfigByFeatureName('setting_maintenance')
  if (!config) {
    config = featureConfigsStore.getConfigByFeatureName('chat')
  }
  
  if (!config) {
    throw new Error('未找到合适的AI功能配置')
  }
  
  return config
}

// 导入需要的类型
import { useFeatureConfigsStore } from '@/stores/featureConfigs'