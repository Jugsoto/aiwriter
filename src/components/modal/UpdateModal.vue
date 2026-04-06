<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-[var(--border-color)]">
          <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">{{ modalTitle }}</h2>
            <button @click="closeModal" class="p-1 rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
              <X class="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          <div class="p-6">
            <div class="mb-4 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--text-secondary)]">当前版本</span>
                <span class="text-sm font-medium text-[var(--text-primary)]">{{ updateState.currentVersion }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--text-secondary)]">最新版本</span>
                <span class="text-sm font-medium text-[var(--text-primary)]">{{ updateState.availableVersion || updateState.currentVersion }}</span>
              </div>
              <div v-if="updateState.releaseDate" class="text-sm text-[var(--text-secondary)]">
                发布日期：{{ formatDate(updateState.releaseDate) }}
              </div>
            </div>

            <div v-if="updateState.releaseNotes.length" class="mb-5">
              <h3 class="text-sm font-medium text-[var(--text-primary)] mb-3">更新内容</h3>
              <ul class="space-y-2">
                <li v-for="(note, index) in updateState.releaseNotes" :key="index" class="flex items-start gap-2">
                  <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span class="text-sm text-[var(--text-secondary)]">{{ note }}</span>
                </li>
              </ul>
            </div>

            <div v-if="updateState.status === 'downloading'" class="mb-5">
              <div class="flex items-center justify-between mb-2 text-sm text-[var(--text-secondary)]">
                <span>下载进度</span>
                <span>{{ progressText }}</span>
              </div>
              <div class="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                <div class="h-full bg-[var(--theme-bg)] transition-all duration-300" :style="{ width: `${updateState.downloadPercent}%` }" />
              </div>
            </div>

            <div v-if="updateState.status === 'downloaded'" class="mb-5 p-4 rounded-lg border border-green-200 bg-green-50 text-green-700">
              更新已下载完成，点击下方按钮即可重启并安装。
            </div>

            <div v-if="updateState.errorMessage" class="mb-5 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
              {{ updateState.errorMessage }}
            </div>

            <div class="flex gap-3">
              <button
                @click="closeModal"
                class="flex-1 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
              >
                稍后处理
              </button>
              <button
                @click="emit('action')"
                :disabled="isActionDisabled"
                class="flex-1 px-4 py-2 bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div class="flex items-center justify-center gap-2">
                  <RefreshCw v-if="updateState.status === 'downloading'" class="w-4 h-4 animate-spin" />
                  <Download v-else-if="updateState.status === 'available'" class="w-4 h-4" />
                  <RefreshCw v-else class="w-4 h-4" />
                  <span>{{ actionLabel }}</span>
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
import { computed } from 'vue'
import { Download, X, CheckCircle, RefreshCw } from 'lucide-vue-next'
import type { AppUpdateState } from '@/electron.d'

interface Props {
  visible: boolean
  updateState: AppUpdateState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  action: []
}>()

const modalTitle = computed(() => {
  if (props.updateState.status === 'downloading') {
    return '下载更新中'
  }

  if (props.updateState.status === 'downloaded') {
    return '更新已就绪'
  }

  return '发现新版本'
})

const actionLabel = computed(() => {
  if (props.updateState.status === 'downloading') {
    return '下载中...'
  }

  if (props.updateState.status === 'downloaded') {
    return '重启安装'
  }

  return '立即下载'
})

const isActionDisabled = computed(() => props.updateState.status === 'downloading')

const progressText = computed(() => `${props.updateState.downloadPercent.toFixed(1)}%`)

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

function closeModal() {
  emit('update:visible', false)
}
</script>

<style scoped>
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
