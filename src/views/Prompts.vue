<template>
  <div class="flex h-full bg-[var(--bg-secondary)]">
    <!-- 左侧导航区域 -->
    <div class="w-60 bg-[var(--bg-primary)] border-r border-[var(--border-color)] p-5">
      <h2 class="text-2xl font-semibold text-[var(--text-primary)] mb-6">提示词</h2>
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
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部操作栏 -->
      <div class="bg-[var(--bg-primary)] border-b border-[var(--border-color)] p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-semibold text-[var(--text-primary)]">
                {{ getCurrentCategoryName() }}
              </h1>
              <button @click="showInfoModal = true"
                class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-full hover:bg-[var(--hover-bg)]">
                <HelpCircle :size="18" />
              </button>
            </div>
          </div>
          <button @click="showAddModal = true"
            class="bg-[var(--theme-bg)] text-[var(--theme-text)] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center">
            新增提示词
          </button>
        </div>
      </div>

      <!-- 提示词列表区域 -->
      <div class="flex-1 p-5 overflow-y-auto">
        <div v-if="!selectedCategory" class="text-[var(--text-secondary)] text-center">
          <div class="text-lg mb-2">请选择一个提示词类型</div>
          <div class="text-sm">点击左侧导航中的类型来查看对应的提示词</div>
        </div>

        <div v-else-if="loading" class="text-center py-8">
          <div class="text-[var(--text-secondary)]">加载中...</div>
        </div>

        <div v-else-if="prompts.length === 0" class="text-center py-8">
          <div class="text-[var(--text-secondary)] mb-4">暂无提示词</div>
          <button @click="showAddModal = true" class="text-[var(--theme-bg)] hover:underline">
            点击添加第一个提示词
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PromptCard v-for="prompt in prompts" :key="prompt.id" :prompt="prompt"
            :is-selected="isPromptSelected(prompt)" :show-actions="true" @click="handlePromptClick(prompt)"
            @mouseenter="hoveredPrompt = prompt.id" @mouseleave="hoveredPrompt = null" @edit="editPrompt(prompt)"
            @delete="handleDeletePrompt(prompt)" />
        </div>
      </div>
    </div>

    <!-- 添加/编辑提示词模态框 -->
    <PromptEditModal :visible="showAddModal || showEditModal" :prompt="editingPrompt" :category="selectedCategory"
      :is-edit="showEditModal" @update:visible="closeModal" @save="handleSavePrompt" />

    <!-- 信息模态框 -->
    <InfoModal :visible="showInfoModal" :title="getCurrentCategoryName()" :message="getCurrentCategoryDescription()"
      @update:visible="showInfoModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FileText, PenTool, FastForward, Award, HelpCircle } from 'lucide-vue-next'
import PromptCard from '../components/PromptCard.vue'
import PromptEditModal from '../components/modal/PromptEditModal.vue'
import InfoModal from '../components/shared/InfoModal.vue'
import {
  getPromptsByCategory,
  getSelectedPromptByCategory,
  setPromptSelection,
  createPrompt,
  updatePrompt,
  deletePrompt as deletePromptService,
  PROMPT_CATEGORIES
} from '../services/promptService'
import type { Prompt } from '../electron'

// 状态管理
const selectedCategory = ref<string>('')
const prompts = ref<Prompt[]>([])
const selectedPrompt = ref<Prompt | undefined>()
const loading = ref(false)
const hoveredPrompt = ref<number | null>(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingPrompt = ref<Prompt | null>(null)
const showInfoModal = ref(false)

// 提示词分类定义
const promptCategories = PROMPT_CATEGORIES.map(cat => ({
  ...cat,
  icon: cat.key === 'chapter_outline' ? FileText :
    cat.key === 'content_writing' ? PenTool :
      cat.key === 'chapter_continuation' ? FastForward :
        Award
}))

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
const selectCategory = async (categoryKey: string) => {
  selectedCategory.value = categoryKey
  await loadPrompts()
  await loadSelectedPrompt()
}

// 加载提示词
const loadPrompts = async () => {
  if (!selectedCategory.value) return

  loading.value = true
  try {
    prompts.value = await getPromptsByCategory(selectedCategory.value)
  } catch (error) {
    console.error('加载提示词失败:', error)
    prompts.value = []
  } finally {
    loading.value = false
  }
}

// 加载已选择的提示词
const loadSelectedPrompt = async () => {
  if (!selectedCategory.value) return

  try {
    selectedPrompt.value = await getSelectedPromptByCategory(selectedCategory.value)
  } catch (error) {
    console.error('加载已选择提示词失败:', error)
    selectedPrompt.value = undefined
  }
}

// 判断提示词是否被选中
const isPromptSelected = (prompt: Prompt) => {
  return selectedPrompt.value?.id === prompt.id
}

// 处理提示词点击
const handlePromptClick = (prompt: Prompt) => {
  // 如果点击的是已选中的提示词，不执行任何操作
  if (isPromptSelected(prompt)) return

  // 设置为选中状态
  setPromptAsDefault(prompt)
}

// 设置提示词为默认
const setPromptAsDefault = async (prompt: Prompt) => {
  try {
    await setPromptSelection({
      category: selectedCategory.value,
      prompt_id: prompt.id
    })
    selectedPrompt.value = prompt
    // 可以在这里添加成功提示
  } catch (error) {
    console.error('设置默认提示词失败:', error)
    // 可以在这里添加错误提示
  }
}

// 编辑提示词
const editPrompt = (prompt: Prompt) => {
  editingPrompt.value = prompt
  showEditModal.value = true
}

// 删除提示词
const handleDeletePrompt = async (prompt: Prompt) => {
  try {
    await deletePromptService(prompt.id)
    await loadPrompts()
    // 如果删除的是当前选中的提示词，需要重新选择
    if (isPromptSelected(prompt)) {
      await loadSelectedPrompt()
    }
  } catch (error) {
    console.error('删除提示词失败:', error)
    // 可以在这里添加错误提示
  }
}

// 处理保存提示词
const handleSavePrompt = async (data: any) => {
  try {
    if (showEditModal.value && editingPrompt.value) {
      // 编辑模式
      await updatePrompt(editingPrompt.value.id, data)
    } else {
      // 添加模式
      await createPrompt({
        ...data,
        category: selectedCategory.value
      })
    }
    closeModal()
    await loadPrompts()
  } catch (error) {
    console.error('保存提示词失败:', error)
    // 可以在这里添加错误提示
  }
}

// 关闭模态框
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingPrompt.value = null
}

// 初始化
onMounted(async () => {
  // 默认选中第一个分类
  if (promptCategories.length > 0) {
    await selectCategory(promptCategories[0].key)
  }
})
</script>