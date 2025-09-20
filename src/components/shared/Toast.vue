<template>
  <transition name="fade">
    <div v-if="visible" class="fixed top-10 left-1/2 transform -translate-x-1/2 z-50">
      <div :class="[
        'border rounded-lg px-4 py-3 shadow-lg min-w-[300px] max-w-[500px]',
        type === 'success' ? 'bg-green-50 border-green-200' : '',
        type === 'error' ? 'bg-red-50 border-red-200' : '',
        type === 'info' ? 'bg-blue-50 border-blue-200' : ''
      ]">
        <div class="flex items-center gap-3">
          <CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0" v-if="type === 'success'" />
          <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0" v-else-if="type === 'error'" />
          <Info class="w-5 h-5 text-blue-600 flex-shrink-0" v-else />
          <span class="text-sm font-medium" :class="[
            type === 'success' ? 'text-green-800' : '',
            type === 'error' ? 'text-red-800' : '',
            type === 'info' ? 'text-blue-800' : ''
          ]">{{ message }}</span>
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
</style>