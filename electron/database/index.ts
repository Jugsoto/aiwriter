export * from './connection'
export * from './migrations/init'

// 导出所有数据模型
export * from './models/book'
export * from './models/chapter'
export * from './models/setting'
export * from './models/provider'
export * from './models/model'
export * from './models/prompt'
export * from './models/usage'
export * from './models/vector'
export * from './models/feature-config'

// 便捷的数据库初始化函数
import { initializeDatabase } from './migrations/init'
export { initializeDatabase as initDatabase }