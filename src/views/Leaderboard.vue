<template>
  <div class="h-full p-8 bg-[var(--bg-primary)]">
    <div class="max-w-6xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[var(--text-primary)] mb-2">排行榜</h1>
        <p class="text-[var(--text-secondary)]">查看作者和作品排行</p>
      </div>

      <!-- 排行榜内容区域 -->
      <div class="bg-[var(--bg-secondary)] rounded-lg shadow-sm border border-[var(--border-color)] p-6">
        <div class="text-center py-12">
          <Trophy :size="64" class="mx-auto mb-4 text-[var(--text-tertiary)]" />
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-2">排行榜功能</h2>
          <p class="text-[var(--text-secondary)]">排行榜功能即将上线，敬请期待...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
</script>

<style scoped>
/* 可以在这里添加排行榜特定的样式 */
</style>
