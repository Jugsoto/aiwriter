<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div
          class="bg-[var(--bg-primary)] rounded-2xl p-6 w-full max-w-4xl mx-4 h-[80vh] flex flex-col border border-[var(--border-color)] shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">
            资料库
          </h3>
          <button @click="handleClose" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- 工具栏 -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <button @click="showCreateModal = true"
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 bg-[var(--theme-bg)] text-white shadow-sm hover:shadow active:scale-98">
              <Plus class="w-4 h-4" />
              <span>新增资料</span>
            </button>
            <button @click="showImportModal = true"
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] active:scale-98">
              <Upload class="w-4 h-4" />
              <span>导入文件</span>
            </button>
            <div class="relative">
              <Search class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
              <input v-model="searchQuery" type="text" placeholder="搜索资料..."
                class="pl-9 pr-3 py-1.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="showStarredOnly = !showStarredOnly"
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 active:scale-98"
              :class="showStarredOnly
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 shadow-sm'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'">
              <Star :class="showStarredOnly ? 'fill-current text-yellow-600' : ''" class="w-4 h-4 transition-colors" />
              <span>{{ showStarredOnly ? '已星标' : '仅显示星标' }}</span>
            </button>
          </div>
        </div>

        <!-- 资料列表 -->
        <div class="flex-1 overflow-y-auto min-h-0">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="text-[var(--text-secondary)]">加载中...</div>
          </div>
          <div v-else-if="filteredReferences.length === 0" class="flex items-center justify-center py-8">
            <div class="text-[var(--text-secondary)] text-center">
              <div v-if="searchQuery || showStarredOnly">没有找到匹配的资料</div>
              <div v-else>暂无资料，点击"新增资料"或"导入文件"创建</div>
            </div>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReferenceCard v-for="reference in filteredReferences" :key="reference.id" :reference="reference" @edit="handleEdit"
              @delete="handleDelete" @toggle-star="handleToggleStar" />
          </div>
        </div>
          </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 创建/编辑资料模态窗 -->
  <ReferenceEditModal v-model:visible="showCreateModal" :book-id="bookId"
    @confirm="handleCreateConfirm" />

  <ReferenceEditModal v-model:visible="showEditModal" :book-id="bookId"
    :edit-reference="editingReference" @confirm="handleEditConfirm" />

  <!-- 导入文件模态窗 -->
  <ReferenceImportModal v-model:visible="showImportModal" :book-id="bookId"
    @confirm="handleImportConfirm" />

  <!-- 删除确认对话框 -->
  <ConfirmModal v-model:visible="showDeleteConfirm" title="删除资料" :message="deleteMessage" dangerous
    @confirm="handleDeleteConfirm" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Plus, Search, Star, Upload } from 'lucide-vue-next'
import type { ReferenceLibrary } from '@/electron.d'
import { useReferenceLibraryStore } from '@/stores/referenceLibrary'
import ReferenceCard from '../write/ReferenceCard.vue'
import ReferenceEditModal from './ReferenceEditModal.vue'
import ReferenceImportModal from './ReferenceImportModal.vue'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'

interface Props {
  visible: boolean
  bookId: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const referenceLibraryStore = useReferenceLibraryStore()

// 状态管理
const loading = ref(false)
const searchQuery = ref('')
const showStarredOnly = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showImportModal = ref(false)
const showDeleteConfirm = ref(false)
const editingReference = ref<ReferenceLibrary | null>(null)
const deleteTarget = ref<ReferenceLibrary | null>(null)

// 计算属性
const deleteMessage = computed(() => {
  return deleteTarget.value ? `确定要删除资料"${deleteTarget.value.title}"吗？` : ''
})

const filteredReferences = computed(() => {
  let result = referenceLibraryStore.references

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(reference =>
      reference.title.toLowerCase().includes(query) ||
      reference.content.toLowerCase().includes(query)
    )
  }

  // 星标过滤
  if (showStarredOnly.value) {
    result = result.filter(reference => reference.starred)
  }

  return result
})

// 监听visible变化，加载数据
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await loadReferences()
  }
})

// 加载资料数据
async function loadReferences() {
  try {
    loading.value = true
    await referenceLibraryStore.loadReferences(props.bookId)
  } catch (error) {
    console.error('Failed to load references:', error)
  } finally {
    loading.value = false
  }
}

// 处理创建确认
async function handleCreateConfirm(data: { title: string; content: string; tags?: string[] }) {
  try {
    await referenceLibraryStore.createReference({
      book_id: props.bookId,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      source_type: 'manual'
    })
    showCreateModal.value = false
  } catch (error) {
    console.error('Failed to create reference:', error)
  }
}

// 处理编辑
function handleEdit(reference: ReferenceLibrary) {
  editingReference.value = reference
  showEditModal.value = true
}

// 处理编辑确认
async function handleEditConfirm(data: { title: string; content: string; tags?: string[] }) {
  if (!editingReference.value) return

  try {
    await referenceLibraryStore.updateReference(editingReference.value.id, {
      title: data.title,
      content: data.content,
      tags: data.tags
    })
    showEditModal.value = false
    editingReference.value = null
  } catch (error) {
    console.error('Failed to update reference:', error)
  }
}

// 处理导入确认
async function handleImportConfirm(references: Array<{ title: string; content: string }>) {
  try {
    await referenceLibraryStore.batchCreateReferences(
      references.map(ref => ({
        book_id: props.bookId,
        title: ref.title,
        content: ref.content,
        source_type: 'import' as const,
        file_type: 'txt',
        tags: []
      }))
    )
    showImportModal.value = false
  } catch (error) {
    console.error('Failed to import references:', error)
  }
}

// 处理删除
function handleDelete(reference: ReferenceLibrary) {
  deleteTarget.value = reference
  showDeleteConfirm.value = true
}

// 处理删除确认
async function handleDeleteConfirm() {
  if (!deleteTarget.value) return

  try {
    await referenceLibraryStore.deleteReference(deleteTarget.value.id)
    showDeleteConfirm.value = false
    deleteTarget.value = null
  } catch (error) {
    console.error('Failed to delete reference:', error)
  }
}

// 处理星标切换
async function handleToggleStar(reference: ReferenceLibrary) {
  try {
    await referenceLibraryStore.toggleReferenceStar(reference.id)
  } catch (error) {
    console.error('Failed to toggle star:', error)
  }
}

// 处理关闭
function handleClose() {
  emit('update:visible', false)
}
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
</style>
