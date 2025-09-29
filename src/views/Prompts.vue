<template>
  <div class="flex h-full bg-[var(--bg-secondary)]">
    <!-- 左侧导航区域 -->
    <div class="w-60 bg-[var(--bg-primary)] border-r border-[var(--border-color)] p-4">
      <h2 class="text-2xl font-semibold text-[var(--text-primary)] mb-4">提示词</h2>
      <nav class="space-y-2">
        <button v-for="category in promptCategories" :key="category.key" @click="selectCategory(category.key)" :class="[
          'w-full flex items-center bg-[var(--bg-secondary)] px-3 py-3 rounded-xl border border-[var(--border-color)] text-left transition-all duration-200',
          selectedCategory === category.key
            ? 'bg-[var(--theme-bg)] text-[var(--theme-text)] border-[var(--theme-bg)]'
            : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
        ]">
          <component :is="category.icon" :size="18" class="mr-3" />
          <span>{{ category.name }}</span>
        </button>
      </nav>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 p-6 overflow-y-auto bg-[var(--bg-secondary)] flex items-center justify-center">
      <div v-if="!selectedCategory" class="text-[var(--text-secondary)] text-center">
        <div class="text-lg mb-2">请选择一个提示词类型</div>
        <div class="text-sm">点击左侧导航中的类型来查看对应的提示词</div>
      </div>
      <div v-else class="text-center">
        <h1 class="text-3xl font-semibold text-[var(--text-primary)] mb-2">
          {{ getCurrentCategoryName() }}
        </h1>
        <p class="text-lg text-[var(--text-secondary)]">
          {{ getCurrentCategoryDescription() }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FileText, PenTool, FastForward, Award } from 'lucide-vue-next'

interface PromptCategory {
  key: string
  name: string
  description: string
  icon: any
}

// 提示词分类定义
const promptCategories: PromptCategory[] = [
  {
    key: 'chapter_outline',
    name: '章节细纲',
    description: '用于生成章节详细大纲的提示词',
    icon: FileText
  },
  {
    key: 'content_writing',
    name: '正文写作',
    description: '用于正文内容创作的提示词',
    icon: PenTool
  },
  {
    key: 'chapter_continuation',
    name: '章节续写',
    description: '用于续写章节内容的提示词',
    icon: FastForward
  },
  {
    key: 'chapter_review',
    name: '章节评估',
    description: '用于评估章节质量的提示词',
    icon: Award
  }
]

const selectedCategory = ref<string>('')

// 获取当前分类名称
const getCurrentCategoryName = () => {
  const category = promptCategories.find(c => c.key === selectedCategory.value)
  return category?.name || ''
}

// 获取当前分类描述
const getCurrentCategoryDescription = () => {
  const category = promptCategories.find(c => c.key === selectedCategory.value)
  return category?.description || ''
}

// 选择分类
const selectCategory = (categoryKey: string) => {
  selectedCategory.value = categoryKey
}

// 初始化
onMounted(() => {
  // 默认选中第一个分类
  if (promptCategories.length > 0) {
    selectedCategory.value = promptCategories[0].key
  }
})
</script>