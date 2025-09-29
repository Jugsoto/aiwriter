<template>
  <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="fixed inset-0" @click="handleCancel"></div>
    <div
      class="bg-[var(--bg-primary)] rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col border-2 border-[var(--border-color)] shadow-lg relative">
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {{ isEdit ? '编辑提示词' : '添加提示词' }}
      </h3>



      <div class="mb-4 flex-1 flex flex-col gap-4 overflow-y-auto min-h-0 p-1">

        <div v-if="isDefaultPrompt" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-red-600 text-sm font-medium">默认提示词不可编辑，请先复制再修改</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            提示词名称 <span class="text-red-500">*</span>
          </label>
          <input v-model="form.name" type="text" required
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入提示词名称" maxlength="100" />
          <p v-if="nameError" class="text-xs text-red-500 mt-1">{{ nameError }}</p>
        </div>


        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              作者
            </label>
            <input v-model="form.author" type="text"
              class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入作者名称" maxlength="50" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              版本
            </label>
            <input v-model="form.version" type="text"
              class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：1.0.0" maxlength="20" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              联系地址
            </label>
            <input v-model="form.url" type="url"
              class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..." maxlength="200" />
          </div>
        </div>

        <div class="flex flex-col">
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            简介
          </label>
          <textarea v-model="form.description" rows="2"
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="请输入提示词简介" maxlength="500" />
        </div>

        <div class="flex-1 flex flex-col">
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            提示词内容 <span class="text-red-500">*</span>
          </label>
          <textarea v-model="form.content" rows="20" required
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 resize-none text-sm"
            placeholder="请输入提示词内容" />
        </div>

      </div>

      <div class="flex justify-end gap-3">
        <button @click="handleCancel"
          class="px-4 py-1.5 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
          取消
        </button>
        <button @click="handleConfirm" :disabled="!isFormValid || submitting || isDefaultPrompt"
          class="px-4 py-1.5 bg-[var(--theme-bg)] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {{ submitting ? '保存中...' : (isEdit ? '保存' : '创建') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Prompt } from '../../electron'

interface Props {
  visible: boolean
  prompt?: Prompt | null
  category?: string
  isEdit: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  prompt: null,
  category: ''
})

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: any): void
}

const emit = defineEmits<Emits>()

// 表单数据
const form = ref({
  name: '',
  content: '',
  category: '',
  description: '',
  author: '',
  version: '',
  url: ''
})

// 提交状态
const submitting = ref(false)

// 验证错误
const nameError = ref('')

// 计算属性
const isDefaultPrompt = computed(() => {
  return props.isEdit && props.prompt?.is_default === 1
})

// 表单验证
const isFormValid = computed(() => {
  return form.value.name.trim() && form.value.content.trim()
})

// 初始化表单
const initForm = () => {
  if (props.isEdit && props.prompt) {
    form.value = {
      name: props.prompt.name,
      content: props.prompt.content,
      category: props.prompt.category,
      description: props.prompt.description,
      author: props.prompt.author,
      version: props.prompt.version,
      url: props.prompt.url
    }
  } else {
    form.value = {
      name: '',
      content: '',
      category: props.category || '',
      description: '',
      author: '',
      version: '',
      url: ''
    }
  }
}

// 监听visible变化，初始化表单数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initForm()
    nameError.value = ''
  }
})

// 处理确认
function handleConfirm() {
  // 验证名称
  nameError.value = ''
  if (!form.value.name.trim()) {
    nameError.value = '提示词名称不能为空'
    return
  }

  if (form.value.name.trim().length > 100) {
    nameError.value = '提示词名称不能超过100个字符'
    return
  }

  if (!isFormValid.value || submitting.value || isDefaultPrompt.value) return

  submitting.value = true
  try {
    const data = {
      name: form.value.name.trim(),
      content: form.value.content.trim(),
      category: form.value.category,
      description: form.value.description.trim(),
      author: form.value.author.trim(),
      version: form.value.version.trim(),
      url: form.value.url.trim()
    }

    emit('save', data)
    emit('update:visible', false)
  } catch (error) {
    console.error('保存提示词失败:', error)
  } finally {
    submitting.value = false
  }
}

// 处理取消
function handleCancel() {
  nameError.value = ''
  emit('update:visible', false)
}

// 监听表单变化，清除错误提示
watch(() => form.value.name, () => {
  if (nameError.value && form.value.name.trim()) {
    nameError.value = ''
  }
})

// 监听属性变化
watch(() => props.prompt, initForm, { immediate: true })
watch(() => props.category, (newCategory) => {
  if (!props.isEdit && newCategory) {
    form.value.category = newCategory
  }
})

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleCancel()
  } else if (event.key === 'Enter' && event.ctrlKey) {
    // Ctrl+Enter 保存
    handleConfirm()
  }
}

// 监听键盘事件
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>