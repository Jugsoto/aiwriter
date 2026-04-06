import { app } from 'electron'
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater'
import { getMainWindow } from '../core/window'
import { logError, logInfo } from '../utils/logger'
import {
  buildAvailableState,
  buildCheckingState,
  buildDownloadedState,
  buildDownloadingState,
  buildErrorState,
  buildNotAvailableState,
  createInitialUpdateState,
  type AppUpdateState,
  type AppUpdateStatus
} from './update-state'

const UPDATE_STATE_CHANNEL = 'app-update:state-changed'
const STARTUP_CHECK_DELAY_MS = 3000
const CHECK_TERMINAL_STATUSES: AppUpdateStatus[] = ['available', 'not-available', 'error']
const DOWNLOAD_TERMINAL_STATUSES: AppUpdateStatus[] = ['downloaded', 'error']
const DEV_UPDATE_MESSAGE = '开发环境不支持自动更新，请使用打包后的应用进行测试。'

interface StateWaiter {
  statuses: Set<AppUpdateStatus>
  resolve: (state: AppUpdateState) => void
}

class UpdateService {
  private state = createInitialUpdateState(app.getVersion())
  private initialized = false
  private waiters: StateWaiter[] = []

  initialize(): void {
    if (this.initialized) {
      return
    }

    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    this.registerListeners()
    this.initialized = true

    if (app.isPackaged) {
      setTimeout(() => {
        void this.checkForUpdates(false)
      }, STARTUP_CHECK_DELAY_MS)
    }
  }

  getState(): AppUpdateState {
    return this.state
  }

  async checkForUpdates(userInitiated = true): Promise<AppUpdateState> {
    this.ensureInitialized()

    if (!app.isPackaged) {
      if (userInitiated) {
        this.updateState(buildErrorState(this.state, DEV_UPDATE_MESSAGE))
      }
      return this.state
    }

    const waitForResult = this.waitForStatuses(CHECK_TERMINAL_STATUSES)
    this.updateState(buildCheckingState(this.state))

    try {
      await autoUpdater.checkForUpdates()
      return waitForResult
    } catch (error) {
      this.handleError('检查更新失败', error)
      return waitForResult
    }
  }

  async downloadUpdate(): Promise<AppUpdateState> {
    this.ensureInitialized()

    if (!app.isPackaged) {
      this.updateState(buildErrorState(this.state, DEV_UPDATE_MESSAGE))
      return this.state
    }

    if (this.state.status === 'downloaded') {
      return this.state
    }

    const waitForResult = this.waitForStatuses(DOWNLOAD_TERMINAL_STATUSES)

    try {
      await autoUpdater.downloadUpdate()
      return waitForResult
    } catch (error) {
      this.handleError('下载更新失败', error)
      return waitForResult
    }
  }

  installUpdate(): AppUpdateState {
    this.ensureInitialized()

    if (this.state.status !== 'downloaded') {
      return this.state
    }

    logInfo('准备安装更新', this.state.availableVersion)
    autoUpdater.quitAndInstall()
    return this.state
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize()
    }
  }

  private registerListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      logInfo('正在检查应用更新')
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      logInfo('发现新版本', info.version)
      this.updateState(buildAvailableState(app.getVersion(), info))
    })

    autoUpdater.on('update-not-available', () => {
      logInfo('当前已是最新版本')
      this.updateState(buildNotAvailableState(app.getVersion()))
    })

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.updateState(buildDownloadingState(this.state, progress))
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      logInfo('更新下载完成', info.version)
      const nextState = this.state.availableVersion
        ? buildDownloadedState(this.state)
        : buildDownloadedState(buildAvailableState(app.getVersion(), info))
      this.updateState(nextState)
    })

    autoUpdater.on('error', (error: Error) => {
      this.handleError('自动更新流程失败', error)
    })
  }

  private handleError(message: string, error: unknown): void {
    logError(message, error)
    const errorMessage = error instanceof Error ? error.message : message
    this.updateState(buildErrorState(this.state, errorMessage))
  }

  private updateState(state: AppUpdateState): void {
    this.state = state
    this.broadcastState()
    this.resolveWaiters(state)
  }

  private broadcastState(): void {
    const mainWindow = getMainWindow()
    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    mainWindow.webContents.send(UPDATE_STATE_CHANNEL, this.state)
  }

  private waitForStatuses(statuses: AppUpdateStatus[]): Promise<AppUpdateState> {
    if (statuses.includes(this.state.status)) {
      return Promise.resolve(this.state)
    }

    return new Promise(resolve => {
      this.waiters.push({
        statuses: new Set(statuses),
        resolve
      })
    })
  }

  private resolveWaiters(state: AppUpdateState): void {
    const pendingWaiters = [...this.waiters]
    this.waiters = []

    for (const waiter of pendingWaiters) {
      if (waiter.statuses.has(state.status)) {
        waiter.resolve(state)
      } else {
        this.waiters.push(waiter)
      }
    }
  }
}

export const updateService = new UpdateService()
export { UPDATE_STATE_CHANNEL }
