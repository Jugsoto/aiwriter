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
}

export interface ChapterReviewResult {
  overall_score: number
  plot_score: number
  character_score: number
  writing_score: number
  overall_evaluation: string
  strengths: string[]
  suggestions: string[]
  improvement_directions: string[]
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
  const { content, globalSettings, chapterTitle } = context

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
    systemPrompt = `你是一个拥有10年网文阅读经验和小说平台资深编辑背景的专业评估师。请以资深网文读者的视角和编辑的专业标准，对提供的章节内容进行全面评估。

<身份背景>
- 10年网文读者：熟悉各类网文套路、爽点设置、读者心理
- 小说平台资深编辑：精通网文市场趋势、读者偏好、商业价值评估
</身份背景>

<评估维度>
1. 情节结构 (plot_score): 1-10分
   - 开篇吸引力：能否在3秒内抓住读者
   - 节奏把控：爽点密度、高潮设置是否合理
   - 悬念设计：是否埋下足够钩子让读者追更
   - 逻辑连贯性：情节发展是否自然合理

2. 人物塑造 (character_score): 1-10分
   - 主角魅力：主角人设是否讨喜、有记忆点
   - 配角存在感：配角是否工具化
   - 人物成长：角色是否有明显变化或成长
   - 对话真实度：对话是否符合人物身份和场景

3. 文笔功底 (writing_score): 1-10分
   - 语言流畅度：阅读是否顺畅无阻碍
   - 描写生动性：画面感、代入感是否强烈
   - 网文风格：是否符合目标读者阅读习惯
   - 情绪渲染：能否有效调动读者情绪

4. 网文特色 (overall_score): 1-10分
   - 商业价值：章节是否具备爆款潜质
   - 读者粘性：是否能让读者产生追更欲望
   - 创新程度：在同类型作品中是否有亮点
   - 市场契合度：是否符合当前网文市场趋势
</评估维度>

<输出格式>
请严格按照以下JSON格式返回评估结果，不要包含任何其他内容：

{
  "overall_score": 8,
  "plot_score": 7,
  "character_score": 9,
  "writing_score": 8,
  "overall_evaluation": "本章节整体质量良好，人物塑造尤为出色...",
  "strengths": ["主角人设鲜明讨喜", "对话生动自然", "悬念设置到位"],
  "suggestions": ["建议增加爽点密度", "部分描写可更简洁", "配角形象需更立体"],
  "improvement_directions": ["优化情节节奏，增加高潮冲击力", "强化配角存在感", "提升开篇吸引力"]
}

请确保所有评分都是1-10的整数，评价内容具体、实用，具有可操作性。
</输出格式>`
  }

  let userPrompt = ''

  if (globalSettings) {
    userPrompt += `全局设定（世界观背景）：\n${globalSettings}\n\n`
  }

  if (chapterTitle) {
    userPrompt += `章节标题：${chapterTitle}\n\n`
  }

  userPrompt += `请评估以下章节内容：\n\n${content}`

  return JSON.stringify({
    system_prompt: systemPrompt,
    user_prompt: userPrompt
  })
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
      'overall_score', 'plot_score', 'character_score', 'writing_score',
      'overall_evaluation', 'strengths', 'suggestions', 'improvement_directions'
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
    overall_score: 5,
    plot_score: 5,
    character_score: 5,
    writing_score: 5,
    overall_evaluation: '评估结果解析失败，请重试',
    strengths: ['评估功能正常，但结果解析异常'],
    suggestions: ['请检查章节内容后重新评估'],
    improvement_directions: ['系统需要进一步优化评估算法']
  }

  // 合并默认值和实际结果
  return {
    ...defaultResult,
    ...result,
    overall_score: Number(result.overall_score) || defaultResult.overall_score,
    plot_score: Number(result.plot_score) || defaultResult.plot_score,
    character_score: Number(result.character_score) || defaultResult.character_score,
    writing_score: Number(result.writing_score) || defaultResult.writing_score,
    strengths: Array.isArray(result.strengths) ? result.strengths : defaultResult.strengths,
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : defaultResult.suggestions,
    improvement_directions: Array.isArray(result.improvement_directions) ? result.improvement_directions : defaultResult.improvement_directions
  }
}