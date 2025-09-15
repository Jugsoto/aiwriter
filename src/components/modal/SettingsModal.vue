<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="fixed inset-0" @click="handleClose"></div>
    <div
      class="bg-[var(--bg-primary)] rounded-xl p-6 w-full max-w-4xl mx-4 h-[80vh] flex flex-col border-2 border-[var(--border-color)] shadow-lg relative">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">
          {{ modalTitle }}
        </h3>
        <button @click="handleClose" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 工具栏 -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <button @click="showCreateModal = true"
            class="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus class="w-4 h-4" />
            <span>新增设定</span>
          </button>
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
            <input v-model="searchQuery" type="text" placeholder="搜索设定..."
              class="pl-9 pr-3 py-1.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
            <input v-model="showStarredOnly" type="checkbox" class="rounded">
            <span>仅显示星标</span>
          </label>
        </div>
      </div>

      <!-- 设定列表 -->
      <div class="flex-1 overflow-y-auto min-h-0">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="text-[var(--text-secondary)]">加载中...</div>
        </div>
        <div v-else-if="filteredSettings.length === 0" class="flex items-center justify-center py-8">
          <div class="text-[var(--text-secondary)] text-center">
            <div v-if="searchQuery || showStarredOnly">没有找到匹配的设定</div>
            <div v-else>暂无设定，点击"新增设定"创建</div>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SettingCard v-for="setting in filteredSettings" :key="setting.id" :setting="setting" @edit="handleEdit"
            @delete="handleDelete" @toggle-star="handleToggleStar" />
        </div>
      </div>
    </div>
  </div>

  <!-- 创建/编辑设定模态窗 -->
  <SettingEditModal v-model:visible="showCreateModal" :book-id="bookId" :setting-type="settingType"
    @confirm="handleCreateConfirm" />

  <SettingEditModal v-model:visible="showEditModal" :book-id="bookId" :setting-type="settingType"
    :edit-setting="editingSetting" @confirm="handleEditConfirm" />

  <!-- 删除确认对话框 -->
  <ConfirmModal v-model:visible="showDeleteConfirm" title="删除设定" :message="deleteMessage" dangerous
    @confirm="handleDeleteConfirm" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Plus, Search } from 'lucide-vue-next'
import type { Setting } from '@/electron.d'
import { useSettingsStore } from '@/stores/settings'
import SettingCard from '../write/SettingCard.vue'
import SettingEditModal from './SettingEditModal.vue'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'

interface Props {
  visible: boolean
  bookId: number
  settingType: 'character' | 'worldview' | 'entry'
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const settingsStore = useSettingsStore()

// 状态管理
const loading = ref(false)
const searchQuery = ref('')
const showStarredOnly = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const editingSetting = ref<Setting | null>(null)
const deleteTarget = ref<Setting | null>(null)

// 计算属性
const modalTitle = computed(() => {
  const titles = {
    character: '人物档案',
    worldview: '世界观',
    entry: '词条设定'
  }
  return titles[props.settingType]
})

const deleteMessage = computed(() => {
  return deleteTarget.value ? `确定要删除设定"${deleteTarget.value.name}"吗？` : ''
})

const filteredSettings = computed(() => {
  let result = settingsStore.settings

  // 首先按当前设定类型过滤
  result = result.filter(setting => setting.type === props.settingType)

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(setting =>
      setting.name.toLowerCase().includes(query) ||
      setting.content.toLowerCase().includes(query)
    )
  }

  // 星标过滤
  if (showStarredOnly.value) {
    result = result.filter(setting => setting.starred)
  }

  return result
})

// 监听visible变化，加载数据
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await loadSettings()
  }
})

// 加载设定数据
async function loadSettings() {
  try {
    loading.value = true
    await settingsStore.loadSettingsByType(props.bookId, props.settingType)
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
}

// 处理创建确认
async function handleCreateConfirm(data: { name: string; content: string; status?: string }) {
  try {
    await settingsStore.createSetting({
      book_id: props.bookId,
      type: props.settingType,
      name: data.name,
      content: data.content,
      status: data.status,
    })
    showCreateModal.value = false
  } catch (error) {
    console.error('Failed to create setting:', error)
  }
}

// 处理编辑
function handleEdit(setting: Setting) {
  editingSetting.value = setting
  showEditModal.value = true
}

// 处理编辑确认
async function handleEditConfirm(data: { name: string; content: string }) {
  if (!editingSetting.value) return

  try {
    await settingsStore.updateSetting(editingSetting.value.id, {
      name: data.name,
      content: data.content
    })
    showEditModal.value = false
    editingSetting.value = null
  } catch (error) {
    console.error('Failed to update setting:', error)
  }
}

// 处理删除
function handleDelete(setting: Setting) {
  deleteTarget.value = setting
  showDeleteConfirm.value = true
}

// 处理删除确认
async function handleDeleteConfirm() {
  if (!deleteTarget.value) return

  try {
    await settingsStore.deleteSetting(deleteTarget.value.id)
    showDeleteConfirm.value = false
    deleteTarget.value = null
  } catch (error) {
    console.error('Failed to delete setting:', error)
  }
}

// 处理星标切换
async function handleToggleStar(setting: Setting) {
  try {
    await settingsStore.toggleSettingStar(setting.id)
  } catch (error) {
    console.error('Failed to toggle star:', error)
  }
}

// 处理关闭
function handleClose() {
  emit('update:visible', false)
}
</script>