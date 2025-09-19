<template>
  <div class="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
    <!-- 设定显示区域 -->
    <div v-if="selectedSettings && selectedSettings.length > 0" class="px-3 pt-3">
      <div class="relative">
        <div ref="settingsContainerRef" class="overflow-hidden transition-all duration-300"
          :style="{ maxHeight: expanded ? 'none' : '72px' }">
          <div class="flex flex-wrap gap-2">
            <div v-for="setting in selectedSettings" :key="setting.id"
              class="inline-flex items-center px-2 py-1 text-xs border rounded-full cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors relative group"
              :style="{ borderColor: 'var(--theme-bg)' }" :title="setting.content" @click="handleSettingClick(setting)">
              <component :is="getSettingIcon(setting.type)" class="w-3 h-3 mr-1" />
              <span class="truncate max-w-[100px]">{{ setting.name }}</span>
              <!-- 删除按钮（仅对非星标设定显示） -->
              <button v-if="!setting.starred" @click.stop="removeSetting(setting)"
                class="ml-1 p-1 text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--hover-bg)] rounded-md transition-colors"
                title="移除设定">
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <button v-if="showExpandButton" @click="expanded = !expanded"
          class="absolute -bottom-1 right-0 p-1 text-[var(--theme-bg)] hover:text-[var(--theme-hover)] transition-colors">
          <ChevronUp v-if="expanded" class="w-4 h-4" />
          <ChevronDown v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="p-3 pb-0">
      <div class="relative">
        <textarea ref="inputRef" v-model="inputText" @keydown.enter.exact.prevent="handleSend" :disabled="disabled"
          class="w-full min-h-[80px] max-h-[200px] px-4 py-3 text-sm border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--sky-500)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="输入消息..." rows="3"></textarea>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="flex items-center justify-between px-3 py-2">
      <div class="flex items-center gap-2 relative">
        <button @click="handleAt" title="引用资源" ref="atButtonRef"
          class="p-2 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <AtSign class="w-4 h-4" />
        </button>

        <!-- 引用资源弹窗 -->
        <div v-if="showAtModal"
          class="absolute bottom-full left-0 mb-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg p-2 min-w-[160px] z-10">
          <div class="flex flex-col gap-1">
            <button @click="handleEntrySetting"
              class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--bg-secondary)] rounded transition-colors">
              <FileText class="w-4 h-4" />
              词条设定
            </button>
            <button @click="handleWorldview"
              class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--bg-secondary)] rounded transition-colors">
              <Globe class="w-4 h-4" />
              世界观
            </button>
            <button @click="handleCharacterProfile"
              class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--bg-secondary)] rounded transition-colors">
              <User class="w-4 h-4" />
              人物档案
            </button>
          </div>
        </div>
        <button @click="handleClear" title="清空对话内容"
          class="p-2 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <Trash2 class="w-4 h-4" />
        </button>
        <button @click="handleStop" title="终止对话"
          class="p-2 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
          <Square class="w-4 h-4" />
        </button>
      </div>
      <button @click="handleSend" :disabled="disabled || !inputText.trim()"
        class="p-2 text-[var(--theme-text)] bg-[var(--theme-bg)] rounded-lg hover:bg-[var(--theme-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <Send class="w-4 h-4" />
      </button>
    </div>

    <!-- 设定选择模态窗 -->
    <SettingSelectionModal v-if="bookId" v-model:visible="showSettingSelectionModal" :book-id="bookId"
      :setting-type="currentSettingType" :selected-settings="selectedSettings" @confirm="handleSettingsSelected" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { AtSign, Trash2, Square, Send, User, Globe, FileText, ChevronUp, ChevronDown, X } from 'lucide-vue-next'
import type { InputAreaProps } from '../../../utils/types'
import type { Setting } from '@/electron.d'
import SettingSelectionModal from '@/components/modal/SettingSelectionModal.vue'

const props = defineProps<InputAreaProps>()
const emit = defineEmits(['send-message', 'at-resource', 'clear-conversation', 'stop-conversation', 'entry-setting', 'worldview', 'character-profile', 'settings-updated', 'settings-selected'])

const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement>()
const atButtonRef = ref<HTMLButtonElement>()
const showAtModal = ref(false)
const expanded = ref(false)
const settingsContainerRef = ref<HTMLElement>()
const showExpandButton = ref(false)
const showSettingSelectionModal = ref(false)
const currentSettingType = ref<'character' | 'worldview' | 'entry'>('entry')
const selectedSettings = ref<Setting[]>([])

// 监听设定数量变化，检查是否需要显示展开按钮
watch(() => props.selectedSettings, async () => {
  await nextTick()
  checkExpandButton()
}, { deep: true })

// 监听selectedSettings变化
watch(() => props.selectedSettings, (newSettings) => {
  if (newSettings) {
    selectedSettings.value = [...newSettings]
  }
}, { immediate: true, deep: true })

// 检查是否需要显示展开按钮
const checkExpandButton = () => {
  if (settingsContainerRef.value) {
    const containerHeight = settingsContainerRef.value.scrollHeight
    const maxHeight = 72 // 两行的高度 (约36px * 2)
    showExpandButton.value = containerHeight > maxHeight
    if (!showExpandButton.value) {
      expanded.value = true // 如果不需要展开，默认展开
    }
  }
}

// 获取设定类型图标
const getSettingIcon = (type: string) => {
  const icons = {
    'character': User,
    'worldview': Globe,
    'entry': FileText
  }
  return icons[type as keyof typeof icons] || FileText
}

// 处理设定点击
const handleSettingClick = (setting: Setting) => {
  // 将设定内容插入到输入框
  const settingText = `【${setting.name}】${setting.content}`
  if (inputText.value) {
    inputText.value += `\n${settingText}`
  } else {
    inputText.value = settingText
  }
}

// 处理词条设定
const handleEntrySetting = () => {
  currentSettingType.value = 'entry'
  showSettingSelectionModal.value = true
  showAtModal.value = false
}

// 处理世界观
const handleWorldview = () => {
  currentSettingType.value = 'worldview'
  showSettingSelectionModal.value = true
  showAtModal.value = false
}

const handleSend = () => {
  if (inputText.value.trim()) {
    emit('send-message', inputText.value.trim())
    inputText.value = ''
    adjustTextareaHeight()
  }
}

const handleAt = () => {
  showAtModal.value = !showAtModal.value
}

const handleCharacterProfile = () => {
  currentSettingType.value = 'character'
  showSettingSelectionModal.value = true
  showAtModal.value = false
}

// 处理设定选择
const handleSettingsSelected = (settings: Setting[]) => {
  selectedSettings.value = settings
  emit('settings-selected', settings)
}

// 移除设定
const removeSetting = (setting: Setting) => {
  const index = selectedSettings.value.findIndex(s => s.id === setting.id)
  if (index > -1) {
    selectedSettings.value.splice(index, 1)
    emit('settings-selected', selectedSettings.value)
  }
}

// 点击外部关闭弹窗
const handleClickOutside = (event: MouseEvent) => {
  if (showAtModal.value && atButtonRef.value && !atButtonRef.value.contains(event.target as Node)) {
    const modalElement = (event.target as HTMLElement).closest('.absolute.bottom-full')
    if (!modalElement) {
      showAtModal.value = false
    }
  }
}

const handleClear = () => {
  emit('clear-conversation')
}

const handleStop = () => {
  emit('stop-conversation')
}

// 自动调整输入框高度
const adjustTextareaHeight = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 200)}px`
  }
}

// 监听输入变化调整高度
watch(inputText, () => {
  adjustTextareaHeight()
})

// 聚焦输入框
const focusInput = () => {
  inputRef.value?.focus()
}

// 生命周期钩子
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  checkExpandButton()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

defineExpose({
  focusInput
})
</script>