<template>
  <div class="space-y-6 bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
    <div>
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">数据设置</h3>
      <!-- 数据目录卡片 -->
      <div class="space-y-4">
        <div
          class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">应用数据</h4>
          </div>
          <button @click="openDataFolder"
            class="ml-4 px-3 py-1.5 text-xs text-white bg-[var(--theme-bg)] hover:bg-primary transition-all rounded-lg">
            {{ appDataPath }}
          </button>
        </div>

        <div
          class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">数据大小</h4>
          </div>
          <div class="px-3 py-1.5 text-sm font-medium text-white bg-[var(--theme-bg)] rounded-lg">
            {{ databaseSize }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 响应式数据
const appDataPath = ref('')
const databaseSize = ref('0 MB')

// 获取应用数据路径
const getAppDataPath = async () => {
  try {
    const path = await window.electronAPI.getAppDataPath()
    appDataPath.value = path
    return path
  } catch (error) {
    console.error('获取应用数据路径失败:', error)
    appDataPath.value = '无法获取路径'
    return ''
  }
}

// 打开数据文件夹
const openDataFolder = async () => {
  try {
    const path = appDataPath.value
    if (path) {
      await window.electronAPI.openFolder(path)
    }
  } catch (error) {
    console.error('打开文件夹失败:', error)
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

// 获取数据库文件大小
const getDatabaseSize = async (dataPath: string) => {
  try {
    // 在Windows上构建数据库文件路径
    const dbPath = dataPath + '\\aiwriter.db'
    const result = await window.electronAPI.getFileSize(dbPath)
    if (result.success) {
      databaseSize.value = formatFileSize(result.size)
    } else {
      databaseSize.value = '无法获取大小'
    }
  } catch (error) {
    console.error('获取数据库大小失败:', error)
    databaseSize.value = '无法获取大小'
  }
}

// 组件挂载时初始化数据
onMounted(async () => {
  const path = await getAppDataPath()
  if (path) {
    await getDatabaseSize(path)
  }
})
</script>