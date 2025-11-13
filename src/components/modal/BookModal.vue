<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <div
          class="bg-[var(--bg-primary)] rounded-2xl p-6 w-full max-w-md mx-4 border border-[var(--border-color)] shadow-2xl">
      <h2 class="text-xl font-semibold mb-4 text-[var(--text-primary)]">
        {{ isEdit ? '编辑书籍' : '新增书籍' }}
      </h2>

      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            书籍名称
          </label>
          <input v-model="bookName" type="text"
            class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            placeholder="请输入书籍名称" required maxlength="100" />
        </div>

        <div class="flex gap-3 justify-end">
          <button type="button" @click="$emit('close')"
            class="px-4 py-1.5 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
            取消
          </button>
          <button type="submit" :disabled="!bookName.trim() || saving"
            class="px-4 py-1.5 bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-lg hover:bg-[var(--theme-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Book } from '@/electron.d'

interface Props {
  book?: Book | null
  isEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  book: null,
  isEdit: false
})

const emit = defineEmits<{
  close: []
  save: [name: string]
}>()

const bookName = ref('')
const saving = ref(false)

// 监听book变化，重置表单数据
watch(() => props.book, (newBook) => {
  bookName.value = newBook?.name || ''
}, { immediate: true })

async function handleSubmit() {
  if (!bookName.value.trim()) return

  saving.value = true
  try {
    await emit('save', bookName.value.trim())
  } finally {
    saving.value = false
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
