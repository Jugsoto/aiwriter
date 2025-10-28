<template>
  <div
    class="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg relative transform hover:scale-105"
    :class="[
      isSelected ? 'border-[var(--theme-bg)]' : 'hover:border-[var(--hover-bg)]'
    ]" @click="handleCardClick" @mouseenter="$emit('mouseenter')" @mouseleave="$emit('mouseleave')">
    <!-- 右上角操作按钮（胶囊样式，一直显示） -->
    <div
      v-if="!prompt.is_default"
      class="absolute top-2 right-2 flex items-center gap-1 bg-[var(--bg-secondary)] px-2 rounded-full border border-[var(--border-color)] shadow-sm min-h-[28px]">
      <button @click.stop="handleDelete"
        class="px-1 py-1 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-100 rounded-full transition-all min-h-[20px] flex items-center"
        title="删除">
        <Trash2 :size="14" />
      </button>
    </div>

    <!-- 提示词名称 -->
    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2" :class="prompt.is_default ? '' : 'pr-16'">
      {{ prompt.name }}
    </h3>

    <!-- 作者和版本信息 -->
    <div class="flex items-center text-sm text-[var(--text-secondary)] mb-3 gap-4">
      <!-- 作者名（可点击跳转） -->
      <button v-if="prompt.url" @click.stop="handleContactAuthor"
        class="flex items-center text-blue-500 hover:text-blue-600 hover:underline transition-all" title="联系作者">
        <User :size="14" class="mr-1" />
        <span>{{ prompt.author || '未知作者' }}</span>
      </button>
      <div v-else class="flex items-center text-blue-500">
        <User :size="14" class="mr-1" />
        <span>{{ prompt.author || '未知作者' }}</span>
      </div>

      <!-- 版本号 -->
      <div class="flex items-center text-blue-500">
        <Tag :size="14" class="mr-1" />
        <span>{{ prompt.version || '1.0.0' }}</span>
      </div>
    </div>

    <!-- 简介 -->
    <p class="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
      {{ prompt.description || '暂无简介' }}
    </p>

    <!-- 确认删除模态框 -->
    <ConfirmModal :visible="showDeleteConfirm" title="删除提示词" :message="`确定要删除提示词「${prompt.name}」吗？`" confirm-text="删除"
      cancel-text="取消" :dangerous="true" @update:visible="showDeleteConfirm = false" @confirm="confirmDelete"
      @cancel="cancelDelete" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Trash2, User, Tag } from 'lucide-vue-next'
import ConfirmModal from './shared/ConfirmModal.vue'
import type { Prompt } from '../electron'

interface Props {
  prompt: Prompt
  isSelected: boolean
  showActions: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
  mouseenter: []
  mouseleave: []
  edit: [prompt: Prompt, isViewMode?: boolean]
  delete: [prompt: Prompt]
}>()

// 删除确认状态
const showDeleteConfirm = ref(false)

// 处理删除
const handleDelete = () => {
  showDeleteConfirm.value = true
}

// 确认删除
const confirmDelete = () => {
  showDeleteConfirm.value = false
  emit('delete', props.prompt)
}

// 取消删除
const cancelDelete = () => {
  showDeleteConfirm.value = false
}

// 处理联系作者
const handleContactAuthor = () => {
  if (props.prompt.url) {
    window.electronAPI.openExternal(props.prompt.url)
  }
}

// 处理卡片点击
const handleCardClick = () => {
  emit('click')
  // 根据提示词类型决定是查看还是编辑
  if (props.prompt.is_default) {
    // 默认提示词以查看模式打开
    emit('edit', props.prompt, true)
  } else {
    // 自定义提示词以编辑模式打开
    emit('edit', props.prompt, false)
  }
}

</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>