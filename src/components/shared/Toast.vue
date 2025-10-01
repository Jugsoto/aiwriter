<template>
  <transition name="fade">
    <div v-if="visible" class="fixed top-10 left-1/2 transform -translate-x-1/2 z-50">
      <div :class="[
        'border rounded-lg px-4 py-3 shadow-lg min-w-[300px] max-w-[500px] transition-colors duration-200',
        type === 'success' ? 'toast-success' : '',
        type === 'error' ? 'toast-error' : '',
        type === 'info' ? 'toast-info' : ''
      ]">
        <div class="flex items-center gap-3">
          <CheckCircle class="w-5 h-5 flex-shrink-0" v-if="type === 'success'" />
          <AlertCircle class="w-5 h-5 flex-shrink-0" v-else-if="type === 'error'" />
          <Info class="w-5 h-5 flex-shrink-0" v-else />
          <span class="text-sm font-medium">{{ message }}</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { CheckCircle, AlertCircle, Info } from 'lucide-vue-next'

interface Props {
  visible: boolean
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'success',
  duration: 2000
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// 自动隐藏提示
watch(() => props.visible, (newVal) => {
  if (newVal && props.duration > 0) {
    setTimeout(() => {
      emit('update:visible', false)
    }, props.duration)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.toast-success {
  background-color: var(--strength-bg);
  border-color: var(--strength-border);
}

.toast-error {
  background-color: var(--pitfall-bg);
  border-color: var(--pitfall-border);
}

.toast-info {
  background-color: var(--suggestion-bg);
  border-color: var(--suggestion-border);
}

.toast-success svg {
  color: var(--strength-border);
}

.toast-error svg {
  color: var(--pitfall-border);
}

.toast-info svg {
  color: var(--suggestion-border);
}

.toast-success span {
  color: var(--text-primary);
}

.toast-error span {
  color: var(--text-primary);
}

.toast-info span {
  color: var(--text-primary);
}
</style>