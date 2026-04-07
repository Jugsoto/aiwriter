const { contextBridge, ipcRenderer } = require('electron')

const api = {
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

  // 书籍相关API
  getBooks: () => ipcRenderer.invoke('get-books'),
  createBook: (data: { name: string }) => ipcRenderer.invoke('create-book', data),
  updateBook: (id: number, data: { name?: string; global_settings?: string }) => ipcRenderer.invoke('update-book', id, data),
  deleteBook: (id: number) => ipcRenderer.invoke('delete-book', id),

  // 书籍导入导出API
  exportBook: (bookId: number) => ipcRenderer.invoke('export-book', bookId),
  importBook: () => ipcRenderer.invoke('import-book'),

  // 章节相关API
  getChapters: (bookId: number) => ipcRenderer.invoke('get-chapters', bookId),
  getChapter: (id: number) => ipcRenderer.invoke('get-chapter', id),
  createChapter: (data: { book_id: number; title: string; content?: string; summary?: string; order_index?: number }) => ipcRenderer.invoke('create-chapter', data),
  updateChapter: (id: number, data: { title?: string; content?: string; summary?: string; review_data?: string; order_index?: number }) => ipcRenderer.invoke('update-chapter', id, data),
  updateChapterOrder: (id: number, orderIndex: number) => ipcRenderer.invoke('update-chapter-order', id, orderIndex),
  deleteChapter: (id: number) => ipcRenderer.invoke('delete-chapter', id),

  // 设定相关API
  getSettings: (bookId: number) => ipcRenderer.invoke('get-settings', bookId),
  getSettingsByType: (bookId: number, type: string) => ipcRenderer.invoke('get-settings-by-type', bookId, type),
  getSetting: (id: number) => ipcRenderer.invoke('get-setting', id),
  createSetting: (data: { book_id: number; type: string; name: string; content?: string; status?: string; starred?: boolean }) => ipcRenderer.invoke('create-setting', data),
  updateSetting: (id: number, data: { type?: string; name?: string; content?: string; status?: string; starred?: boolean }) => ipcRenderer.invoke('update-setting', id, data),
  deleteSetting: (id: number) => ipcRenderer.invoke('delete-setting', id),
  toggleSettingStar: (id: number) => ipcRenderer.invoke('toggle-setting-star', id),

  // 资料库相关API
  getReferences: (bookId: number) => ipcRenderer.invoke('get-references', bookId),
  getReference: (id: number) => ipcRenderer.invoke('get-reference', id),
  createReference: (data: { book_id: number; title: string; content: string; file_type?: string; source_type?: 'manual' | 'import' | 'chapter'; source_path?: string; tags?: string[]; starred?: boolean; metadata?: Record<string, any> }) => ipcRenderer.invoke('create-reference', data),
  updateReference: (id: number, data: { title?: string; content?: string; file_type?: string; source_type?: 'manual' | 'import' | 'chapter'; source_path?: string; tags?: string[]; starred?: boolean; metadata?: Record<string, any> }) => ipcRenderer.invoke('update-reference', id, data),
  deleteReference: (id: number) => ipcRenderer.invoke('delete-reference', id),
  toggleReferenceStar: (id: number) => ipcRenderer.invoke('toggle-reference-star', id),
  searchReferences: (bookId: number, query: string, fileType?: string, starredOnly?: boolean) => ipcRenderer.invoke('search-references', bookId, query, fileType, starredOnly),
  batchCreateReferences: (references: Array<{ book_id: number; title: string; content: string; file_type?: string; source_type?: 'manual' | 'import' | 'chapter'; source_path?: string; tags?: string[]; starred?: boolean; metadata?: Record<string, any> }>) => ipcRenderer.invoke('batch-create-references', references),

  // 供应商相关API
  getProviders: () => ipcRenderer.invoke('get-providers'),
  getProvider: (id: number) => ipcRenderer.invoke('get-provider', id),
  createProvider: (data: { name: string; url: string; key: string; is_builtin?: number }) => ipcRenderer.invoke('create-provider', data),
  updateProvider: (id: number, data: { name?: string; url?: string; key?: string; is_builtin?: number }) => ipcRenderer.invoke('update-provider', id, data),
  deleteProvider: (id: number) => ipcRenderer.invoke('delete-provider', id),

  // 模型相关API
  getModels: (providerId: number) => ipcRenderer.invoke('get-models', providerId),
  getModel: (id: number) => ipcRenderer.invoke('get-model', id),
  createModel: (data: { provider_id: number; model: string; tags?: string }) => ipcRenderer.invoke('create-model', data),
  updateModel: (id: number, data: { provider_id?: number; model?: string; tags?: string }) => ipcRenderer.invoke('update-model', id, data),
  deleteModel: (id: number) => ipcRenderer.invoke('delete-model', id),

  // 数据设置相关API
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),
  getFileSize: (filePath: string) => ipcRenderer.invoke('get-file-size', filePath),
  getFolderSize: (folderPath: string) => ipcRenderer.invoke('get-folder-size', folderPath),
  resetData: () => ipcRenderer.invoke('reset-data'),
  backupData: () => ipcRenderer.invoke('backup-data'),
  restoreData: () => ipcRenderer.invoke('restore-data'),

  // 功能配置相关API
  getFeatureConfigs: () => ipcRenderer.invoke('get-feature-configs'),
  updateFeatureConfig: (featureName: string, data: { provider_id?: number; model_id?: number; temperature?: number }) =>
    ipcRenderer.invoke('update-feature-config', featureName, data),

  // 用量统计相关API
  createUsageStatistic: (data: { provider_id: number; model_id: number; feature_name: string; mode: string; input_tokens?: number; output_tokens?: number; total_tokens?: number }) =>
    ipcRenderer.invoke('create-usage-statistic', data),
  getUsageStatistics: () => ipcRenderer.invoke('get-usage-statistics'),
  getUsageStatisticsByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('get-usage-statistics-by-date-range', startDate, endDate),
  getUsageStatisticsByProvider: (providerId: number) => ipcRenderer.invoke('get-usage-statistics-by-provider', providerId),
  getUsageStatisticsByModel: (modelId: number) => ipcRenderer.invoke('get-usage-statistics-by-model', modelId),
  getUsageStatisticsSummary: () => ipcRenderer.invoke('get-usage-statistics-summary'),

  // 章节向量相关API
  createChapterVector: (data: { book_id: number; chapter_id: number; chunk_index: number; chunk_text: string; embedding: Buffer; token_count: number }) =>
    ipcRenderer.invoke('create-chapter-vector', data),
  getChapterVectorsByBookId: (bookId: number) => ipcRenderer.invoke('get-chapter-vectors-by-book-id', bookId),
  getChapterVectorsByChapterId: (chapterId: number) => ipcRenderer.invoke('get-chapter-vectors-by-chapter-id', chapterId),
  deleteChapterVectorsByChapterId: (chapterId: number) => ipcRenderer.invoke('delete-chapter-vectors-by-chapter-id', chapterId),
  deleteChapterVectorsByBookId: (bookId: number) => ipcRenderer.invoke('delete-chapter-vectors-by-book-id', bookId),
  searchSimilarChapterVectors: (bookId: number, queryEmbedding: Uint8Array, limit: number, excludeChapterId?: number) =>
    ipcRenderer.invoke('search-similar-chapter-vectors', bookId, queryEmbedding, limit, excludeChapterId),

  // 设定向量相关API
  createSettingVector: (data: { book_id: number; setting_id: number; setting_content: string; embedding: Uint8Array; token_count: number }) =>
    ipcRenderer.invoke('create-setting-vector', data),
  getSettingVectorBySettingId: (settingId: number) => ipcRenderer.invoke('get-setting-vector-by-setting-id', settingId),
  getSettingVectorsByBookId: (bookId: number) => ipcRenderer.invoke('get-setting-vectors-by-book-id', bookId),
  updateSettingVector: (settingId: number, data: { setting_content?: string; embedding?: Uint8Array; token_count?: number }) =>
    ipcRenderer.invoke('update-setting-vector', settingId, data),
  deleteSettingVectorBySettingId: (settingId: number) => ipcRenderer.invoke('delete-setting-vector-by-setting-id', settingId),
  deleteSettingVectorsByBookId: (bookId: number) => ipcRenderer.invoke('delete-setting-vectors-by-book-id', bookId),
  searchSimilarSettingVectors: (bookId: number, queryEmbedding: Uint8Array, limit: number) =>
    ipcRenderer.invoke('search-similar-setting-vectors', bookId, queryEmbedding, limit),

  // 提示词相关API
  getPrompts: () => ipcRenderer.invoke('get-prompts'),
  getPromptsByCategory: (category: string) => ipcRenderer.invoke('get-prompts-by-category', category),
  getPrompt: (id: number) => ipcRenderer.invoke('get-prompt', id),
  createPrompt: (data: { name: string; content: string; category: string; is_default?: number; description?: string; author?: string; version?: string; url?: string }) => ipcRenderer.invoke('create-prompt', data),
  updatePrompt: (id: number, data: { name?: string; content?: string; category?: string; is_default?: number; description?: string; author?: string; version?: string; url?: string }) => ipcRenderer.invoke('update-prompt', id, data),
  deletePrompt: (id: number) => ipcRenderer.invoke('delete-prompt', id),
  getPromptSelection: (category: string) => ipcRenderer.invoke('get-prompt-selection', category),
  getAllPromptSelections: () => ipcRenderer.invoke('get-all-prompt-selections'),
  setPromptSelection: (data: { category: string; prompt_id: number }) => ipcRenderer.invoke('set-prompt-selection', data),
  deletePromptSelection: (category: string) => ipcRenderer.invoke('delete-prompt-selection', category),
  getDefaultPromptByCategory: (category: string) => ipcRenderer.invoke('get-default-prompt-by-category', category),
  getSelectedPromptByCategory: (category: string) => ipcRenderer.invoke('get-selected-prompt-by-category', category),
  setDefaultPromptForCategory: (category: string, promptId: number) => ipcRenderer.invoke('set-default-prompt-for-category', category, promptId),

  // 应用信息相关API
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppUpdateState: () => ipcRenderer.invoke('app-update:get-state'),
  checkForAppUpdates: () => ipcRenderer.invoke('app-update:check'),
  downloadAppUpdate: () => ipcRenderer.invoke('app-update:download'),
  installAppUpdate: () => ipcRenderer.invoke('app-update:install'),
  onAppUpdateStateChanged: (callback: (state: any) => void) => {
    const listener = (_event: unknown, state: any) => callback(state)
    ipcRenderer.on('app-update:state-changed', listener)
    return () => ipcRenderer.removeListener('app-update:state-changed', listener)
  },
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // 文件操作相关API
  showOpenDialog: (options: { title?: string; filters?: Array<{ name: string; extensions: string[] }>; properties?: string[] }) => ipcRenderer.invoke('show-open-dialog', options),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),

  // 排行榜相关API
  fetchLeaderboard: (params: { gender: 0 | 1; type: 1 | 2; categoryId: number; offset: number; limit: number }) =>
    ipcRenderer.invoke('leaderboard:fetch', params)
}

contextBridge.exposeInMainWorld('electronAPI', api)
