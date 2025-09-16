<template>
  <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
    <!-- 消息列表 -->
    <div v-if="messages.length > 0 || isLoading" class="space-y-4">
      <div v-for="message in messages" :key="message.id" class="flex" :class="{
        'justify-end': message.role === 'user',
        'justify-start': message.role === 'assistant'
      }">
        <div class="max-w-[80%] rounded-2xl px-4 py-3" :class="{
          'bg-[var(--sky-100)] text-[var(--text-primary)]': message.role === 'user',
          'bg-[var(--bg-primary)] border border-[var(--border-color)]': message.role === 'assistant'
        }">
          <div class="text-sm whitespace-pre-wrap">{{ message.content }}</div>
          <div class="text-xs text-[var(--text-tertiary)] mt-1 text-right">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex justify-start">
        <div class="max-w-[80%] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style="animation-delay: -0.3s">
              </div>
              <div class="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce"
                style="animation-delay: -0.15s"></div>
              <div class="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce"></div>
            </div>
            <span class="text-sm text-[var(--text-secondary)]">AI正在思考中...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { MessageListProps } from './types'

const props = defineProps<MessageListProps>()
const messagesContainer = ref<HTMLElement>()

// 格式化时间显示
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 自动滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value!.scrollTop = messagesContainer.value!.scrollHeight
    })
  }
}

// 监听消息变化，自动滚动
watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })

// 监听加载状态变化
watch(() => props.isLoading, () => {
  if (props.isLoading) {
    scrollToBottom()
  }
})
</script>

<style scoped>
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }

  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}
</style>