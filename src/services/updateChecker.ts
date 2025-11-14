// 更新检查服务
export interface UpdateInfo {
  version: string
  versionCode: number
  isForced: boolean
  releaseDate: string
  downloadUrl: string
  releaseNotes: string[]
}

export interface Announcement {
  id: number
  title: string
  content: string
  link: string | null
  releaseTime: string
  isPinned: boolean
}

export interface UpdateResponse {
  updateInfo: UpdateInfo
  announcements: Announcement[]
}

export interface VersionInfo {
  version: string
  versionCode: number
}

export class UpdateChecker {
  private static readonly UPDATE_URL = 'https://shenbi.qgming.com/latest.json'
  
  /**
   * 获取本地版本信息
   */
  static async getLocalVersion(): Promise<VersionInfo> {
    try {
      const version = await window.electronAPI.getAppVersion()
      // 从package.json中的版本号解析出版本代码
      // 假设版本格式为 x.y.z，转换为数字 xxx
      const versionParts = version.split('.').map(part => parseInt(part, 10))
      const versionCode = (versionParts[0] || 0) * 100 + (versionParts[1] || 0) * 10 + (versionParts[2] || 0)
      
      return {
        version,
        versionCode
      }
    } catch (error) {
      console.error('获取本地版本失败:', error)
      // 返回默认版本
      return {
        version: '1.0.0',
        versionCode: 100
      }
    }
  }
  
  /**
   * 从远程服务器获取最新版本信息
   */
  static async fetchLatestVersion(): Promise<UpdateResponse | null> {
    try {
      // 添加时间戳参数防止缓存
      const timestamp = new Date().getTime()
      const urlWithTimestamp = `${this.UPDATE_URL}?t=${timestamp}`
      
      const response = await fetch(urlWithTimestamp)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data as UpdateResponse
    } catch (error) {
      console.error('获取最新版本信息失败:', error)
      return null
    }
  }
  
  /**
   * 检查是否有更新
   */
  static async checkForUpdates(): Promise<{
    hasUpdate: boolean
    localVersion: VersionInfo
    remoteVersion: UpdateInfo | null
    announcements: Announcement[]
  }> {
    const localVersion = await this.getLocalVersion()
    const updateData = await this.fetchLatestVersion()

    if (!updateData) {
      return {
        hasUpdate: false,
        localVersion,
        remoteVersion: null,
        announcements: []
      }
    }

    const { updateInfo, announcements } = updateData
    // 只有当远程版本大于本地版本时才认为有更新
    // 当本地版本 >= 远程版本时，认为已是最新版本
    const hasUpdate = updateInfo.versionCode > localVersion.versionCode

    return {
      hasUpdate,
      localVersion,
      remoteVersion: updateInfo,
      announcements
    }
  }
  
  /**
   * 获取置顶公告
   */
  static getPinnedAnnouncements(announcements: Announcement[]): Announcement[] {
    return announcements.filter(announcement => announcement.isPinned)
  }
  
  /**
   * 获取普通公告（非置顶）
   */
  static getRegularAnnouncements(announcements: Announcement[]): Announcement[] {
    return announcements.filter(announcement => !announcement.isPinned)
  }
  
  /**
   * 打开下载链接
   */
  static async openDownloadUrl(url: string): Promise<void> {
    try {
      await window.electronAPI.openExternal(url)
    } catch (error) {
      console.error('打开下载链接失败:', error)
      throw error
    }
  }
}