# GitHub Auto Update Design

**Date:** 2026-04-06

## Goal

将当前基于 `latest.json` 的前端更新检查，替换为基于 GitHub Releases 的 Electron 应用内自动更新，并移除公告相关功能。

## Scope

- 使用 `electron-builder` + GitHub Releases 发布 Windows 更新元数据与安装包
- 使用主进程更新服务统一处理检查、下载、安装
- 启动后后台检查更新
- 设置页支持手动检查更新
- 下载完成后支持“重启安装”
- 删除公告页面、公告入口、公告路由与旧远端更新逻辑

## Out Of Scope

- macOS / Linux 自动更新
- 保留公告中心
- 自建更新服务器

## Architecture

### Build And Release

- `package.json` 中的 `build.publish` 指向公开仓库 `qgming/aiwriter`
- 继续使用 `nsis` 目标生成 Windows 安装包
- 发布流程依赖 GitHub Releases 中的安装包、`latest.yml` 与 blockmap

### Main Process

- 新增独立更新服务模块封装 `electron-updater`
- 在应用初始化完成后注册更新服务并安排后台检查
- 通过 IPC 暴露手动检查、开始下载、重启安装、读取当前状态
- 通过事件将更新状态和下载进度推送到渲染层

### Renderer

- `AboutUs.vue` 不再直接请求远端 JSON
- `UpdateModal.vue` 改为展示主进程推送的更新状态
- `Home.vue` 的“发现新版本”按钮改为触发应用内下载/安装，而不是打开外部下载页
- `update` store 负责维护当前更新状态和订阅主进程事件

## Update State Model

- `idle`: 尚未检查
- `checking`: 正在检查更新
- `available`: 发现新版本，尚未下载
- `downloading`: 正在下载更新
- `downloaded`: 下载完成，等待安装
- `not-available`: 当前已是最新版本
- `error`: 检查或下载失败

## UX Rules

- 启动时后台静默检查，无更新时不打扰用户
- 手动检查总是给出结果反馈
- 有新版本时展示版本号、发布日期、更新说明
- 下载完成前不自动退出应用
- 仅在用户确认时执行“重启安装”

## Cleanup

- 删除 `src/views/Announcements.vue`
- 删除路由 `/announcements`
- 删除主页和工具页中的公告入口
- 删除旧 `updateChecker` 公告与下载链接逻辑

## Verification

- TypeScript 类型检查通过
- Electron 构建通过
- 开发环境下不会误触发更新逻辑
- 打包环境下更新状态在 UI 中可正确切换
