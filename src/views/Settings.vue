<template>
  <div class="flex h-full bg-[var(--bg-primary)]">
    <!-- 左侧导航栏 -->
    <div class="w-60 bg-[var(--bg-primary)] border-r border-[var(--border-color)] p-4">
      <h2 class="text-2xl font-semibold text-[var(--text-primary)] mb-4">设置</h2>
      <nav class="space-y-2">
        <button v-for="item in menuItems" :key="item.key" @click="activeTab = item.key" :class="[
          'w-full flex items-center bg-[var(--bg-secondary)] px-3 py-3 rounded-xl border border-[var(--border-color)] text-left transition-all duration-200',
          activeTab === item.key
            ? 'bg-[var(--theme-bg)] text-[var(--theme-text)] border-[var(--theme-bg)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
        ]">
          <component :is="item.icon" :size="18" class="mr-3" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </div>

    <!-- 右侧内容区 -->
    <div class="flex-1 overflow-y-auto bg-[var(--bg-secondary)]">
      <component :is="currentComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Brain, Settings, MessageSquare, BarChart3, Database, Info } from 'lucide-vue-next'
import ModelSettings from '@/components/settings/ModelSettings.vue'
import FeatureSettings from '@/components/settings/FeatureSettings.vue'
import PromptManagement from '@/components/settings/PromptManagement.vue'
import UsageStatistics from '@/components/settings/UsageStatistics.vue'
import DataSettings from '@/components/settings/DataSettings.vue'
import AboutUs from '@/components/settings/AboutUs.vue'

// 菜单项类型定义
interface MenuItem {
  key: string
  label: string
  icon: any
}

// 菜单项配置
const menuItems: MenuItem[] = [
  { key: 'model', label: '模型设置', icon: Brain },
  { key: 'feature', label: '功能设置', icon: Settings },
  { key: 'prompt', label: '提示词管理', icon: MessageSquare },
  { key: 'usage', label: '用量统计', icon: BarChart3 },
  { key: 'data', label: '数据设置', icon: Database },
  { key: 'about', label: '关于我们', icon: Info }
]

// 当前激活的标签
const activeTab = ref<string>('model')

// 组件映射
const componentMap: Record<string, any> = {
  model: ModelSettings,
  feature: FeatureSettings,
  prompt: PromptManagement,
  usage: UsageStatistics,
  data: DataSettings,
  about: AboutUs
}

// 当前显示的组件
const currentComponent = computed(() => componentMap[activeTab.value])
</script>
