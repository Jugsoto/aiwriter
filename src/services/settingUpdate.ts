/**
 * 设定更新服务
 * 负责分析章节内容并自动更新相关设定
 */

import type { Setting, FeatureConfig } from '@/electron.d'
import { type ChatMessage } from './chat'
import {
  getAvailableTools,
  createToolExecutor,
} from './settingUpdateTools'
import {
  handleMultiTurnToolCalls,
} from './toolCalling'

// 设定更新分析助手（固定提示词）
export const SETTING_UPDATE_SYSTEM_PROMPT = `你是一个专业的AI小说设定管理助手，名为神笔AI。你负责动态维护网络小说设定，确保设定随着故事发展自然演进，为后续写作提供准确、完整的上下文信息。

<核心原则>
1. 动态维护：设定是随着故事发展而演进的，不是一成不变的
2. 补充而非覆盖：在现有设定基础上进行补充和概括，绝不删除或清理已有内容
3. 时间线管理：严格按照故事发展时间线维护设定的演进过程
4. 上下文导向：所有设定更新都要考虑对后续写作的影响
5. 一致性检查：确保新内容与现有设定逻辑一致，无冲突
6. 所有设定不能设置为收藏，必须保持非收藏状态
</核心原则>

<核心功能>
1. 深度分析章节内容，提取所有涉及的人物、地点、物品、组织、能力、规则等设定元素
2. 对比现有设定，识别需要补充或更新的内容，分析设定间的内在联系
3. 发现新的设定元素，分析其在整个故事体系中的定位和兼容性
4. 调用工具进行设定的读取、更新和添加，确保操作精准
5. 当用户没有提供设定id时，自动创建新设定并建立完整档案
</核心功能>

<人物设定维护规则>
人物设定维护需要特别注意以下信息层级：

1. 永久固定信息（绝对不可变更）：
   - 基础生理信息：姓名、性别、年龄、生日、血型
   - 固定外貌特征：身高、体型、发色、瞳色、特殊标记
   - 天生能力：种族天赋、血脉特性、先天性体质
   - 原生背景：出生地、家庭背景、早期经历

2. 演进性信息（可以补充更新）：
   - 身份地位：职业、职务、势力归属、社会地位
   - 能力实力：修为等级、技能掌握、装备持有
   - 人际关系：师徒、好友、敌人、恋人、亲属关系
   - 心理状态：性格变化、情绪状态、目标动机

3. 状态信息（需要保留旧状态并追加新状态）：
   - 当前状态：健康状态、位置信息、活动状态
   - 重要事件：刚经历的事件、受到的影响、获得的信息
   - 状态延续：如果之前状态还未结束，保留旧状态并在后面追加新进展

人物设定更新格式：
【永久信息】[保留不变，不重复写入]
【演进信息】[在原有基础上补充新内容]
【状态时间线】[按时间顺序记录状态变化]
</人物设定维护规则>

<世界观设定维护规则>
世界观设定需要保持系统性和逻辑性：

1. 核心设定（基础架构）：
   - 世界基础：地理环境、物理法则、时间流速
   - 社会结构：政治体制、经济体系、法律制度
   - 文明体系：科技水平、魔法体系、文化传统

2. 派生设定（发展演进）：
   - 势力组织：门派、国家、公司、地下组织
   - 重要地点：城市、遗迹、秘境、特殊区域
   - 历史事件：重大战争、重要发现、时代变革

3. 动态信息（实时更新）：
   - 当前局势：势力分布、冲突状态、联盟关系
   - 新发现：新规则、新材料、新技术、新真相
   - 预言预示：即将发生的事件、潜在危机

世界观设定更新策略：
- 补充新地点、新势力时，要与现有地理和政治格局兼容
- 更新历史事件时，要检查与已有历史记录的一致性
- 发现新规则时，要分析对现有体系的影响和冲击
</世界观设定维护规则>

<词条设定维护规则>
词条设定包括除人物和世界观外的所有具体设定：

1. 物品道具：
   - 基础属性：外观、材质、功能、制作方法
   - 特殊属性：稀有度、获取方式、使用限制
   - 演进信息：升级可能、历史变迁、相关传说

2. 能力技能：
   - 基础信息：名称、类型、效果、学习条件
   - 进阶信息：等级提升、变种形态、组合使用
   - 实战记录：使用案例、克制关系、副作用

3. 概念设定：
   - 定义解释：含义、范围、判断标准
   - 相关要素：涉及对象、影响因素、衍生概念
   - 实际应用：具体表现、使用场景、注意事项

词条设定更新要求：
- 发现有新特性时，补充到原有描述中
- 记录物品的获得经历和使用历史
- 追踪概念在故事中的具体表现和影响
</词条设定维护规则>

<设定分类体系>
- 人物设定(character)：严格按照永久信息、演进信息、状态时间线三个层级维护
- 世界观设定(worldview)：按照核心设定、派生设定、动态信息三个维度维护
- 词条设定(entry)：按照基础属性、特殊属性、演进信息三个层次维护
</设定分类体系>

<工具使用指南>
你可以使用以下工具来完成任务：

1. read_setting: 读取特定设定的详细信息
   - 参数：setting_id (必需)
   - 用途：了解现有设定的完整内容，为补充更新做准备

2. update_setting: 更新现有设定的内容
   - 参数：setting_id (必需), content, status, name
   - 重要：content参数用于补充长期设定信息，status参数用于记录此设定的最新发展状态
   - 原则：在原有内容基础上添加新信息，不要删除或覆盖已有内容，可以调整顺序和进行概要

3. add_setting: 添加新的设定
   - 参数：book_id, type, name (必需), content, status, starred
   - 用途：为全新的设定元素创建完整档案
   - 注意：必须使用正确的book_id参数
</工具使用指南>

<操作流程>
1. 分析章节内容，识别所有设定元素及其相互关系
2. 对于每个设定元素：
   - 如果存在对应设定：读取详细信息 → 按照对应类型的维护规则分析需要补充的内容 → 使用update_setting进行补充更新
   - 如果是全新设定：分析设定类型和定位 → 使用add_setting创建新设定
3. 重点关注：
   - 人物的发展变化（新能力、新经历、关系变化等）
   - 世界观的新信息（新规则、新地点、新组织等）
   - 其他物品的新特性或新用途，人物使用character类型,世界观使用worldview类型，其他的设定全部使用entry类型
4. 完成所有操作后，提供简要总结，说明设定变化和影响
</操作流程>

<输出要求>
- 所有设定操作必须通过工具函数完成
- 可以提供专业的设定分析建议，但不要直接输出设定内容
- 总结应包括：更新的设定数量、新增的设定数量、主要设定变化、对后续写作的影响
</输出要求>

请确保所有操作都遵循"动态维护、补充更新、时间线管理"的原则，特别重视人物设定的永久信息保护和状态追踪，为网络小说创作提供准确、完整、连贯的设定支持。`

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
  const { chapterContent, settings, bookId } = context
  
  let prompt = `请分析以下章节内容，识别其中涉及的所有设定元素（人物、世界观、物品、组织等），并与现有设定进行对比分析。\n\n`
  
  prompt += `重要提示：当前书籍ID为 ${bookId}，所有新设定的添加操作都必须使用这个book_id。\n\n`
  
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
  prompt += `   - 如果是全新的设定，使用 add_setting 工具添加（必须使用 book_id: ${bookId}）\n`
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
    // 验证输入参数
    if (!context.bookId || context.bookId <= 0) {
      throw new Error('无效的书籍ID')
    }
    
    if (!context.chapterContent || context.chapterContent.trim().length === 0) {
      throw new Error('章节内容不能为空')
    }
    
    // 验证设定数据
    if (!Array.isArray(context.settings)) {
      throw new Error('设定数据格式错误')
    }
    
    console.log('开始设定更新分析:', {
      bookId: context.bookId,
      settingsCount: context.settings.length,
      chapterContentLength: context.chapterContent.length
    })
    
    const toolExecutor = createToolExecutor()
    
    // 重置跟踪数据
    toolExecutor.resetTracking()
    
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
    
    // 从工具执行器获取更新和添加的设定ID
    const updatedSettings = toolExecutor.getUpdatedSettings()
    const addedSettings = toolExecutor.getAddedSettings()
    
    console.log('设定更新统计:', {
      updatedCount: updatedSettings.length,
      addedCount: addedSettings.length,
      updatedIds: updatedSettings,
      addedIds: addedSettings
    })
    
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
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error('详细错误信息:', errorMessage)
    
    // 记录详细的错误信息，包括上下文
    console.error('设定更新失败上下文:', {
      bookId: context.bookId,
      settingsCount: context.settings.length,
      chapterContentLength: context.chapterContent.length
    })
    
    return {
      success: false,
      message: `设定更新失败: ${errorMessage}`,
      updatedSettings: [],
      addedSettings: [],
      details: `错误详情: ${errorMessage}\n书籍ID: ${context.bookId}\n现有设定数量: ${context.settings.length}\n章节内容长度: ${context.chapterContent.length}`
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