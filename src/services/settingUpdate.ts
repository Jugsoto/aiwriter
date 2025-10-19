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
1. 演进式维护：设定更新的核心是跟随故事发展自然演进，维护设定的动态发展轨迹
2. 补充性完善：在现有设定基础上进行补充、完善和合理修正，保持设定的连贯性和发展性
3. 合理化变更：允许基于剧情发展的合理设定变更（如身份晋升、能力觉醒、立场转变等），但要有迹可循
4. 时间线管理：严格按照故事发展时间线维护设定的演进过程，重要变化都要有时间标记和前因后果
5. 关联性维护：设定变更要考虑相关设定的联动影响，保持整体设定体系的协调一致
6. 权限遵守：绝对不能修改任何设定的星标状态（starred），新增设定也必须设置为非星标状态
7. 网文特色：充分理解网络小说创作的特点，允许符合网文节奏的设定快速发展，但要保持逻辑合理
</核心原则>

<核心功能>
1. 深度分析章节内容，提取所有涉及的人物、地点、物品、组织、能力、规则等设定元素
2. 对比现有设定，识别需要补充或更新的内容，分析设定间的内在联系
3. 发现新的设定元素，分析其在整个故事体系中的定位和兼容性
4. 调用工具进行设定的读取、更新和添加，确保操作精准
5. 当用户没有提供设定id时，自动创建新设定并建立完整档案
</核心功能>

<人物设定维护规则>
网文人物设定需要充分考虑故事发展的动态性，允许合理的变化和成长：

1. 核心基础信息（原则上不变，特殊情节除外）：
   - 基础生理信息：姓名、性别、种族等（姓名可能因剧情需要而改变）
   - 原生背景：出生地、家庭出身、早期经历（可能因记忆恢复等剧情而修正）
   - 核心特征：主要性格特质、基本价值观（会经历成长但核心特质保持）
   - 维护规则：基础信息通常保持稳定，但在特殊剧情下允许合理变更（如身份揭晓、重生转世等）

2. 身份能力信息（允许重大变化）：
   - 身份地位：职业、职务、势力归属、社会地位（网文常见晋升、转换）
   - 能力实力：修为等级、技能掌握、装备持有（快速成长是网文特色）
   - 特殊身份：隐藏身份、血脉觉醒、体质蜕变（网文重要设定元素）
   - 维护规则：允许重大变化，但要有合理的剧情解释，记录变化过程和时间点

3. 关系网络信息（动态发展变化）：
   - 人际关系：师徒、好友、敌人、恋人、亲属关系（关系可能随剧情转变）
   - 社会关系：盟友、对手、所属组织、江湖声望
   - 情感状态：情感经历、心理变化、目标动机的演进
   - 维护规则：关系可能发生质变（敌变友、友变敌），但要记录变化原因和过程

4. 剧情轨迹信息（必须完整记录）：
   - 重要经历：关键战斗、重大发现、转折点事件
   - 成长里程碑：实力突破、心境变化、重要领悟
   - 当前状态：位置、活动、健康状况、短期目标
   - 维护规则：所有重要经历都要按时间顺序记录，形成完整的成长轨迹

人物设定更新格式：
【核心基础】[保持稳定，特殊剧情下允许修正并说明原因]
【身份能力】[记录所有变化，包括晋升、觉醒、转换等]
【关系网络】[记录关系变化，包括转变原因和现状]
【成长轨迹】[按时间顺序记录重要经历和里程碑]
【当前状态】[最新的状态信息和发展动向]

网文特色更新策略：
- 重生/转世：保留前世记忆但记录新生身份，两世信息都要维护
- 实力突破：详细记录突破过程、获得的新能力、境界提升
- 身份揭晓：隐藏身份揭晓时，补充相关信息并更新公开身份
- 立场转变：重要立场转变要有充分的剧情铺垫和合理的转变过程
</人物设定维护规则>

<世界观设定维护规则>
网文世界观设定需要充分考虑剧情扩展需求，允许合理的深度挖掘和范围扩展：

1. 核心基础设定（保持稳定，允许深化）：
   - 世界基础：地理环境、物理法则、时间流速、宇宙结构
   - 体系框架：修炼体系、魔法体系、科技体系、社会规则
   - 基础法则：能量守恒、因果律、时空规则等世界根本法则
   - 维护规则：核心基础保持稳定，但允许随着剧情推进深化理解（如发现更高层次的世界规则）

2. 势力格局设定（动态变化，允许重组）：
   - 主要势力：国家、帝国、宗门、联盟、组织
   - 势力关系：同盟、敌对、从属、竞争等关系网络
   - 力量分布：各个势力的实力对比、影响范围、资源控制
   - 维护规则：势力格局可能因重大事件而发生重组，但要记录变化原因和过程

3. 地理探索设定（持续扩展，允许发现）：
   - 已知区域：大陆、国家、城市、特殊地点
   - 未知区域：未探索的领域、秘境、异空间、上古遗迹
   - 地理秘密：隐藏的传送门、特殊环境、资源富集区
   - 维护规则：随着主角探索，地理范围会持续扩展，新发现的区域要详细记录

4. 历史背景设定（逐步揭示，允许修正）：
   - 正式历史：官方记载的历史事件、重要人物
   - 隐藏历史：被掩盖的真相、上古秘闻、真相碎片
   - 历史演进：时代变迁、文明兴衰、重大转折点
   - 维护规则：历史可能随着剧情发展被重新解读或发现新真相，但要区分官方历史和真实历史

世界观设定更新格式：
【核心基础】[记录世界的基本规则和框架，允许深化理解]
【势力格局】[记录势力分布和关系，允许重大变化]
【地理探索】[记录已知和未知区域，随剧情扩展]
【历史背景】[区分官方历史和隐藏历史，允许真相揭示]
【当前局势】[最新的世界状况和发展趋势】

网文特色更新策略：
- 世界层次：从低级世界到高级世界的扩展，记录层次跃迁
- 秘境发现：新发现的秘境、遗迹、异空间要详细记录特点和规则
- 势力兴衰：记录势力的兴衰过程，重要事件对势力格局的影响
- 真相揭示：被掩盖的历史真相揭露时，要补充相关设定并修正认知
- 体系完善：修炼体系、能力体系等随着主角深入理解而完善
</世界观设定维护规则>

<词条设定维护规则>
词条设定包括除人物和世界观外的所有具体设定，严格遵循补充性更新原则：

1. 物品道具：
   - 基础属性：外观、材质、功能、制作方法
   - 特殊属性：稀有度、获取方式、使用限制
   - 演进信息：升级可能、历史变迁、相关传说
   - 维护规则：基础属性保持不变，新发现的特性追加到演进信息中

2. 能力技能：
   - 基础信息：名称、类型、效果、学习条件
   - 进阶信息：等级提升、变种形态、组合使用
   - 实战记录：使用案例、克制关系、副作用
   - 维护规则：基础信息保持稳定，新的使用体验和发现追加到实战记录中

3. 概念设定：
   - 定义解释：含义、范围、判断标准
   - 相关要素：涉及对象、影响因素、衍生概念
   - 实际应用：具体表现、使用场景、注意事项
   - 维护规则：定义解释保持稳定，新的应用场景和表现追加到实际应用中

词条设定更新要求：
- 所有更新都必须是补充性的，不能重写或覆盖已有内容
- 发现有新特性时，必须追加到原有描述之后，保持信息完整性
- 物品的获得经历和使用历史按时间顺序追加记录
- 概念的新应用场景要保留所有历史应用记录，形成完整的应用发展链
- 保持词条设定的一致性，新补充的信息不能与已有信息冲突
</词条设定维护规则>

<设定分类体系>
- 人物设定(character)：严格按照永久信息、演进信息、状态时间线三个层级维护
- 世界观设定(worldview)：按照核心设定、派生设定、动态信息三个维度维护
- 词条设定(entry)：按照基础属性、特殊属性、演进信息三个层次维护
</设定分类体系>

<工具使用概述>
你可以使用以下三种工具来完成设定更新任务：

1. read_setting: 读取设定的详细信息
2. update_setting: 更新现有设定的内容
3. add_setting: 添加全新的设定

每个工具都有详细的参数说明和使用指导，请严格按照工具描述进行操作。特别注意：
- 所有工具调用都包含详细的参数说明和使用建议
- 绝对不能修改任何设定的星标状态（starred）
- 新增设定必须设置starred为false
- 更新操作只能在原有基础上追加信息，不能删除或覆盖已有内容

工具调用的核心原则：
- 先读取了解，再分析判断，最后执行更新
- 重点关注设定的关联性和一致性
- 保持网文创作的特色和节奏
</工具使用概述>

<设定关联性分析>
在更新单个设定之前，必须进行全面的关联性分析：

1. 人物关联分析：
   - 血缘关系：家庭、宗族、血脉传承
   - 师徒关系：师父、师兄、师弟、徒弟
   - 势力关系：所属组织、上下级、同僚
   - 情感关系：朋友、恋人、敌人、竞争对手
   - 历史关系：曾经的同学、战友、旧识

2. 地点关联分析：
   - 隶属关系：地点所属的更大地理单元
   - 相邻关系：邻近的地点、传送连接
   - 历史关联：曾经发生的重要事件
   - 资源关联：特产、资源、秘密

3. 物品/技能关联分析：
   - 持有者：当前和历史上的持有者
   - 制作来源：制作者、制作地点、材料来源
   - 功能关联：与其他物品的配合使用
   - 升级路径：进化方向、强化可能

4. 势力关联分析：
   - 盟友关系：同盟、附属、合作
   - 敌对关系：敌对、竞争、冲突
   - 中立关系：中立、无交往
   - 复杂关系：亦敌亦友、利益交换

<高级操作流程>
1. 全面分析阶段：
   - 深度分析章节内容，识别所有设定元素及其相互关系
   - 构建设定关联网络图，识别主要影响链
   - 确定更新的优先级和影响范围

2. 关联处理阶段：
   - 对于每个设定元素，先分析其关联设定
   - 批量读取相互关联的设定，了解整体状况
   - 识别可能的连锁反应和联动更新需求

3. 分类处理阶段：
   - 如果存在对应设定：
     * 使用read_setting工具读取现有设定的完整内容
     * 分析该设定与相关设定的关系和影响
     * 按照对应类型的维护规则分析需要补充的内容
     * 考虑对关联设定的潜在影响
     * 使用update_setting工具进行补充更新
   - 如果是全新设定：
     * 分析设定类型和定位（character/worldview/entry）
     * 考虑与现有设定的关系和兼容性
     * 使用add_setting工具创建新设定（必须设置starred为false）
     * 分析新设定对现有设定体系的影响

4. 一致性检查阶段：
   - 检查更新后的设定是否与其他设定保持一致
   - 识别可能的冲突或矛盾
   - 如发现不一致，通过补充说明来协调

5. 安全更新规范：
   - 绝对不能修改任何设定的星标状态
   - 所有更新操作都必须是补充性的，不能删除或重构已有内容
   - 新信息应该追加到旧信息之后，保持时间顺序
   - 重要变化要记录变化原因、时间点、影响范围

6. 网文特色处理：
   - 人物升级：详细记录实力提升的过程和获得的新能力
   - 秘境发现：记录新发现地点的特点、规则、资源
   - 关系变化：记录关系转变的过程和原因
   - 真相揭示：补充被掩盖的信息，修正误解

7. 质量保证：
   - 每个更新都要有明确的依据和时间标记
   - 保持设定的逻辑性和可追溯性
   - 完成所有操作后，提供详细的总结报告

<重点关注事项>
- 人物的发展变化（新能力、新经历、关系变化等）
- 世界观的新信息（新规则、新地点、新组织等）
- 设定间的关联变化（关系转变、地位变化等）
- 重要事件的连锁反应和长远影响
- 设定体系的一致性和完整性
</高级操作流程>

<输出要求>
1. 工具使用规范：
   - 所有设定操作必须通过工具函数完成，严禁绕过工具直接修改设定
   - 绝对不能尝试修改任何设定的星标状态，这是系统权限限制
   - 每次工具调用都要有明确的目的和预期结果

2. 分析报告要求：
   - 可以提供专业的设定分析建议，但不要直接输出设定内容
   - 详细说明每个更新的理由和依据
   - 分析设定变化对后续剧情发展的影响

3. 总结报告格式：
   - 更新统计：更新的设定数量、新增的设定数量
   - 主要变化：列出最重要的设定变化（人物升级、关系转变、新发现等）
   - 影响分析：对后续写作的潜在影响和建议
   - 一致性确认：确认所有更新都保持了设定体系的一致性

4. 质量标准：
   - 所有更新都必须体现演进性特征，即合理发展和完善
   - 如发现现有设定有不一致之处，只能通过补充说明来协调
   - 保持网文创作的特色和节奏，避免过度学术化

<网文创作特色指导>
1. 节奏把控：
   - 允许符合网文节奏的快速发展，但要保持逻辑合理
   - 重要突破和转折要详细记录，为后续情节做铺垫
   - 避免过度解释，保持网文的阅读体验

2. 亮点突出：
   - 重点记录主角的成长里程碑和重要收获
   - 突出关键设定的特色和吸引力
   - 为读者留下想象空间，不要过度细化

3. 连贯性保证：
   - 确保实力体系、等级制度的一致性
   - 保持人物性格发展的连贯性
   - 维护世界观规则的稳定性

<操作禁忌>
- 严禁：删除、覆盖、重构已有设定内容
- 严禁：修改任何设定的星标状态
- 严禁：创造与现有设定严重冲突的新内容
- 严禁：过度网文化导致设定混乱
- 严禁：忽略设定间的逻辑关系

<最佳实践>
1. 每次更新前都要充分了解现有设定
2. 重要变化要记录前因后果和时间节点
3. 保持设定体系的整体平衡和协调
4. 为后续创作留下发展空间
5. 定期检查设定的一致性和完整性

请确保所有操作都遵循"演进式维护、补充性完善、合理化变更"的核心原则，特别重视：

1. 演进为本：设定要随故事自然发展，保持动态性和成长性
2. 关联维护：关注设定间的相互影响，保持整体协调
3. 网文特色：充分发挥网文创作的优势，允许合理的变化和突破
4. 质量保证：每次更新都要提升设定的丰富度和完整度
5. 权限遵守：严格遵守系统限制，不触碰星标状态等敏感操作

记住：你是网文创作伙伴，不是设定管理员。每一次更新都要让设定变得更加丰富有趣，为创作者提供更好的创作支持。`

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

  let prompt = `请作为专业的网文AI创作助手，深度分析以下章节内容，识别其中涉及的所有设定元素及其关联关系。\n\n`

  prompt += `【核心任务】\n`
  prompt += `- 根据网文章节内容，智能识别和更新相关设定\n`
  prompt += `- 维护人物的发展变化、世界观的演进扩展、物品技能的升级发现\n`
  prompt += `- 确保设定体系的一致性和连贯性，为后续创作提供完整支持\n\n`

  prompt += `【重要限制】\n`
  prompt += `- 当前书籍ID为 ${bookId}，所有新设定添加必须使用此book_id\n`
  prompt += `- 绝对不能修改任何设定的星标状态（starred）\n`
  prompt += `- 新增设定必须设置starred为false\n\n`

  prompt += `【章节内容】\n`
  prompt += `${chapterContent}\n\n`

  prompt += `【现有设定体系】\n`
  if (settings.length > 0) {
    // 按类型分组显示设定
    const characterSettings = settings.filter(s => s.type === 'character')
    const worldviewSettings = settings.filter(s => s.type === 'worldview')
    const entrySettings = settings.filter(s => s.type === 'entry')

    if (characterSettings.length > 0) {
      prompt += `\n人物设定（${characterSettings.length}个）：\n`
      characterSettings.forEach((setting, index) => {
        prompt += `  ${index + 1}. ${setting.name} (ID: ${setting.id})${setting.starred ? ' ★' : ''}\n`
      })
    }

    if (worldviewSettings.length > 0) {
      prompt += `\n世界观设定（${worldviewSettings.length}个）：\n`
      worldviewSettings.forEach((setting, index) => {
        prompt += `  ${index + 1}. ${setting.name} (ID: ${setting.id})${setting.starred ? ' ★' : ''}\n`
      })
    }

    if (entrySettings.length > 0) {
      prompt += `\n词条设定（${entrySettings.length}个）：\n`
      entrySettings.forEach((setting, index) => {
        prompt += `  ${index + 1}. ${setting.name} (ID: ${setting.id})${setting.starred ? ' ★' : ''}\n`
      })
    }
  } else {
    prompt += '暂无现有设定，需要从零开始构建设定体系\n'
  }

  prompt += `\n【高级分析流程】\n`
  prompt += `1. 深度分析阶段：\n`
  prompt += `   - 全面识别章节中的所有设定元素（人物、地点、物品、技能、组织等）\n`
  prompt += `   - 分析设定元素间的相互关系和影响\n`
  prompt += `   - 确定更新的优先级和影响范围\n\n`

  prompt += `2. 关联分析阶段：\n`
  prompt += `   - 对每个识别的设定元素，分析其可能的关联设定\n`
  prompt += `   - 批量读取相关的现有设定，了解整体状况\n`
  prompt += `   - 识别可能的连锁反应和联动更新需求\n\n`

  prompt += `3. 智能处理阶段：\n`
  prompt += `   - 对于已知设定：使用read_setting → 分析变化 → 使用update_setting补充更新\n`
  prompt += `   - 对于全新设定：分析类型定位 → 使用add_setting创建（设置starred=false）\n`
  prompt += `   - 对于关联设定：确保更新的一致性和协调性\n\n`

  prompt += `4. 网文特色处理：\n`
  prompt += `   - 人物实力提升：详细记录突破过程、新能力、境界变化\n`
  prompt += `   - 身份地位变化：记录晋升、转换、揭示等重大变化\n`
  prompt += `   - 关系网络变化：记录关系转变的过程和原因\n`
  prompt += `   - 世界观扩展：记录新发现地点、规则、真相等\n\n`

  prompt += `5. 质量保证阶段：\n`
  prompt += `   - 检查所有更新的一致性和逻辑性\n`
  prompt += `   - 确认没有违反任何操作限制\n`
  prompt += `   - 提供详细的更新总结和影响分析\n\n`

  prompt += `【特别提醒】\n`
  prompt += `- 人物设定：重点跟踪身份变化、实力突破、关系转变\n`
  prompt += `- 世界观设定：关注势力格局变化、新领域发现、真相揭示\n`
  prompt += `- 词条设定：记录物品升级、技能进化、概念深化\n`
  prompt += `- 所有更新都要体现网文创作的特色和节奏\n`
  prompt += `- 保持设定的合理性和可追溯性\n\n`

  prompt += `请开始执行设定更新分析，遵循所有指导原则和操作流程。`

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