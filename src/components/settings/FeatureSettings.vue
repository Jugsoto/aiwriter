<template>
  <div class="flex h-full bg-[var(--bg-primary)]">
    <!-- 左侧功能列表 -->
    <div class="w-60 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-4 flex flex-col">
      <div class="mb-4">
        <h2 class="text-2xl font-semibold text-[var(--text-primary)]">功能配置</h2>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-2">
          <div v-for="featureName in featureNames" :key="featureName" class="relative group">
            <button @click="selectFeature(featureName)" :class="[
              'w-full flex items-center bg-[var(--bg-primary)] px-3 py-3 rounded-xl border border-[var(--border-color)] text-left transition-all duration-200',
              selectedFeatureName === featureName
                ? 'bg-[var(--blue-100)] border-[var(--theme-bg)]'
                : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
            ]">
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ getFeatureDisplayName(featureName) }}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧配置面板 -->
    <div class="flex-1 p-6 overflow-y-auto bg-[var(--bg-secondary)]">
      <!-- 整体配置展示卡片 -->
      <div class="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)] mb-6">
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">当前配置概览</h3>
        <div v-if="selectedFeatureName" class="mb-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
          <div class="text-sm text-[var(--text-secondary)] mb-1">功能描述</div>
          <div class="text-sm text-[var(--text-primary)]">{{ getCurrentFeatureDescription() }}</div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center">
              <img v-if="getCurrentProviderLogo()" :src="getCurrentProviderLogo()" class="w-8 h-8 object-contain"
                alt="Provider Logo">
              <div v-else class="w-8 h-8 bg-[var(--text-secondary)] rounded opacity-30"></div>
            </div>
            <div>
              <div class="text-sm text-[var(--text-secondary)]">供应商</div>
              <div class="font-medium">{{ getCurrentProviderName() || '未配置' }}</div>
            </div>
          </div>
          <div>
            <div class="text-sm text-[var(--text-secondary)]">模型</div>
            <div class="font-medium">{{ getCurrentModelName() || '未配置' }}</div>
          </div>
          <div>
            <div class="text-sm text-[var(--text-secondary)]">温度</div>
            <div class="font-medium">{{ currentConfig.temperature }}</div>
            <div class="text-xs text-[var(--text-secondary)] mt-1">
              推荐值: {{ getFeatureDefaults().temperature }}
            </div>
          </div>
          <div>
            <div class="text-sm text-[var(--text-secondary)]">Top P</div>
            <div class="font-medium">{{ currentConfig.top_p }}</div>
            <div class="text-xs text-[var(--text-secondary)] mt-1">
              推荐值: {{ getFeatureDefaults().top_p }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!selectedFeatureName" class="flex items-center justify-center h-full">
        <div class="text-[var(--text-secondary)] text-center">
          <div class="text-lg mb-2">请选择一个功能</div>
          <div class="text-sm">点击左侧功能列表中的项目来配置参数</div>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div class="space-y-6 bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">
                {{ getFeatureDisplayName(selectedFeatureName) }} - 配置
              </h3>
            </div>

            <!-- 供应商选择 -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                供应商
              </label>
              <select v-model="currentConfig.provider_id" @change="onProviderChange"
                class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] transition-colors">
                <option value="">请选择供应商</option>
                <option v-for="provider in providers" :key="provider.id" :value="provider.id">
                  {{ provider.name }}
                </option>
              </select>
            </div>

            <!-- 模型选择 -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                模型
              </label>
              <select v-model="currentConfig.model_id" :disabled="!currentConfig.provider_id"
                class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] transition-colors disabled:opacity-50">
                <option value="">请选择模型</option>
                <option v-for="model in availableModels" :key="model.id" :value="model.id">
                  {{ model.model }}
                </option>
              </select>
            </div>

            <!-- 温度参数 -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                温度 (Temperature): {{ currentConfig.temperature }}
              </label>
              <input v-model.number="currentConfig.temperature" type="range" min="0" max="2" step="0.1"
                class="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                <span>0.0</span>
                <span>更确定</span>
                <span>2.0</span>
              </div>
            </div>

            <!-- top_p参数 -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Top P: {{ currentConfig.top_p }}
              </label>
              <input v-model.number="currentConfig.top_p" type="range" min="0" max="1" step="0.1"
                class="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                <span>0.0</span>
                <span>更集中</span>
                <span>1.0</span>
              </div>
            </div>

            <div class="flex justify-end mt-6 space-x-3">
              <button @click="resetCurrentConfig"
                class="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--hover-bg)] transition-all duration-200">
                重置
              </button>
              <button @click="saveCurrentConfig" :disabled="!hasConfigChanges || loading"
                class="px-4 py-2 bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                保存配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useFeatureConfigsStore } from '@/stores/featureConfigs'
import { useProvidersStore } from '@/stores/providers'

const featureConfigsStore = useFeatureConfigsStore()
const providersStore = useProvidersStore()

// 当前选中的功能
const selectedFeatureName = ref<string>('')

// 当前编辑的配置
const currentConfig = ref({
  provider_id: 0,
  model_id: 0,
  temperature: 0.7,
  top_p: 1.0
})

// 原始配置（用于比较更改）
const originalConfig = ref({
  provider_id: 0,
  model_id: 0,
  temperature: 0.7,
  top_p: 1.0
})

// 计算属性
const featureNames = computed(() => featureConfigsStore.getAllFeatureNames())
const providers = computed(() => providersStore.providers)
const availableModels = computed(() => providersStore.models)
const loading = computed(() => featureConfigsStore.loading)
const hasConfigChanges = computed(() => {
  return (
    currentConfig.value.provider_id !== originalConfig.value.provider_id ||
    currentConfig.value.model_id !== originalConfig.value.model_id ||
    currentConfig.value.temperature !== originalConfig.value.temperature ||
    currentConfig.value.top_p !== originalConfig.value.top_p
  )
})

// 获取功能显示名称
function getFeatureDisplayName(featureName: string): string {
  return featureConfigsStore.getFeatureDisplayName(featureName)
}

// 获取当前功能描述
function getCurrentFeatureDescription(): string {
  if (!selectedFeatureName.value) return ''
  return featureConfigsStore.getFeatureDescription(selectedFeatureName.value)
}

// 获取当前功能默认参数
function getFeatureDefaults() {
  if (!selectedFeatureName.value) {
    return { temperature: 0.7, top_p: 1.0 }
  }
  return featureConfigsStore.getFeatureDefaults(selectedFeatureName.value)
}

// 获取当前供应商名称
function getCurrentProviderName(): string {
  if (!currentConfig.value.provider_id || currentConfig.value.provider_id === 0) {
    return '未配置'
  }
  const provider = providers.value.find(p => p.id === currentConfig.value.provider_id)
  return provider?.name || '未配置'
}

// 获取当前模型名称
function getCurrentModelName(): string {
  if (!currentConfig.value.model_id || currentConfig.value.model_id === 0) {
    return '未配置'
  }
  const model = availableModels.value.find(m => m.id === currentConfig.value.model_id)
  return model?.model || '未配置'
}

// 获取当前供应商logo
function getCurrentProviderLogo(): string {
  if (!currentConfig.value.provider_id || currentConfig.value.provider_id === 0) {
    return ''
  }

  const provider = providers.value.find(p => p.id === currentConfig.value.provider_id)
  if (!provider) return ''

  // 根据供应商名称返回对应的logo路径
  const logoMap: Record<string, string> = {
    'OpenAI': '/src/assets/providers/openai.png',
    'Claude': '/src/assets/providers/claude.png',
    'Gemini': '/src/assets/providers/gemini.png',
    'Kimi': '/src/assets/providers/kimi.png',
    'DeepSeek': '/src/assets/providers/deepseek.png',
    'Qwen': '/src/assets/providers/qwen.png',
    '智谱AI': '/src/assets/providers/zhipu.png',
    '硅基流动': '/src/assets/providers/siliconflow.png',
    'OpenRouter': '/src/assets/providers/openrouter.png',
    'AiHubMix': '/src/assets/providers/aihubmix.png'
  }

  return logoMap[provider.name] || '/src/assets/providers/other.png'
}

// 选择功能
function selectFeature(featureName: string) {
  selectedFeatureName.value = featureName
  loadCurrentConfig()
}

// 加载当前配置
function loadCurrentConfig() {
  if (!selectedFeatureName.value) return

  try {
    const config = featureConfigsStore.getConfigByFeatureName(selectedFeatureName.value)
    if (config) {
      currentConfig.value = {
        provider_id: config.provider_id,
        model_id: config.model_id,
        temperature: config.temperature,
        top_p: config.top_p
      }
      // 加载对应的模型列表（只有当provider_id不为0时）
      if (config.provider_id && config.provider_id > 0) {
        providersStore.loadModels(config.provider_id)
      }
    } else {
      // 使用默认值
      currentConfig.value = {
        provider_id: 0,
        model_id: 0,
        temperature: 0.7,
        top_p: 0.1
      }
    }
  } catch (error) {
    console.error('Failed to load current config:', error)
    // 使用默认值
    currentConfig.value = {
      provider_id: 0,
      model_id: 0,
      temperature: 0.7,
      top_p: 0.1
    }
  }

  // 保存原始配置
  originalConfig.value = { ...currentConfig.value }
}

// 供应商变更处理
function onProviderChange() {
  if (currentConfig.value.provider_id && currentConfig.value.provider_id > 0) {
    providersStore.loadModels(currentConfig.value.provider_id)
    currentConfig.value.model_id = 0 // 重置模型选择
  } else {
    providersStore.models = []
    currentConfig.value.model_id = 0
  }
}

// 保存当前配置
async function saveCurrentConfig() {
  if (!selectedFeatureName.value) return

  try {
    // 提取纯对象数据，避免发送Vue的ref对象
    const configData = {
      provider_id: currentConfig.value.provider_id,
      model_id: currentConfig.value.model_id,
      temperature: currentConfig.value.temperature,
      top_p: currentConfig.value.top_p
    }
    await featureConfigsStore.updateFeatureConfig(selectedFeatureName.value, configData)
    // 更新原始配置
    originalConfig.value = { ...currentConfig.value }
  } catch (error) {
    console.error('Failed to save feature config:', error)
  }
}

// 重置当前配置
function resetCurrentConfig() {
  loadCurrentConfig()
}


// 监听配置变化
watch(() => featureConfigsStore.configs, () => {
  if (selectedFeatureName.value) {
    loadCurrentConfig()
  }
}, { deep: true })

// 初始化
onMounted(async () => {
  await Promise.all([
    featureConfigsStore.loadFeatureConfigs(),
    providersStore.loadProviders()
  ])

  // 默认选中第一个功能
  if (featureNames.value.length > 0 && !selectedFeatureName.value) {
    selectFeature(featureNames.value[0])
  }
})
</script>