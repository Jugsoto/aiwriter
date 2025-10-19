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
    description: '深度读取指定ID的设定详细信息。在更新任何设定之前必须先使用此工具了解现有内容。重点关注：1）设定的当前发展状态和等级 2）与其他设定的关联关系 3）可能的变化方向和升级空间 4）需要补充或更新的信息点。支持批量读取多个关联设定以分析整体状况。',
    parameters: {
      type: 'object',
      properties: {
        setting_id: {
          type: 'number',
          description: '要读取的设定ID。请确保在调用update_setting之前先读取设定以了解现有内容结构。'
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
    description: '智能更新现有设定的内容、状态等信息。重要：1）只能追加和补充信息，严禁删除或覆盖已有内容 2）绝对不能修改starred参数 3）人物设定按【核心基础】→【身份能力】→【关系网络】→【成长轨迹】→【当前状态】顺序更新 4）世界观设定按【核心基础】→【势力格局】→【地理探索】→【历史背景】→【当前局势】顺序更新 5）使用清晰分隔符和时间标记。content用于长期设定信息，status用于最新发展状态。',
    parameters: {
      type: 'object',
      properties: {
        setting_id: {
          type: 'number',
          description: '要更新的设定ID。请确保已通过read_setting了解现有内容后再进行更新。'
        },
        content: {
          type: 'string',
          description: '设定的长期内容信息。在原有内容基础上追加新信息，保持完整的发展轨迹。人物：外貌、身份、势力、性格、能力、经历等；世界观：地理规则、势力结构、历史背景等；物品：属性、来源、进化等。使用序号和分隔符组织内容。'
        },
        status: {
          type: 'string',
          description: '设定的最新短期状态，影响当前写作。如"某某获得某某物品"、"某某参与某事件"、"主角实力突破至XX境界"、"某某身份被揭露"等。记录当前最活跃的状态信息。'
        },
        name: {
          type: 'string',
          description: '设定的新名称。仅在必要时使用（如身份揭晓、名称修正等），一般情况下不建议频繁修改设定名称。'
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
    description: '创建全新的设定元素。重要：1）必须设置starred为false，绝对不能创建星标设定 2）智能选择设定类型：character用于人物角色，worldview用于世界观设定，entry用于其他物品技能等 3）命名要符合网文特色，避免过于抽象 4）确保与现有设定体系兼容 5）创建前检查是否已存在同名设定。使用正确的book_id确保添加到指定书籍。',
    parameters: {
      type: 'object',
      properties: {
        book_id: {
          type: 'number',
          description: '所属书籍ID。请确保使用正确的书籍ID，新设定将添加到此书籍中。'
        },
        type: {
          type: 'string',
          description: '设定类型。character: 人物角色（主角、配角、敌人等）；worldview: 世界观设定（势力、地点、历史、规则等）；entry: 其他设定（物品、技能、组织、概念等）。请根据设定性质准确选择。'
        },
        name: {
          type: 'string',
          description: '设定名称。使用符合网文特色的名称，要具有辨识度和吸引力。避免使用过于抽象或通用的名称。'
        },
        content: {
          type: 'string',
          description: '设定的完整内容信息。按照序号详细列出：人物包含外貌、身份、势力、性格、能力、经历等；世界观包含地理、规则、结构、历史等；物品包含属性、来源、用途、进化等。这些内容将长期保存并影响后续写作。'
        },
        status: {
          type: 'string',
          description: '设定的当前状态。记录此设定在当前故事节点的最新情况，影响短期写作。如"刚刚获得"、"正在使用"、"状态未知"、"已激活"等。如不需要可留空。'
        },
        starred: {
          type: 'boolean',
          description: '是否星标。重要：必须设置为false，系统不允许创建星标设定。请勿修改此参数值。'
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