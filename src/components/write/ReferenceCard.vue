<template>
  <div
    @click="$emit('edit', reference)"
    class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] hover:border-[var(--border-hover)] hover:shadow-md transition-all cursor-pointer flex flex-col max-h-64">
    <!-- 上半部分：标题和操作按钮 -->
    <div class="p-3 border-b border-[var(--border-color)]">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium text-[var(--text-primary)] truncate flex-1" :title="reference.title">
          {{ reference.title }}
        </h4>
        <div class="flex items-center gap-1 ml-2">
          <button @click.stop="$emit('toggle-star', reference)" class="p-1 rounded-md transition-colors"
            :class="reference.starred ? 'text-yellow-500 hover:text-yellow-600' : 'text-[var(--text-secondary)] hover:text-yellow-500'"
            :title="reference.starred ? '取消星标' : '添加星标'">
            <Star :class="reference.starred ? 'fill-current' : ''" class="w-4 h-4" />
          </button>
          <button @click.stop="$emit('delete', reference)"
            class="p-1 text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--hover-bg)] rounded-md transition-colors"
            title="删除">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
      <!-- 文件类型和来源标签 -->
      <div class="flex items-center gap-2 mt-1">
        <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
          {{ file_type_label }}
        </span>
        <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
          {{ source_type_label }}
        </span>
      </div>
    </div>

    <!-- 中间部分：标签 -->
    <div v-if="parsed_tags.length > 0" class="px-3 pt-2 border-b border-[var(--border-color)]">
      <div class="flex flex-wrap gap-1">
        <span v-for="tag in parsed_tags" :key="tag"
          class="text-xs px-2 py-0.5 bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded">
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 下半部分：资料内容预览 -->
    <div class="p-3 flex-1 overflow-y-auto">
      <div v-if="reference.content">
        <p class="text-xs text-[var(--text-primary)] line-clamp-4">
          {{ reference.content }}
        </p>
      </div>
      <div v-else class="text-xs text-[var(--text-secondary)] italic">
        暂无内容
      </div>
    </div>

    <!-- 底部：时间戳 -->
    <div class="px-3 py-2 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
      {{ formatted_date }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star, Trash2 } from 'lucide-vue-next'
import type { ReferenceLibrary } from '@/electron.d'

interface Props {
  reference: ReferenceLibrary
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'edit', reference: ReferenceLibrary): void
  (e: 'delete', reference: ReferenceLibrary): void
  (e: 'toggle-star', reference: ReferenceLibrary): void
}>()

// 解析标签
const parsed_tags = computed(() => {
  try {
    return JSON.parse(props.reference.tags)
  } catch {
    return []
  }
})

// 文件类型标签
const file_type_label = computed(() => {
  const labels: Record<string, string> = {
    txt: 'TXT',
    md: 'Markdown',
    docx: 'Word',
    pdf: 'PDF'
  }
  return labels[props.reference.file_type] || props.reference.file_type.toUpperCase()
})

// 来源类型标签
const source_type_label = computed(() => {
  const labels: Record<string, string> = {
    manual: '手动添加',
    import: '文件导入',
    chapter: '章节提取'
  }
  return labels[props.reference.source_type] || props.reference.source_type
})

// 格式化日期
const formatted_date = computed(() => {
  const date = new Date(props.reference.updated_at)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
})
</script>
