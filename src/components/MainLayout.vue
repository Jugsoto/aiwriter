<template>
  <div class="flex flex-col h-screen bg-[var(--bg-primary)]">
    <WindowControls />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar />
      <div class="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import WindowControls from '@/components/WindowControls.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>