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
        {{ isEdit ? '编辑设定' : '新增设定' }}
      </h3>

      <div class="mb-4 flex-1 flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            设定名称 <span class="text-red-500">*</span>
          </label>
          <input v-model="formData.name" type="text"
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入设定名称..." required>
          <p v-if="nameError" class="text-xs text-red-500 mt-1">{{ nameError }}</p>
        </div>

        <div class="flex-1 flex flex-col">
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            设定内容 <span class="text-gray-400 text-xs">(可选)</span>
          </label>
          <textarea v-model="formData.content"
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 resize-none"
            placeholder="请输入设定内容..." rows="6"></textarea>
        </div>
        <div class="flex-1 flex flex-col">
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            当前状态 <span class="text-gray-400 text-xs">(可选)</span>
          </label>
          <textarea v-model="formData.status"
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 resize-none"
            placeholder="请输入当前状态..." rows="3"></textarea>
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
import type { Setting } from '@/electron.d'

interface Props {
  visible: boolean
  bookId: number
  settingType: 'character' | 'worldview' | 'entry'
  editSetting?: Setting | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', data: { name: string; content: string; status?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editSetting: null
})

const emit = defineEmits<Emits>()

// 表单数据
const formData = ref({
  name: '',
  content: '',
  status: ''
})

// 验证错误
const nameError = ref('')

// 计算属性
const isEdit = computed(() => !!props.editSetting)

// 监听visible变化，初始化表单数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.editSetting) {
      formData.value = {
        name: props.editSetting.name,
        content: props.editSetting.content,
        status: props.editSetting.status
      }
    } else {
      formData.value = {
        name: '',
        content: '',
        status: ''
      }
    }
  }
})

// 处理确认
function handleConfirm() {
  // 验证名称
  nameError.value = ''
  if (!formData.value.name.trim()) {
    nameError.value = '设定名称不能为空'
    return
  }

  if (formData.value.name.trim().length > 50) {
    nameError.value = '设定名称不能超过50个字符'
    return
  }

  emit('confirm', {
    name: formData.value.name.trim(),
    content: formData.value.content.trim(),
    status: formData.value.status
  })
  emit('update:visible', false)
}

// 处理取消
function handleCancel() {
  nameError.value = ''
  emit('update:visible', false)
}

// 监听表单变化，清除错误提示
watch(() => formData.value.name, () => {
  if (nameError.value && formData.value.name.trim()) {
    nameError.value = ''
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