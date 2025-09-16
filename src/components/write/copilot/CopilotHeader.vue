<template>
  <div class="px-3 py-2  flex items-center justify-between">
    <!-- 左侧：历史对话和新建对话按钮 -->
    <div class="flex items-center gap-1 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full px-1">
      <button @click="$emit('show-history')" class="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
        title="历史对话">
        <History class="w-4 h-4" />
      </button>
      <div class="h-4 w-px bg-[var(--border-color)]"></div>
      <button @click="handleNewConversation" class="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
        title="新建对话">
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <!-- 右侧：设置按钮 -->
    <button @click="handleOpenSettings"
      class="p-2 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
      title="设置">
      <Settings class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Plus, Settings, History } from 'lucide-vue-next'
import type { HeaderProps } from './types'

defineProps<HeaderProps>()
const emit = defineEmits(['new-conversation', 'open-settings', 'show-history'])

const handleNewConversation = () => {
  emit('new-conversation')
}

const handleOpenSettings = () => {
  emit('open-settings')
}
</script>