<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="bg-[var(--bg-primary)] rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col border border-[var(--border-color)] shadow-2xl">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
        导入文件到资料库
      </h3>

      <!-- 拖拽上传区域 -->
      <div
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        class="border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors"
        :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-[var(--border-color)] hover:border-blue-400'"
      >
        <Upload class="w-12 h-12 mx-auto mb-3 text-[var(--text-secondary)]" />
        <p class="text-sm text-[var(--text-primary)] mb-2">
          拖拽文件到此处，或点击选择文件
        </p>
        <p class="text-xs text-[var(--text-secondary)] mb-4">
          支持 .txt 格式的文本文件
        </p>
        <button
          @click="selectFiles"
          class="px-4 py-2 bg-[var(--theme-bg)] text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          选择文件
        </button>
      </div>

      <!-- 文件列表 -->
      <div v-if="files.length > 0" class="flex-1 overflow-y-auto mb-4">
        <div class="text-sm font-medium text-[var(--text-secondary)] mb-2">
          已选择 {{ files.length }} 个文件
        </div>
        <div class="space-y-2">
          <div
            v-for="(file, index) in files"
            :key="index"
            class="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <FileText class="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="text-sm text-[var(--text-primary)] truncate">
                  {{ file.name }}
                </div>
                <div class="text-xs text-[var(--text-secondary)]">
                  {{ formatFileSize(file.size) }}
                </div>
              </div>
            </div>
            <button
              @click="removeFile(index)"
              class="p-1 text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--hover-bg)] rounded transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- 导入进度 -->
      <div v-if="importing" class="mb-4">
        <div class="text-sm text-[var(--text-secondary)] mb-2">
          正在导入 {{ importProgress.current }} / {{ importProgress.total }} 个文件...
        </div>
        <div class="w-full bg-[var(--bg-secondary)] rounded-full h-2">
          <div
            class="bg-blue-500 h-2 rounded-full transition-all"
            :style="{ width: `${(importProgress.current / importProgress.total) * 100}%` }"
          ></div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button
          @click="handleCancel"
          :disabled="importing"
          class="px-4 py-1.5 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          取消
        </button>
        <button
          @click="handleConfirm"
          :disabled="files.length === 0 || importing"
          class="px-4 py-1.5 bg-[var(--theme-bg)] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ importing ? '导入中...' : '导入' }}
        </button>
      </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Upload, FileText, X } from 'lucide-vue-next'

interface Props {
  visible: boolean
  bookId: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', references: Array<{ title: string; content: string }>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态管理
const files = ref<File[]>([])
const isDragging = ref(false)
const importing = ref(false)
const importProgress = ref({ current: 0, total: 0 })

// 监听visible变化，重置状态
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    files.value = []
    importProgress.value = { current: 0, total: 0 }
  }
})

// 选择文件
async function selectFiles() {
  try {
    // 使用 Electron 的 dialog API 选择文件
    const result = await window.electronAPI.showOpenDialog({
      title: '选择要导入的文件',
      filters: [
        { name: 'Text Files', extensions: ['txt'] }
      ],
      properties: ['openFile', 'multiSelections']
    })

    if (result.canceled) return

    // 添加文件到列表（避免重复）
    for (const filePath of result.filePaths) {
      const fileName = filePath.split(/[/\\]/).pop() || ''
      const existingFile = files.value.find(f => f.name === fileName)
      if (!existingFile) {
        // 读取文件内容
        const content = await window.electronAPI.readFile(filePath)
        files.value.push(new File([content], fileName, { type: 'text/plain' }))
      }
    }
  } catch (error) {
    console.error('Failed to select files:', error)
  }
}

// 处理拖拽上传
function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  const droppedFiles = event.dataTransfer?.files
  if (!droppedFiles) return

  // 只接受 .txt 文件
  for (const file of Array.from(droppedFiles)) {
    if (file.name.endsWith('.txt')) {
      const existingFile = files.value.find(f => f.name === file.name)
      if (!existingFile) {
        files.value.push(file)
      }
    }
  }
}

// 移除文件
function removeFile(index: number) {
  files.value.splice(index, 1)
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 读取文件内容
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string || '')
    }
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`))
    }
    reader.readAsText(file)
  })
}

// 处理确认
async function handleConfirm() {
  if (files.value.length === 0 || importing.value) return

  try {
    importing.value = true
    importProgress.value = { current: 0, total: files.value.length }

    const references: Array<{ title: string; content: string }> = []

    for (const file of files.value) {
      const content = await readFileContent(file)
      const title = file.name.replace(/\.txt$/i, '')
      references.push({ title, content })
      importProgress.value.current++
    }

    emit('confirm', references)
    emit('update:visible', false)
  } catch (error) {
    console.error('Failed to import files:', error)
  } finally {
    importing.value = false
  }
}

// 处理取消
function handleCancel() {
  if (importing.value) return
  emit('update:visible', false)
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
