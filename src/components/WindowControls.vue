<template>
  <div class="window-controls flex justify-between items-center h-8 bg-[var(--window-bg)] border-b border-[var(--border-color)]">
    <div class="flex items-center gap-2 px-3 no-drag">
      <img src="../assets/vue.svg" alt="Logo" class="w-5 h-5" />
      <span class="text-sm font-medium text-[var(--text-primary)]">AI Writer</span>
    </div>
    <div class="flex-1 drag-area"></div>
    <div class="flex no-drag">
      <button 
        class="w-[46px] h-8 border-none bg-transparent flex items-center justify-center cursor-pointer transition-colors duration-200 text-[var(--text-primary)] hover:bg-[var(--hover-bg)]" 
        @click="minimizeWindow" 
        title="最小化"
      >
        <Minus :size="16" />
      </button>
      <button 
        class="w-[46px] h-8 border-none bg-transparent flex items-center justify-center cursor-pointer transition-colors duration-200 text-[var(--text-primary)] hover:bg-[var(--hover-bg)]" 
        @click="maximizeWindow" 
        title="最大化"
      >
        <Square :size="16" />
      </button>
      <button 
        class="w-[46px] h-8 border-none bg-transparent flex items-center justify-center cursor-pointer transition-colors duration-200 text-[var(--text-primary)] hover:bg-red-600 hover:text-white" 
        @click="closeWindow" 
        title="关闭"
      >
        <X :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Minus, Square, X } from 'lucide-vue-next'

const minimizeWindow = () => {
  window.electronAPI?.minimize()
}

const maximizeWindow = () => {
  window.electronAPI?.maximize()
}

const closeWindow = () => {
  window.electronAPI?.close()
}
</script>

<style scoped>
.window-controls {
  -webkit-app-region: drag;
}

.drag-area {
  -webkit-app-region: drag;
  min-width: 100px;
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>