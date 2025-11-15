<template>
  <div class="flex h-full bg-[var(--bg-secondary)]">
    <!-- 左侧功能列表 -->
    <div class="w-60 bg-[var(--bg-primary)] border-r border-[var(--border-color)] p-4 flex flex-col">
      <div class="mb-4">
        <h2 class="text-2xl font-semibold text-[var(--text-primary)]">功能配置</h2>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-2">
          <div v-for="featureName in featureNames" :key="featureName" class="relative group">
            <button @click="selectFeature(featureName)" :class="[
              'w-full flex items-center bg-[var(--bg-secondary)] px-3 py-3 rounded-xl border border-[var(--border-color)] text-left transition-all duration-200',
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
      <!-- 信息卡片 - 仅当配置已保存时显示 -->
      <div v-if="isConfigSaved" class="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)] mb-6">
        <div class="space-y-4">
          <!-- 第一行：图片和供应商名称 -->
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center">
              <img v-if="getCurrentProviderLogo()" :src="getCurrentProviderLogo()" class="w-8 h-8 object-contain"
                alt="Provider Logo">
              <div v-else class="w-8 h-8 bg-[var(--text-secondary)] rounded opacity-30"></div>
            </div>
            <div class="text-lg font-semibold text-[var(--text-primary)]">
              {{ getCurrentProviderName() }}
            </div>
          </div>

          <!-- 第二行：模型名称 -->
          <div class="text-base text-[var(--text-primary)] font-medium">
            {{ getCurrentModelName() }}
          </div>

          <!-- 第三行：温度参数 -->
          <div class="flex space-x-6 text-sm">
            <div class="flex items-center space-x-2">
              <span class="text-[var(--text-secondary)]">温度:</span>
              <span class="font-medium">{{ currentConfig.temperature }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能说明卡片 -->
      <div v-if="selectedFeatureName"
        class="bg-[var(--bg-primary)] p-5 rounded-xl border border-[var(--border-color)] mb-6">
        <div class="text-sm font-medium text-[var(--text-secondary)] mb-3">功能用途</div>
        <div class="flex flex-wrap gap-2">
          <div v-for="(item, index) in getCurrentFeatureDescription()" :key="index"
            class="inline-flex items-center bg-[var(--bg-secondary)] px-3 py-2 rounded-lg border border-[var(--border-color)]">
            <span class="text-sm text-[var(--text-primary)] whitespace-nowrap">{{ item }}</span>
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
            <!-- 供应商选择 -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                供应商
              </label>
              <select v-model="currentConfig.provider_id" @change="onProviderChange"
                class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] transition-colors">
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
              <select v-model="currentConfig.model_id"
                class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] transition-colors">
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


            <div class="flex justify-end mt-6">
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
  provider_id: 1,
  model_id: 1,
  temperature: 0.7
})

// 原始配置（用于比较更改）
const originalConfig = ref({
  provider_id: 1,
  model_id: 1,
  temperature: 0.7
})

// 配置是否已保存的标志
const isConfigSaved = ref<boolean>(false)

// 计算属性
const featureNames = computed(() => featureConfigsStore.getAllFeatureNames())
const providers = computed(() => providersStore.providers)
const availableModels = computed(() => providersStore.models)
const loading = computed(() => featureConfigsStore.loading)
const hasConfigChanges = computed(() => {
  return (
    currentConfig.value.provider_id !== originalConfig.value.provider_id ||
    currentConfig.value.model_id !== originalConfig.value.model_id ||
    currentConfig.value.temperature !== originalConfig.value.temperature
  )
})

// 获取功能显示名称
function getFeatureDisplayName(featureName: string): string {
  return featureConfigsStore.getFeatureDisplayName(featureName)
}

// 获取当前功能描述
function getCurrentFeatureDescription(): string[] {
  if (!selectedFeatureName.value) return []
  return featureConfigsStore.getFeatureDescription(selectedFeatureName.value)
}

// 获取当前供应商名称
function getCurrentProviderName(): string {
  const provider = providers.value.find(p => p.id === currentConfig.value.provider_id)
  return provider?.name || '未配置'
}

// 获取当前模型名称
function getCurrentModelName(): string {
  const model = availableModels.value.find(m => m.id === currentConfig.value.model_id)
  return model?.model || '未配置'
}

// 获取当前供应商logo - 使用更简洁的语法
function getCurrentProviderLogo(): string {
  const provider = providers.value.find(p => p.id === currentConfig.value.provider_id)
  if (!provider) return ''

  // 使用更简洁的图标映射，参考 ModelSettings.vue 的实现
  const iconMap: Record<string, string> = {
    'OpenAI': 'openai',
    'Claude': 'claude',
    'Kimi': 'kimi',
    'Gemini': 'gemini',
    'DeepSeek': 'deepseek',
    'Qwen': 'qwen',
    '智谱AI': 'zhipu',
    'AiHubMix': 'aihubmix',
    'OpenRouter': 'openrouter',
    '硅基流动': 'siliconflow',
    '神笔AI': 'shenbi'
  }

  const matchedIcon = iconMap[provider.name] || 'other'
  return new URL(`../../assets/providers/${matchedIcon}.png`, import.meta.url).href
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
        temperature: config.temperature
      }
      // 设置已保存标志（数据库初始化时已配置默认供应商和模型）
      isConfigSaved.value = true
      // 加载对应的模型列表
      providersStore.loadModels(config.provider_id)
    } else {
      // 使用默认值（这种情况不应该发生，因为数据库初始化时会创建配置）
      currentConfig.value = {
        provider_id: 1,
        model_id: 1,
        temperature: 0.7
      }
      isConfigSaved.value = true
    }
  } catch (error) {
    console.error('Failed to load current config:', error)
    // 使用默认值
    currentConfig.value = {
      provider_id: 1,
      model_id: 1,
      temperature: 0.7
    }
    isConfigSaved.value = true
  }

  // 保存原始配置
  originalConfig.value = { ...currentConfig.value }
}

// 供应商变更处理
function onProviderChange() {
  providersStore.loadModels(currentConfig.value.provider_id)
  currentConfig.value.model_id = 0 // 重置模型选择
}

// 保存当前配置
async function saveCurrentConfig() {
  if (!selectedFeatureName.value) return

  try {
    // 提取纯对象数据，避免发送Vue的ref对象
    const configData = {
      provider_id: currentConfig.value.provider_id,
      model_id: currentConfig.value.model_id,
      temperature: currentConfig.value.temperature
    }
    await featureConfigsStore.updateFeatureConfig(selectedFeatureName.value, configData)
    // 更新原始配置
    originalConfig.value = { ...currentConfig.value }
    // 设置配置已保存标志
    isConfigSaved.value = true
  } catch (error) {
    console.error('Failed to save feature config:', error)
  }
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

  // 默认选中第一个功能，并立即加载其配置
  if (featureNames.value.length > 0 && !selectedFeatureName.value) {
    selectedFeatureName.value = featureNames.value[0]
    // 立即加载第一个功能的配置数据
    loadCurrentConfig()
  }
})
</script>