/**
 * 榜单分析服务
 * 使用 jsonChat 分析榜单上的网络小说题材、热门趋势、热点信息等
 */

import { jsonChatCompletion, type JsonChatResponse } from './jsonChat'
import type { ChatMessage } from './chat'
import type { FeatureConfig } from '@/electron.d'
import type { DecodedBook } from '@/types/leaderboard'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'

export interface LeaderboardAnalysisContext {
  books: DecodedBook[]
  boardName: string
  categoryName: string
}

export interface GenreDistribution {
  genre: string
  count: number
  percentage: number
  examples: string[]
}

export interface TrendAnalysis {
  trend_name: string
  description: string
  popularity: string
  representative_books: string[]
}

export interface HotKeyword {
  keyword: string
  frequency: number
  category: string
}

export interface ReaderPreference {
  preference_type: string
  description: string
  supporting_data: string
}

export interface LeaderboardAnalysisResult {
  genre_distribution: GenreDistribution[]
  trend_analysis: TrendAnalysis[]
  hot_keywords: HotKeyword[]
  reader_preferences: ReaderPreference[]
  commercial_value_assessment: string
  creation_suggestions: string[]
  overall_summary: string
}

/**
 * 获取榜单分析功能配置 - 使用章节评估的配置
 */
export async function getLeaderboardAnalysisConfig(): Promise<FeatureConfig> {
  const featureConfigsStore = useFeatureConfigsStore()

  // 确保配置已加载
  if (featureConfigsStore.configs.length === 0) {
    await featureConfigsStore.loadFeatureConfigs()
  }

  // 使用章节评估的配置
  const config = featureConfigsStore.getConfigByFeatureName('chapter_review')
  if (!config) {
    throw new Error('章节评估功能配置未找到，请先在设置中配置')
  }

  return config
}

/**
 * 构建榜单分析的提示词
 */
export function buildLeaderboardAnalysisPrompt(context: LeaderboardAnalysisContext): { systemPrompt: string; userPrompt: string } {
  const { books, boardName, categoryName } = context

  const systemPrompt = `你是一位资深的网络文学市场分析师，拥有10年以上的行业经验。你擅长分析网文市场趋势、读者偏好、题材热度等。

请基于提供的榜单数据，从以下几个维度进行深度分析，并以JSON格式返回结果：

1. **题材分布分析 (genre_distribution)**
   - 统计榜单上各类题材的占比（如玄幻、都市、言情、科幻等）
   - 分析主流题材和新兴题材的表现
   - 提供每个题材的代表作品

2. **热门趋势分析 (trend_analysis)**
   - 识别当前最受欢迎的题材类型和创作趋势
   - 分析高人气作品的共同特征
   - 预测未来可能的趋势走向

3. **热点关键词 (hot_keywords)**
   - 从书名和简介中提取高频关键词
   - 识别热门设定、人物类型、故事背景
   - 按类别分类关键词（如：设定、人物、背景等）

4. **读者偏好洞察 (reader_preferences)**
   - 基于在读人数分析读者喜好
   - 识别高留存率作品的特点
   - 分析不同题材的受众规模

5. **商业价值评估 (commercial_value_assessment)**
   - 评估榜单整体的商业价值
   - 识别具有爆款潜力的题材方向

6. **创作建议 (creation_suggestions)**
   - 提供具体的创作建议和市场机会

7. **整体总结 (overall_summary)**
   - 对榜单进行整体性的总结和评价

请严格按照以下JSON格式返回分析结果：
{
  "genre_distribution": [
    {
      "genre": "题材名称",
      "count": 数量,
      "percentage": 百分比,
      "examples": ["代表作品1", "代表作品2"]
    }
  ],
  "trend_analysis": [
    {
      "trend_name": "趋势名称",
      "description": "趋势描述",
      "popularity": "热度评级（高/中/低）",
      "representative_books": ["代表作品1", "代表作品2"]
    }
  ],
  "hot_keywords": [
    {
      "keyword": "关键词",
      "frequency": 出现频率,
      "category": "关键词类别（设定/人物/背景等）"
    }
  ],
  "reader_preferences": [
    {
      "preference_type": "偏好类型",
      "description": "偏好描述",
      "supporting_data": "支撑数据"
    }
  ],
  "commercial_value_assessment": "商业价值评估的详细描述",
  "creation_suggestions": ["建议1", "建议2", "建议3"],
  "overall_summary": "整体总结"
}`

  // 构建书籍列表信息
  const booksList = books.map((book, index) => {
    return `${index + 1}. 《${book.bookName}》
   作者：${book.author}
   在读人数：${book.readCount}
   简介：${book.abstract || '暂无简介'}
   状态：${book.status}`
  }).join('\n\n')

  const userPrompt = `请分析以下榜单数据：

**榜单信息**
- 榜单名称：${boardName}
- 分类：${categoryName}
- 书籍数量：${books.length}本

**榜单书籍列表**
${booksList}

请基于以上数据，进行全面深入的榜单分析，并严格按照JSON格式返回结果。`

  return { systemPrompt, userPrompt }
}

/**
 * 生成榜单分析 - 非流式JSON输出
 * @param context 榜单分析上下文
 * @param featureConfig 功能配置
 * @returns 榜单分析结果
 */
export async function generateLeaderboardAnalysis(
  context: LeaderboardAnalysisContext,
  featureConfig?: FeatureConfig
): Promise<LeaderboardAnalysisResult> {
  // 如果没有提供功能配置，则获取默认配置
  if (!featureConfig) {
    featureConfig = await getLeaderboardAnalysisConfig()
  }

  const { systemPrompt, userPrompt } = buildLeaderboardAnalysisPrompt(context)

  // 构建消息数组
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  try {
    // 使用JSON聊天完成接口
    const response: JsonChatResponse = await jsonChatCompletion(messages, featureConfig)

    if (!response.json_content) {
      console.error('AI返回的内容不是有效的JSON格式')
      console.error('原始返回内容:', response.content)
      throw new Error('AI返回的内容不是有效的JSON格式，请重试')
    }

    // 验证JSON结构
    const expectedFields = [
      'genre_distribution',
      'trend_analysis',
      'hot_keywords',
      'reader_preferences',
      'commercial_value_assessment',
      'creation_suggestions',
      'overall_summary'
    ]

    const missingFields: string[] = []
    for (const field of expectedFields) {
      if (!(field in response.json_content)) {
        missingFields.push(field)
      }
    }

    if (missingFields.length > 0) {
      console.warn('JSON结构不完整，缺少字段:', missingFields)
      console.warn('实际返回的JSON:', response.json_content)
      // 尝试修复或使用默认值
      return fixLeaderboardAnalysisResult(response.json_content)
    }

    console.log('榜单分析成功完成')
    return response.json_content as LeaderboardAnalysisResult
  } catch (error) {
    console.error('生成榜单分析失败:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('生成榜单分析失败，请重试')
  }
}

/**
 * 修复不完整的榜单分析结果
 */
function fixLeaderboardAnalysisResult(result: Record<string, any>): LeaderboardAnalysisResult {
  const defaultResult: LeaderboardAnalysisResult = {
    genre_distribution: [],
    trend_analysis: [],
    hot_keywords: [],
    reader_preferences: [],
    commercial_value_assessment: '分析结果解析失败，请重试',
    creation_suggestions: ['请重新生成分析'],
    overall_summary: '分析结果解析失败'
  }

  // 合并默认值和实际结果
  return {
    ...defaultResult,
    ...result,
    genre_distribution: Array.isArray(result.genre_distribution) ? result.genre_distribution : defaultResult.genre_distribution,
    trend_analysis: Array.isArray(result.trend_analysis) ? result.trend_analysis : defaultResult.trend_analysis,
    hot_keywords: Array.isArray(result.hot_keywords) ? result.hot_keywords : defaultResult.hot_keywords,
    reader_preferences: Array.isArray(result.reader_preferences) ? result.reader_preferences : defaultResult.reader_preferences,
    creation_suggestions: Array.isArray(result.creation_suggestions) ? result.creation_suggestions : defaultResult.creation_suggestions
  }
}
