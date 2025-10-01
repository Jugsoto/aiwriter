/**
 * 设定更新工具服务
 * 提供读取、更新、添加设定的工具函数，供AI调用
 */

import { useSettingsStore } from '@/stores/settings'
import type { OpenAIToolFunction } from './toolCalling'

export interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

export interface ToolResult {
  tool_call_id: string
  output: string
}

/**
 * 读取设定工具
 */
export const readSettingTool = {
  type: 'function' as const,
  function: {
    name: 'read_setting',
    description: '读取指定ID的设定详细信息',
    parameters: {
      type: 'object',
      properties: {
        setting_id: {
          type: 'number',
          description: '要读取的设定ID'
        }
      },
      required: ['setting_id']
    }
  }
}

/**
 * 更新设定工具
 */
export const updateSettingTool = {
  type: 'function' as const,
  function: {
    name: 'update_setting',
    description: '更新现有设定的内容、状态等信息',
    parameters: {
      type: 'object',
      properties: {
        setting_id: {
          type: 'number',
          description: '要更新的设定ID'
        },
        content: {
          type: 'string',
          description: '设定的新内容,按照序号列出所有的内容，这些设定将长期保存并影响后续写作，如外貌，身份，势力，性格，能力，经历等'
        },
        status: {
          type: 'string',
          description: '设定的最新状态，表示此设定的最新情况，用来影响短期写作，如“某某获得某某，某某参与了某件事，主角得到了什么新身份”'
        },
        name: {
          type: 'string',
          description: '设定的新名称'
        }
      },
      required: ['setting_id']
    }
  }
}

/**
 * 添加设定工具
 */
export const addSettingTool = {
  type: 'function' as const,
  function: {
    name: 'add_setting',
    description: '添加新的设定（人物、世界观、物品等）',
    parameters: {
      type: 'object',
      properties: {
        book_id: {
          type: 'number',
          description: '所属书籍ID'
        },
        type: {
          type: 'string',
          description: '设定类型（character: 人物, worldview: 世界观, entry: 其他）'
        },
        name: {
          type: 'string',
          description: '设定名称'
        },
        content: {
          type: 'string',
          description: '设定内容，按照序号列出所有的内容，这些设定将长期保存并影响后续写作，如外貌，身份，势力，性格，能力，经历等'
        },
        status: {
          type: 'string',
          description: '设定的最新状态，表示次设定的最新情况，用来影响短期写作，如“某某获得某某，某某参与了某件事，主角得到了什么新身份”'
        },
        starred: {
          type: 'boolean',
          description: '是否星标'
        }
      },
      required: ['book_id', 'type', 'name']
    }
  }
}

/**
 * 获取所有可用工具
 */
export function getAvailableTools(): OpenAIToolFunction[] {
  return [readSettingTool as OpenAIToolFunction, updateSettingTool as OpenAIToolFunction, addSettingTool as OpenAIToolFunction]
}

/**
 * 工具执行器
 */
export class ToolExecutor {
  private settingsStore: ReturnType<typeof useSettingsStore>
  private updatedSettings: number[] = []
  private addedSettings: number[] = []

  constructor() {
    this.settingsStore = useSettingsStore()
  }

  /**
   * 获取更新和添加的设定ID
   */
  getUpdatedSettings(): number[] {
    return [...this.updatedSettings]
  }

  /**
   * 获取添加的设定ID
   */
  getAddedSettings(): number[] {
    return [...this.addedSettings]
  }

  /**
   * 重置跟踪数据
   */
  resetTracking() {
    this.updatedSettings = []
    this.addedSettings = []
  }

  /**
   * 执行工具调用
   */
  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const { name, arguments: argsStr } = toolCall.function
    
    try {
      const args = JSON.parse(argsStr)
      
      switch (name) {
        case 'read_setting':
          return await this.executeReadSetting(toolCall.id, args)
        
        case 'update_setting':
          return await this.executeUpdateSetting(toolCall.id, args)
        
        case 'add_setting':
          return await this.executeAddSetting(toolCall.id, args)
        
        default:
          throw new Error(`未知的工具函数: ${name}`)
      }
    } catch (error) {
      return {
        tool_call_id: toolCall.id,
        output: `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 执行读取设定
   */
  private async executeReadSetting(toolCallId: string, args: any): Promise<ToolResult> {
    const { setting_id } = args
    
    if (!setting_id) {
      return {
        tool_call_id: toolCallId,
        output: '错误: 缺少必需的 setting_id 参数'
      }
    }

    try {
      const setting = await this.settingsStore.getSetting(setting_id)
      
      if (!setting) {
        return {
          tool_call_id: toolCallId,
          output: `未找到ID为 ${setting_id} 的设定`
        }
      }

      const result = {
        id: setting.id,
        name: setting.name,
        type: setting.type,
        content: setting.content,
        status: setting.status,
        starred: setting.starred,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      }

      return {
        tool_call_id: toolCallId,
        output: JSON.stringify(result, null, 2)
      }
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `读取设定失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 执行更新设定
   */
  private async executeUpdateSetting(toolCallId: string, args: any): Promise<ToolResult> {
    const { setting_id, content, status, name } = args
    
    if (!setting_id) {
      return {
        tool_call_id: toolCallId,
        output: '错误: 缺少必需的 setting_id 参数'
      }
    }

    try {
      const updateData: any = {}
      if (content !== undefined) updateData.content = content
      if (status !== undefined) updateData.status = status
      if (name !== undefined) updateData.name = name

      const updatedSetting = await this.settingsStore.updateSetting(setting_id, updateData)
      
      // 跟踪更新的设定ID
      if (!this.updatedSettings.includes(setting_id)) {
        this.updatedSettings.push(setting_id)
      }
      
      return {
        tool_call_id: toolCallId,
        output: `设定更新成功: ${updatedSetting.name} (ID: ${updatedSetting.id})`
      }
    } catch (error) {
      return {
        tool_call_id: toolCallId,
        output: `更新设定失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  /**
   * 执行添加设定
   */
  private async executeAddSetting(toolCallId: string, args: any): Promise<ToolResult> {
    const { book_id, type, name, content, status, starred } = args
    
    if (!book_id || !type || !name) {
      return {
        tool_call_id: toolCallId,
        output: '错误: 缺少必需的参数 (book_id, type, name)'
      }
    }

    try {
      console.log('开始添加新设定:', {
        book_id,
        type,
        name,
        content_length: content?.length || 0,
        status_length: status?.length || 0,
        starred
      })

      // 检查是否已存在相同名称的设定（第二道防线）
      const existingSetting = this.settingsStore.settings.find(
        s => s.book_id === book_id && s.name === name
      )
      
      if (existingSetting) {
        console.log(`设定 "${name}" 已存在，ID: ${existingSetting.id}`)
        return {
          tool_call_id: toolCallId,
          output: `设定 "${name}" 已存在 (ID: ${existingSetting.id})，请使用 update_setting 工具更新现有设定`
        }
      }

      const newSetting = await this.settingsStore.createSetting({
        book_id,
        type,
        name,
        content: content || '',
        status: status || '',
        starred: starred || false
      })
      
      console.log('新设定添加成功:', {
        id: newSetting.id,
        name: newSetting.name,
        type: newSetting.type
      })
      
      // 跟踪添加的设定ID
      this.addedSettings.push(newSetting.id)
      
      return {
        tool_call_id: toolCallId,
        output: `新设定添加成功: ${newSetting.name} (ID: ${newSetting.id}, 类型: ${newSetting.type})`
      }
    } catch (error) {
      console.error('添加设定失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      return {
        tool_call_id: toolCallId,
        output: `添加设定失败: ${errorMessage}`
      }
    }
  }
}

/**
 * 创建工具执行器实例
 */
export function createToolExecutor(): ToolExecutor {
  return new ToolExecutor()
}