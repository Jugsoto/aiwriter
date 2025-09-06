<template>
  <div class="window-controls">
    <div class="window-controls-left">
      <img src="../assets/vue.svg" alt="Logo" class="window-logo" />
      <span class="window-title">AI Writer</span>
    </div>
    <div class="window-controls-right">
      <button class="window-control-btn minimize" @click="minimizeWindow">
        <Minus :size="16" />
      </button>
      <button class="window-control-btn maximize" @click="maximizeWindow">
        <Square :size="16" />
      </button>
      <button class="window-control-btn close" @click="closeWindow">
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  background: var(--window-bg);
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
}

.window-controls-left {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.window-logo {
  width: 20px;
  height: 20px;
}

.window-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.window-controls-right {
  display: flex;
  -webkit-app-region: no-drag;
}

.window-control-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--text-primary);
}

.window-control-btn:hover {
  background: var(--hover-bg);
}

.window-control-btn.close:hover {
  background: #dc2626;
  color: white;
}

.window-control-btn.minimize:hover,
.window-control-btn.maximize:hover {
  background: #6b7280;
  color: white;
}
</style>