<template>
  <div class="px-3 py-2 flex items-center justify-between relative">
    <!-- 左侧：历史对话和新建对话按钮 -->
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full px-1">
        <button @click="toggleHistory"
          class="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors relative" title="历史对话"
          :class="{ 'bg-[var(--bg-secondary)]': showHistory }">
          <History class="w-4 h-4" />
        </button>
        <div class="h-4 w-px bg-[var(--border-color)]"></div>
        <button @click="handleNewConversation" class="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
          title="新建对话">
          <Plus class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 右侧：设置按钮 -->
    <button @click="handleOpenSettings"
      class="p-2 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
      title="设置">
      <Settings class="w-4 h-4" />
    </button>

    <!-- 历史记录组件 -->
    <ConversationHistory v-if="showHistory" :show="showHistory" :conversations="conversations"
      :current-conversation="currentConversation" :book-id="bookId" @close="showHistory = false"
      @select-conversation="handleSelectConversation" @conversations-updated="handleConversationsUpdated" />

    <!-- Copilot设置组件 -->
    <CopilotSettings v-if="showSettings" :book-id="bookId" @close="handleCloseSettings" @saved="handleSettingsSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Settings, History } from 'lucide-vue-next'
import type { HeaderProps } from '../../../utils/types'
import CopilotSettings from './CopilotSettings.vue'
import ConversationHistory from './ConversationHistory.vue'

defineProps<HeaderProps & {
  bookId: number
}>()

const emit = defineEmits(['new-conversation', 'open-settings', 'select-conversation', 'settings-saved', 'conversations-updated'])

// 设置面板显示状态
const showSettings = ref(false)
const showHistory = ref(false)

const handleNewConversation = () => {
  emit('new-conversation')
}

const handleOpenSettings = () => {
  showSettings.value = true
}

const handleCloseSettings = () => {
  showSettings.value = false
}

const handleSettingsSaved = (settings: any) => {
  emit('settings-saved', settings)
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const handleSelectConversation = (conversation: any) => {
  emit('select-conversation', conversation)
}

const handleConversationsUpdated = (conversations: any[]) => {
  emit('conversations-updated', conversations)
}
</script>