<template>
  <div class="h-full bg-[var(--bg-secondary)] flex flex-col">
    <!-- 头部 -->
    <div class="p-3 flex items-center justify-between">
      <button @click="toggleSortOrder"
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        <ArrowUpDown class="w-4 h-4" />
        切换排序
      </button>
      <button @click="showCreateModal = true"
        class="flex items-center gap-1 px-2 py-1.5 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors">
        <Plus class="w-4 h-4" />
        新建章节
      </button>
    </div>

    <!-- 章节列表 -->
    <div class="flex-1 overflow-y-auto p-3 pt-0">
      <div v-if="loading" class="text-center text-[var(--text-secondary)] py-8">
        加载中...
      </div>
      <div v-else-if="error" class="text-center text-red-500 py-8">
        {{ error }}
      </div>
      <div v-else-if="chapters.length === 0" class="text-center text-[var(--text-secondary)] py-12">
        暂无章节，点击上方按钮创建
      </div>
      <div v-else class="space-y-2">
        <div v-for="(chapter, index) in sortedChapters" :key="chapter.id" @click="selectChapter(chapter)"
          class="group relative px-3 py-2 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] cursor-pointer transition-all hover:border-[var(--theme-bg)]"
          :class="{ 'border-[var(--theme-bg)] bg-[var(--theme-bg)]': currentChapter?.id === chapter.id }">
          <!-- 章节信息 -->
          <div class="flex items-center">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="text-base font-bold"
                :class="currentChapter?.id === chapter.id ? 'text-[var(--theme-text)]' : 'text-[var(--text-primary)]'">
                {{ getChapterDisplayNumber(index) }}
              </span>
              <span class="text-base truncate font-medium"
                :class="currentChapter?.id === chapter.id ? 'text-[var(--theme-text)]' : 'text-[var(--text-primary)]'">
                {{ chapter.title }}
              </span>
            </div>
          </div>

          <!-- 操作按钮（hover时显示在右上角） -->
          <div
            class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-[var(--bg-secondary)] px-1.5 py-1 rounded-full border border-[var(--border-color)] shadow-sm">
            <button @click.stop="openSummaryModal(chapter)"
              class="p-1 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all"
              title="编辑梗概">
              <FileText class="w-3.5 h-3.5" />
            </button>
            <button @click.stop="openEditModal(chapter)"
              class="p-1 text-[var(--text-secondary)] hover:text-green-600 hover:bg-green-100 rounded-full transition-all"
              title="编辑章节">
              <Edit class="w-3.5 h-3.5" />
            </button>
            <button @click.stop="confirmDelete(chapter)"
              class="p-1 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-100 rounded-full transition-all"
              title="删除章节">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑章节模态窗口 -->
    <ChapterModal v-model:visible="showCreateModal" :is-edit="false" @confirm="handleCreateChapter"
      @cancel="showCreateModal = false" />

    <ChapterModal v-model:visible="showEditModalFlag" :is-edit="true"
      :initial-data="{ title: editingChapter?.title || '' }" @confirm="handleEditChapter"
      @cancel="showEditModalFlag = false" />

    <!-- 梗概编辑模态窗口 -->
    <SummaryModal v-model:visible="showSummaryModalFlag" :initial-data="{ summary: editingChapter?.summary || '' }"
      @confirm="handleUpdateSummary" @cancel="showSummaryModalFlag = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Edit, Trash2, FileText, ArrowUpDown } from 'lucide-vue-next'
import { useChaptersStore } from '@/stores/chapters'
import { showConfirm } from '@/composables'
import type { Chapter } from '@/electron.d'
import ChapterModal from '@/components/modal/ChapterModal.vue'
import SummaryModal from '@/components/modal/SummaryModal.vue'

interface Props {
  bookId: number
}

const props = defineProps<Props>()

const chaptersStore = useChaptersStore()

// 计算属性
const chapters = computed(() => chaptersStore.chapters)
const currentChapter = computed(() => chaptersStore.currentChapter)
const loading = computed(() => chaptersStore.loading)
const error = computed(() => chaptersStore.error)

// 排序后的章节列表
const sortedChapters = computed(() => {
  return [...chapters.value].sort((a, b) => {
    if (sortOrder.value === 'asc') {
      return a.id - b.id // 正序：ID 从小到大
    } else {
      return b.id - a.id // 逆序：ID 从大到小
    }
  })
})

// 模态窗口状态
const showCreateModal = ref(false)
const showEditModalFlag = ref(false)
const showSummaryModalFlag = ref(false)
const editingChapter = ref<Chapter | null>(null)
const sortOrder = ref<'asc' | 'desc'>('desc') // 默认逆序

// 切换排序顺序
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// 加载章节数据
const loadChapters = async () => {
  await chaptersStore.loadChapters(props.bookId)

  // 自动选择最新编辑的章节
  if (chaptersStore.chapters.length > 0) {
    // 按更新时间降序排序，选择最新编辑的章节
    const sortedChapters = [...chaptersStore.chapters].sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    const latestChapter = sortedChapters[0]
    chaptersStore.setCurrentChapter(latestChapter)
  } else {
    // 如果没有章节，清空当前章节
    chaptersStore.setCurrentChapter(null)
  }
}

// 获取章节显示编号
const getChapterDisplayNumber = (index: number) => {
  if (sortOrder.value === 'asc') {
    return index + 1 // 正序：从1开始
  } else {
    return sortedChapters.value.length - index // 逆序：从总长度开始递减
  }
}

// 选择章节
const selectChapter = (chapter: Chapter) => {
  chaptersStore.setCurrentChapter(chapter)
}

// 显示编辑模态窗口
const openEditModal = (chapter: Chapter) => {
  editingChapter.value = chapter
  showEditModalFlag.value = true
}

// 显示梗概编辑模态窗口
const openSummaryModal = (chapter: Chapter) => {
  editingChapter.value = chapter
  showSummaryModalFlag.value = true
}

// 创建章节
const handleCreateChapter = async (data: { title: string }) => {
  try {
    await chaptersStore.createChapter({
      book_id: props.bookId,
      title: data.title
    })
  } catch (err) {
    console.error('创建章节失败:', err)
  }
}

// 编辑章节
const handleEditChapter = async (data: { title: string }) => {
  if (!editingChapter.value) return

  try {
    await chaptersStore.updateChapter(editingChapter.value.id, {
      title: data.title
    })
  } catch (err) {
    console.error('编辑章节失败:', err)
  }
}

// 更新梗概
const handleUpdateSummary = async (data: { summary: string }) => {
  if (!editingChapter.value) return

  try {
    await chaptersStore.updateChapter(editingChapter.value.id, {
      summary: data.summary
    })
  } catch (err) {
    console.error('更新梗概失败:', err)
  }
}

// 删除确认
const confirmDelete = async (chapter: Chapter) => {
  const confirmed = await showConfirm({
    title: '删除章节',
    message: `确定要删除章节"${chapter.title}"吗？`,
    description: '此操作不可恢复，章节内容将被永久删除。',
    dangerous: true,
    confirmText: '删除'
  })

  if (confirmed) {
    handleDeleteChapter(chapter.id)
  }
}

// 删除章节
const handleDeleteChapter = async (id: number) => {
  try {
    await chaptersStore.deleteChapter(id)
  } catch (err) {
    console.error('删除章节失败:', err)
  }
}

// 监听书籍ID变化
watch(() => props.bookId, (newBookId) => {
  if (newBookId) {
    loadChapters()
  }
}, { immediate: true })

// 组件挂载时加载数据
onMounted(() => {
  loadChapters()
})
</script>
