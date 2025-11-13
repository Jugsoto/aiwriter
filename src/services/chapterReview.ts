/**
 * 章节评估服务
 * 调用jsonChat服务进行章节质量评估
 * 参考chapterSummary.ts实现模式
 */

import { jsonChatCompletion, type JsonChatResponse } from './jsonChat'
import type { FeatureConfig } from '@/electron.d'
import type { ChatMessage } from './chat'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'

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

  // 新增深度分析
  opening_analysis: string
  ending_analysis: string
  highlight_moments: string[]
  weak_points: string[]
  pacing_analysis: string

  // 优点分析
  strengths: string[]

  // 问题与不足（增强版）
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

/**
 * 获取章节评估功能配置 - 使用章节评估专用配置
 */
export async function getChapterReviewConfig(): Promise<FeatureConfig> {
  const featureConfigsStore = useFeatureConfigsStore()
  
  // 确保配置已加载
  if (featureConfigsStore.configs.length === 0) {
    await featureConfigsStore.loadFeatureConfigs()
  }
  
  const config = featureConfigsStore.getConfigByFeatureName('chapter_review')
  if (!config) {
    throw new Error('章节评估功能配置未找到，请先在设置中配置')
  }
  
  return config
}

/**
 * 构建章节评估的用户提示词
 */
export async function buildChapterReviewPrompt(context: ChapterReviewContext): Promise<string> {
  const {
    content,
    globalSettings,
    previousChapterContent,
    previousChapterTitle,
    firstFiveChaptersSummary
  } = context

  // 使用系统默认提示词（不再支持用户自定义）
  const systemPrompt = `# 角色定位
你是一位拥有双重身份的网文评审专家：
1. 【10年网文老读者】- 阅文量超过5000万字，见过无数套路，对注水、拖沓、毒点极度敏感，追求爽感和阅读快感
2. 【资深网文编辑】- 从业8年，经手过多部爆款作品，精通商业化写作技巧，擅长发现问题并给出可落地的修改方案

# 评估原则（锐评模式）
1. 【毒舌但中肯】：像老读者吐槽一样直接，但每个批评都要有理有据
2. 【零容忍毒点】：凡是可能导致读者弃书的问题，必须标注为"严重"并重点说明
3. 【实战导向】：所有建议必须可操作，最好能给出具体改写方向或示例
4. 【商业敏感】：时刻关注订阅转化、追更欲望、付费意愿等商业指标
5. 【对标意识】：与同类型头部作品对比，找出差距和优势

# 八大评估维度（1-10分评分标准）

## 1. 情节推进 (plot_progression_score)
【老读者视角】
- 8-10分：剧情紧凑，每段都有信息量，看得停不下来
- 6-7分：基本流畅，但有注水嫌疑，部分段落可删减
- 4-5分：拖沓明显，大段废话，有快进冲动
- 1-3分：严重注水，剧情停滞，想弃书

【编辑视角】
- 是否有明确的章节目标（冲突/悬念/转折）
- 信息密度是否合理（3000字至少要有2-3个情节点）
- 章末钩子是否有效（能否吸引读者点下一章）

## 2. 人物表现 (character_performance_score)
【老读者视角】
- 8-10分：人物鲜活，行为合理，对话有个性
- 6-7分：人物扁平，但不出戏
- 4-5分：人物工具化，为剧情服务而失去真实感
- 1-3分：人物崩坏，智商下线，行为不符合人设

【编辑视角】
- 主角是否有清晰的动机和目标
- 配角是否有存在价值（推动剧情/制造冲突/提供信息）
- 人物对话是否符合身份和性格
- 是否有"为了剧情需要而降智"的情况

## 3. 情绪价值 (emotional_value_score)
【老读者视角】
- 8-10分：情绪饱满，爽点密集，看得热血沸腾
- 6-7分：有情绪起伏，但不够强烈
- 4-5分：平淡如水，缺乏代入感
- 1-3分：尴尬、别扭，甚至反感

【编辑视角】
- 爽点设计是否到位（打脸/逆袭/装逼/收获）
- 情绪节奏是否合理（张弛有度，不能一直平淡）
- 是否有让读者共鸣的情感触点
- 负面情绪（憋屈/愤怒）是否能及时释放

## 4. 阅读节奏 (reading_pace_score)
【老读者视角】
- 8-10分：一气呵成，根本停不下来
- 6-7分：整体流畅，偶有卡顿
- 4-5分：节奏拖沓，多次想跳过
- 1-3分：读不下去，严重影响体验

【编辑视角】
- 开篇前100字是否抓人（黄金开局）
- 段落长度是否合理（避免大段文字墙）
- 叙事密度是否均衡（避免前松后紧或前紧后松）
- 是否有"无效文字"（可删减而不影响理解）

## 5. 创意新颖 (creativity_score)
【老读者视角】
- 8-10分：眼前一亮，没见过的设定/情节/反转
- 6-7分：常规套路，但执行得不错
- 4-5分：老套路，但还能看
- 1-3分：陈词滥调，毫无新意

【编辑视角】
- 是否有差异化的设定或情节
- 是否避开了常见的"烂梗"
- 细节描写是否有巧思
- 是否有让人记住的"名场面"

## 6. 商业价值 (commercial_value_score)
【老读者视角】
- 8-10分：强烈的追更欲望，愿意付费订阅
- 6-7分：可以追更，但不急
- 4-5分：可看可不看，随缘
- 1-3分：没有继续看的欲望

【编辑视角】
- 是否有明确的目标读者群体
- 是否符合当前市场热点和趋势
- 付费转化点是否设计合理（章末钩子）
- 是否有"传播点"（能让读者推荐给朋友的亮点）

## 7. 文笔质量 (writing_quality_score)
【老读者视角】
- 8-10分：文字流畅优美，描写生动
- 6-7分：文笔合格，不影响阅读
- 4-5分：文笔粗糙，但能看懂
- 1-3分：语句不通，错字连篇

【编辑视角】
- 语言是否简洁有力（避免冗余修饰）
- 描写是否生动具体（避免抽象空洞）
- 用词是否准确恰当（避免词不达意）
- 是否有明显的语病和错字

## 8. 对话质量 (dialogue_quality_score)
【老读者视角】
- 8-10分：对话自然有趣，有冲突有张力
- 6-7分：对话合格，不出戏
- 4-5分：对话生硬，像背台词
- 1-3分：对话尴尬，严重出戏

【编辑视角】
- 对话是否推动剧情（避免无效对话）
- 对话是否符合人物性格和身份
- 是否有"信息轰炸"（大段说明性对话）
- 对话节奏是否紧凑（避免一问一答的流水账）

# 深度分析要求

## 开篇分析（前200字黄金区）
- 是否在前3句话内抓住读者注意力
- 是否快速建立场景和冲突
- 是否有"继续读下去"的理由
- 【锐评】：如果开篇平淡，直接指出"开篇废话太多，前XX字可以直接删掉"

## 结尾分析（章末钩子）
- 是否留下悬念或期待
- 是否有"必须看下一章"的冲动
- 结尾是否突兀或草率
- 【锐评】：如果结尾无力，直接指出"结尾太平淡，建议改为XXX，制造悬念"

## 爽点分析（highlight_moments）
- 找出本章最精彩的2-5个片段
- 说明为什么爽（打脸/逆袭/装逼/收获/反转）
- 评估爽点密度是否合理
- 【锐评】：如果爽点不足，直接指出"全章缺乏高潮，建议在XX处增加冲突"

## 槽点分析（weak_points）
- 找出本章最影响阅读体验的2-5个问题
- 说明为什么槽（注水/拖沓/逻辑漏洞/人物崩坏）
- 评估槽点的严重程度
- 【锐评】：用老读者的口吻吐槽，例如"这段对话太尬了，像小学生过家家"

## 节奏分析（pacing_analysis）
- 整体节奏是快是慢
- 是否有明显的节奏问题（前松后紧/前紧后松/一直平淡）
- 哪些段落可以加快/放慢
- 【锐评】：直接指出"XX-XX段完全是注水，可以压缩到XX字"

# 问题定位要求（编辑专业视角）

发现问题时必须提供：
1. 【具体位置】：第几段、第几句、具体文字内容
2. 【问题类型】：注水/拖沓/逻辑漏洞/人物崩坏/对话尴尬/描写空洞等
3. 【严重程度】：
   - 严重：可能导致读者弃书的致命问题
   - 中等：影响阅读体验，但不至于弃书
   - 轻微：小瑕疵，优化后更好
4. 【修改建议】：给出具体的改写方向，最好有示例
5. 【预期效果】：说明修改后能达到什么效果

# 严重问题识别（critical_issues）

以下问题必须标注为"严重"并列入critical_issues：
1. 【逻辑崩坏】：前后矛盾、设定冲突、因果不通
2. 【人物崩坏】：主角突然降智、配角行为不符合人设
3. 【毒点密集】：圣母/舔狗/无脑/拖沓/注水严重
4. 【情节崩坏】：强行转折、为了剧情需要而牺牲合理性
5. 【商业致命】：章末无钩子、全章无爽点、节奏严重拖沓

# 快速优化建议（quick_wins）

给出3-5个"立竿见影"的优化建议：
1. 【删减优化】：哪些段落可以直接删掉或压缩
2. 【增强优化】：哪些地方加一句话就能提升效果
3. 【调整优化】：哪些段落调换顺序效果更好
4. 【替换优化】：哪些词语/句子换一种表达更有力

示例：
- "开篇前两段全是废话，直接从第三段开始，效果立刻提升"
- "结尾加一句'他突然想起了那个预言'，悬念立刻就有了"
- "把XX段的心理描写删掉，改成对话推进，节奏立刻快起来"

<输出格式>
JSON格式示例：
{
  "plot_progression_score": 8,
  "character_performance_score": 7,
  "emotional_value_score": 9,
  "reading_pace_score": 8,
  "creativity_score": 7,
  "commercial_value_score": 8,
  "writing_quality_score": 7,
  "dialogue_quality_score": 8,
  "overall_evaluation": "本章整体质量不错...",
  "opening_analysis": "开篇前三段：...",
  "ending_analysis": "结尾：...",
  "highlight_moments": ["亮点1", "亮点2"],
  "weak_points": ["问题1", "问题2"],
  "pacing_analysis": "节奏：...",
  "strengths": ["优点1", "优点2", "优点3"],
  "pitfalls": [{"content": "...", "position": "...", "severity": "中等", "suggestion": "..."}],
  "improvement_suggestions": ["建议1", "建议2", "建议3"],
  "critical_issues": [],
  "quick_wins": ["优化1", "优化2", "优化3"]
}
</输出格式>`

  let userPrompt = ''

  if (globalSettings) {
    userPrompt += `# 全局设定：
1. 全局设定是本书的基础信息，如小说类型、主线暗线信息。
2. 全局设定会贯穿整本书，影响所有章节的内容和走向。
3. 全局设定会影响章节评估的标准和重点，请务必参考。
# 以下是全局设定内容：
${globalSettings}\n\n`
  }

  // 添加前五章梗概信息
  if (firstFiveChaptersSummary) {
    userPrompt += `# 前五章梗概：
1. 前五章梗概是对故事开篇的简要总结，帮助理解故事背景和人物关系。
2. 前五章梗概会影响当前章节的评估标准，特别是剧情连贯性分析。
3. 前五章梗概会帮助你更好的理解故事发展脉络和人物成长轨迹。
# 以下是前五章梗概内容：
${firstFiveChaptersSummary}\n\n`
  }

  // 添加前一章节信息
  if (previousChapterContent && previousChapterTitle) {
    userPrompt += `# 前一章节信息：
1. 前一章节内容是紧接当前章节的上一个章节内容。
2. 在评估当前章节时，必须参考前一章节保持剧情连贯性分析。
3. 前一章节信息会影响情节推进、人物发展和情绪价值的评估标准。
# 以下是前一章节内容：
章节标题：${previousChapterTitle}
章节内容：${previousChapterContent}\n\n`
  }

  userPrompt += `# 当前章节内容：
1. 当前章节内容是本次评估的主要对象，请基于以上所有上下文信息进行全面评估。
2. 评估时要结合前文内容，分析剧情衔接的连贯性和一致性。
3. 请严格按照评估维度和原则进行客观、专业的评估。
# 以下是当前章节内容：
${content}`

  return JSON.stringify({
    system_prompt: systemPrompt,
    user_prompt: userPrompt
  })
}

/**
 * 获取前一章节内容
 */
export async function getPreviousChapterContent(chapterId: number, bookId: number): Promise<{ content: string; title: string } | null> {
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

/**
 * 生成章节评估 - 非流式JSON输出
 */
export async function generateChapterReview(
  context: ChapterReviewContext,
  featureConfig?: FeatureConfig,
  chapterId?: number
): Promise<ChapterReviewResult> {
  // 如果没有提供功能配置，则获取默认配置
  if (!featureConfig) {
    featureConfig = await getChapterReviewConfig()
  }

  // 如果提供了章节ID和书籍ID，尝试获取前一章节内容和前五章梗概
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

  const promptData = await buildChapterReviewPrompt(context)
  const { system_prompt, user_prompt } = JSON.parse(promptData)

  // 构建消息数组
  const messages: ChatMessage[] = [
    { role: 'system' as const, content: system_prompt },
    { role: 'user' as const, content: user_prompt }
  ]

  try {
    // 使用JSON聊天完成接口，使用数据库配置的温度参数
    const response: JsonChatResponse = await jsonChatCompletion(messages, featureConfig)

    if (!response.json_content) {
      console.error('AI返回的内容不是有效的JSON格式')
      console.error('原始返回内容:', response.content)
      throw new Error('AI返回的内容不是有效的JSON格式，请重试')
    }

    // 验证JSON结构
    const expectedFields = [
      'plot_progression_score', 'character_performance_score', 'emotional_value_score', 'reading_pace_score',
      'creativity_score', 'commercial_value_score', 'writing_quality_score', 'dialogue_quality_score',
      'overall_evaluation', 'opening_analysis', 'ending_analysis', 'highlight_moments', 'weak_points',
      'pacing_analysis', 'strengths', 'pitfalls', 'improvement_suggestions',
      'critical_issues', 'quick_wins'
    ]

    const validation = validateChapterReviewResult(response.json_content, expectedFields)
    if (!validation.valid) {
      console.warn('JSON结构不完整，缺少字段:', validation.missingFields)
      console.warn('实际返回的JSON:', response.json_content)
      // 尝试修复或使用默认值
      return fixChapterReviewResult(response.json_content)
    }

    const reviewResult = response.json_content as ChapterReviewResult

    // 如果提供了章节ID，保存评估结果到数据库
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

/**
 * 保存章节评估结果到数据库
 */
export async function saveChapterReview(chapterId: number, reviewResult: ChapterReviewResult): Promise<void> {
  try {
    const reviewDataString = JSON.stringify(reviewResult)
    
    await window.electronAPI.updateChapter(chapterId, {
      review_data: reviewDataString
    })
  } catch {
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
  } catch {
    return null
  }
}

/**
 * 验证章节评估结果的结构
 */
function validateChapterReviewResult(
  result: Record<string, any>,
  expectedFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = []
  
  for (const field of expectedFields) {
    if (!(field in result)) {
      missingFields.push(field)
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  }
}

/**
 * 修复不完整的章节评估结果
 */
function fixChapterReviewResult(result: Record<string, any>): ChapterReviewResult {
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

  // 处理pitfalls数据结构
  let fixedPitfalls = defaultResult.pitfalls
  if (Array.isArray(result.pitfalls)) {
    fixedPitfalls = result.pitfalls.map(pitfall => {
      if (typeof pitfall === 'string') {
        return { content: pitfall, position: '未指定', severity: '未知', suggestion: '需要进一步分析' }
      }
      return pitfall
    })
  }

  // 合并默认值和实际结果，确保所有必需字段都存在
  const fixedResult: ChapterReviewResult = {
    ...defaultResult,
    ...result,
    // 确保所有评分字段都是有效的数字
    plot_progression_score: Number(result.plot_progression_score) || defaultResult.plot_progression_score,
    character_performance_score: Number(result.character_performance_score) || defaultResult.character_performance_score,
    emotional_value_score: Number(result.emotional_value_score) || defaultResult.emotional_value_score,
    reading_pace_score: Number(result.reading_pace_score) || defaultResult.reading_pace_score,
    creativity_score: Number(result.creativity_score) || defaultResult.creativity_score,
    commercial_value_score: Number(result.commercial_value_score) || defaultResult.commercial_value_score,
    writing_quality_score: Number(result.writing_quality_score) || defaultResult.writing_quality_score,
    dialogue_quality_score: Number(result.dialogue_quality_score) || defaultResult.dialogue_quality_score,
    // 确保字符串字段有效
    overall_evaluation: typeof result.overall_evaluation === 'string' ? result.overall_evaluation : defaultResult.overall_evaluation,
    opening_analysis: typeof result.opening_analysis === 'string' ? result.opening_analysis : defaultResult.opening_analysis,
    ending_analysis: typeof result.ending_analysis === 'string' ? result.ending_analysis : defaultResult.ending_analysis,
    pacing_analysis: typeof result.pacing_analysis === 'string' ? result.pacing_analysis : defaultResult.pacing_analysis,
    // 确保数组字段是有效的数组
    strengths: Array.isArray(result.strengths) ? result.strengths : defaultResult.strengths,
    highlight_moments: Array.isArray(result.highlight_moments) ? result.highlight_moments : defaultResult.highlight_moments,
    weak_points: Array.isArray(result.weak_points) ? result.weak_points : defaultResult.weak_points,
    pitfalls: fixedPitfalls,
    improvement_suggestions: Array.isArray(result.improvement_suggestions) ? result.improvement_suggestions : defaultResult.improvement_suggestions,
    critical_issues: Array.isArray(result.critical_issues) ? result.critical_issues : defaultResult.critical_issues,
    quick_wins: Array.isArray(result.quick_wins) ? result.quick_wins : defaultResult.quick_wins
  }

  return fixedResult
}