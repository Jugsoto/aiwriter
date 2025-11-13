import { defineStore } from 'pinia'
import { ref } from 'vue'
import { UpdateChecker, type UpdateInfo as RemoteUpdateInfo, type Announcement } from '@/services/updateChecker'

export interface UpdateInfo {
  hasUpdate: boolean
  latestVersion: string
  currentVersion: string
  downloadUrl: string
  releaseNotes: string[]
  isForced: boolean
}

export const useUpdateStore = defineStore('update', () => {
  const updateInfo = ref<UpdateInfo>({
    hasUpdate: false,
    latestVersion: '',
    currentVersion: '',
    downloadUrl: '',
    releaseNotes: [],
    isForced: false
  })

  const announcements = ref<Announcement[]>([])
  const isChecking = ref(false)

  /**
   * 检查更新
   */
  const checkForUpdates = async () => {
    try {
      isChecking.value = true

      // 使用 UpdateChecker 服务检查更新
      const result = await UpdateChecker.checkForUpdates()

      if (result.hasUpdate && result.remoteVersion) {
        updateInfo.value = {
          hasUpdate: true,
          latestVersion: result.remoteVersion.version,
          currentVersion: result.localVersion.version,
          downloadUrl: result.remoteVersion.downloadUrl,
          releaseNotes: result.remoteVersion.releaseNotes,
          isForced: result.remoteVersion.isForced
        }
      } else {
        updateInfo.value = {
          hasUpdate: false,
          latestVersion: result.localVersion.version,
          currentVersion: result.localVersion.version,
          downloadUrl: '',
          releaseNotes: [],
          isForced: false
        }
      }

      announcements.value = result.announcements

      return updateInfo.value
    } catch (error) {
      console.error('检查更新失败:', error)
      return null
    } finally {
      isChecking.value = false
    }
  }

  /**
   * 打开下载页面
   */
  const openDownloadPage = async () => {
    if (updateInfo.value.downloadUrl) {
      await UpdateChecker.openDownloadUrl(updateInfo.value.downloadUrl)
    }
  }

  /**
   * 清除更新信息
   */
  const clearUpdateInfo = () => {
    updateInfo.value = {
      hasUpdate: false,
      latestVersion: '',
      currentVersion: '',
      downloadUrl: '',
      releaseNotes: [],
      isForced: false
    }
    announcements.value = []
  }

  return {
    updateInfo,
    announcements,
    isChecking,
    checkForUpdates,
    openDownloadPage,
    clearUpdateInfo
  }
})
