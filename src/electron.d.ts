declare global {
  interface Window {
    electronAPI: {
      // 窗口控制
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      
      // 书籍相关API
      getBooks: () => Promise<Book[]>
      createBook: (data: { name: string }) => Promise<Book>
      updateBook: (id: number, data: { name?: string; global_settings?: string }) => Promise<Book>
      deleteBook: (id: number) => Promise<{ success: boolean }>
      
      // 章节相关API
      getChapters: (bookId: number) => Promise<Chapter[]>
      getChapter: (id: number) => Promise<Chapter | undefined>
      createChapter: (data: { book_id: number; title: string; content?: string; summary?: string; order_index?: number }) => Promise<Chapter>
      updateChapter: (id: number, data: { title?: string; content?: string; summary?: string; order_index?: number }) => Promise<Chapter>
      updateChapterOrder: (id: number, orderIndex: number) => Promise<Chapter>
      deleteChapter: (id: number) => Promise<{ success: boolean }>
      
      // 设定相关API
      getSettings: (bookId: number) => Promise<Setting[]>
      getSettingsByType: (bookId: number, type: string) => Promise<Setting[]>
      getSetting: (id: number) => Promise<Setting | undefined>
      createSetting: (data: { book_id: number; type: string; name: string; content?: string; status?: string; starred?: boolean }) => Promise<Setting>
      updateSetting: (id: number, data: { type?: string; name?: string; content?: string; status?: string; starred?: boolean }) => Promise<Setting>
      deleteSetting: (id: number) => Promise<{ success: boolean }>
      toggleSettingStar: (id: number) => Promise<Setting>
      
      // 供应商相关API
      getProviders: () => Promise<Provider[]>
      getProvider: (id: number) => Promise<Provider | undefined>
      createProvider: (data: { name: string; url: string; key: string; is_builtin?: number }) => Promise<Provider>
      updateProvider: (id: number, data: { name?: string; url?: string; key?: string; is_builtin?: number }) => Promise<Provider>
      deleteProvider: (id: number) => Promise<{ success: boolean }>
      
      // 模型相关API
      getModels: (providerId: number) => Promise<Model[]>
      getModel: (id: number) => Promise<Model | undefined>
      createModel: (data: { provider_id: number; model: string; tags?: string }) => Promise<Model>
      updateModel: (id: number, data: { provider_id?: number; model?: string; tags?: string }) => Promise<Model>
      deleteModel: (id: number) => Promise<{ success: boolean }>
      
      // 数据设置相关API
      getAppDataPath: () => Promise<string>
      openFolder: (folderPath: string) => Promise<{ success: boolean }>
      getFileSize: (filePath: string) => Promise<{ size: number; success: boolean }>
      getFolderSize: (folderPath: string) => Promise<{ size: number; success: boolean }>
      resetData: () => Promise<{ success: boolean; error?: string }>
      backupData: () => Promise<{ success: boolean; backupPath?: string; error?: string }>
      restoreData: () => Promise<{ success: boolean; error?: string }>
      
      // 功能配置相关API
      getFeatureConfigs: () => Promise<FeatureConfig[]>
      updateFeatureConfig: (featureName: string, data: { provider_id?: number; model_id?: number; temperature?: number; top_p?: number }) => Promise<FeatureConfig>
      
      // 用量统计相关API
      createUsageStatistic: (data: { provider_id: number; model_id: number; feature_name: string; mode: string; input_tokens?: number; output_tokens?: number; total_tokens?: number }) => Promise<UsageStatistic>
      getUsageStatistics: () => Promise<UsageStatistic[]>
      getUsageStatisticsByDateRange: (startDate: string, endDate: string) => Promise<UsageStatistic[]>
      getUsageStatisticsByProvider: (providerId: number) => Promise<UsageStatistic[]>
      getUsageStatisticsByModel: (modelId: number) => Promise<UsageStatistic[]>
      getUsageStatisticsSummary: () => Promise<{
        total_calls: number
        total_input_tokens: number
        total_output_tokens: number
        total_tokens: number
        providers: Array<{
          provider_id: number
          provider_name: string
          total_calls: number
          total_tokens: number
        }>
        models: Array<{
          model_id: number
          model_name: string
          provider_name: string
          total_calls: number
          total_tokens: number
        }>
      }>
      
      // 章节向量相关API
      createChapterVector: (data: { book_id: number; chapter_id: number; chunk_index: number; chunk_text: string; embedding: Uint8Array; token_count: number }) => Promise<ChapterVector>
      getChapterVectorsByBookId: (bookId: number) => Promise<ChapterVector[]>
      getChapterVectorsByChapterId: (chapterId: number) => Promise<ChapterVector[]>
      deleteChapterVectorsByChapterId: (chapterId: number) => Promise<{ success: boolean }>
      deleteChapterVectorsByBookId: (bookId: number) => Promise<{ success: boolean }>
      searchSimilarChapterVectors: (bookId: number, queryEmbedding: Uint8Array, limit: number, excludeChapterId?: number) => Promise<ChapterVector[]>
      
      // 设定向量相关API
      createSettingVector: (data: { book_id: number; setting_id: number; setting_content: string; embedding: Uint8Array; token_count: number }) => Promise<SettingVector>
      getSettingVectorBySettingId: (settingId: number) => Promise<SettingVector | undefined>
      getSettingVectorsByBookId: (bookId: number) => Promise<SettingVector[]>
      updateSettingVector: (settingId: number, data: { setting_content?: string; embedding?: Uint8Array; token_count?: number }) => Promise<SettingVector>
      deleteSettingVectorBySettingId: (settingId: number) => Promise<{ success: boolean }>
      deleteSettingVectorsByBookId: (bookId: number) => Promise<{ success: boolean }>
      searchSimilarSettingVectors: (bookId: number, queryEmbedding: Uint8Array, limit: number) => Promise<SettingVector[]>
      
      // 应用信息相关API
      getAppVersion: () => Promise<string>
      openExternal: (url: string) => Promise<void>
    }
  }
}

// 书籍类型定义
export interface Book {
  id: number
  name: string
  global_settings: string
  created_at: string
  updated_at: string
}

// 章节类型定义
export interface Chapter {
  id: number
  book_id: number
  title: string
  content: string
  summary: string
  order_index: number
  created_at: string
  updated_at: string
}

// 设定类型定义
export interface Setting {
  id: number
  book_id: number
  type: string
  name: string
  content: string
  status: string
  starred: boolean
  created_at: string
  updated_at: string
}

// 供应商类型定义
export interface Provider {
  id: number
  name: string
  url: string
  key: string
  is_builtin: number
  created_at: string
  updated_at: string
}

// 模型类型定义
export interface Model {
  id: number
  provider_id: number
  model: string
  tags: string
  created_at: string
  updated_at: string
}

// 章节向量类型定义
export interface ChapterVector {
  id: number
  book_id: number
  chapter_id: number
  chunk_index: number
  chunk_text: string
  embedding: Uint8Array
  token_count: number
  created_at: string
  updated_at: string
  distance?: number
}

// 设定向量类型定义
export interface SettingVector {
  id: number
  book_id: number
  setting_id: number
  setting_content: string
  embedding: Uint8Array
  token_count: number
  created_at: string
  updated_at: string
  distance?: number
}

// 功能配置类型定义
export interface FeatureConfig {
  id: number
  feature_name: string
  provider_id: number
  model_id: number
  temperature: number
  top_p: number
  provider_name?: string
  model_name?: string
  created_at: string
  updated_at: string
}

// 用量统计类型定义
export interface UsageStatistic {
  id: number
  timestamp: string
  provider_id: number
  model_id: number
  feature_name: string
  mode: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  provider_name?: string
  model_name?: string
}
