<template>
  <div class="p-6 h-full overflow-y-auto">
    <!-- 页面标题 -->
    <h1 class="text-2xl font-semibold text-[var(--text-primary)] mb-6">应用中心</h1>

    <!-- 工具卡片网格布局 -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      <!-- 内部页面工具卡片 -->
      <ToolCard v-for="tool in pageTools" :key="tool.id" :tool="tool" type="page" @click="handleToolClick" />

      <!-- 外部网站工具卡片 -->
      <ToolCard v-for="tool in websiteTools" :key="tool.id" :tool="tool" type="website" @click="handleToolClick" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ToolCard from '@/components/ToolCard.vue'

interface Tool {
  id: string
  name: string
  icon: string
  description?: string
  target?: string // 页面路由或外部URL
  color?: string // 图标背景色
  type?: 'page' | 'website' // 添加类型字段
}

const router = useRouter()

// 内部页面工具
const pageTools = ref<Tool[]>([
  {
    id: 'prompts',
    name: '提示词库',
    icon: 'MessageSquareText',
    description: '管理和使用AI提示词',
    target: '/prompts',
    color: 'bg-blue-100 dark:bg-blue-900',
    type: 'page'
  },
  {
    id: 'settings',
    name: '设置',
    icon: 'Settings',
    description: '应用设置和配置',
    target: '/settings',
    color: 'bg-gray-100 dark:bg-gray-900',
    type: 'page'
  },
])

// 外部网站工具
const websiteTools = ref<Tool[]>([
  {
    id: 'zhuque-ai',
    name: '朱雀AI检测',
    icon: 'Shield',
    description: '腾讯AI内容检测工具',
    target: 'https://matrix.tencent.com/ai-detect/',
    color: 'bg-red-100 dark:bg-red-900',
    type: 'website'
  },
  {
    id: 'lm-arena',
    name: '大模型排行榜',
    icon: 'BarChart3',
    description: 'AI模型性能排行榜',
    target: 'https://lmarena.ai/leaderboard',
    color: 'bg-indigo-100 dark:bg-indigo-900',
    type: 'website'
  },
  {
    id: 'fanqie-console',
    name: '番茄控制台',
    icon: 'BookOpen',
    description: '番茄小说作者平台',
    target: 'https://fanqienovel.com/main/writer/home',
    color: 'bg-red-100 dark:bg-red-900',
    type: 'website'
  },
  {
    id: 'yuewen-console',
    name: '阅文控制台',
    icon: 'PenTool',
    description: '阅文集团作家助手',
    target: 'https://write.qq.com/',
    color: 'bg-yellow-100 dark:bg-yellow-900',
    type: 'website'
  },
  {
    id: 'shenbi-ai',
    name: '神笔AI',
    icon: 'Wand2',
    description: 'AI写作辅助工具',
    target: 'https://ai.qgming.com',
    color: 'bg-purple-100 dark:bg-purple-900',
    type: 'website'
  },
  {
    id: 'shenbi-write',
    name: '写作教程',
    icon: 'Pen',
    description: 'AI写作辅助工具',
    target: 'https://shenbi.qgming.com',
    color: 'bg-teal-100 dark:bg-teal-900',
    type: 'website'
  }
])

const handleToolClick = (tool: Tool & { type: 'page' | 'website' }) => {
  if (tool.type === 'page') {
    // 内部页面跳转
    router.push(tool.target as string)
  } else if (tool.type === 'website') {
    // 外部网站打开
    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(tool.target as string)
    } else {
      // 浏览器环境
      window.open(tool.target as string, '_blank')
    }
  }
}
</script>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--hover-bg);
}
</style>
