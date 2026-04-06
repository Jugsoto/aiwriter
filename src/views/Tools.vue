<template>
  <div class="p-5 h-full overflow-y-auto bg-[var(--bg-secondary)]">
    <h1 class="text-2xl font-semibold text-[var(--text-primary)] mb-6">应用中心</h1>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      <ToolCard v-for="tool in pageTools" :key="tool.id" :tool="tool" type="page" @click="handleToolClick" />
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
  target?: string
  color?: string
  type?: 'page' | 'website'
}

const router = useRouter()

const pageTools = ref<Tool[]>([
  {
    id: 'idea-generator',
    name: '脑洞生成器',
    icon: 'Lightbulb',
    description: '生成创意脑洞和灵感',
    target: '/generator?type=idea',
    color: 'bg-yellow-100 dark:bg-yellow-900',
    type: 'page'
  },
  {
    id: 'book-title-generator',
    name: '书名生成器',
    icon: 'BookOpen',
    description: '生成吸引人的书名',
    target: '/generator?type=book-title',
    color: 'bg-green-100 dark:bg-green-900',
    type: 'page'
  },
  {
    id: 'summary-generator',
    name: '简介生成器',
    icon: 'FileText',
    description: '生成作品简介和摘要',
    target: '/generator?type=summary',
    color: 'bg-purple-100 dark:bg-purple-900',
    type: 'page'
  }
])

const websiteTools = ref<Tool[]>([
  {
    id: 'shenbi-channel',
    name: '官方社区',
    icon: 'Users',
    description: '神笔写作官方频道',
    target: 'https://pd.qq.com/g/shenbixiezuo0',
    color: 'bg-blue-100 dark:bg-blue-900',
    type: 'website'
  },
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
    router.push(tool.target as string)
    return
  }

  if (window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(tool.target as string)
  } else {
    window.open(tool.target as string, '_blank')
  }
}
</script>

<style scoped>
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
