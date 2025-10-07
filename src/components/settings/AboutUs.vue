<template>
  <div class="p-6 space-y-6">
    <!-- 软件信息卡片 -->
    <div class="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
      <div class="flex items-start justify-between mb-6">
        <!-- 左侧 Logo -->
        <div class="flex-shrink-0">
          <img src="/logo.png" alt="AI Writer Logo"
            class="w-16 h-16 rounded-2xl border-1 border-[var(--border-color)]" />
        </div>

        <!-- 右侧软件信息 -->
        <div class="flex-1 ml-6">
          <h1 class="text-2xl font-bold text-[var(--text-primary)] mb-2">神笔AI写作</h1>
          <p class="text-[var(--text-secondary)]">让创作更智能，让写作更高效</p>
        </div>
      </div>

      <!-- 版本信息和更新按钮 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-bg)] text-[var(--theme-text)] border border-[var(--theme-bg)] rounded-full">
            <Tag class="w-4 h-4" />
            <span class="text-sm font-medium">{{ appVersion }}</span>
          </div>
          <button @click="checkForUpdates"
            class="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isCheckingUpdates">
            <RefreshCw v-if="isCheckingUpdates" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            <span class="text-sm font-medium">{{ isCheckingUpdates ? '检查中...' : '检查更新' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 信息链接卡片 -->
    <div class="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">更多信息</h3>
      <div class="space-y-3">
        <!-- 官方网站 -->
        <div
          class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex items-center">
            <Globe class="w-5 h-5 text-[var(--text-secondary)] mr-3" />
            <span class="text-[var(--text-primary)] font-medium">官方网站</span>
          </div>
          <button @click="openOfficialWebsite"
            class="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200">
            <span class="text-sm font-medium">访问</span>
          </button>
        </div>

        <!-- 使用教程 -->
        <div
          class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex items-center">
            <BookOpen class="w-5 h-5 text-[var(--text-secondary)] mr-3" />
            <span class="text-[var(--text-primary)] font-medium">使用教程</span>
          </div>
          <button @click="openTutorial"
            class="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200">
            <span class="text-sm font-medium">查看</span>
          </button>
        </div>

        <!-- 神笔AI -->
        <div
          class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex items-center">
            <PenTool class="w-5 h-5 text-[var(--text-secondary)] mr-3" />
            <span class="text-[var(--text-primary)] font-medium">神笔AI</span>
          </div>
          <button @click="openShenbiAI"
            class="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200">
            <span class="text-sm font-medium">了解</span>
          </button>
        </div>
      </div>
    </div>

  </div>

  <!-- 更新模态窗 -->
  <UpdateModal v-model:visible="showUpdateModal" :localVersion="appVersion" :updateInfo="updateInfo"
    :isForcedUpdate="isForcedUpdate" @update="handleUpdate" />

  <!-- 公告模态窗 -->
  <AnnouncementModal v-model:visible="showAnnouncementModal" :announcements="validAnnouncements" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Globe, BookOpen, PenTool, Download, RefreshCw, Tag } from 'lucide-vue-next'
import { UpdateChecker } from '@/services/updateChecker'
import { useToast } from '@/composables/useToast'
import UpdateModal from '@/components/modal/UpdateModal.vue'

// 响应式数据
const appVersion = ref('0.9.0')
const isCheckingUpdates = ref(false)
const showUpdateModal = ref(false)
const showAnnouncementModal = ref(false)
const updateInfo = ref<any>(null)
const isForcedUpdate = ref(false)
const validAnnouncements = ref<any[]>([])

// Toast功能
const { showToast } = useToast()

// 获取应用版本信息
const getAppVersion = async () => {
  try {
    const version = await window.electronAPI.getAppVersion()
    appVersion.value = version
  } catch (error) {
    console.error('获取应用版本失败:', error)
    appVersion.value = '0.9.0'
  }
}


// 检查更新
const checkForUpdates = async () => {
  isCheckingUpdates.value = true
  try {
    const result = await UpdateChecker.checkForUpdates()

    if (result.hasUpdate && result.remoteVersion) {
      // 有更新
      updateInfo.value = result.remoteVersion
      isForcedUpdate.value = result.remoteVersion.isForced
      showUpdateModal.value = true

    } else {
      // 无更新
      showToast({
        message: '当前已是最新版本！',
        type: 'info'
      })
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    showToast({
      message: '检查更新失败，请稍后重试',
      type: 'error'
    })
  } finally {
    isCheckingUpdates.value = false
  }
}

// 处理更新
const handleUpdate = () => {
  showUpdateModal.value = false
}


// 打开官方网站
const openOfficialWebsite = async () => {
  try {
    await window.electronAPI.openExternal('https://shenbi.qgming.com')
  } catch (error) {
    console.error('打开官方网站失败:', error)
  }
}

// 打开使用教程
const openTutorial = async () => {
  try {
    await window.electronAPI.openExternal('https://shenbi.qgming.com/guide/what-is-the-app.html')
  } catch (error) {
    console.error('打开使用教程失败:', error)
  }
}

// 打开神笔AI
const openShenbiAI = async () => {
  try {
    await window.electronAPI.openExternal('https://ai.qgming.com')
  } catch (error) {
    console.error('打开神笔AI失败:', error)
  }
}

// 组件挂载时初始化数据
onMounted(async () => {
  await getAppVersion()
})
</script>