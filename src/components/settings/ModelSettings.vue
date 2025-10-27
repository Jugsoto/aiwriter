<template>
  <div class=" flex h-full bg-[var(--bg-secondary)]">
    <!-- 左侧供应商列表 -->
    <div class="w-60 bg-[var(--bg-primary)] border-r border-[var(--border-color)] p-4 flex flex-col">
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
              'w-full flex items-center bg-[var(--bg-secondary)] px-3 py-3 rounded-xl border border-[var(--border-color)] text-left transition-all duration-200',
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
        <!-- 特殊供应商卡片 - 神笔AI、硅基流动、Deepseek -->
        <div v-if="isSpecialProvider"
          class="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-color)] relative">
          <!-- 问号图标 - 右上角 -->
          <button @click="showInfoModal = true"
            class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full border border-[var(--border-color)] hover:bg-[var(--hover-bg)] hover:text-[var(--theme-bg)] transition-all duration-200"
            title="查看介绍">
            <HelpCircle class="w-4 h-4" />
          </button>
          <div class="flex flex-col items-center text-center">
            <!-- Logo -->
            <img :src="getProviderIcon(currentProvider.name)" :alt="currentProvider.name" class="w-12 h-12 mb-1" />
            <!-- 供应商名称 -->
            <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">{{ currentProvider.name }}</h3>
            <!-- 操作按钮区域 -->
            <div class="flex space-x-4">
              <button @click="openOfficialWebsite"
                class="px-4 py-1 bg-[var(--bg-secondary)] text-[var(--theme-bg)] rounded-full border border-[var(--theme-bg)] hover:bg-[var(--theme-bg)] hover:text-white transition-all duration-200">
                官网注册
              </button>
              <button @click="openRechargePage"
                class="px-4 py-1 bg-[var(--bg-secondary)] text-[var(--theme-bg)] rounded-full border border-[var(--theme-bg)] hover:bg-[var(--theme-bg)] hover:text-white transition-all duration-200">
                余额充值
              </button>
            </div>
          </div>
        </div>

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
                <div class="relative">
                  <input v-model="currentProvider.key" :type="showKey ? 'text' : 'password'"
                    class="w-full px-3 py-2 pr-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-bg)] transition-colors" />
                  <button type="button" @click="showKey = !showKey"
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--theme-bg)] transition-colors"
                    title="显示/隐藏密钥">
                    <Eye v-if="!showKey" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div class="flex justify-end mt-4 space-x-3">
              <button @click="showTestModelModal = true" :disabled="!currentProvider.url || !currentProvider.key"
                class="px-4 py-1 border border-green-700 bg-[var(--bg-secondary)] text-green-700 rounded-full hover:bg-green-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                测试连接
              </button>
              <button @click="saveProviderConfig" :disabled="!hasConfigChanges || providersStore.loading"
                class="px-4 py-1 border border-[var(--theme-bg)] bg-[var(--bg-secondary)] text-[var(--theme-bg)] rounded-full hover:bg-[var(--theme-bg)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
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
              <div class="flex items-center space-x-2">
                <button @click="fetchModelsFromService"
                  class="px-3 py-2 text-sm bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-full border border-[var(--border-color)] hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-8 flex items-center"
                  title="获取模型" :disabled="!currentProvider.url || providersStore.loading">
                  获取模型
                </button>
                <button @click="showModelModal = true"
                  class="w-8 h-8 flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-text)] rounded-full border border-[var(--border-color)] hover:bg-primary transition-all duration-200"
                  title="添加模型">
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div class="space-y-3">
              <div v-for="model in sortedModels" :key="model.id"
                class="relative group flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] hover:border-[var(--theme-bg)] transition-colors">
                <div class="flex-1 flex items-center">
                  <div class="font-medium text-[var(--text-primary)]">{{ model.model }}</div>
                  <div v-if="model.tags" class="flex items-center ml-2 space-x-1">
                    <div v-for="tag in parseTags(model.tags)" :key="tag"
                      class="flex items-center px-2 py-1 text-xs border rounded-full"
                      :class="getTagConfig(tag).color">
                      <component :is="getTagConfig(tag).icon" class="w-3 h-3 mr-1" />
                      {{ getTagConfig(tag).label }}
                    </div>
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

    <!-- 模型选择模态框 -->
    <ModelSelectionModal v-model:visible="showTestModelModal" :models="sortedModels" @select="handleModelSelection" />

    <!-- 获取模型模态框 -->
    <FetchModelsModal v-model:visible="showFetchModelsModal" :models="fetchedModels" :existing-models="sortedModels"
      @add-model="addFetchedModel" @remove-model="removeFetchedModel" @close="showFetchModelsModal = false" />

    <!-- 信息模态框 -->
    <InfoModal v-model:visible="showInfoModal" :title="getInfoModalTitle()" :message="getInfoModalMessage()"
      @close="showInfoModal = false" />

    <!-- Toast提示 -->
    <Toast v-model:visible="toastVisible" :message="toastMessage" :type="toastType"
      :duration="toastType === 'info' ? 0 : 2000" />

    <!-- 错误模态框 -->
    <ErrorModal v-model:visible="errorModalVisible" :message="errorModalMessage" :error-details="errorModalDetails"
      @close="errorModalVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProvidersStore } from '@/stores/providers'
import { useToast } from '@/composables'
import ProviderModelModal from '@/components/modal/ProviderModelModal.vue'
import ModelSelectionModal from '@/components/modal/ModelSelectionModal.vue'
import FetchModelsModal from '@/components/modal/FetchModelsModal.vue'
import Toast from '@/components/shared/Toast.vue'
import ErrorModal from '@/components/shared/ErrorModal.vue'
import InfoModal from '@/components/shared/InfoModal.vue'
import { Plus, X, HelpCircle, Brain, Eye, EyeOff, Zap, Database, Layers, Gift } from 'lucide-vue-next'
import { showConfirm } from '@/composables/useConfirm'
import { testConnection } from '@/services/testConnection'
import { fetchModelsFromService as fetchModelsService } from '@/services/fetchModels'
import type { Provider } from '@/electron.d'
import type { Model } from '@/electron.d'

const providersStore = useProvidersStore()
const { toastVisible, toastMessage, toastType, showToast, hideToast } = useToast()

// 模态框状态
const showProviderModal = ref(false)
const showModelModal = ref(false)
const showTestModelModal = ref(false)
const showFetchModelsModal = ref(false)
const showInfoModal = ref(false)

// 错误模态框状态
const errorModalVisible = ref(false)
const errorModalMessage = ref('')
const errorModalDetails = ref('')

// 获取的模型列表
const fetchedModels = ref<string[]>([])

// 密钥显示状态
const showKey = ref(false)

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

// 计算是否为特殊供应商（神笔AI、硅基流动、Deepseek）
const isSpecialProvider = computed(() => {
  if (!currentProvider.value.name) return false
  const specialProviders = ['神笔AI', '硅基流动', 'DeepSeek']
  return specialProviders.includes(currentProvider.value.name)
})

// 获取特殊供应商的官网链接
const getOfficialWebsiteUrl = (providerName: string): string => {
  const urlMap: Record<string, string> = {
    '神笔AI': 'https://ai.qgming.com/',
    '硅基流动': 'https://cloud.siliconflow.cn/i/BT2o4ohd',
    'DeepSeek': 'https://platform.deepseek.com/'
  }
  return urlMap[providerName] || '#'
}

// 获取特殊供应商的充值链接
const getRechargeUrl = (providerName: string): string => {
  const urlMap: Record<string, string> = {
    '神笔AI': 'https://ai.qgming.com/console/topup',
    '硅基流动': 'https://cloud.siliconflow.cn/me/expensebill',
    'DeepSeek': 'https://platform.deepseek.com/top_up'
  }
  return urlMap[providerName] || '#'
}

// 打开官网注册页面
const openOfficialWebsite = () => {
  if (!currentProvider.value.name) return
  const url = getOfficialWebsiteUrl(currentProvider.value.name)
  if (url !== '#') {
    window.electronAPI.openExternal(url)
  }
}

// 打开余额充值页面
const openRechargePage = () => {
  if (!currentProvider.value.name) return
  const url = getRechargeUrl(currentProvider.value.name)
  if (url !== '#') {
    window.electronAPI.openExternal(url)
  }
}

// 获取信息模态窗标题
const getInfoModalTitle = (): string => {
  if (!currentProvider.value.name) return '供应商介绍'
  return `${currentProvider.value.name} - 介绍`
}

// 获取信息模态窗内容
const getInfoModalMessage = (): string => {
  if (!currentProvider.value.name) return '暂无介绍信息'

  const infoMap: Record<string, string> = {
    '神笔AI': '神笔AI是专为神笔写作开发的AI模型服务平台，支持软件所需的所有全球顶尖AI模型，提供稳定的Gemini-2.5系列模型服务，对比官网节省80%，为用户提供高性价比高质量的AI服务。',
    '硅基流动': '硅基流动是一个专业的AI模型服务平台，支持Qwen、Deepseek、Kimi等国内开源模型，提供稳定可靠的AI模型调用服务，支持多种应用场景。',
    'DeepSeek': 'DeepSeek是深度求索公司开发的AI模型平台，官方API直供，稳定性高，速度快，提供强大的语言模型服务，支持多种自然语言处理任务。'
  }

  return infoMap[currentProvider.value.name] || `${currentProvider.value.name}是一个AI模型服务供应商，为用户提供优质的AI模型调用服务。`
}

// 获取供应商图标（处理undefined情况）
const getProviderIcon = (providerName: string | undefined): string => {
  if (!providerName) return new URL('../../assets/providers/other.png', import.meta.url).href
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
    '硅基流动': 'siliconflow',
    '神笔AI': 'shenbi'
  }

  // 直接查找匹配的图标
  const matchedIcon = iconMap[providerName] || 'other'

  // 返回图标路径
  return new URL(`../../assets/providers/${matchedIcon}.png`, import.meta.url).href
}

// 标签配置映射
const tagConfig = {
  tool: {
    icon: Zap,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    label: '工具'
  },
  think: {
    icon: Brain,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    label: '思考'
  },
  embedding: {
    icon: Database,
    color: 'bg-green-100 text-green-700 border-green-200',
    label: '嵌入'
  },
  eye: {
    icon: Eye,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    label: '视觉'
  },
  free: {
    icon: Gift,
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    label: '免费'
  },
  reranker: {
    icon: Layers,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    label: '重排'
  }
}

// 解析标签字符串为数组
const parseTags = (tags: string): string[] => {
  if (!tags) return []
  return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
}

// 获取标签配置
const getTagConfig = (tag: string) => {
  return tagConfig[tag as keyof typeof tagConfig] || {
    icon: Zap,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    label: tag
  }
}

// 选择供应商
function selectProvider(providerId: number) {
  try {
    providersStore.selectProvider(providerId)
    const provider = providersStore.providers.find(p => p.id === providerId)

    if (provider) {
      currentProvider.value = {
        name: provider.name,
        url: provider.url || '',
        key: provider.key || ''
      }
    }
  } catch (error) {
    console.error('Error selecting provider:', error)
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


// 显示错误模态框
const showErrorModal = (message: string, details?: string) => {
  errorModalMessage.value = message
  errorModalDetails.value = details || ''
  errorModalVisible.value = true
}

// 处理模型选择（从模态窗）
const handleModelSelection = (model: Model) => {
  handleTestConnection(model.model)
}

// 处理测试连接
const handleTestConnection = async (modelName: string) => {
  if (!providersStore.selectedProviderId || !currentProvider.value.url || !currentProvider.value.key) {
    showErrorModal('请先配置供应商的URL和Key')
    return
  }

  const provider = providersStore.providers.find(p => p.id === providersStore.selectedProviderId)
  if (!provider) {
    showErrorModal('供应商不存在')
    return
  }

  // 显示持续Toast提示
  showToast({
    message: '正在测试连接...',
    type: 'info',
    duration: 0 // duration为0表示不自动隐藏
  })

  try {
    const result = await testConnection(provider as Provider, modelName)


    if (result.success) {
      hideToast() // 关闭持续显示的Toast
      showToast({
        message: '连接成功',
        type: 'success'
      })
    } else {
      hideToast() // 关闭持续显示的Toast
      showErrorModal(result.message, result.error)
    }
  } catch (error) {
    hideToast() // 关闭持续显示的Toast
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    showErrorModal('测试连接失败', errorMessage)
  }
}

// 获取模型服务
const fetchModelsFromService = async () => {
  if (!providersStore.selectedProviderId || !currentProvider.value.url) {
    showErrorModal('请先配置供应商的URL')
    return
  }

  const provider = providersStore.providers.find(p => p.id === providersStore.selectedProviderId)
  if (!provider) {
    showErrorModal('供应商不存在')
    return
  }

  // 显示持续Toast提示
  showToast({
    message: '正在获取模型列表...',
    type: 'info',
    duration: 0
  })

  try {
    const result = await fetchModelsService(currentProvider.value.url, currentProvider.value.key || '')

    if (result.success) {
      hideToast() // 关闭持续显示的Toast
      fetchedModels.value = result.models
      showFetchModelsModal.value = true
    } else {
      hideToast() // 关闭持续显示的Toast
      throw new Error(result.error || '获取模型列表失败')
    }
  } catch (error) {
    hideToast() // 关闭持续显示的Toast
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    showErrorModal('获取模型列表失败', errorMessage)
  }
}

// 添加获取的模型
const addFetchedModel = async (modelName: string) => {
  if (!providersStore.selectedProviderId) return

  try {
    await providersStore.createModel({
      provider_id: providersStore.selectedProviderId,
      model: modelName,
      tags: ''
    })
  } catch (error) {
    console.error('Failed to add fetched model:', error)
    showErrorModal('添加模型失败', error instanceof Error ? error.message : '未知错误')
  }
}

// 移除获取的模型
const removeFetchedModel = async (modelName: string) => {
  if (!providersStore.selectedProviderId) return

  // 找到要删除的模型
  const modelToDelete = providersStore.models.find(
    model => model.model === modelName && model.provider_id === providersStore.selectedProviderId
  )

  if (!modelToDelete) {
    showErrorModal('未找到要删除的模型')
    return
  }

  try {
    await providersStore.deleteModel(modelToDelete.id)
  } catch (error) {
    console.error('Failed to remove fetched model:', error)
    showErrorModal('删除模型失败', error instanceof Error ? error.message : '未知错误')
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

  // 默认选中id最小的供应商（最顶部的第一个）
  if (providersStore.providers.length > 0 && !providersStore.selectedProviderId) {
    // 按id升序排序，选择id最小的供应商
    const sortedProviders = [...providersStore.providers].sort((a, b) => a.id - b.id)
    const firstProvider = sortedProviders[0]
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