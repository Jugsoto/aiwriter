<template>
  <div class="w-13 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col justify-between py-4">
    <div class="flex flex-col gap-2">
      <router-link to="/"
        class="nav-item flex items-center justify-center p-2 no-underline rounded-lg mx-2 transition-all duration-200 cursor-pointer border-none bg-transparent text-sm font-medium w-9 h-9 text-gray-600 dark:text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-900 dark:hover:text-gray-300"
        title="首页">
        <Home :size="20" class="text-[var(--icon-color)] dark:text-[var(--icon-color-dark)]" />
      </router-link>
      <router-link to="/prompts"
        class="nav-item flex items-center justify-center p-2 no-underline rounded-lg mx-2 transition-all duration-200 cursor-pointer border-none bg-transparent text-sm font-medium w-9 h-9 text-gray-600 dark:text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-900 dark:hover:text-gray-300"
        title="提示词">
        <Sparkle :size="20" class="text-[var(--icon-color)] dark:text-[var(--icon-color-dark)]" />
      </router-link>
      <router-link to="/tools"
        class="nav-item flex items-center justify-center p-2 no-underline rounded-lg mx-2 transition-all duration-200 cursor-pointer border-none bg-transparent text-sm font-medium w-9 h-9 text-gray-600 dark:text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-900 dark:hover:text-gray-300"
        title="应用商店">
        <Store :size="20" class="text-[var(--icon-color)] dark:text-[var(--icon-color-dark)]" />
      </router-link>
      <router-link to="/leaderboard"
        class="nav-item flex items-center justify-center p-2 no-underline rounded-lg mx-2 transition-all duration-200 cursor-pointer border-none bg-transparent text-sm font-medium w-9 h-9 text-gray-600 dark:text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-900 dark:hover:text-gray-300"
        title="排行榜">
        <Trophy :size="20" class="text-[var(--icon-color)] dark:text-[var(--icon-color-dark)]" />
      </router-link>
    </div>

    <div class="flex flex-col gap-2">
      <button
        v-if="hasUpdate"
        class="flex items-center justify-center p-2 text-white no-underline rounded-lg mx-2 transition-all duration-200 cursor-pointer border-none bg-blue-600 text-sm font-medium w-9 h-9 hover:bg-blue-700 animate-pulse"
        @click="handleUpdate"
        title="有新版本可用，点击升级">
        <Download :size="20" />
      </button>
      <button
        class="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 no-underline rounded-lg mx-2 transition-all duration-200 cursor-pointer border-none bg-transparent text-sm font-medium w-9 h-9 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-900 dark:hover:text-gray-300"
        @click="toggleDarkMode" title="深色模式">
        <Moon v-if="isDark" :size="20" class="text-[var(--icon-color)] dark:text-[var(--icon-color-dark)]" />
        <Sun v-else :size="20" class="text-[var(--icon-color)] dark:text-[var(--icon-color-dark)]" />
      </button>
      <router-link to="/settings"
        class="nav-item flex items-center justify-center p-2 no-underline rounded-lg mx-2 transition-all duration-200 cursor-pointer border-none bg-transparent text-sm font-medium w-9 h-9 text-gray-600 dark:text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-900 dark:hover:text-gray-300"
        title="设置">
        <Settings :size="20" class="text-[var(--icon-color)] dark:text-[var(--icon-color-dark)]" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Home, Store, Settings, Moon, Sun, Sparkle, Trophy, Download } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'
import { useUpdateStore } from '@/stores/update'

const themeStore = useThemeStore()
const updateStore = useUpdateStore()

const isDark = computed(() => themeStore.isDark)
const hasUpdate = computed(() => updateStore.updateInfo.hasUpdate)

const toggleDarkMode = () => {
  themeStore.toggleTheme()
}

const handleUpdate = async () => {
  await updateStore.openDownloadPage()
}

// 组件挂载时检查更新
onMounted(async () => {
  await updateStore.checkForUpdates()
})
</script>

<style scoped>
.nav-item.router-link-active {
  background-color: var(--theme-bg) !important;
  color: var(--theme-text) !important;
}

.nav-item.router-link-active svg {
  color: var(--theme-text) !important;
}
</style>
