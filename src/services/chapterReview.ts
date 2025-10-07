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
  creativity_score: number
  commercial_value_score: number
  overall_evaluation: string
  strengths: string[]
  pitfalls: Array<{
    content: string
    position?: string
    suggestion?: string
  }>
  improvement_suggestions: string[]
  plot_continuity_analysis?: string
  continuity_strengths?: string[]
  continuity_issues?: string[]
  first_five_chapters_summary?: string
  // AI回复中的新增字段
  market_trend_analysis?: string
  target_audience_analysis?: string
  commercial_potential?: string
  improvement_priority?: string[]
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
    systemPrompt = `你是一位拥有15年网文编辑经验和百万读者数据分析的专业评估师，名为神笔。请从资深网文读者和商业编辑的双重视角，对章节内容进行深度评估，专注于提升章节的阅读吸引力和商业价值。

<身份背景>
- 15年资深网文编辑：深谙各大平台爆款逻辑、读者心理、爽点设置技巧
- 百万读者数据分析：基于大数据洞察网文流行趋势和读者偏好变化
- 商业价值评估师：精准评估章节的爆款潜力和市场竞争力
- 神笔AI助手：专注于帮助作者打造爆款网文，实现商业价值最大化
</身份背景>

<评估目标>
- 精准识别章节的优缺点，提供针对性改进建议
- 评估章节的爆款潜力和商业价值，指导优化方向
- 分析章节在网文市场中的竞争力和吸引力
- 提供具体的、可执行的写作优化建议
- 帮助作者提升读者留存率、付费率和传播力
</评估目标>

<评估原则>
1. 商业导向原则：以市场需求和读者偏好为评估核心
2. 数据支撑原则：基于网文成功案例和读者行为数据
3. 精准定位原则：评估要具体到段落、句子，指出具体位置
4. 实用高效原则：建议要立即可用，效果显著
5. 爆款思维原则：围绕打造爆款网文进行全方位优化
</评估原则>

<六大评估维度（1-10分评分）>
1. 情节推进 (plot_progression_score):
   - 剧情推进是否紧凑有力，避免拖沓注水？
   - 是否设置了强悬念、爽点或爆点吸引读者？
   - 伏笔和铺垫是否巧妙，能否引发读者期待？
   - 章节结尾是否有强力钩子，确保追更率？

2. 人物表现 (character_performance_score):
   - 主角人设是否讨喜，符合目标读者喜好？
   - 角色对话是否生动有趣，有人物特色？
   - 配角是否有记忆点，避免工具化？
   - 人物关系是否有看点和冲突，增强戏剧性？

3. 情绪价值 (emotional_value_score):
   - 是否成功制造爽点、虐点、甜点等情绪爆点？
   - 情绪描写是否感染力强，能引发读者共鸣？
   - 情绪节奏是否把控得当，张弛有度？
   - 能否激发读者评论、点赞、分享等互动行为？

4. 阅读节奏 (reading_pace_score):
   - 开篇是否迅速抓人，避免慢热？
   - 段落长短是否适宜，阅读体验流畅？
   - 信息密度是否合理，避免信息过载？
   - 整体节奏是否符合网文快节奏消费习惯？

5. 创意新颖 (creativity_score):
   - 情节设定是否有新意，避免套路化？
   - 转折和反转是否出人意料，但逻辑合理？
   - 细节描写是否有创意，增强画面感？
   - 章节是否有记忆点，形成传播话题？

6. 商业价值 (commercial_value_score):
   - 章节是否符合当前网文市场热点和趋势？
   - 是否具备爆款潜质和话题性？
   - 内容是否适合付费阅读，体现价值感？
   - 能否带来高留存、高互动、高传播？
</六大评估维度>

<问题分析要求>
对于识别的问题，必须提供：
1. 具体问题描述
2. 问题出现的位置（段落、句子等）
3. 具体的修改建议和示例
</问题分析要求>

<输出格式>
请严格按照以下JSON格式返回评估结果：
{
  "plot_progression_score": 8,
  "character_performance_score": 7,
  "emotional_value_score": 9,
  "reading_pace_score": 8,
  "creativity_score": 7,
  "commercial_value_score": 8,
  "overall_evaluation": "本章节整体表现优秀，情绪价值突出，具有较强的爆款潜质...",
  "strengths": ["开篇悬念设置巧妙，迅速抓住读者眼球", "主角情绪爆发点极具感染力，易引发读者共鸣", "结尾强力钩子设置成功，追更潜力高"],
  "pitfalls": [
    {
      "content": "第3段主角内心独白略显冗长，影响阅读节奏",
      "position": "第3段开头处",
      "suggestion": "建议压缩内心独白，用更多动作和对话来体现情绪，如增加与配角的互动"
    },
    {
      "content": "配角对话缺乏个性特色，辨识度不高",
      "position": "第5-6段配角对话",
      "suggestion": "为配角设计专属口头禅或说话风格，增加人物记忆点"
    }
  ],
  "improvement_suggestions": ["建议增加一个小的情节转折，提升创意度", "在关键情节处加强环境描写，增强画面感", "优化段落结构，避免长段落堆砌"]
}
</输出格式>`
  }

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
      throw new Error('AI返回的内容不是有效的JSON格式')
    }

    // 验证JSON结构
    const expectedFields = [
      'plot_progression_score', 'character_performance_score', 'emotional_value_score', 'reading_pace_score',
      'creativity_score', 'commercial_value_score', 'overall_evaluation', 'strengths', 'pitfalls', 'improvement_suggestions'
    ]
    
    const validation = validateChapterReviewResult(response.json_content, expectedFields)
    if (!validation.valid) {
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
    overall_evaluation: '评估结果解析失败，请重试',
    strengths: ['评估功能正常，但结果解析异常'],
    pitfalls: [{
      content: '请检查章节内容后重新评估',
      position: '全文',
      suggestion: '系统需要进一步优化评估算法'
    }],
    improvement_suggestions: ['系统需要进一步优化评估算法']
  }

  // 处理pitfalls数据结构
  let fixedPitfalls = defaultResult.pitfalls
  if (Array.isArray(result.pitfalls)) {
    fixedPitfalls = result.pitfalls.map(pitfall => {
      if (typeof pitfall === 'string') {
        return { content: pitfall, position: '未指定', suggestion: '需要进一步分析' }
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
    // 确保数组字段是有效的数组
    strengths: Array.isArray(result.strengths) ? result.strengths : defaultResult.strengths,
    pitfalls: fixedPitfalls,
    improvement_suggestions: Array.isArray(result.improvement_suggestions) ? result.improvement_suggestions : defaultResult.improvement_suggestions,
    // 确保字符串字段有效
    overall_evaluation: typeof result.overall_evaluation === 'string' ? result.overall_evaluation : defaultResult.overall_evaluation
  }

  return fixedResult
}