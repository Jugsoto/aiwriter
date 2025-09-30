import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['better-sqlite3', 'electron', 'path', 'fs', 'util'],
              output: {
                format: 'es'
              }
            },
            target: 'node18',
            lib: {
              entry: 'electron/main.ts',
              formats: ['es']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'es'
              }
            },
            lib: {
              entry: 'electron/preload.ts',
              formats: ['es']
            }
          }
        }
      },
      {
        entry: 'electron/database.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['better-sqlite3', 'electron', 'path', 'fs', 'util'],
              output: {
                format: 'cjs'
              }
            },
            target: 'node18',
            lib: {
              entry: 'electron/database.ts',
              formats: ['cjs']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  publicDir: 'public',
  build: {
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架库
          vendor: ['vue', 'vue-router', 'pinia'],
          // UI组件库
          lucide: ['lucide-vue-next'],
          // 图表库
          echarts: ['echarts', 'vue-echarts'],
          // AI相关库
          ai: ['openai'],
          // 工具库
          utils: ['marked'],
          // 数据库相关
          database: ['better-sqlite3']
        }
      }
    }
  },
  server: {
    port: 5173
  },
  clearScreen: false
})
