<template>
  <div class="p-6 space-y-6 ">
    <!-- 数据目录卡片 -->
    <div class="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">数据目录</h3>
      <div class="space-y-4">
        <div
          class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">应用数据目录</h4>
          </div>
          <button @click="openDataFolder"
            class="ml-4 px-3 py-1.5 text-xs text-white bg-[var(--theme-bg)] hover:bg-primary transition-all rounded-lg">
            {{ appDataPath }}
          </button>
        </div>

        <div
          class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">用户数据大小</h4>
          </div>
          <div class="px-3 py-1.5 text-sm font-medium text-white bg-[var(--theme-bg)] rounded-lg">
            {{ databaseSize }}
          </div>
        </div>
      </div>
    </div>

    <!-- 数据设置卡片 -->
    <div class="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">数据设置</h3>
      <div class="space-y-4">
        <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">数据备份与恢复</h4>
            </div>
            <div class="flex items-center gap-3">
              <button @click="handleBackup" :disabled="isBackingUp"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border-1 border-[var(--border-color)] rounded-full hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Download v-if="!isBackingUp" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
                {{ isBackingUp ? '备份中...' : '备份数据' }}
              </button>
              <button @click="handleRestore" :disabled="isRestoring"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border-1 border-[var(--border-color)] rounded-full hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload v-if="!isRestoring" class="w-4 h-4" />
                <Loader2 v-else class="w-4 h-4 animate-spin" />
                {{ isRestoring ? '恢复中...' : '恢复数据' }}
              </button>
            </div>
          </div>
        </div>

        <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">重置用户数据</h4>
            </div>
            <button @click="showResetConfirm"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border-1 border-red-600 rounded-full hover:bg-red-50 transition-all duration-200">
              <Trash2 class="w-3.5 h-3.5" />
              重置数据
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 重置数据确认对话框 -->
  <ConfirmModal v-model:visible="resetConfirmVisible" title="确认重置数据" message="此操作将删除所有用户数据（包括所有书籍和章节），但会保留软件本身的配置和设置。"
    description="重置后应用将自动重启，所有创作内容将被清空且无法恢复。" confirm-text="确认重置" cancel-text="取消" :dangerous="true"
    :loading="isResetting" confirm-loading-text="正在重置数据..." @confirm="handleResetData" @cancel="handleResetCancel" />

  <!-- 错误提示模态窗 -->
  <ErrorModal v-model:visible="errorModalVisible" title="重置数据失败" message="重置数据时发生错误，请查看错误详情或重试。"
    :error-details="resetError" @close="handleErrorModalClose" />

  <!-- 备份错误提示模态窗 -->
  <ErrorModal v-model:visible="backupModalVisible" title="备份数据失败" message="备份数据时发生错误，请查看错误详情或重试。"
    :error-details="backupError" @close="handleBackupErrorModalClose" />

  <!-- 恢复错误提示模态窗 -->
  <ErrorModal v-model:visible="restoreModalVisible" title="恢复数据失败" message="恢复数据时发生错误，请查看错误详情或重试。"
    :error-details="restoreError" @close="handleRestoreErrorModalClose" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ConfirmModal from '../shared/ConfirmModal.vue'
import ErrorModal from '../shared/ErrorModal.vue'
import { Trash2, Download, Upload, Loader2 } from 'lucide-vue-next'

// 响应式数据
const appDataPath = ref('')
const databaseSize = ref('0 MB')
const resetConfirmVisible = ref(false)
const isResetting = ref(false)
const resetError = ref('')
const errorModalVisible = ref(false)
const isBackingUp = ref(false)
const isRestoring = ref(false)
const backupError = ref('')
const restoreError = ref('')
const backupModalVisible = ref(false)
const restoreModalVisible = ref(false)

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

// 显示重置数据确认对话框
const showResetConfirm = () => {
  resetConfirmVisible.value = true
  resetError.value = ''
}

// 处理重置数据取消
const handleResetCancel = () => {
  resetConfirmVisible.value = false
  resetError.value = ''
}

// 处理错误模态窗关闭
const handleErrorModalClose = () => {
  errorModalVisible.value = false
  resetError.value = ''
}

// 处理重置数据
const handleResetData = async () => {
  try {
    isResetting.value = true
    resetError.value = ''

    const result = await window.electronAPI.resetData()

    if (result.success) {
      // 重置成功，对话框保持打开状态直到应用重启
      // 不需要手动关闭对话框，因为应用会重启
      console.log('数据重置成功，应用即将重启...')
    } else {
      // 重置失败，显示错误信息
      resetError.value = result.error || '重置数据失败'
      isResetting.value = false
      errorModalVisible.value = true
      console.error('重置数据失败:', result.error)
    }
  } catch (error) {
    // 处理异常情况
    resetError.value = error instanceof Error ? error.message : '重置数据时发生未知错误'
    isResetting.value = false
    errorModalVisible.value = true
    console.error('重置数据失败:', error)
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

// 获取数据库文件大小（只统计用户数据）
const getDatabaseSize = async (dataPath: string) => {
  try {
    const dbFilePath = `${dataPath}/aiwriter.db`
    const result = await window.electronAPI.getFileSize(dbFilePath)
    if (result.success) {
      databaseSize.value = formatFileSize(result.size)
    } else {
      databaseSize.value = '无法获取大小'
    }
  } catch (error) {
    console.error('获取数据库文件大小失败:', error)
    databaseSize.value = '无法获取大小'
  }
}

// 处理数据备份
const handleBackup = async () => {
  try {
    isBackingUp.value = true
    backupError.value = ''

    const result = await window.electronAPI.backupData()

    if (result.success) {
      console.log('数据备份成功:', result.backupPath)
      // 可以添加成功提示
    } else {
      backupError.value = result.error || '备份数据失败'
      backupModalVisible.value = true
      console.error('数据备份失败:', result.error)
    }
  } catch (error) {
    backupError.value = error instanceof Error ? error.message : '备份数据时发生未知错误'
    backupModalVisible.value = true
    console.error('数据备份失败:', error)
  } finally {
    isBackingUp.value = false
  }
}

// 处理数据恢复
const handleRestore = async () => {
  try {
    isRestoring.value = true
    restoreError.value = ''

    const result = await window.electronAPI.restoreData()

    if (result.success) {
      console.log('数据恢复成功')
      // 可以添加成功提示或刷新数据
      // 重新获取数据大小
      if (appDataPath.value) {
        await getDatabaseSize(appDataPath.value)
      }
    } else {
      restoreError.value = result.error || '恢复数据失败'
      restoreModalVisible.value = true
      console.error('数据恢复失败:', result.error)
    }
  } catch (error) {
    restoreError.value = error instanceof Error ? error.message : '恢复数据时发生未知错误'
    restoreModalVisible.value = true
    console.error('数据恢复失败:', error)
  } finally {
    isRestoring.value = false
  }
}

// 处理备份错误模态窗关闭
const handleBackupErrorModalClose = () => {
  backupModalVisible.value = false
  backupError.value = ''
}

// 处理恢复错误模态窗关闭
const handleRestoreErrorModalClose = () => {
  restoreModalVisible.value = false
  restoreError.value = ''
}

// 组件挂载时初始化数据
onMounted(async () => {
  const path = await getAppDataPath()
  if (path) {
    await getDatabaseSize(path)
  }
})
</script>