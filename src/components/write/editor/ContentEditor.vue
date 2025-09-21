<template>
  <div class="h-full">
    <!-- 空状态 -->
    <div v-if="!currentChapter" class="text-center text-[var(--text-secondary)] py-12">
      <p class="text-lg mb-2">请选择一个章节开始编辑</p>
      <p class="text-sm">在左侧章节管理中选择章节后，即可开始编写内容</p>
    </div>

    <!-- 内容编辑区域 -->
    <div v-else class="h-full relative">
      <!-- 流式模式：使用 textarea -->
      <textarea v-if="isStreaming" :value="content" @input="handleInput"
        class="w-full h-full px-4 py-3 bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none resize-none font-mono leading-relaxed overflow-y-auto"
        placeholder="在这里编写您的章节内容...">
      </textarea>

      <!-- 非流式模式：使用 contenteditable div -->
      <div v-else ref="editorRef"
        class="rich-editor w-full h-full px-4 py-3 bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none overflow-y-auto"
        :contenteditable="!isStreaming" @input="handleRichEditorInput" @keydown="handleKeyDown" @blur="handleBlur"
        @focus="handleFocus" @click="handleClick" @keyup="handleKeyUp" @paste="handlePaste" @cut="handleCut">
        <!-- 段落将通过 JavaScript 动态渲染 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { Chapter } from '@/electron.d'

// 定义props
const props = defineProps({
  currentChapter: {
    type: Object as () => Chapter | null,
    default: null
  },
  content: {
    type: String,
    default: ''
  },
  originalContent: {
    type: String,
    default: ''
  },
  isStreaming: {
    type: Boolean,
    default: false
  }
})

// 定义emits
const emit = defineEmits<{
  'update:content': [value: string]
  'contentChange': []
  'stop-streaming': []
}>()

// 编辑器引用
const editorRef = ref<HTMLElement | null>(null)

// 光标位置状态
const cursorPosition = ref<{
  paragraphIndex: number
  offset: number
  isCollapsed: boolean
} | null>(null)

// 是否正在处理输入（防止递归更新）
const isProcessingInput = ref(false)

// 处理文本区域输入
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:content', target.value)
  emit('contentChange')
}

// 将内容分割为段落数组
const splitIntoParagraphs = (text: string): string[] => {
  if (!text) return ['']
  // 按换行符分割，并确保至少有一个空段落
  const paragraphs = text.split('\n')
  return paragraphs.length === 0 ? [''] : paragraphs
}

// 计算每千字段落的索引
const calculateMilestoneParagraphs = (paragraphs: string[]): number[] => {
  const milestoneIndexes: number[] = []
  let totalChars = 0
  let nextMilestone = 1000

  paragraphs.forEach((paragraph, index) => {
    const prevTotalChars = totalChars
    totalChars += paragraph.length

    // 检查是否跨越了1000字的倍数里程碑
    while (totalChars >= nextMilestone && prevTotalChars < nextMilestone) {
      milestoneIndexes.push(index)
      nextMilestone += 1000
    }
  })

  return milestoneIndexes
}

// 将段落数组合并为文本
const joinParagraphs = (paragraphs: string[]): string => {
  return paragraphs.join('\n')
}

// 渲染段落到编辑器
const renderParagraphs = () => {
  if (!editorRef.value || isProcessingInput.value) return

  const paragraphs = splitIntoParagraphs(props.content)
  const milestoneIndexes = calculateMilestoneParagraphs(paragraphs)

  // 清空编辑器内容
  editorRef.value.innerHTML = ''

  // 创建段落元素
  paragraphs.forEach((paragraphText, index) => {
    const paragraphDiv = document.createElement('div')
    paragraphDiv.className = 'paragraph mb-4 min-h-[1.2em] outline-none'
    paragraphDiv.setAttribute('data-paragraph-index', index.toString())

    // 如果是里程碑段落，添加特殊样式
    if (milestoneIndexes.includes(index)) {
      paragraphDiv.classList.add('milestone-paragraph')
    }

    // 处理空段落（显示占位符光标）
    if (paragraphText === '' && index === paragraphs.length - 1) {
      paragraphDiv.innerHTML = '<br>'
    } else {
      paragraphDiv.textContent = paragraphText
    }

    editorRef.value?.appendChild(paragraphDiv)
  })

  // 恢复光标位置
  restoreCursorPosition()
}

// 从编辑器中提取内容
const extractContentFromEditor = (): string => {
  if (!editorRef.value) return props.content

  const paragraphs: string[] = []
  const paragraphElements = editorRef.value.querySelectorAll('.paragraph')

  paragraphElements.forEach((element) => {
    paragraphs.push(element.textContent || '')
  })

  return joinParagraphs(paragraphs)
}

// 处理富文本编辑器输入
const handleRichEditorInput = () => {
  if (isProcessingInput.value) return

  isProcessingInput.value = true
  const newContent = extractContentFromEditor()
  emit('update:content', newContent)
  emit('contentChange')

  // 保存当前光标位置
  saveCursorPosition()

  nextTick(() => {
    isProcessingInput.value = false
  })
}

// 保存光标位置
const saveCursorPosition = () => {
  if (!editorRef.value) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const startContainer = range.startContainer

  // 找到包含光标的段落
  let paragraphElement = startContainer as HTMLElement

  while (paragraphElement && !paragraphElement.classList?.contains('paragraph')) {
    paragraphElement = paragraphElement.parentElement as HTMLElement
  }

  if (!paragraphElement) return

  const paragraphIndex = parseInt(paragraphElement.getAttribute('data-paragraph-index') || '0')
  const offset = range.startOffset

  cursorPosition.value = {
    paragraphIndex,
    offset,
    isCollapsed: range.collapsed
  }
}

// 恢复光标位置
const restoreCursorPosition = () => {
  if (!editorRef.value || !cursorPosition.value) return

  const { paragraphIndex, offset, isCollapsed } = cursorPosition.value
  const paragraphs = editorRef.value.querySelectorAll('.paragraph')

  if (paragraphIndex >= paragraphs.length) return

  const targetParagraph = paragraphs[paragraphIndex]
  const textNode = targetParagraph.firstChild || targetParagraph.appendChild(document.createTextNode(''))

  const range = document.createRange()
  const selection = window.getSelection()

  if (!selection) return

  range.setStart(textNode, Math.min(offset, textNode.textContent?.length || 0))
  range.collapse(isCollapsed)

  selection.removeAllRanges()
  selection.addRange(range)
}

// 处理按键事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (props.isStreaming) return

  const { key } = event

  // 保存当前光标位置
  saveCursorPosition()

  // 处理 Enter 键
  if (key === 'Enter') {
    event.preventDefault()
    handleEnterKey()
    return
  }

  // 处理 Backspace 键
  if (key === 'Backspace') {
    // 让浏览器先处理默认行为，然后我们再做调整
    setTimeout(() => {
      handleBackspaceKey(event)
    }, 0)
  }
}

// 处理 Enter 键
const handleEnterKey = () => {
  if (!editorRef.value) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const startContainer = range.startContainer

  // 找到当前段落
  let currentParagraph = startContainer as HTMLElement
  while (currentParagraph && !currentParagraph.classList?.contains('paragraph')) {
    currentParagraph = currentParagraph.parentElement as HTMLElement
  }

  if (!currentParagraph) return

  const currentText = currentParagraph.textContent || ''
  const cursorPosition = range.startOffset

  // 分割段落
  const beforeText = currentText.slice(0, cursorPosition)
  const afterText = currentText.slice(cursorPosition)

  // 更新当前段落
  currentParagraph.textContent = beforeText

  // 创建新段落
  const newParagraph = document.createElement('div')
  newParagraph.className = 'paragraph mb-4 min-h-[1.2em] outline-none'
  newParagraph.textContent = afterText

  // 插入新段落
  if (currentParagraph.nextSibling) {
    editorRef.value.insertBefore(newParagraph, currentParagraph.nextSibling)
  } else {
    editorRef.value.appendChild(newParagraph)
  }

  // 更新所有段落的索引
  updateParagraphIndexes()

  // 将光标移动到新段落的开头
  const newSelection = window.getSelection()
  if (newSelection) {
    const newRange = document.createRange()
    newRange.setStart(newParagraph, 0)
    newRange.collapse(true)
    newSelection.removeAllRanges()
    newSelection.addRange(newRange)
  }

  // 触发输入事件以更新内容
  handleRichEditorInput()
}

// 处理 Backspace 键
const handleBackspaceKey = (event: KeyboardEvent) => {
  if (!editorRef.value) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const startContainer = range.startContainer

  // 找到当前段落
  let currentParagraph = startContainer as HTMLElement
  while (currentParagraph && !currentParagraph.classList?.contains('paragraph')) {
    currentParagraph = currentParagraph.parentElement as HTMLElement
  }

  if (!currentParagraph) return

  const paragraphIndex = parseInt(currentParagraph.getAttribute('data-paragraph-index') || '0')
  const currentText = currentParagraph.textContent || ''
  const cursorPosition = range.startOffset

  // 如果在段首且不是第一个段落，则合并到前一段落
  if (cursorPosition === 0 && paragraphIndex > 0) {
    event.preventDefault()

    const previousParagraph = editorRef.value.querySelectorAll('.paragraph')[paragraphIndex - 1] as HTMLElement
    const previousText = previousParagraph.textContent || ''

    // 合并文本
    previousParagraph.textContent = previousText + currentText

    // 删除当前段落
    currentParagraph.remove()

    // 更新段落索引
    updateParagraphIndexes()

    // 将光标移动到合并后的位置
    const newSelection = window.getSelection()
    if (newSelection) {
      const newRange = document.createRange()
      newRange.setStart(previousParagraph, previousText.length)
      newRange.collapse(true)
      newSelection.removeAllRanges()
      newSelection.addRange(newRange)
    }

    // 触发输入事件以更新内容
    handleRichEditorInput()
  }
}

// 更新所有段落的索引
const updateParagraphIndexes = () => {
  if (!editorRef.value) return

  const paragraphs = editorRef.value.querySelectorAll('.paragraph')
  paragraphs.forEach((paragraph, index) => {
    (paragraph as HTMLElement).setAttribute('data-paragraph-index', index.toString())
  })
}

// 其他事件处理
const handleBlur = () => {
  saveCursorPosition()
}

const handleFocus = () => {
  // 确保编辑器获得焦点时有正确的内容
  renderParagraphs()
}

const handleClick = () => {
  saveCursorPosition()
}

const handleKeyUp = () => {
  saveCursorPosition()
}

const handlePaste = (event: ClipboardEvent) => {
  // 处理粘贴事件，确保粘贴的内容也被正确分割为段落
  event.preventDefault()

  const clipboardData = event.clipboardData
  const pastedText = clipboardData?.getData('text/plain') || ''

  // 插入粘贴的文本
  document.execCommand('insertText', false, pastedText)

  // 触发输入事件以更新内容
  handleRichEditorInput()
}

const handleCut = () => {
  // 处理剪切事件
  document.execCommand('cut')
  handleRichEditorInput()
}

// 监听内容变化，重新渲染段落
watch(() => props.content, (newContent, oldContent) => {
  if (props.isStreaming || isProcessingInput.value) return

  // 只有在内容确实发生变化时才重新渲染
  if (newContent !== oldContent) {
    renderParagraphs()
  }
})

// 监听流式模式变化
watch(() => props.isStreaming, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    // 流式模式切换时，确保内容同步
    nextTick(() => {
      if (!props.isStreaming) {
        renderParagraphs()
      }
    })
  }
})

// 监听章节变化，同步内容（只在章节切换时更新）
watch(() => props.currentChapter?.id, (newId, oldId) => {
  if (newId !== oldId) {
    if (props.currentChapter) {
      emit('update:content', props.currentChapter.content || '')
    } else {
      emit('update:content', '')
    }

    // 确保非流式模式下重新渲染段落
    nextTick(() => {
      if (!props.isStreaming) {
        renderParagraphs()
      }
    })
  }
}, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
  if (!props.isStreaming) {
    nextTick(() => {
      renderParagraphs()
    })
  }
})

// 组件卸载时清理
onUnmounted(() => {
  // 清理事件监听器等资源
})
</script>

<style scoped>
.rich-editor {
  line-height: 1.6;
  font-family: inherit;
}

.paragraph {
  margin-bottom: 1em;
  min-height: 1.2em;
  outline: none;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s ease;
}

.paragraph:focus {
  outline: none;
}

/* 确保空段落可见 */
.paragraph:empty::before {
  content: "\200B";
  /* 零宽度空格，确保空段落可见 */
}

.paragraph br {
  display: none;
  /* 隐藏自动生成的br标签 */
}

/* 使用深度选择器确保里程碑段落样式能够应用 */
:deep(.milestone-paragraph) {
  border-bottom-color: #0ea5e9 !important;
  border-bottom-width: 2px !important;
}

:deep(.milestone-paragraph:hover) {
  border-bottom-color: #0284c7 !important;
}
</style>