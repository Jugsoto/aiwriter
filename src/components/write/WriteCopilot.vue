<template>
  <div class="h-full flex flex-col bg-[var(--bg-primary)]">
    <CopilotHeader :conversations="[]" :current-conversation="null" @new-conversation="() => { }"
      @select-conversation="() => { }" @open-settings="() => { }" />

    <MessageList :messages="[]" :is-loading="false" />

    <InputArea :disabled="false" @send-message="() => { }" @at-resource="handleAtResource"
      @clear-conversation="handleClearConversation" @stop-conversation="handleStopConversation" ref="inputAreaRef" />
  </div>
</template>

<script setup lang="ts">
import CopilotHeader from './copilot/CopilotHeader.vue'
import MessageList from './copilot/MessageList.vue'
import InputArea from './copilot/InputArea.vue'

const handleAtResource = () => {
  console.log('引用资源功能')
}

const handleClearConversation = () => {
  console.log('清空对话内容')
}

const handleStopConversation = () => {
  console.log('终止对话')
}
</script>
