import { ipcMain } from 'electron'
import { registerBookHandlers } from './book-handlers'
import { registerChapterHandlers } from './chapter-handlers'
import { registerSettingHandlers } from './setting-handlers'
import { registerProviderHandlers } from './provider-handlers'
import { registerModelHandlers } from './model-handlers'
import { registerPromptHandlers } from './prompt-handlers'
import { registerUsageHandlers } from './usage-handlers'
import { registerSystemHandlers } from './system-handlers'
import { registerWindowHandlers } from './window-handlers'
import { registerLeaderboardHandlers } from './leaderboard-handlers'

/**
 * 注册所有IPC处理器
 */
export function registerAllHandlers(): void {
  console.log('Registering IPC handlers...')

  // 注册各种业务处理器
  registerBookHandlers()
  registerChapterHandlers()
  registerSettingHandlers()
  registerProviderHandlers()
  registerModelHandlers()
  registerPromptHandlers()
  registerUsageHandlers()
  registerSystemHandlers()
  registerWindowHandlers()
  registerLeaderboardHandlers()

  console.log('All IPC handlers registered successfully')
}

/**
 * 移除所有IPC处理器
 */
export function removeAllHandlers(): void {
  console.log('Removing all IPC handlers...')

  // Electron 20+ 方式：移除所有处理器
  ipcMain.removeAllListeners()

  console.log('All IPC handlers removed successfully')
}