/**
 * 章节评估服务
 * 优化版本 - 简化提示词，提升评估效率和准确性
 */

import { jsonChatCompletion, type JsonChatResponse } from './jsonChat'
import type { FeatureConfig } from '@/electron.d'
import type { ChatMessage } from './chat'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'

// ==================== 类型定义 ====================

export interface ChapterReviewContext {
  content: string
  globalSettings?: string
  chapterTitle?: string
  previousChapterContent?: string
  previousChapterTitle?: string
  firstFiveChaptersSummary?: string
  bookId?: number
  chapterId?: number
}

export interface ChapterReviewResult {
  // 八大评分维度
  plot_progression_score: number
  character_performance_score: number
  emotional_value_score: number
  reading_pace_score: number
  creativity_score: number
  commercial_value_score: number
  writing_quality_score: number
  dialogue_quality_score: number

  // 综合评价
  overall_evaluation: string

  // 深度分析
  opening_analysis: string
  ending_analysis: string
  highlight_moments: string[]
  weak_points: string[]
  pacing_analysis: string

  // 优点分析
  strengths: string[]

  // 问题与不足
  pitfalls: Array<{
    content: string
    position?: string
    severity?: string
    suggestion?: string
  }>

  // 改进建议
  improvement_suggestions: string[]
  critical_issues: string[]
  quick_wins: string[]
}

export interface ChapterReviewOptions {
  maxTokens?: number
}

// ==================== 配置管理 ====================

/**
 * 获取章节评估功能配置
 */
export async function getChapterReviewConfig(): Promise<FeatureConfig> {
  const featureConfigsStore = useFeatureConfigsStore()

  if (featureConfigsStore.configs.length === 0) {
    await featureConfigsStore.loadFeatureConfigs()
  }

  const config = featureConfigsStore.getConfigByFeatureName('chapter_review')
  if (!config) {
    throw new Error('章节评估功能配置未找到，请先在设置中配置')
  }

  return config
}

// ==================== 提示词构建 ====================

/**
 * 构建优化后的系统提示词
 */
function buildSystemPrompt(): string {
  return `你是资深网文评审专家，具备10年阅读经验和8年编辑经验。以老读者和编辑双重视角评估章节质量。

# 核心任务
评估章节是否能吸引读者持续阅读，发现问题并给出可落地的改进建议。

# 评估维度（1-10分）

**1. 情节推进** - 剧情是否紧凑有料，有无注水拖沓
**2. 人物表现** - 人物是否鲜活合理，有无降智崩坏
**3. 情绪价值** - 爽点是否密集，情绪是否饱满
**4. 阅读节奏** - 节奏是否流畅，有无卡顿冗余
**5. 创意新颖** - 是否有新意，避开烂梗套路
**6. 商业价值** - 追更欲望强度，付费转化潜力
**7. 文笔质量** - 文字是否流畅生动，有无语病
**8. 对话质量** - 对话是否自然有张力，推动剧情

# 分析要点

**开篇分析** - 前200字是否抓人，能否快速建立冲突
**结尾分析** - 章末钩子是否有效，能否吸引点下一章
**爽点分析** - 找出2-5个精彩片段（打脸/逆袭/反转等）
**槽点分析** - 找出2-5个影响体验的问题（注水/拖沓/逻辑漏洞等）
**节奏分析** - 整体节奏快慢，哪些段落需要调整

# 问题定位标准

发现问题时提供：
- **具体位置**：第几段/具体内容
- **问题类型**：注水/逻辑漏洞/人物崩坏/对话尴尬等
- **严重程度**：严重（可能弃书）/中等（影响体验）/轻微（小瑕疵）
- **修改建议**：具体改写方向或示例
- **预期效果**：修改后的提升效果

# 严重问题（critical_issues）

以下问题标注为"严重"：
- 逻辑崩坏：前后矛盾、设定冲突
- 人物崩坏：主角降智、配角行为失常
- 毒点密集：圣母/舔狗/无脑/严重注水
- 情节崩坏：强行转折、牺牲合理性
- 商业致命：无钩子/无爽点/节奏严重拖沓

# 快速优化（quick_wins）

给出3-5个立竿见影的建议：
- 删减优化：可直接删除或压缩的段落
- 增强优化：加一句话就能提升的地方
- 调整优化：调换顺序效果更好的段落
- 替换优化：换种表达更有力的词句

# 综合锐评要求

**综合锐评**必须做到：
- **100字以内**，一针见血
- **直击核心问题**，不绕弯子不客套
- **用读者视角**，说人话不说官话
- **给出明确判断**：能追/一般/劝退
- **点明关键矛盾**：最大优点vs最大问题

示例风格：
- "节奏拖沓，3000字只推进一个小冲突。对话占比过高却无营养。开篇尚可，结尾无钩子。建议：删减对话，强化冲突密度。当前状态：一般偏下，需大改。"
- "爽点密集，打脸节奏精准。但主角降智明显，为装逼牺牲逻辑。文笔流畅，商业价值高。建议：修复逻辑漏洞即可上架。当前状态：能追，小修后更佳。"

# 输出格式
严格按以下JSON格式输出：
{
  "plot_progression_score": 数字(1-10),
  "character_performance_score": 数字(1-10),
  "emotional_value_score": 数字(1-10),
  "reading_pace_score": 数字(1-10),
  "creativity_score": 数字(1-10),
  "commercial_value_score": 数字(1-10),
  "writing_quality_score": 数字(1-10),
  "dialogue_quality_score": 数字(1-10),
  "overall_evaluation": "综合锐评(100字以内，直击要害)",
  "opening_analysis": "开篇分析(50-100字)",
  "ending_analysis": "结尾分析(50-100字)",
  "highlight_moments": ["爽点1", "爽点2", "爽点3"],
  "weak_points": ["槽点1", "槽点2", "槽点3"],
  "pacing_analysis": "节奏分析(50-100字)",
  "strengths": ["优点1", "优点2", "优点3"],
  "pitfalls": [
    {
      "content": "问题描述",
      "position": "具体位置",
      "severity": "严重/中等/轻微",
      "suggestion": "修改建议"
    }
  ],
  "improvement_suggestions": ["建议1", "建议2", "建议3"],
  "critical_issues": ["严重问题1", "严重问题2"],
  "quick_wins": ["快速优化1", "快速优化2", "快速优化3"]
}

评价要直接中肯，建议要具体可操作。`
}

/**
 * 构建用户提示词
 */
function buildUserPrompt(context: ChapterReviewContext): string {
  const {
    content,
    globalSettings,
    previousChapterContent,
    previousChapterTitle,
    firstFiveChaptersSummary
  } = context

  let userPrompt = ''

  // 添加全局设定
  if (globalSettings) {
    userPrompt += `# 全局设定\n${globalSettings}\n\n`
  }

  // 添加前五章梗概
  if (firstFiveChaptersSummary) {
    userPrompt += `# 前五章梗概\n${firstFiveChaptersSummary}\n\n`
  }

  // 添加上一章节
  if (previousChapterContent && previousChapterTitle) {
    userPrompt += `# 上一章节\n**标题**：${previousChapterTitle}\n**内容**：${previousChapterContent}\n\n`
  }

  // 添加待评估章节
  userPrompt += `# 待评估章节\n${content}\n\n---\n请基于以上信息，从老读者和编辑双重视角进行全面评估，输出JSON格式结果。`

  return userPrompt
}

/**
 * 构建章节评估的完整提示词
 */
export async function buildChapterReviewPrompt(context: ChapterReviewContext): Promise<string> {
  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt(context)

  return JSON.stringify({
    system_prompt: systemPrompt,
    user_prompt: userPrompt
  })
}

// ==================== 上下文获取 ====================

/**
 * 获取前一章节内容
 */
export async function getPreviousChapterContent(
  chapterId: number,
  bookId: number
): Promise<{ content: string; title: string } | null> {
  try {
    const chapters = await window.electronAPI.getChapters(bookId)
    const currentChapterIndex = chapters.findIndex(ch => ch.id === chapterId)

    if (currentChapterIndex > 0) {
      const previousChapter = chapters[currentChapterIndex - 1]
      return {
        content: previousChapter.content,
        title: previousChapter.title
      }
    }
    return null
  } catch (error) {
    console.warn('获取前一章节内容失败:', error)
    return null
  }
}

/**
 * 获取前五章梗概
 */
export async function getFirstFiveChaptersSummary(bookId: number): Promise<string> {
  try {
    const chapters = await window.electronAPI.getChapters(bookId)
    const firstFiveChapters = chapters.slice(0, 5).filter(ch => ch.summary)

    if (firstFiveChapters.length === 0) {
      return '暂无前五章梗概信息'
    }

    const summaries = firstFiveChapters.map((ch, index) =>
      `第${index + 1}章 "${ch.title}": ${ch.summary}`
    )

    return summaries.join('\n\n')
  } catch (error) {
    console.warn('获取前五章梗概失败:', error)
    return '获取前五章梗概失败'
  }
}

// ==================== 评估生成 ====================

/**
 * 生成章节评估
 */
export async function generateChapterReview(
  context: ChapterReviewContext,
  featureConfig?: FeatureConfig,
  chapterId?: number
): Promise<ChapterReviewResult> {
  // 获取功能配置
  if (!featureConfig) {
    featureConfig = await getChapterReviewConfig()
  }

  // 获取上下文信息
  if (chapterId && context.bookId) {
    try {
      const previousChapter = await getPreviousChapterContent(chapterId, context.bookId)
      if (previousChapter) {
        context.previousChapterContent = previousChapter.content
        context.previousChapterTitle = previousChapter.title
      }

      const summary = await getFirstFiveChaptersSummary(context.bookId)
      context.firstFiveChaptersSummary = summary
    } catch (error) {
      console.warn('获取上下文信息失败，继续使用基础评估:', error)
    }
  }

  // 构建提示词
  const promptData = await buildChapterReviewPrompt(context)
  const { system_prompt, user_prompt } = JSON.parse(promptData)

  // 构建消息数组
  const messages: ChatMessage[] = [
    { role: 'system', content: system_prompt },
    { role: 'user', content: user_prompt }
  ]

  try {
    // 调用 AI 生成评估
    const response: JsonChatResponse = await jsonChatCompletion(messages, featureConfig)

    if (!response.json_content) {
      console.error('AI返回的内容不是有效的JSON格式')
      console.error('原始返回内容:', response.content)
      throw new Error('AI返回的内容不是有效的JSON格式，请重试')
    }

    // 验证并修复结果
    const reviewResult = validateAndFixReviewResult(response.json_content)

    // 保存评估结果
    if (chapterId) {
      await saveChapterReview(chapterId, reviewResult)
    }

    console.log('章节评估成功完成')
    return reviewResult
  } catch (error) {
    console.error('生成章节评估失败:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('生成章节评估失败，请重试')
  }
}

// ==================== 结果验证与修复 ====================

/**
 * 验证并修复评估结果
 */
function validateAndFixReviewResult(result: Record<string, any>): ChapterReviewResult {
  const defaultResult: ChapterReviewResult = {
    plot_progression_score: 5,
    character_performance_score: 5,
    emotional_value_score: 5,
    reading_pace_score: 5,
    creativity_score: 5,
    commercial_value_score: 5,
    writing_quality_score: 5,
    dialogue_quality_score: 5,
    overall_evaluation: '评估结果解析失败，请重试',
    opening_analysis: '开篇分析数据缺失',
    ending_analysis: '结尾分析数据缺失',
    highlight_moments: ['数据解析异常'],
    weak_points: ['数据解析异常'],
    pacing_analysis: '节奏分析数据缺失',
    strengths: ['评估功能正常，但结果解析异常'],
    pitfalls: [{
      content: '请检查章节内容后重新评估',
      position: '全文',
      severity: '未知',
      suggestion: '系统需要进一步优化评估算法'
    }],
    improvement_suggestions: ['系统需要进一步优化评估算法'],
    critical_issues: ['数据解析异常'],
    quick_wins: ['重新评估以获取完整数据']
  }

  // 修复 pitfalls 数据结构
  let fixedPitfalls = defaultResult.pitfalls
  if (Array.isArray(result.pitfalls)) {
    fixedPitfalls = result.pitfalls.map(pitfall => {
      if (typeof pitfall === 'string') {
        return {
          content: pitfall,
          position: '未指定',
          severity: '未知',
          suggestion: '需要进一步分析'
        }
      }
      return {
        content: pitfall.content || '未知问题',
        position: pitfall.position || '未指定',
        severity: pitfall.severity || '未知',
        suggestion: pitfall.suggestion || '需要进一步分析'
      }
    })
  }

  // 合并默认值和实际结果
  const fixedResult: ChapterReviewResult = {
    // 评分字段
    plot_progression_score: Number(result.plot_progression_score) || defaultResult.plot_progression_score,
    character_performance_score: Number(result.character_performance_score) || defaultResult.character_performance_score,
    emotional_value_score: Number(result.emotional_value_score) || defaultResult.emotional_value_score,
    reading_pace_score: Number(result.reading_pace_score) || defaultResult.reading_pace_score,
    creativity_score: Number(result.creativity_score) || defaultResult.creativity_score,
    commercial_value_score: Number(result.commercial_value_score) || defaultResult.commercial_value_score,
    writing_quality_score: Number(result.writing_quality_score) || defaultResult.writing_quality_score,
    dialogue_quality_score: Number(result.dialogue_quality_score) || defaultResult.dialogue_quality_score,

    // 字符串字段
    overall_evaluation: typeof result.overall_evaluation === 'string' ? result.overall_evaluation : defaultResult.overall_evaluation,
    opening_analysis: typeof result.opening_analysis === 'string' ? result.opening_analysis : defaultResult.opening_analysis,
    ending_analysis: typeof result.ending_analysis === 'string' ? result.ending_analysis : defaultResult.ending_analysis,
    pacing_analysis: typeof result.pacing_analysis === 'string' ? result.pacing_analysis : defaultResult.pacing_analysis,

    // 数组字段
    strengths: Array.isArray(result.strengths) ? result.strengths : defaultResult.strengths,
    highlight_moments: Array.isArray(result.highlight_moments) ? result.highlight_moments : defaultResult.highlight_moments,
    weak_points: Array.isArray(result.weak_points) ? result.weak_points : defaultResult.weak_points,
    improvement_suggestions: Array.isArray(result.improvement_suggestions) ? result.improvement_suggestions : defaultResult.improvement_suggestions,
    critical_issues: Array.isArray(result.critical_issues) ? result.critical_issues : defaultResult.critical_issues,
    quick_wins: Array.isArray(result.quick_wins) ? result.quick_wins : defaultResult.quick_wins,

    // 复杂对象数组
    pitfalls: fixedPitfalls
  }

  return fixedResult
}

// ==================== 数据持久化 ====================

/**
 * 保存章节评估结果到数据库
 */
export async function saveChapterReview(
  chapterId: number,
  reviewResult: ChapterReviewResult
): Promise<void> {
  try {
    const reviewDataString = JSON.stringify(reviewResult)

    await window.electronAPI.updateChapter(chapterId, {
      review_data: reviewDataString
    })
  } catch (error) {
    console.error('保存评估结果失败:', error)
    throw new Error('保存评估结果失败，请重试')
  }
}

/**
 * 获取章节评估结果
 */
export async function getChapterReview(chapterId: number): Promise<ChapterReviewResult | null> {
  try {
    const chapter = await window.electronAPI.getChapter(chapterId)
    if (chapter && chapter.review_data) {
      const reviewResult = JSON.parse(chapter.review_data) as ChapterReviewResult
      return reviewResult
    }
    return null
  } catch (error) {
    console.error('获取评估结果失败:', error)
    return null
  }
}