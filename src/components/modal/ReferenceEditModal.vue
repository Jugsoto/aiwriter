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
        {{ isEdit ? '编辑资料' : '新增资料' }}
      </h3>

      <div class="mb-4 flex-1 flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            资料标题 <span class="text-red-500">*</span>
          </label>
          <input v-model="formData.title" type="text"
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入资料标题..." required>
          <p v-if="titleError" class="text-xs text-red-500 mt-1">{{ titleError }}</p>
        </div>

        <div class="flex-1 flex flex-col">
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            资料内容 <span class="text-red-500">*</span>
          </label>
          <textarea v-model="formData.content"
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 resize-none"
            placeholder="请输入资料内容..." rows="8"></textarea>
          <p v-if="contentError" class="text-xs text-red-500 mt-1">{{ contentError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            标签 <span class="text-gray-400 text-xs">(可选，用逗号分隔)</span>
          </label>
          <input v-model="tagsInput" type="text"
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：参考资料,学习方法,写作技巧">
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button @click="handleCancel"
          class="px-4 py-1.5 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
          取消
        </button>
        <button @click="handleConfirm"
          class="px-4 py-1.5 bg-[var(--theme-bg)] text-white rounded-lg hover:bg-blue-700 transition-colors">
          保存
        </button>
      </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ReferenceLibrary } from '@/electron.d'

interface Props {
  visible: boolean
  bookId: number
  editReference?: ReferenceLibrary | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', data: { title: string; content: string; tags?: string[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editReference: null
})

const emit = defineEmits<Emits>()

// 表单数据
const formData = ref({
  title: '',
  content: ''
})

const tagsInput = ref('')

// 验证错误
const titleError = ref('')
const contentError = ref('')

// 计算属性
const isEdit = computed(() => !!props.editReference)

// 监听visible变化，初始化表单数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.editReference) {
      formData.value = {
        title: props.editReference.title,
        content: props.editReference.content
      }
      // 解析标签
      try {
        const tags = JSON.parse(props.editReference.tags)
        tagsInput.value = tags.join(', ')
      } catch {
        tagsInput.value = ''
      }
    } else {
      formData.value = {
        title: '',
        content: ''
      }
      tagsInput.value = ''
    }
  }
})

// 处理确认
function handleConfirm() {
  // 验证标题
  titleError.value = ''
  if (!formData.value.title.trim()) {
    titleError.value = '资料标题不能为空'
    return
  }

  if (formData.value.title.trim().length > 100) {
    titleError.value = '资料标题不能超过100个字符'
    return
  }

  // 验证内容
  contentError.value = ''
  if (!formData.value.content.trim()) {
    contentError.value = '资料内容不能为空'
    return
  }

  // 解析标签
  const tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)

  emit('confirm', {
    title: formData.value.title.trim(),
    content: formData.value.content.trim(),
    tags
  })
  emit('update:visible', false)
}

// 处理取消
function handleCancel() {
  titleError.value = ''
  contentError.value = ''
  emit('update:visible', false)
}

// 监听表单变化，清除错误提示
watch(() => formData.value.title, () => {
  if (titleError.value && formData.value.title.trim()) {
    titleError.value = ''
  }
})

watch(() => formData.value.content, () => {
  if (contentError.value && formData.value.content.trim()) {
    contentError.value = ''
  }
})
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
