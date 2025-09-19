<template>
  <div class="p-6">
    <div class="space-y-6 bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
      <div>
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">用量统计</h3>

        <!-- 汇总信息卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
            <div class="text-sm text-[var(--text-secondary)] mb-1">总调用次数</div>
            <div class="text-2xl font-bold text-[var(--text-primary)]">{{ summary.total_calls }}</div>
          </div>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
            <div class="text-sm text-[var(--text-secondary)] mb-1">总输入Token</div>
            <div class="text-2xl font-bold text-[var(--text-primary)]">{{ formatNumber(summary.total_input_tokens) }}
            </div>
          </div>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
            <div class="text-sm text-[var(--text-secondary)] mb-1">总输出Token</div>
            <div class="text-2xl font-bold text-[var(--text-primary)]">{{ formatNumber(summary.total_output_tokens) }}
            </div>
          </div>
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
            <div class="text-sm text-[var(--text-secondary)] mb-1">总Token数</div>
            <div class="text-2xl font-bold text-[var(--text-primary)]">{{ formatNumber(summary.total_tokens) }}</div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- 每日用量趋势图 -->
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-md font-medium text-[var(--text-primary)]">每日用量趋势</h4>
              <div class="flex gap-1">
                <button @click="setTrendDays(7)" :class="[
                  'px-3 py-1 text-xs rounded transition-all',
                  trendDays === 7 ? 'text-white bg-[var(--theme-bg)]' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                ]">
                  7天
                </button>
                <button @click="setTrendDays(15)" :class="[
                  'px-3 py-1 text-xs rounded transition-all',
                  trendDays === 15 ? 'text-white bg-[var(--theme-bg)]' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                ]">
                  15天
                </button>
                <button @click="setTrendDays(30)" :class="[
                  'px-3 py-1 text-xs rounded transition-all',
                  trendDays === 30 ? 'text-white bg-[var(--theme-bg)]' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                ]">
                  30天
                </button>
              </div>
            </div>
            <div ref="dailyTrendChart" class="h-64"></div>
          </div>

          <!-- 供应商分布饼图 -->
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
            <h4 class="text-md font-medium text-[var(--text-primary)] mb-3">供应商Token分布</h4>
            <div ref="providerPieChart" class="h-64"></div>
          </div>

          <!-- 模型使用对比柱状图 -->
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
            <h4 class="text-md font-medium text-[var(--text-primary)] mb-3">模型使用对比</h4>
            <div ref="modelBarChart" class="h-64"></div>
          </div>

          <!-- 功能Token分布 -->
          <div class="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
            <h4 class="text-md font-medium text-[var(--text-primary)] mb-3">功能Token分布</h4>
            <div ref="tokenTypeChart" class="h-64"></div>
          </div>
        </div>

        <!-- 时间范围选择 -->
        <div class="flex items-center gap-4 mb-6">
          <div class="flex items-center gap-2">
            <label class="text-sm text-[var(--text-secondary)]">开始时间:</label>
            <input v-model="startDate" type="date"
              class="px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)]">
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-[var(--text-secondary)]">结束时间:</label>
            <input v-model="endDate" type="date"
              class="px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)]">
          </div>
          <button @click="filterByDateRange"
            class="px-4 py-2 text-sm text-white bg-[var(--theme-bg)] hover:bg-primary transition-all rounded-lg">
            筛选
          </button>
          <button @click="resetDateFilter"
            class="px-4 py-2 text-sm text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all rounded-lg">
            重置
          </button>
        </div>

        <!-- 详细记录表格 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-md font-medium text-[var(--text-primary)]">详细记录</h4>
            <button @click="loadUsageStatistics"
              class="px-3 py-1.5 text-xs text-white bg-[var(--theme-bg)] hover:bg-primary transition-all rounded-lg">
              刷新
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--border-color)]">
                  <th class="text-left py-2 px-3 text-[var(--text-secondary)]">时间</th>
                  <th class="text-left py-2 px-3 text-[var(--text-secondary)]">供应商/模型</th>
                  <th class="text-left py-2 px-3 text-[var(--text-secondary)]">功能</th>
                  <th class="text-right py-2 px-3 text-[var(--text-secondary)]">输入Token</th>
                  <th class="text-right py-2 px-3 text-[var(--text-secondary)]">输出Token</th>
                  <th class="text-right py-2 px-3 text-[var(--text-secondary)]">总计</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stat in paginatedStatistics" :key="stat.id"
                  class="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                  <td class="py-2 px-3 text-[var(--text-primary)]">{{ formatDateTime(stat.timestamp) }}</td>
                  <td class="py-2 px-3 text-[var(--text-primary)]">
                    <div class="text-xs">{{ stat.provider_name }}</div>
                    <div class="text-xs text-[var(--text-secondary)]">{{ stat.model_name }}</div>
                  </td>
                  <td class="py-2 px-3 text-[var(--text-primary)]">{{ stat.feature_name }}</td>
                  <td class="py-2 px-3 text-right text-[var(--text-primary)]">{{ formatNumber(stat.input_tokens) }}</td>
                  <td class="py-2 px-3 text-right text-[var(--text-primary)]">{{ formatNumber(stat.output_tokens) }}
                  </td>
                  <td class="py-2 px-3 text-right text-[var(--text-primary)] font-medium">{{
                    formatNumber(stat.total_tokens) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
            <div class="text-sm text-[var(--text-secondary)]">
              显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, usageStatistics.length) }}
              条，共 {{ usageStatistics.length }} 条
            </div>
            <div class="flex items-center gap-2">
              <button @click="currentPage--" :disabled="currentPage <= 1"
                class="px-3 py-1 text-sm border border-[var(--border-color)] rounded hover:bg-[var(--bg-secondary)] disabled:opacity-50">
                上一页
              </button>
              <span class="text-sm text-[var(--text-primary)]">{{ currentPage }} / {{ totalPages }}</span>
              <button @click="currentPage++" :disabled="currentPage >= totalPages"
                class="px-3 py-1 text-sm border border-[var(--border-color)] rounded hover:bg-[var(--bg-secondary)] disabled:opacity-50">
                下一页
              </button>
            </div>
          </div>

          <div v-if="usageStatistics.length === 0" class="text-center py-8 text-[var(--text-secondary)]">
            暂无用量记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { UsageStatistic } from '@/electron.d'

// 响应式数据
interface SummaryData {
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  providers: Array<{
    provider_id: number
    provider_name: string
    total_calls: number
    total_tokens: number
  }>
  models: Array<{
    model_id: number
    model_name: string
    provider_name: string
    total_calls: number
    total_tokens: number
  }>
}

const summary = ref<SummaryData>({
  total_calls: 0,
  total_input_tokens: 0,
  total_output_tokens: 0,
  total_tokens: 0,
  providers: [],
  models: []
})

const usageStatistics = ref<UsageStatistic[]>([])
const allUsageStatistics = ref<UsageStatistic[]>([]) // 所有历史数据，用于趋势图
const startDate = ref('')
const endDate = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const trendDays = ref(7) // 默认显示7天趋势

// 图表实例
const dailyTrendChart = ref<HTMLElement>()
const providerPieChart = ref<HTMLElement>()
const modelBarChart = ref<HTMLElement>()
const tokenTypeChart = ref<HTMLElement>()

let dailyTrendInstance: echarts.ECharts | null = null
let providerPieInstance: echarts.ECharts | null = null
let modelBarInstance: echarts.ECharts | null = null
let tokenTypeInstance: echarts.ECharts | null = null

// 计算属性
const paginatedStatistics = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return usageStatistics.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(usageStatistics.value.length / pageSize.value)
})

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化日期时间
const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取主题颜色
const getThemeColors = () => {
  const isDark = document.documentElement.classList.contains('dark')
  return {
    textColor: isDark ? '#e5e7eb' : '#374151',
    gridColor: isDark ? '#374151' : '#e5e7eb',
    backgroundColor: isDark ? '#1f2937' : '#ffffff'
  }
}

// 处理每日数据
const processDailyData = () => {
  const dailyMap = new Map<string, { calls: number, inputTokens: number, outputTokens: number, totalTokens: number }>()

  // 根据趋势天数筛选数据（从今天往前推指定天数）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - trendDays.value)

  // 使用所有历史数据，不受时间选择器影响
  allUsageStatistics.value.forEach(stat => {
    const statDate = new Date(stat.timestamp)
    // 只处理在指定时间范围内的数据
    if (statDate >= startDate && statDate <= endDate) {
      const date = statDate.toLocaleDateString('zh-CN')
      const existing = dailyMap.get(date) || { calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 }
      existing.calls += 1
      existing.inputTokens += stat.input_tokens
      existing.outputTokens += stat.output_tokens
      existing.totalTokens += stat.total_tokens
      dailyMap.set(date, existing)
    }
  })

  const dates = Array.from(dailyMap.keys()).sort()
  const calls = dates.map(date => dailyMap.get(date)!.calls)
  const inputTokens = dates.map(date => dailyMap.get(date)!.inputTokens)
  const outputTokens = dates.map(date => dailyMap.get(date)!.outputTokens)
  const totalTokens = dates.map(date => dailyMap.get(date)!.totalTokens)

  return { dates, calls, inputTokens, outputTokens, totalTokens }
}

// 处理功能数据（使用所有历史数据，不受时间筛选影响）
const processFeatureData = () => {
  const featureMap = new Map<string, { inputTokens: number, outputTokens: number, totalTokens: number }>()

  // 使用所有历史数据进行功能统计，不受时间筛选影响
  allUsageStatistics.value.forEach(stat => {
    const featureName = stat.feature_name || '未知功能'
    const existing = featureMap.get(featureName) || { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    existing.inputTokens += stat.input_tokens
    existing.outputTokens += stat.output_tokens
    existing.totalTokens += stat.total_tokens
    featureMap.set(featureName, existing)
  })

  // 转换为数组并按总Token数排序
  const featureData = Array.from(featureMap.entries()).map(([name, data]) => ({
    name,
    value: data.totalTokens,
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens
  })).sort((a, b) => b.value - a.value)

  return featureData
}

// 初始化每日趋势图
const initDailyTrendChart = () => {
  if (!dailyTrendChart.value) return

  dailyTrendInstance = echarts.init(dailyTrendChart.value)
  const dailyData = processDailyData()
  const colors = getThemeColors()

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dailyData.dates,
      axisLabel: { color: colors.textColor, rotate: 45 },
      axisLine: { lineStyle: { color: colors.gridColor } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: colors.textColor, formatter: (value: number) => formatNumber(value) },
      axisLine: { lineStyle: { color: colors.gridColor } },
      splitLine: { lineStyle: { color: colors.gridColor } }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.backgroundColor,
      borderColor: colors.gridColor,
      textStyle: { color: colors.textColor },
      formatter: (params: any) => {
        const date = params[0].axisValue
        const calls = params[0].value
        const inputTokens = params[1].value
        const outputTokens = params[2].value
        const totalTokens = params[3].value
        return `${date}<br/>调用次数: ${calls}<br/>输入Token: ${formatNumber(inputTokens)}<br/>输出Token: ${formatNumber(outputTokens)}<br/>总Token: ${formatNumber(totalTokens)}`
      }
    },
    legend: {
      data: ['调用次数', '输入Token', '输出Token', '总Token'],
      textStyle: { color: colors.textColor }
    },
    series: [
      {
        name: '调用次数',
        type: 'line',
        data: dailyData.calls,
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        areaStyle: { opacity: 0.3 }
      },
      {
        name: '输入Token',
        type: 'line',
        data: dailyData.inputTokens,
        smooth: true,
        itemStyle: { color: '#f59e0b' },
        areaStyle: { opacity: 0.3 }
      },
      {
        name: '输出Token',
        type: 'line',
        data: dailyData.outputTokens,
        smooth: true,
        itemStyle: { color: '#ef4444' },
        areaStyle: { opacity: 0.3 }
      },
      {
        name: '总Token',
        type: 'line',
        data: dailyData.totalTokens,
        smooth: true,
        itemStyle: { color: '#10b981' },
        areaStyle: { opacity: 0.3 }
      }
    ]
  }

  dailyTrendInstance.setOption(option)
}

// 初始化供应商饼图
const initProviderPieChart = () => {
  if (!providerPieChart.value) return

  providerPieInstance = echarts.init(providerPieChart.value)
  const pieData = summary.value.providers.map(provider => ({
    name: provider.provider_name,
    value: provider.total_tokens
  }))

  const colors = getThemeColors()

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.backgroundColor,
      borderColor: colors.gridColor,
      textStyle: { color: colors.textColor },
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: colors.textColor }
    },
    series: [
      {
        name: 'Token分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: colors.backgroundColor,
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: '18', fontWeight: 'bold', color: colors.textColor }
        },
        labelLine: { show: false },
        data: pieData
      }
    ]
  }

  providerPieInstance.setOption(option)
}

// 初始化模型柱状图
const initModelBarChart = () => {
  if (!modelBarChart.value) return

  modelBarInstance = echarts.init(modelBarChart.value)
  const barData = summary.value.models.slice(0, 10)
  const colors = getThemeColors()

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: colors.backgroundColor,
      borderColor: colors.gridColor,
      textStyle: { color: colors.textColor }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: colors.textColor, formatter: (value: number) => formatNumber(value) },
      axisLine: { lineStyle: { color: colors.gridColor } },
      splitLine: { lineStyle: { color: colors.gridColor } }
    },
    yAxis: {
      type: 'category',
      data: barData.map(model => model.model_name),
      axisLabel: { color: colors.textColor },
      axisLine: { lineStyle: { color: colors.gridColor } }
    },
    series: [
      {
        name: 'Token数',
        type: 'bar',
        data: barData.map(model => model.total_tokens),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#1d4ed8' }
          ])
        }
      }
    ]
  }

  modelBarInstance.setOption(option)
}

// 初始化功能Token分布图（使用所有历史数据，不受时间筛选影响）
const initTokenTypeChart = () => {
  if (!tokenTypeChart.value) return

  tokenTypeInstance = echarts.init(tokenTypeChart.value)
  const featureData = processFeatureData() // 使用所有历史数据
  const colors = getThemeColors()

  // 生成颜色数组
  const colorList = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.backgroundColor,
      borderColor: colors.gridColor,
      textStyle: { color: colors.textColor },
      formatter: (params: any) => {
        const data = params.data
        return `${params.name}<br/>总Token: ${formatNumber(data.value)}<br/>输入Token: ${formatNumber(data.inputTokens)}<br/>输出Token: ${formatNumber(data.outputTokens)}<br/>占比: ${params.percent}%`
      }
    },
    legend: {
      top: '5%',
      left: 'center',
      textStyle: { color: colors.textColor },
      formatter: (name: string) => {
        const item = featureData.find(item => item.name === name)
        return item ? `${name} (${formatNumber(item.value)})` : name
      }
    },
    series: [
      {
        name: '功能Token分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: colors.backgroundColor,
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: '16', fontWeight: 'bold', color: colors.textColor }
        },
        labelLine: { show: false },
        data: featureData.map((item, index) => ({
          value: item.value,
          name: item.name,
          inputTokens: item.inputTokens,
          outputTokens: item.outputTokens,
          itemStyle: { color: colorList[index % colorList.length] }
        }))
      }
    ]
  }

  tokenTypeInstance.setOption(option)
}

// 初始化所有图表
const initCharts = () => {
  nextTick(() => {
    initDailyTrendChart()
    initProviderPieChart()
    initModelBarChart()
    initTokenTypeChart()
  })
}

// 销毁图表实例
const disposeCharts = () => {
  if (dailyTrendInstance) {
    dailyTrendInstance.dispose()
    dailyTrendInstance = null
  }
  if (providerPieInstance) {
    providerPieInstance.dispose()
    providerPieInstance = null
  }
  if (modelBarInstance) {
    modelBarInstance.dispose()
    modelBarInstance = null
  }
  if (tokenTypeInstance) {
    tokenTypeInstance.dispose()
    tokenTypeInstance = null
  }
}

// 获取用量统计汇总
const loadUsageSummary = async () => {
  try {
    const data = await window.electronAPI.getUsageStatisticsSummary()
    summary.value = data
    initCharts()
  } catch (error) {
    console.error('获取用量统计汇总失败:', error)
  }
}

// 获取所有历史用量数据（用于趋势图，不受时间筛选影响）
const loadAllUsageStatistics = async () => {
  try {
    const data = await window.electronAPI.getUsageStatistics()
    allUsageStatistics.value = data
  } catch (error) {
    console.error('获取所有历史用量数据失败:', error)
  }
}

// 获取详细用量统计
const loadUsageStatistics = async () => {
  try {
    currentPage.value = 1 // 重置页码
    if (startDate.value && endDate.value) {
      const data = await window.electronAPI.getUsageStatisticsByDateRange(startDate.value, endDate.value)
      usageStatistics.value = data
    } else {
      const data = await window.electronAPI.getUsageStatistics()
      usageStatistics.value = data
    }
    // 注意：不再在这里调用initCharts()，因为趋势图使用独立数据
    initProviderPieChart()
    initModelBarChart()
    initTokenTypeChart()
  } catch (error) {
    console.error('获取用量统计失败:', error)
  }
}

// 按日期范围筛选
const filterByDateRange = () => {
  if (!startDate.value || !endDate.value) {
    alert('请选择开始和结束时间')
    return
  }
  loadUsageStatistics()
}

// 重置日期筛选
const resetDateFilter = () => {
  startDate.value = ''
  endDate.value = ''
  loadUsageStatistics()
}

// 设置趋势天数
const setTrendDays = (days: number) => {
  trendDays.value = days
  initDailyTrendChart() // 重新渲染趋势图
}

// 初始化日期（默认显示最近7天）
const initDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  endDate.value = end.toISOString().split('T')[0]
  startDate.value = start.toISOString().split('T')[0]
}

// 监听窗口大小变化，重新调整图表大小
const handleResize = () => {
  if (dailyTrendInstance) dailyTrendInstance.resize()
  if (providerPieInstance) providerPieInstance.resize()
  if (modelBarInstance) modelBarInstance.resize()
  if (tokenTypeInstance) tokenTypeInstance.resize()
}

// 组件挂载时初始化数据
onMounted(async () => {
  initDateRange()
  // 先加载所有历史数据，确保功能Token分布图有数据
  await loadAllUsageStatistics()
  // 然后并行加载其他数据
  await Promise.all([loadUsageSummary(), loadUsageStatistics()])
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onUnmounted(() => {
  disposeCharts()
  window.removeEventListener('resize', handleResize)
})

// 监听趋势天数变化，重新渲染趋势图
watch(trendDays, () => {
  initDailyTrendChart()
})

// 监听所有历史数据变化，重新渲染趋势图和功能Token分布图
watch(allUsageStatistics, () => {
  initDailyTrendChart()
  initTokenTypeChart()
})

// 监听汇总数据变化，重新初始化供应商和模型图表
watch(summary, () => {
  initProviderPieChart()
  initModelBarChart()
})
</script>
