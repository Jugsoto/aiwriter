<template>
  <div class=" flex h-full bg-[var(--bg-primary)]">
    <!-- 左侧供应商列表 -->
    <div class="w-60 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-4 flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-semibold text-[var(--text-primary)]">模型供应商</h2>
        <button @click="showProviderModal = true"
          class="w-8 h-8 flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-full border border-[var(--border-color)] hover:bg-primary transition-all duration-200"
          title="添加供应商">
          <Plus class="w-4 h-4" />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-2">
          <div v-for="provider in sortedProviders" :key="provider.id" class="relative group">
            <button @click="selectProvider(provider.id)" :class="[
              'w-full flex items-center bg-[var(--bg-primary)] px-3 py-3 rounded-xl border border-[var(--border-color)] text-left transition-all duration-200',
              providersStore.selectedProviderId === provider.id
                ? ' bg-[var(--blue-100)] border-[var(--theme-bg)]'
                : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
            ]">
              <img :src="getProviderIcon(provider.name)" :alt="provider.name" class="w-6 h-6 mr-3 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ provider.name }}</div>
              </div>
              <!-- 删除按钮 - 仅对非内置供应商显示 -->
              <button v-if="provider.is_builtin === 0" @click.stop="deleteProvider(provider.id)"
                class="ml-2 p-1 text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--bg-hover)] rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                title="删除供应商">
                <X class="w-4 h-4" />
              </button>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 p-6 overflow-y-auto bg-[var(--bg-secondary)]">
      <div v-if="!providersStore.selectedProviderId" class="flex items-center justify-center h-full">
        <div class="text-[var(--text-secondary)] text-center">
          <div class="text-lg mb-2">请选择一个供应商</div>
          <div class="text-sm">点击左侧供应商列表中的项目来管理配置</div>
        </div>
      </div>

      <div v-else class="space-y-6">
        <!-- 供应商配置卡片 -->
        <div class="space-y-6 bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">供应商配置</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  URL
                </label>
                <input v-model="currentProvider.url" type="text"
                  class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] transition-colors" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Key
                </label>
                <input v-model="currentProvider.key" type="password"
                  class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] transition-colors" />
              </div>
            </div>
            <div class="flex justify-end mt-4">
              <button @click="saveProviderConfig" :disabled="!hasConfigChanges || providersStore.loading"
                class="px-4 py-2 bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                保存配置
              </button>
            </div>
          </div>
        </div>

        <!-- 模型管理卡片 -->
        <div class="space-y-6 bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)]">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">模型管理</h3>
              <button @click="showModelModal = true"
                class="w-8 h-8 flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-full border border-[var(--border-color)] hover:bg-primary transition-all duration-200"
                title="添加模型">
                <Plus class="w-4 h-4" />
              </button>
            </div>
            <div class="space-y-3">
              <div v-for="model in sortedModels" :key="model.id"
                class="relative group flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] hover:border-[var(--theme-bg)] transition-colors">
                <div class="flex-1 flex items-center">
                  <div class="font-medium text-[var(--text-primary)]">{{ model.model }}</div>
                  <div v-if="model.tags" class="flex items-center ml-2 space-x-1">
                    <span v-for="tag in parseTags(model.tags)" :key="tag"
                      class="px-2 py-1 text-xs bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-full">
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="deleteModel(model.id)"
                    class="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--bg-hover)] rounded-md transition-colors"
                    title="删除模型">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div v-if="providersStore.models.length === 0" class="text-center py-8 text-[var(--text-secondary)]">
                暂无模型，点击"添加模型"按钮创建
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新的模态窗组件 -->
    <ProviderModelModal v-model:visible="showProviderModal" type="provider" @confirm="handleAddProvider"
      @cancel="showProviderModal = false" />
    <ProviderModelModal v-model:visible="showModelModal" type="model" @confirm="handleAddModel"
      @cancel="showModelModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProvidersStore } from '@/stores/providers'
import ProviderModelModal from '@/components/modal/ProviderModelModal.vue'
import { Plus, X } from 'lucide-vue-next'
import { showConfirm } from '@/composables/useConfirm'
import type { Provider } from '@/electron.d'

const providersStore = useProvidersStore()

// 模态框状态
const showProviderModal = ref(false)
const showModelModal = ref(false)

// 当前编辑的供应商数据
const currentProvider = ref<Partial<Provider>>({
  name: '',
  url: '',
  key: ''
})

// 计算是否有配置更改
const hasConfigChanges = computed(() => {
  if (!providersStore.selectedProviderId) return false
  const original = providersStore.providers.find(p => p.id === providersStore.selectedProviderId)
  if (!original) return false
  return (
    currentProvider.value.url !== original.url ||
    currentProvider.value.key !== original.key
  )
})

// 排序后的供应商列表
const sortedProviders = computed(() => {
  if (!providersStore.providers || providersStore.providers.length === 0) return []
  return [...providersStore.providers].sort((a, b) => a.id - b.id)
})

// 排序后的模型列表
const sortedModels = computed(() => {
  if (!providersStore.models || providersStore.models.length === 0) return []
  return [...providersStore.models].sort((a, b) => {
    return b.id - a.id
  })
})

// 获取供应商图标
const getProviderIcon = (providerName: string): string => {
  // 定义供应商图标映射（直接匹配初始化器中的确切名称）
  const iconMap: Record<string, string> = {
    // 直接匹配初始化器中的供应商名称
    'OpenAI': 'openai',
    'Claude': 'claude',
    'Kimi': 'kimi',
    'Gemini': 'gemini',
    'DeepSeek': 'deepseek',
    'Qwen': 'qwen',
    '智谱AI': 'zhipu',
    'AiHubMix': 'aihubmix',
    'OpenRouter': 'openrouter',
    '硅基流动': 'siliconflow'
  }

  // 直接查找匹配的图标
  const matchedIcon = iconMap[providerName] || 'other'

  // 返回图标路径
  return new URL(`../../assets/providers/${matchedIcon}.png`, import.meta.url).href
}

// 解析标签字符串为数组
const parseTags = (tags: string): string[] => {
  if (!tags) return []
  return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
}

// 选择供应商
function selectProvider(providerId: number) {
  providersStore.selectProvider(providerId)
  const provider = providersStore.providers.find(p => p.id === providerId)

  if (provider) {
    currentProvider.value = {
      name: provider.name,
      url: provider.url || '',
      key: provider.key || ''
    }
  }
}

// 保存供应商配置
async function saveProviderConfig() {
  if (!providersStore.selectedProviderId) return
  try {
    await providersStore.updateProvider(providersStore.selectedProviderId, {
      url: currentProvider.value.url,
      key: currentProvider.value.key
    })
  } catch (error) {
    console.error('Failed to save provider config:', error)
  }
}

// 处理添加供应商（只添加名称）
async function handleAddProvider(data: { name: string }) {
  try {
    // 创建只有名称的供应商，URL和Key在右侧配置
    await providersStore.createProvider({
      name: data.name,
      url: '',  // 空值，用户后续在右侧配置
      key: ''   // 空值，用户后续在右侧配置
    })
    showProviderModal.value = false
  } catch (error) {
    console.error('Failed to add provider:', error)
  }
}

// 删除供应商
async function deleteProvider(id: number) {
  const provider = providersStore.providers.find(p => p.id === id)
  if (!provider) return

  if (provider.is_builtin === 1) {
    alert('内置供应商不能删除')
    return
  }

  const confirmed = await showConfirm({
    title: '删除供应商',
    message: `确定要删除供应商"${provider.name}"吗？`,
    description: '此操作将同时删除该供应商下的所有模型。',
    dangerous: true
  })

  if (!confirmed) return

  try {
    await providersStore.deleteProvider(id)
  } catch (error) {
    console.error('Failed to delete provider:', error)
  }
}

// 处理添加模型（只添加模型名称，不包含标签）
async function handleAddModel(data: { model: string }) {
  if (!providersStore.selectedProviderId) return
  try {
    // 创建只有模型名称的模型，不包含标签
    await providersStore.createModel({
      provider_id: providersStore.selectedProviderId,
      model: data.model,
      tags: ''  // 空标签，不允许用户添加标签
    })
    showModelModal.value = false
  } catch (error) {
    console.error('Failed to add model:', error)
  }
}

// 删除模型
async function deleteModel(id: number) {
  const confirmed = await showConfirm({
    title: '删除模型',
    message: '确定要删除这个模型吗？',
    dangerous: true
  })

  if (!confirmed) return

  try {
    await providersStore.deleteModel(id)
  } catch (error) {
    console.error('Failed to delete model:', error)
  }
}

// 监听供应商数据变化，自动更新当前供应商信息
watch(() => providersStore.selectedProviderId, (newProviderId) => {
  if (newProviderId) {
    const provider = providersStore.providers.find(p => p.id === newProviderId)
    if (provider) {
      currentProvider.value = {
        name: provider.name,
        url: provider.url || '',
        key: provider.key || ''
      }
    }
  }
})

// 监听供应商列表变化
watch(() => providersStore.providers, (newProviders) => {
  if (providersStore.selectedProviderId) {
    const provider = newProviders.find(p => p.id === providersStore.selectedProviderId)
    if (provider) {
      currentProvider.value = {
        name: provider.name,
        url: provider.url || '',
        key: provider.key || ''
      }
    }
  }
}, { deep: true })

// 初始化
onMounted(async () => {
  await providersStore.loadProviders()

  // 默认选中第一个供应商
  if (providersStore.providers.length > 0 && !providersStore.selectedProviderId) {
    const firstProvider = providersStore.providers[0]
    providersStore.selectProvider(firstProvider.id)
    // 立即更新当前供应商数据
    currentProvider.value = {
      name: firstProvider.name,
      url: firstProvider.url || '',
      key: firstProvider.key || ''
    }
  }
})
</script>