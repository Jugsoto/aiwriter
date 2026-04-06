import { deleteProvider, getAllProviders } from '../database'
import { ensureDefaultFeatureConfigs } from './provider-init'

const DEPRECATED_PROVIDER_NAMES = ['神笔AI']

export function cleanupDeprecatedProviders(): void {
  try {
    const deprecatedProviders = getAllProviders().filter(provider =>
      DEPRECATED_PROVIDER_NAMES.includes(provider.name)
    )

    if (deprecatedProviders.length === 0) {
      return
    }

    for (const provider of deprecatedProviders) {
      deleteProvider(provider.id)
      console.log(`已移除停服供应商: ${provider.name}`)
    }

    ensureDefaultFeatureConfigs()
    console.log('停服供应商清理完成，已补齐默认功能配置')
  } catch (error) {
    console.error('清理停服供应商失败:', error)
  }
}