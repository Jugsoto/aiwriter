<template>
  <div
    class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] hover:border-[var(--border-hover)] transition-colors flex flex-col max-h-64">
    <!-- 上半部分：名称和操作按钮 -->
    <div class="p-3 border-b border-[var(--border-color)]">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium text-[var(--text-primary)] truncate flex-1" :title="setting.name">
          {{ setting.name }}
        </h4>
        <div class="flex items-center gap-1 ml-2">
          <button @click="$emit('toggle-star', setting)" class="p-1 rounded-md transition-colors"
            :class="setting.starred ? 'text-yellow-500 hover:text-yellow-600' : 'text-[var(--text-secondary)] hover:text-yellow-500'"
            :title="setting.starred ? '取消星标' : '添加星标'">
            <Star :class="setting.starred ? 'fill-current' : ''" class="w-4 h-4" />
          </button>
          <button @click="$emit('edit', setting)"
            class="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-md transition-colors"
            title="编辑">
            <Edit class="w-4 h-4" />
          </button>
          <button @click="$emit('delete', setting)"
            class="p-1 text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--hover-bg)] rounded-md transition-colors"
            title="删除">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 下半部分：当前状态内容 -->
    <div class="p-3 flex-1 overflow-y-auto">
      <div v-if="setting.status" class="mb-2">
        <p class="text-xs text-[var(--text-secondary)] mb-1">当前状态：</p>
        <p class="text-xs text-[var(--text-primary)] line-clamp-3">
          {{ setting.status }}
        </p>
      </div>
      <div v-if="setting.content" class="mb-2">
        <p class="text-xs text-[var(--text-secondary)] mb-1">设定内容：</p>
        <p class="text-xs text-[var(--text-primary)] line-clamp-3">
          {{ setting.content }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Star, Edit, Trash2 } from 'lucide-vue-next'
import type { Setting } from '@/electron.d'

interface Props {
  setting: Setting
}

defineProps<Props>()

defineEmits<{
  (e: 'edit', setting: Setting): void
  (e: 'delete', setting: Setting): void
  (e: 'toggle-star', setting: Setting): void
}>()
</script>