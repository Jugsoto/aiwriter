<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleBackdropClick"
      >
        <div
          class="bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-[var(--border-color)]">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">
            {{ isForcedUpdate ? '强制更新' : '发现新版本' }}
          </h2>
        </div>
        <button v-if="!isForcedUpdate" @click="closeModal"
          class="p-1 rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
          <X class="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
      </div>

      <!-- 内容区 -->
      <div class="p-6">
        <!-- 版本信息 -->
        <div class="mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-[var(--text-secondary)]">当前版本</span>
            <span class="text-sm font-medium text-[var(--text-primary)]">{{ localVersion }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-[var(--text-secondary)]">最新版本</span>
            <span class="text-sm font-medium text-[var(--text-primary)]">{{ updateInfo.version }}</span>
          </div>
        </div>

        <!-- 发布日期 -->
        <div class="mb-3">
          <span class="text-sm text-[var(--text-secondary)]">发布日期：{{ formatDate(updateInfo.releaseDate) }}</span>
        </div>

        <!-- 更新说明 -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-[var(--text-primary)] mb-3">更新内容</h3>
          <ul class="space-y-2">
            <li v-for="(note, index) in updateInfo.releaseNotes" :key="index" class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span class="text-sm text-[var(--text-secondary)]">{{ note }}</span>
            </li>
          </ul>
        </div>

        <!-- 强制更新提示 -->
        <div v-if="isForcedUpdate"
          class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div class="flex items-start gap-2">
            <AlertTriangle class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-1">强制更新</h4>
              <p class="text-sm text-red-600 dark:text-red-300">
                这是一个强制更新，为了确保软件正常运行和安全性，请立即更新到最新版本。
              </p>
            </div>
          </div>
        </div>

        <!-- 按钮区域 -->
        <div class="flex gap-3">
          <button v-if="!isForcedUpdate" @click="closeModal"
            class="flex-1 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
            稍后更新
          </button>
          <button @click="handleUpdate" :disabled="isUpdating"
            class="flex-1 px-4 py-2 bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            <div class="flex items-center justify-center gap-2">
              <RefreshCw v-if="isUpdating" class="w-4 h-4 animate-spin" />
              <Download v-else class="w-4 h-4" />
              <span>{{ isUpdating ? '准备中...' : '立即更新' }}</span>
            </div>
          </button>
        </div>
      </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Download, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-vue-next'
import type { UpdateInfo } from '@/services/updateChecker'

interface Props {
  visible: boolean
  localVersion: string
  updateInfo: UpdateInfo
  isForcedUpdate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isForcedUpdate: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update': []
}>()

const isUpdating = ref(false)

// 格式化日期
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

// 处理背景点击
const handleBackdropClick = () => {
  if (!props.isForcedUpdate) {
    closeModal()
  }
}

// 关闭模态窗
const closeModal = () => {
  if (!props.isForcedUpdate) {
    emit('update:visible', false)
  }
}

// 处理更新
const handleUpdate = async () => {
  isUpdating.value = true
  try {
    // 打开下载链接
    const { UpdateChecker } = await import('@/services/updateChecker')
    await UpdateChecker.openDownloadUrl(props.updateInfo.downloadUrl)

    // 触发更新事件
    emit('update')
  } catch (error) {
    console.error('打开下载链接失败:', error)
  } finally {
    isUpdating.value = false
  }
}
</script>

<style scoped>
/* 模态框过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
