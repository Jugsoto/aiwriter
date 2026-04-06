<template>
  <div class="p-6 space-y-6">
    <div class="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
      <div class="flex items-start justify-between mb-6">
        <div class="flex-shrink-0">
          <img src="/logo.png" alt="AI Writer Logo" class="w-16 h-16 rounded-2xl border-1 border-[var(--border-color)]" />
        </div>

        <div class="flex-1 ml-6">
          <h1 class="text-2xl font-bold text-[var(--text-primary)] mb-2">神笔写作</h1>
          <p class="text-[var(--text-secondary)]">让创作更智能，让写作更高效</p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-bg)] text-[var(--theme-text)] border border-[var(--theme-bg)] rounded-full">
            <Tag class="w-4 h-4" />
            <span class="text-sm font-medium">{{ appVersion }}</span>
          </div>
          <div v-if="updateStore.hasUpdate" class="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            新版本 {{ updateStore.state.availableVersion }}
          </div>
        </div>

        <button
          @click="checkForUpdates"
          class="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="updateStore.isChecking"
        >
          <RefreshCw v-if="updateStore.isChecking" class="w-4 h-4 animate-spin" />
          <Download v-else class="w-4 h-4" />
          <span class="text-sm font-medium">{{ updateStore.isChecking ? '检查中...' : '检查更新' }}</span>
        </button>
      </div>
    </div>

    <div class="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">更多信息</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex items-center">
            <Globe class="w-5 h-5 text-[var(--text-secondary)] mr-3" />
            <span class="text-[var(--text-primary)] font-medium">官方网站</span>
          </div>
          <button @click="openOfficialWebsite" class="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200">
            <span class="text-sm font-medium">访问</span>
          </button>
        </div>

        <div class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex items-center">
            <BookOpen class="w-5 h-5 text-[var(--text-secondary)] mr-3" />
            <span class="text-[var(--text-primary)] font-medium">使用教程</span>
          </div>
          <button @click="openTutorial" class="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200">
            <span class="text-sm font-medium">查看</span>
          </button>
        </div>

        <div class="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div class="flex items-center">
            <Users class="w-5 h-5 text-[var(--text-secondary)] mr-3" />
            <span class="text-[var(--text-primary)] font-medium">官方社区</span>
          </div>
          <button @click="openCommunity" class="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-full hover:bg-[var(--hover-bg)] transition-all duration-200">
            <span class="text-sm font-medium">加入</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <UpdateModal v-model:visible="showUpdateModal" :updateState="updateStore.state" @action="handleUpdateAction" />
  <Toast :visible="toastVisible" :message="toastMessage" :type="toastType" @update:visible="toastVisible = $event" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Globe, BookOpen, Download, RefreshCw, Tag, Users } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { useUpdateStore } from '@/stores/update'
import UpdateModal from '@/components/modal/UpdateModal.vue'
import Toast from '@/components/shared/Toast.vue'

const updateStore = useUpdateStore()
const showUpdateModal = ref(false)
const { toastVisible, toastMessage, toastType, showToast } = useToast()

const appVersion = computed(() => updateStore.state.currentVersion || '0.0.0')

watch(
  () => updateStore.state.status,
  (status) => {
    if (status === 'available' || status === 'downloading' || status === 'downloaded') {
      showUpdateModal.value = true
    }
  }
)

async function checkForUpdates() {
  const result = await updateStore.checkForUpdates()

  if (result.status === 'not-available') {
    showToast({
      message: '当前已是最新版本！',
      type: 'info'
    })
  }

  if (result.status === 'error') {
    showToast({
      message: result.errorMessage || '检查更新失败，请稍后重试',
      type: 'error'
    })
  }
}

async function handleUpdateAction() {
  if (updateStore.state.status === 'available') {
    await updateStore.downloadUpdate()
    return
  }

  if (updateStore.state.status === 'downloaded') {
    await updateStore.installUpdate()
  }
}

async function openOfficialWebsite() {
  try {
    await window.electronAPI.openExternal('https://github.com/qgming/aiwriter')
  } catch (error) {
    console.error('打开官方网站失败:', error)
  }
}

async function openTutorial() {
  try {
    await window.electronAPI.openExternal('https://shenbi.qgming.com/software/introduction.html')
  } catch (error) {
    console.error('打开使用教程失败:', error)
  }
}

async function openCommunity() {
  try {
    await window.electronAPI.openExternal('https://pd.qq.com/g/shenbixiezuo0')
  } catch (error) {
    console.error('打开官方社区失败:', error)
  }
}

onMounted(async () => {
  await updateStore.initialize()
  if (updateStore.hasUpdate) {
    showUpdateModal.value = true
  }
})
</script>
