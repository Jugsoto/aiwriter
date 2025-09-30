/**
 * 章节评估服务
 * 调用jsonChat服务进行章节质量评估
 * 参考chapterSummary.ts实现模式
 */

import { jsonChatCompletion, type JsonChatResponse } from './jsonChat'
import type { FeatureConfig } from '@/electron.d'
import type { ChatMessage } from './chat'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { getSelectedPromptByCategory } from './promptService'

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
  plot_progression_score: number
  character_performance_score: number
  emotional_value_score: number
  reading_pace_score: number
  overall_evaluation: string
  strengths: string[]
  pitfalls: string[]
  improvement_suggestions: string[]
  plot_continuity_analysis?: string
  continuity_strengths?: string[]
  continuity_issues?: string[]
  first_five_chapters_summary?: string
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

  // 获取用户选择的章节评估提示词
  let systemPrompt = ''
  try {
    const prompt = await getSelectedPromptByCategory('chapter_review')
    if (prompt) {
      systemPrompt = prompt.content
    }
  } catch (error) {
    console.warn('获取章节评估提示词失败，使用默认提示词:', error)
  }

  // 如果没有获取到用户提示词，使用默认提示词
  if (!systemPrompt) {
    systemPrompt = `你是一个拥有10年网文阅读经验和小说平台资深编辑背景的专业评估师，名为神笔。请以资深网文读者的视角和编辑的专业标准，对提供的章节内容进行全面评估。

<身份背景>
- 10年网文读者：熟悉各类网文套路、爽点设置、读者心理、流行趋势
- 小说平台资深编辑：精通网文市场趋势、读者偏好、商业价值评估标准
- 专业评估师：具备客观、中肯的评估能力，能够提供建设性反馈
- 神笔AI助手：专注于帮助作者提升写作质量，增强读者阅读体验
</身份背景>

<评估目标>
- 帮助作者识别章节的优缺点，提供具体可行的改进建议
- 确保评估结果客观公正，既肯定优点也不回避问题
- 结合前文内容，分析剧情衔接的连贯性和一致性
- 针对网文特点，评估章节的商业价值和读者吸引力
- 提供实用的写作建议，帮助作者提升后续创作质量
</评估目标>

<评估原则>
1. 客观性原则：基于事实和文本内容进行评估，避免主观臆断
2. 针对性原则：评估要具体到具体段落、人物或情节，避免泛泛而谈
3. 建设性原则：发现问题同时提供可行的改进方案
4. 连贯性原则：结合前文内容，确保评估的上下文一致性
5. 实用性原则：建议要具体可行，能够直接指导创作实践
</评估原则>

<评估维度>
请从以下四个维度对章节进行评分（1-10分的整数）：
1. 情节推进 (plot_progression_score):
   - 本章是否有效推动了主线或关键支线？
   - 是否有实质性的信息增量、关键转折或伏笔回收？
   - 是否避免了"水章"、无效对话或原地打转？
   - 与前文情节的衔接是否自然流畅？

2. 人物表现 (character_performance_score):
   - 角色（主/配）的行为、对话是否符合其人设？
   - 是否展现了角色的性格、动机、成长或关系变化？
   - 配角是否存在过度工具化的问题？
   - 角色发展是否与前文保持一致？

3. 情绪价值 (emotional_value_score):
   - 是否成功激发了目标情绪（如爽、燃、虐、甜、悬疑等）？
   - 能否引发读者的共鸣、评论或追更欲望？
   - 情绪的铺垫、爆发与收束是否自然？
   - 情绪发展是否与前文情绪基调协调？

4. 阅读节奏 (reading_pace_score):
   - 开篇是否足够抓人？结尾是否有强钩子？
   - 整体行文是否流畅、简洁，无阅读障碍？
   - 节奏快慢是否得当，符合网文快节奏的消费习惯？
   - 与前文节奏是否协调一致？
</评估维度>

<输出格式>
请严格按照以下JSON格式返回评估结果，根据评估维度中的方法给出评分及各项点评及建议内容，不要包含任何其他内容：
{
  "plot_progression_score": 6,
  "character_performance_score": 6,
  "emotional_value_score": 6,
  "reading_pace_score": 6,
  "overall_evaluation": "本章节整体质量良好，情绪价值尤为突出...",
  "strengths": ["开篇悬念设置巧妙", "主角情绪爆发点极具感染力", "节奏把控张弛有度"],
  "pitfalls": ["这是雷点1", "这是雷点2：第3段出现两处错别字", "这是雷点3"],
  "improvement_suggestions": ["这是建议1", "这是建议3", "这是建议10"]
}
</输出格式>`
  }

  let userPrompt = ''

  if (globalSettings) {
    userPrompt += `全局设定（世界观背景）：\n${globalSettings}\n\n`
  }

  // 添加前五章梗概信息
  if (firstFiveChaptersSummary) {
    userPrompt += `前五章梗概（故事背景）：\n${firstFiveChaptersSummary}\n\n`
  }

  // 添加前一章节信息
  if (previousChapterContent && previousChapterTitle) {
    userPrompt += `前一章节信息（用于剧情衔接分析）：\n`
    userPrompt += `章节内容：${previousChapterContent}\n\n`
  }

  userPrompt += `请评估以下当前章节内容：\n\n${content}`

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
    // 使用JSON聊天完成接口，使用数据库配置的温度和top_p参数
    const response: JsonChatResponse = await jsonChatCompletion(messages, featureConfig)

    if (!response.json_content) {
      throw new Error('AI返回的内容不是有效的JSON格式')
    }

    // 验证JSON结构
    const expectedFields = [
      'plot_progression_score', 'character_performance_score', 'emotional_value_score', 'reading_pace_score',
      'overall_evaluation', 'strengths', 'pitfalls', 'improvement_suggestions'
    ]

    const validation = validateChapterReviewResult(response.json_content, expectedFields)
    if (!validation.valid) {
      console.warn('JSON结构验证失败，缺失字段:', validation.missingFields)
      // 尝试修复或使用默认值
      return fixChapterReviewResult(response.json_content)
    }

    const reviewResult = response.json_content as ChapterReviewResult

    // 如果提供了章节ID，保存评估结果到数据库
    if (chapterId) {
      await saveChapterReview(chapterId, reviewResult)
    }

    return reviewResult
  } catch (error) {
    console.error('生成章节评估失败:', error)
    throw new Error('生成章节评估失败，请重试')
  }
}

/**
 * 保存章节评估结果到数据库
 */
export async function saveChapterReview(chapterId: number, reviewResult: ChapterReviewResult): Promise<void> {
  try {
    await window.electronAPI.updateChapter(chapterId, {
      review_data: JSON.stringify(reviewResult)
    })
  } catch (error) {
    console.error('保存章节评估结果失败:', error)
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
      return JSON.parse(chapter.review_data) as ChapterReviewResult
    }
    return null
  } catch (error) {
    console.error('获取章节评估结果失败:', error)
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
    overall_evaluation: '评估结果解析失败，请重试',
    strengths: ['评估功能正常，但结果解析异常'],
    pitfalls: ['请检查章节内容后重新评估'],
    improvement_suggestions: ['系统需要进一步优化评估算法']
  }

  // 合并默认值和实际结果
  return {
    ...defaultResult,
    ...result,
    plot_progression_score: Number(result.plot_progression_score) || defaultResult.plot_progression_score,
    character_performance_score: Number(result.character_performance_score) || defaultResult.character_performance_score,
    emotional_value_score: Number(result.emotional_value_score) || defaultResult.emotional_value_score,
    reading_pace_score: Number(result.reading_pace_score) || defaultResult.reading_pace_score,
    strengths: Array.isArray(result.strengths) ? result.strengths : defaultResult.strengths,
    pitfalls: Array.isArray(result.pitfalls) ? result.pitfalls : defaultResult.pitfalls,
    improvement_suggestions: Array.isArray(result.improvement_suggestions) ? result.improvement_suggestions : defaultResult.improvement_suggestions
  }
}