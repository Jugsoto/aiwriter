<template>
  <div v-if="show"
    class="absolute top-12 left-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg w-64 z-50">
    <!-- 头部 -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
      <h3 class="text-sm font-medium text-[var(--text-primary)]">对话历史</h3>
      <button @click="$emit('close')" class="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors" title="关闭">
        <X class="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
    </div>

    <!-- 历史列表 -->
    <div class="max-h-64 overflow-y-auto">
      <div v-if="conversations.length === 0" class="p-4 text-center text-sm text-[var(--text-secondary)]">
        暂无对话历史
      </div>

      <div v-else>
        <div v-for="(conversation, index) in conversations" :key="conversation.id"
          @click="selectConversation(conversation)" class="p-2 hover:bg-[var(--bg-secondary)] cursor-pointer "
          :class="[{ 'bg-[var(--bg-secondary)]': currentConversation?.id === conversation.id }, index === conversations.length - 1 ? 'rounded-b-lg' : '']">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-[var(--text-primary)] truncate overflow-hidden whitespace-nowrap"
                :title="conversation.title">
                {{ conversation.title }}
              </h4>
            </div>
            <button @click.stop="handleDeleteConversation(conversation.id)"
              class="p-1 hover:bg-[var(--bg-primary)] rounded transition-colors ml-2 flex-shrink-0" title="删除对话">
              <Trash2 class="w-3 h-3 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, Trash2 } from 'lucide-vue-next'
import type { Conversation } from '../../../utils/types'
import { ConversationStorage } from '../../../utils/conversationStorage'
import { showConfirm } from '../../../composables/useConfirm'

// Props
const props = defineProps<{
  show: boolean
  conversations: Conversation[]
  currentConversation: Conversation | null
  bookId: number
}>()

// Emits
const emit = defineEmits<{
  close: []
  selectConversation: [conversation: Conversation]
  conversationsUpdated: [conversations: Conversation[]]
}>()

// 选择对话
const selectConversation = (conversation: Conversation) => {
  emit('selectConversation', conversation)
  emit('close')
}

// 删除对话（带确认）
const handleDeleteConversation = async (conversationId: string) => {
  const confirmed = await showConfirm({
    title: '删除对话',
    message: '确定要删除这个对话吗？此操作不可恢复。',
    dangerous: true
  })

  if (confirmed) {
    ConversationStorage.deleteConversation(props.bookId, conversationId)
    const updatedConversations = props.conversations.filter(c => c.id !== conversationId)
    emit('conversationsUpdated', updatedConversations)
  }
}
</script>