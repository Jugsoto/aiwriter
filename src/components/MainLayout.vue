<template>
  <div class="main-layout">
    <WindowControls />
    <div class="main-content">
      <Sidebar />
      <div class="page-content">
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

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary);
}
</style>