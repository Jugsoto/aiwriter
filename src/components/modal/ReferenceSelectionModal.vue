<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div
          class="bg-[var(--bg-primary)] rounded-2xl p-6 w-full max-w-4xl mx-4 h-[600px] flex flex-col border border-[var(--border-color)] shadow-2xl">
      <!-- 标题栏和搜索 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">
          选择资料
        </h3>
        <button @click="handleClose" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="relative mb-4">
        <Search class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
        <input v-model="searchQuery" type="text" placeholder="搜索资料..."
          class="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>

      <!-- 资料列表 -->
      <div class="flex-1 overflow-y-auto min-h-0 mb-4">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="text-[var(--text-secondary)]">加载中...</div>
        </div>
        <div v-else-if="filteredReferences.length === 0" class="flex items-center justify-center py-8">
          <div class="text-[var(--text-secondary)] text-center">
            <div v-if="searchQuery">没有找到匹配的资料</div>
            <div v-else>暂无资料</div>
          </div>
        </div>
        <div v-else class="space-y-2">
          <div v-for="reference in filteredReferences" :key="reference.id"
            class="relative p-4 border rounded-lg cursor-pointer transition-all duration-200" :class="{
              'bg-[var(--bg-secondary)] border-[var(--theme-bg)] shadow-md': isSelected(reference),
              'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[var(--border-hover)]': !isSelected(reference)
            }" @click="handleCardClick(reference)">
            <!-- 资料信息 -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="text-sm font-medium text-[var(--text-primary)] truncate">{{ reference.title }}</h4>
                  <Star v-if="reference.starred" class="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                </div>
                <p class="text-xs text-[var(--text-primary)] line-clamp-2 mb-2">
                  {{ reference.content }}
                </p>
                <div v-if="parsedTags(reference).length > 0" class="flex flex-wrap gap-1">
                  <span v-for="tag in parsedTags(reference)" :key="tag"
                    class="text-xs px-2 py-0.5 bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded">
                    {{ tag }}
                  </span>
                </div>
              </div>
              <!-- 选中图标 -->
              <Check v-if="isSelected(reference)" class="w-5 h-5 text-[var(--theme-bg)] flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
        <div class="text-sm text-[var(--text-secondary)]">
          已选择 {{ localSelectedReferences.length }} 个资料
        </div>
        <div class="flex items-center gap-3">
          <button @click="handleClose"
            class="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
            取消
          </button>
          <button @click="handleConfirm"
            :disabled="localSelectedReferences.length === 0"
            class="px-4 py-2 text-sm text-white bg-[var(--theme-bg)] hover:bg-[var(--theme-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            确认
          </button>
        </div>
      </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Star, Search, Check } from 'lucide-vue-next'
import type { ReferenceLibrary } from '@/electron.d'
import { useReferenceLibraryStore } from '@/stores/referenceLibrary'

interface Props {
  visible: boolean
  bookId: number
  selectedReferences?: ReferenceLibrary[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', references: ReferenceLibrary[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const referenceLibraryStore = useReferenceLibraryStore()

// 状态管理
const loading = ref(false)
const localSelectedReferences = ref<ReferenceLibrary[]>([])
const searchQuery = ref('')

// 解析标签
const parsedTags = (reference: ReferenceLibrary) => {
  try {
    return JSON.parse(reference.tags)
  } catch {
    return []
  }
}

// 过滤资料
const filteredReferences = computed(() => {
  let result = referenceLibraryStore.references

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(reference =>
      reference.title.toLowerCase().includes(query) ||
      reference.content.toLowerCase().includes(query)
    )
  }

  // 排序：星标在前，然后按时间倒序
  return result.sort((a, b) => {
    if (a.starred && !b.starred) return -1
    if (!a.starred && b.starred) return 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
})

// 检查资料是否被选中
const isSelected = (reference: ReferenceLibrary) => {
  return localSelectedReferences.value.some(r => r.id === reference.id)
}

// 处理资料切换
const handleReferenceToggle = (reference: ReferenceLibrary) => {
  const index = localSelectedReferences.value.findIndex(r => r.id === reference.id)
  if (index > -1) {
    localSelectedReferences.value.splice(index, 1)
  } else {
    localSelectedReferences.value.push(reference)
  }
}

// 处理卡片点击
const handleCardClick = (reference: ReferenceLibrary) => {
  handleReferenceToggle(reference)
}

// 处理确认
const handleConfirm = () => {
  emit('confirm', [...localSelectedReferences.value])
  handleClose()
}

// 处理关闭
const handleClose = () => {
  emit('update:visible', false)
}

// 加载资料数据
const loadReferences = async () => {
  try {
    loading.value = true
    await referenceLibraryStore.loadReferences(props.bookId)
  } catch (error) {
    console.error('Failed to load references:', error)
  } finally {
    loading.value = false
  }
}

// 监听visible变化
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await loadReferences()
    // 初始化选中状态
    localSelectedReferences.value = props.selectedReferences ? [...props.selectedReferences] : []
  } else {
    // 清空选中状态
    localSelectedReferences.value = []
    searchQuery.value = ''
  }
})
</script>

<style scoped>
/* 模态框过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
