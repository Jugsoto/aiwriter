<template>
  <div class="group relative cursor-pointer" @click="$emit('click', { ...tool, type })">
    <!-- 卡片容器 -->
    <div
      class="flex flex-col items-center p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--theme-bg)] hover:shadow-lg transition-all duration-300 transform hover:scale-105">

      <!-- 图标区域（相对定位容器） -->
      <div class="relative mb-3">
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          :class="tool.color || 'bg-gray-100 dark:bg-gray-800'">
          <component :is="getIconComponent(tool.icon)" class="w-8 h-8 text-black" />
        </div>

        <!-- 网站类型角标 - 一直显示在图标区域右下角 -->
        <div v-if="type === 'website'"
          class="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800">
          <Globe class="w-3 h-3 text-white" />
        </div>
      </div>

      <!-- 文字区域 -->
      <div class="text-center">
        <h3 class="text-sm font-medium text-[var(--text-primary)] leading-tight">
          {{ tool.name }}
        </h3>
      </div>
    </div>

    <!-- 悬停效果背景 -->
    <div
      class="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-[var(--hover-bg)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
  </div>
</template>

<script setup lang="ts">
import * as LucideIcons from 'lucide-vue-next'

interface Tool {
  id: string
  name: string
  icon: string
  description?: string
  target?: string
  color?: string
}

interface Props {
  tool: Tool
  type: 'page' | 'website'
}

defineProps<Props>()
defineEmits<{
  click: [tool: Tool & { type: 'page' | 'website' }]
}>()

// 动态获取图标组件
const getIconComponent = (iconName: string) => {
  const iconComponent = (LucideIcons as any)[iconName]
  return iconComponent || LucideIcons.HelpCircle
}

// 确保 Globe 图标可用
const Globe = LucideIcons.Globe || LucideIcons.ExternalLink
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
  box-orient: vertical;
}
</style>