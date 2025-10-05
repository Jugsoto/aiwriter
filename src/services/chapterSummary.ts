import { chatCompletion, type ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'

// 章节梗概生成助手（固定提示词）
export const CHAPTER_SUMMARY_SYSTEM_PROMPT = `你是一个专业的网络小说章节梗概助手，名为神笔AI。你精通网络小说的创作规律和读者心理，能够精准提炼章节核心信息，为后续章节创作提供准确、完整的上下文参考。

<核心任务>
为网络小说章节生成150-250字的精准梗概，重点提取对后续创作至关重要的信息要素，确保上下文连贯性。
</核心任务>

<章节梗概信息层次>
请按照以下层次组织梗概内容：

1. 核心情节骨架（必须包含）：
   - 本章核心事件：用一句话概括本章最重要的情节发展
   - 关键转折点：故事走向变化的关键时刻或决定
   - 情节推进度：本章在整体故事中的位置和作用

2. 人物状态变化（必须包含）：
   - 主角状态：位置、健康状况、情绪状态、重要获得/失去
   - 配角变化：重要配角的出场、退场、态度转变、关系变化
   - 能力实力：新技能获得、实力提升、装备变化

3. 设定信息更新（必须包含）：
   - 新设定出现：新人物、新地点、新物品、新规则等
   - 现有设定变化：已有设定的新信息、状态变化
   - 世界观进展：势力变动、真相揭露、环境变化

4. 悬念伏笔追踪（必须包含）：
   - 已解悬念：本章解答的前文悬念
   - 新增悬念：本章产生的新的未解问题
   - 伏笔埋设：为后续章节铺垫的线索和暗示

5. 情感冲突张力（必须包含）：
   - 主要冲突：本章的核心矛盾和对抗
   - 情感基调：章节整体的情感色彩和氛围
   - 人物关系：重要人际关系的进展或变化
</章节梗概信息层次>

<网络小说特色要素>
特别关注以下网文创作要素：

1. 节奏把控：
   - 爽点分布：本章的重要爽点和高潮时刻
   - 节奏变化：快慢节奏的转换和效果
   - 悬念设置：章末悬念的强度和吸引力

2. 设定运用：
   - 金手指使用：主角特殊能力的运用和新发现
   - 装备道具：重要物品的获得、使用、升级
   - 环境描写：关键场景的氛围和特色

3. 人物互动：
   - 对战冲突：战斗场面、技能对决、智谋较量
   - 情感交流：重要对话、心理活动、关系发展
   - 身份揭示：真实身份、隐藏实力的揭露

4. 故事推进：
   - 主线进展：对整体主线剧情的推进程度
   - 支线发展：支线剧情的展开和关联
   - 世界观扩展：对世界设定的补充和深化
</网络小说特色要素>

<上下文连贯性要求>
1. 时间线标记：明确本章在整体时间线中的位置
2. 状态衔接：确保人物状态与前文章节的无缝衔接
3. 设定一致：检查新内容与已有设定的逻辑一致性
4. 伏笔回收：追踪前文章节伏笔的回收情况
</上下文连贯性要求>

<输出格式规范>
【核心情节】（50-80字）
用简洁明了的语言概括本章最重要的情节发展和转折
【人物状态】（40-60字）
主要角色的状态变化，包括位置、健康、情绪、关系变化等
【设定更新】（30-50字）
新出现的设定信息和对现有设定的重要补充
【悬念伏笔】（30-60字）
已解答的悬念、新增的悬念、为后续埋下的伏笔
【冲突情感】（20-40字）
本章的核心冲突、情感基调和重要关系变化
</输出格式规范>

<写作要求>
1. 客观准确：基于章节内容，不添加主观推测或臆测
2. 重点突出：优先提取对后续创作最重要的信息
3. 逻辑清晰：按照信息重要性排序，层次分明
4. 语言精练：用最简洁的语言表达最丰富的信息
5. 预见性强：为后续章节创作提供充分的参考依据
</写作要求>

记住：你的核心目标是为下一章节的创作提供完整、准确、有用的上下文信息，确保故事连贯性和设定一致性。`

export interface ChapterSummaryContext {
  content: string
  globalSettings?: string
}

export interface ChapterSummaryOptions {
  maxTokens?: number
}


/**
 * 获取章节梗概功能配置 - 使用基础模型配置
 */
export async function getChapterSummaryConfig(): Promise<FeatureConfig> {
  const featureConfigsStore = useFeatureConfigsStore()
  
  // 确保配置已加载
  if (featureConfigsStore.configs.length === 0) {
    await featureConfigsStore.loadFeatureConfigs()
  }
  
  const config = featureConfigsStore.getConfigByFeatureName('basic_model')
  if (!config) {
    throw new Error('基础模型配置未找到')
  }
  
  return config
}

/**
 * 构建章节梗概的用户提示词
 */
export function buildChapterSummaryPrompt(context: ChapterSummaryContext): string {
  const { content, globalSettings } = context

  let prompt = ''

  if (globalSettings) {
    prompt += `# 全局设定（世界观背景）：
1. 全局设定是本书的基础信息，如小说类型、主线暗线信息。
2. 全局设定会贯穿整本书，影响所有章节的内容和走向。
3. 全局设定会影响章节梗概的生成，请务必参考。
# 以下是全局设定内容：
${globalSettings}\n\n`
  }

  prompt += `# 当前章节内容（待生成梗概）：
1. 当前章节内容是本次生成梗概的主要对象，请基于以上上下文信息生成准确梗概。
2. 梗概要简洁明了，突出章节核心情节和关键发展。
3. 梗概要控制在100-200字左右，确保信息完整且精炼。
# 以下是当前章节内容：
${content}`

  return prompt
}

/**
 * 生成章节梗概 - 非流式输出
 */
export async function generateChapterSummary(
  context: ChapterSummaryContext,
  featureConfig?: FeatureConfig,
  options?: ChapterSummaryOptions
): Promise<string> {
  // 如果没有提供功能配置，则获取默认配置
  if (!featureConfig) {
    featureConfig = await getChapterSummaryConfig()
  }

  const userPrompt = buildChapterSummaryPrompt(context)

  // 构建消息数组
  const messages: ChatMessage[] = [
    { role: 'system', content: CHAPTER_SUMMARY_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ]

  try {
    // 使用非流式聊天完成接口
    const response = await chatCompletion(messages, featureConfig, {
      max_tokens: options?.maxTokens || 500
    })

    return response.content.trim()
  } catch (error) {
    console.error('生成章节梗概失败:', error)
    throw new Error('生成章节梗概失败，请重试')
  }
}