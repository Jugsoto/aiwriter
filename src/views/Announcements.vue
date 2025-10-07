<template>
  <div class="p-5 h-full overflow-y-auto bg-[var(--bg-secondary)]">
    <!-- 页面标题和刷新按钮 -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <button @click="goBack"
          class="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all duration-300">
          <ChevronLeft class="w-5 h-5 text-[var(--text-primary)]" />
        </button>
        <h1 class="text-2xl font-semibold text-[var(--text-primary)]">公告中心</h1>
      </div>
      <button @click="loadAnnouncements" :disabled="isLoading"
        class="flex items-center gap-2 px-4 py-2 bg-[var(--theme-bg)] text-white rounded-xl hover:bg-[var(--theme-hover)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-sm">
        <RefreshCw v-if="!isLoading" class="w-4 h-4" />
        <div v-else class="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        {{ isLoading ? '加载中...' : '刷新' }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-bg)] mb-4"></div>
      <p class="text-lg">正在加载公告...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
      <div class="text-6xl mb-4">⚠️</div>
      <p class="text-lg">{{ error }}</p>
      <button @click="loadAnnouncements"
        class="mt-4 px-4 py-2 bg-[var(--theme-bg)] text-white rounded-xl hover:bg-[var(--theme-hover)] transition-all duration-300 transform hover:scale-105 shadow-sm">
        重试
      </button>
    </div>

    <!-- 公告列表 -->
    <div v-else class="space-y-4">
      <!-- 公告卡片 -->
      <div v-for="announcement in announcements" :key="announcement.id" :class="[
        'group bg-[var(--bg-primary)] border rounded-2xl p-5  hover:shadow-sm transition-all duration-300 transform hover:scale-[1.01]',
        announcement.isPinned ? 'border-orange-300 dark:border-orange-700' : 'border-[var(--border-color)] hover:border-[var(--theme-bg)]'
      ]">
        <!-- 公告头部 -->
        <div class="flex justify-between items-start mb-3">
          <h2 class="text-lg font-medium text-[var(--text-primary)]">{{ announcement.title }}</h2>
          <Pin v-if="announcement.isPinned" class="w-4 h-4 text-orange-500" />
        </div>

        <!-- 公告内容 -->
        <div class="text-[var(--text-secondary)] mb-4 whitespace-pre-line">
          <p>{{ announcement.content }}</p>
        </div>

        <!-- 底部信息 -->
        <div class="flex items-center justify-between">
          <!-- 发布时间 -->
          <div
            class="flex items-center gap-1 px-3 py-1 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-color)]">
            <Calendar class="w-3 h-3 text-[var(--text-tertiary)]" />
            <span class="text-xs text-[var(--text-secondary)]">{{ formatDate(announcement.releaseTime) }}</span>
          </div>

          <!-- 链接按钮 -->
          <button v-if="announcement.link" @click="openLink(announcement.link)"
            class="flex items-center gap-1 px-3 py-1 text-xs bg-[var(--theme-bg)] text-white rounded-full hover:bg-[var(--theme-hover)] transition-all duration-300 transform hover:scale-105 shadow-sm h-6">
            <ExternalLink class="w-3 h-3" />
            访问链接
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!isLoading && !error && announcements.length === 0"
      class="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
      <div class="text-6xl mb-4">📢</div>
      <p class="text-lg">暂无公告</p>
      <p class="text-sm mt-2">请稍后再来查看</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { UpdateChecker } from '@/services/updateChecker'
import { Calendar, ExternalLink, Pin, RefreshCw, ChevronLeft } from 'lucide-vue-next'

interface Announcement {
  id: number
  title: string
  content: string
  date: Date
  link: string | null
  releaseTime: Date
  isPinned: boolean
  isImportant?: boolean
}

// 公告数据
const announcements = ref<Announcement[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// 加载公告数据
const loadAnnouncements = async () => {
  console.log('开始加载公告数据...')
  isLoading.value = true
  error.value = null

  try {
    // 调用更新检查服务获取公告
    const result = await UpdateChecker.checkForUpdates()
    console.log('获取到更新检查结果:', result)

    // 直接使用所有公告，不进行过期过滤
    const allAnnouncements = result.announcements
    console.log('获取到公告数量:', allAnnouncements.length)

    // 转换API数据为本地格式
    announcements.value = allAnnouncements.map(announcement => {
      // 根据标题判断重要性
      let isImportant = false
      if (announcement.title.includes('重要') || announcement.title.includes('活动') ||
        announcement.title.includes('维护') || announcement.title.includes('服务器')) {
        isImportant = true
      }

      return {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        date: new Date(announcement.releaseTime), // 使用发布时间作为显示日期
        link: announcement.link,
        releaseTime: new Date(announcement.releaseTime),
        isPinned: announcement.isPinned,
        isImportant
      }
    })

    // 按置顶状态和发布时间排序：置顶公告在前，然后按发布时间倒序
    announcements.value.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b.date.getTime() - a.date.getTime()
    })

    console.log('公告数据加载完成，共', announcements.value.length, '条公告')
    console.log('第一条公告的link值:', announcements.value[0]?.link)
    console.log('第一条公告的link类型:', typeof announcements.value[0]?.link)
  } catch (err) {
    console.error('加载公告失败:', err)
    error.value = '加载公告失败，请稍后再试'
  } finally {
    isLoading.value = false
  }
}

// 格式化日期
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 打开链接
const openLink = async (url: string) => {
  try {
    await window.electronAPI.openExternal(url)
  } catch (error) {
    console.error('打开链接失败:', error)
  }
}

// 返回上一页
const goBack = () => {
  window.history.back()
}

// 组件挂载时加载数据
onMounted(() => {
  console.log('公告页面已挂载，开始加载公告数据')
  // 用户进入页面时立即调用更新检查服务获取公告
  loadAnnouncements()

  // 设置自动刷新，每30分钟检查一次新公告
  const refreshInterval = setInterval(() => {
    console.log('定时刷新公告数据')
    loadAnnouncements()
  }, 30 * 60 * 1000) // 30分钟

  // 组件卸载时清除定时器
  onUnmounted(() => {
    console.log('公告页面即将卸载，清除定时器')
    clearInterval(refreshInterval)
  })
})
</script>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-primary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--theme-bg);
}
</style>