<template>
  <div class="h-full flex flex-col">
    <BookHeader :book-name="book?.name" @back="goBack" @global-settings="showGlobalSettingsModal = true"
      @open-settings="handleOpenSettings" />

    <!-- 主要内容区 - 三栏布局 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧章节管理 -->
      <div ref="leftPanel" class="bg-[var(--bg-secondary)] relative" :style="{ width: leftWidth + 'px' }">
        <ChapterManager :book-id="bookId" :is-chapter-locked="isChapterLocked" :locked-chapter-id="lockedChapterId" />
      </div>

      <!-- 左侧分隔条 -->
      <div class="border-r border-[var(--border-color)]  cursor-col-resize relative group transition-all duration-200"
        :style="{ borderWidth: isHoveringLeft ? '2px' : '1px' }" @mousedown="startResize('left', $event)"
        @mouseenter="isHoveringLeft = true" @mouseleave="isHoveringLeft = false">
        <div class="absolute inset-0 group-hover:bg-blue-500/20"></div>
      </div>

      <!-- 中间正文编辑器 -->
      <div ref="middlePanel" class="flex-1 bg-[var(--bg-primary)] relative" :style="{ width: middleWidth + 'px' }">
        <Editor ref="editorRef" />
      </div>

      <!-- 右侧分隔条 -->
      <div class="border-l border-[var(--border-color)] cursor-col-resize relative group transition-all duration-200"
        :style="{ borderWidth: isHoveringRight ? '2px' : '1px' }" @mousedown="startResize('right', $event)"
        @mouseenter="isHoveringRight = true" @mouseleave="isHoveringRight = false">
        <div class="absolute inset-0 group-hover:bg-blue-500/20"></div>
      </div>

      <!-- 右侧AI助手 -->
      <div ref="rightPanel" class="bg-[var(--bg-secondary)] relative" :style="{ width: rightWidth + 'px' }">
        <WriteCopilot :book-id="bookId" @start-writing="handleStartWriting" />
      </div>
    </div>

    <!-- 全局设定模态框 -->
    <GlobalSettingsModal v-model:visible="showGlobalSettingsModal"
      :initial-data="{ global_settings: book?.global_settings || '' }" @confirm="handleGlobalSettingsSave" />

    <!-- 设定管理模态框 -->
    <SettingsModal v-model:visible="showSettingsModal" :book-id="bookId" :setting-type="currentSettingType" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import type { Book } from '@/electron.d'
import ChapterManager from '@/components/write/ChapterManager.vue'
import Editor from '@/components/write/Editor.vue'
import WriteCopilot from '@/components/write/WriteCopilot.vue'
import BookHeader from '@/components/write/BookHeader.vue'
import GlobalSettingsModal from '@/components/modal/GlobalSettingsModal.vue'
import SettingsModal from '@/components/modal/SettingsModal.vue'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()

const book = ref<Book | null>(null)
const loading = ref(false)
const error = ref('')
const showGlobalSettingsModal = ref(false)
const showSettingsModal = ref(false)
const currentSettingType = ref<'character' | 'worldview' | 'entry'>('character')
const editorRef = ref<InstanceType<typeof Editor>>()

// 检查是否有章节被锁定
const isChapterLocked = ref(false)
const lockedChapterId = ref<number | null>(null)

// 计算属性
const bookId = computed(() => {
  const id = route.params.id as string
  return id ? Number(id) : 0
})

// 三栏布局相关
const leftPanel = ref<HTMLElement>()
const middlePanel = ref<HTMLElement>()
const rightPanel = ref<HTMLElement>()

// hover状态
const isHoveringLeft = ref(false)
const isHoveringRight = ref(false)

// 统一最小宽度
const MIN_WIDTH = 150 // 所有面板最小宽度

// 计算初始宽度比例1:2:1
const totalWidth = ref(window.innerWidth - 40) // 留出边距
const leftWidth = ref(0)
const middleWidth = ref(0)
const rightWidth = ref(0)

const isResizing = ref(false)
const resizeType = ref<'left' | 'right'>('left')
const startX = ref(0)
const startLeftWidth = ref(0)
const startMiddleWidth = ref(0)
const startRightWidth = ref(0)

// 初始化宽度
function initWidths() {
  totalWidth.value = window.innerWidth - 40
  const unitWidth = totalWidth.value / 10
  leftWidth.value = Math.max(MIN_WIDTH, unitWidth * 2)
  middleWidth.value = Math.max(MIN_WIDTH, unitWidth * 5)
  rightWidth.value = Math.max(MIN_WIDTH, unitWidth * 3)

  // 确保总宽度正确
  const currentTotal = leftWidth.value + middleWidth.value + rightWidth.value
  if (currentTotal !== totalWidth.value) {
    middleWidth.value += totalWidth.value - currentTotal
  }
}

onMounted(async () => {
  initWidths()
  await loadBook()
  window.addEventListener('resize', initWidths)
})

// 监听路由变化，当ID改变时重新加载
watch(() => route.params.id, async () => {
  await loadBook()
})

async function loadBook() {
  const bookId = route.params.id as string
  if (!bookId) {
    error.value = '无效的书籍ID'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 确保书籍数据已加载
    if (booksStore.books.length === 0) {
      await booksStore.loadBooks()
    }

    const foundBook = booksStore.books.find((b: Book) => b.id === Number(bookId))

    if (foundBook) {
      book.value = foundBook
    } else {
      error.value = '未找到该书籍'
    }
  } catch (err) {
    console.error('Failed to load book:', err)
    error.value = '加载书籍失败，请重试'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/')
}

async function handleGlobalSettingsSave(data: { global_settings: string }) {
  if (!book.value) return

  try {
    await booksStore.updateBookGlobalSettings(book.value.id, data.global_settings)
    // 更新本地书籍数据
    book.value.global_settings = data.global_settings
    console.log('Global settings saved successfully')
  } catch (err) {
    console.error('Failed to save global settings:', err)
    alert('保存全局设定失败，请重试')
  }
}

function handleOpenSettings(type: 'character' | 'worldview' | 'entry') {
  currentSettingType.value = type
  showSettingsModal.value = true
}

// 拖动调整大小功能
function startResize(type: 'left' | 'right', event: MouseEvent) {
  isResizing.value = true
  resizeType.value = type
  startX.value = event.clientX
  startLeftWidth.value = leftWidth.value
  startMiddleWidth.value = middleWidth.value
  startRightWidth.value = rightWidth.value

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  // 阻止默认行为，防止文本选择等干扰
  event.preventDefault()
}

function handleMouseMove(event: MouseEvent) {
  if (!isResizing.value) return

  const deltaX = event.clientX - startX.value

  if (resizeType.value === 'left') {
    resizePanel('left', deltaX)
  } else {
    resizePanel('right', deltaX)
  }

  // 确保所有宽度都不小于最小值
  leftWidth.value = Math.max(MIN_WIDTH, leftWidth.value)
  middleWidth.value = Math.max(MIN_WIDTH, middleWidth.value)
  rightWidth.value = Math.max(MIN_WIDTH, rightWidth.value)

  // 确保总宽度不变
  const total = leftWidth.value + middleWidth.value + rightWidth.value
  if (total !== totalWidth.value) {
    middleWidth.value += totalWidth.value - total
  }
}

function resizePanel(type: 'left' | 'right', deltaX: number) {
  if (type === 'left') {
    // 左侧拖动：影响左侧和中间
    if (deltaX > 0) {
      const availableMiddle = startMiddleWidth.value - MIN_WIDTH
      if (deltaX <= availableMiddle) {
        // 阶段1：只减少中间区域
        leftWidth.value = startLeftWidth.value + deltaX
        middleWidth.value = startMiddleWidth.value - deltaX
        rightWidth.value = startRightWidth.value
      } else {
        // 阶段2：中间已达最小，开始减少右侧
        const remainingDelta = deltaX - availableMiddle
        const availableRight = startRightWidth.value - MIN_WIDTH
        if (remainingDelta <= availableRight) {
          leftWidth.value = startLeftWidth.value + availableMiddle + remainingDelta
          middleWidth.value = MIN_WIDTH
          rightWidth.value = startRightWidth.value - remainingDelta
        } else {
          // 达到极限
          leftWidth.value = startLeftWidth.value + availableMiddle + availableRight
          middleWidth.value = MIN_WIDTH
          rightWidth.value = MIN_WIDTH
        }
      }
    } else {
      // 向左拖动：减少左侧，增加中间
      const availableLeft = startLeftWidth.value - MIN_WIDTH
      const actualDelta = Math.min(-deltaX, availableLeft)

      leftWidth.value = startLeftWidth.value - actualDelta
      middleWidth.value = startMiddleWidth.value + actualDelta
      rightWidth.value = startRightWidth.value
    }
  } else {
    // 右侧拖动：影响右侧和中间
    if (deltaX < 0) {
      // 向左拖动：增加右侧宽度，减少中间宽度
      const maxIncrease = (startMiddleWidth.value - MIN_WIDTH) + (startLeftWidth.value - MIN_WIDTH)
      const desiredIncrease = -deltaX

      if (desiredIncrease <= maxIncrease) {
        // 未达到极限
        if (desiredIncrease <= (startMiddleWidth.value - MIN_WIDTH)) {
          // 阶段1：只减少中间区域
          rightWidth.value = startRightWidth.value + desiredIncrease
          middleWidth.value = startMiddleWidth.value - desiredIncrease
          leftWidth.value = startLeftWidth.value
        } else {
          // 阶段2：中间已达最小，开始减少左侧
          const remaining = desiredIncrease - (startMiddleWidth.value - MIN_WIDTH)
          rightWidth.value = startRightWidth.value + desiredIncrease
          middleWidth.value = MIN_WIDTH
          leftWidth.value = startLeftWidth.value - remaining
        }
      } else {
        // 达到极限：中间和左侧都已最小，不能再增加右侧
        rightWidth.value = startRightWidth.value + maxIncrease
        middleWidth.value = MIN_WIDTH
        leftWidth.value = MIN_WIDTH
      }
    } else {
      // 向右拖动：减少右侧，增加中间
      const availableRight = startRightWidth.value - MIN_WIDTH
      const actualDelta = Math.min(deltaX, availableRight)

      rightWidth.value = startRightWidth.value - actualDelta
      middleWidth.value = startMiddleWidth.value + actualDelta
      leftWidth.value = startLeftWidth.value
    }
  }
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
  window.removeEventListener('resize', initWidths)
})

// 处理开始写作事件
const handleStartWriting = async (message: any) => {
  // 调用编辑器的流式写作功能
  if (editorRef.value) {
    try {
      // 创建一个自定义事件，让 WriteCopilot 处理
      const event = new CustomEvent('content-writing-request', {
        detail: { message }
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error('BookView: 开始写作失败', error)
    }
  }
}

// 监听流式写作状态变化
let streamingStatusHandler: EventListener | null = null

onMounted(() => {
  // 监听流式写作状态变化
  streamingStatusHandler = ((event: Event) => {
    const customEvent = event as CustomEvent
    const { isLocked, chapterId } = customEvent.detail

    isChapterLocked.value = isLocked
    lockedChapterId.value = chapterId
  }) as EventListener

  window.addEventListener('streaming-status-changed', streamingStatusHandler)
})

onUnmounted(() => {
  if (streamingStatusHandler) {
    window.removeEventListener('streaming-status-changed', streamingStatusHandler)
    streamingStatusHandler = null
  }
})
</script>

<style scoped>
.cursor-col-resize {
  cursor: col-resize;
}
</style>