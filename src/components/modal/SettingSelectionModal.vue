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
      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">
          选择{{ modalTitle }}
        </h3>
        <button @click="handleClose" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 设定列表 -->
      <div class="flex-1 overflow-y-auto min-h-0 mb-4">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="text-[var(--text-secondary)]">加载中...</div>
        </div>
        <div v-else-if="sortedSettings.length === 0" class="flex items-center justify-center py-8">
          <div class="text-[var(--text-secondary)] text-center">
            暂无{{ modalTitle }}设定
          </div>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="setting in sortedSettings" :key="setting.id"
            class="relative p-4 border-1 rounded-lg cursor-pointer transition-all duration-200" :class="{
              'bg-[var(--bg-secondary)] border-[var(--theme-bg)] shadow-md': isSelected(setting) || setting.starred,
              'bg-[var(--bg-primary)] border-[var(--border-color)]': !isSelected(setting) && !setting.starred
            }" @click="handleCardClick(setting)">
            <!-- 设定信息 -->
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-medium text-[var(--text-primary)] truncate">{{ setting.name }}</h4>
                </div>
              </div>
              <!-- 星标图标 -->
              <Star v-if="setting.starred" class="w-4 h-4 text-yellow-500 fill-current flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
        <button @click="handleClose"
          class="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
          取消
        </button>
        <button @click="handleConfirm"
          class="px-4 py-2 text-sm text-white bg-[var(--theme-bg)] hover:bg-[var(--theme-hover)] rounded-lg transition-colors">
          确认
        </button>
      </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Star, } from 'lucide-vue-next'
import type { Setting } from '@/electron.d'
import { useSettingsStore } from '@/stores/settings'

interface Props {
  visible: boolean
  bookId: number
  settingType: 'character' | 'worldview' | 'entry'
  selectedSettings?: Setting[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', settings: Setting[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const settingsStore = useSettingsStore()

// 状态管理
const loading = ref(false)
const localSelectedSettings = ref<Setting[]>([])

// 计算属性
const modalTitle = computed(() => {
  const titles = {
    character: '人物档案',
    worldview: '世界观',
    entry: '词条设定'
  }
  return titles[props.settingType]
})

// 排序设定（星标在前，然后按名称排序）
const sortedSettings = computed(() => {
  const typeSettings = settingsStore.settings.filter(setting => setting.type === props.settingType)
  return typeSettings.sort((a, b) => {
    // 星标优先
    if (a.starred && !b.starred) return -1
    if (!a.starred && b.starred) return 1
    // 然后按名称排序
    return a.name.localeCompare(b.name)
  })
})

// 检查设定是否被选中
const isSelected = (setting: Setting) => {
  return localSelectedSettings.value.some(s => s.id === setting.id)
}

// 处理设定切换
const handleSettingToggle = (setting: Setting) => {
  const index = localSelectedSettings.value.findIndex(s => s.id === setting.id)
  if (index > -1) {
    localSelectedSettings.value.splice(index, 1)
  } else {
    localSelectedSettings.value.push(setting)
  }
}

// 处理卡片点击
const handleCardClick = (setting: Setting) => {
  handleSettingToggle(setting)
}

// 处理确认
const handleConfirm = () => {
  emit('confirm', [...localSelectedSettings.value])
  handleClose()
}

// 处理关闭
const handleClose = () => {
  emit('update:visible', false)
}

// 加载设定数据
const loadSettings = async () => {
  try {
    loading.value = true
    await settingsStore.loadSettingsByType(props.bookId, props.settingType)
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
}

// 监听visible变化
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await loadSettings()
    // 初始化选中状态
    localSelectedSettings.value = props.selectedSettings ? [...props.selectedSettings] : []

    // 等待设定加载完成后，自动选中所有星标设定
    setTimeout(() => {
      const starredSettings = sortedSettings.value.filter(s => s.starred)
      starredSettings.forEach(starredSetting => {
        if (!localSelectedSettings.value.some(s => s.id === starredSetting.id)) {
          localSelectedSettings.value.push(starredSetting)
        }
      })
    }, 100)
  } else {
    // 清空选中状态
    localSelectedSettings.value = []
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
</style>