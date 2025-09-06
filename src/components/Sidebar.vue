<template>
  <div class="sidebar">
    <div class="sidebar-top">
      <router-link to="/" class="nav-item" active-class="active" title="首页">
        <Home :size="20" />
      </router-link>
      <router-link to="/tools" class="nav-item" active-class="active" title="工具页">
        <Wrench :size="20" />
      </router-link>
    </div>
    
    <div class="sidebar-bottom">
      <button class="nav-item" @click="toggleDarkMode" title="深色模式">
        <Moon v-if="isDark" :size="20" />
        <Sun v-else :size="20" />
      </button>
      <router-link to="/settings" class="nav-item" active-class="active" title="设置">
        <Settings :size="20" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Home, Wrench, Settings, Moon, Sun } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const toggleDarkMode = () => {
  themeStore.toggleTheme()
}
</script>

<style scoped>
.sidebar {
  width: 60px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  margin: 0 8px;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  width: 44px;
  height: 44px;
}

.nav-item:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--theme-bg);
  color: var(--theme-text);
}

.sidebar-top, .sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>