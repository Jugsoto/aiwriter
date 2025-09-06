# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + TypeScript + Vite Electron desktop application called "神笔AI写作" (Magic Pen AI Writing). It's a cross-platform desktop app with a custom frameless window and window controls.

## Development Commands

### Core Development
- `npm run dev` - Start Vite development server (for web preview)
- `npm run electron:dev` - Start Electron in development mode
- `npm run build` - Build Vue application with TypeScript compilation
- `npm run electron:build` - Build complete Electron application
- `npm run dist` - Create Windows NSIS installer

### Development Workflow
1. Use `npm run electron:dev` for development with hot reload
2. The app runs on port 5173 in development
3. Electron main process runs from `electron/main.ts`
4. Preload script at `electron/preload.ts` provides secure IPC communication

## Architecture

### Electron Structure
- **Main Process**: `electron/main.ts` - Window management, IPC handlers
- **Preload Script**: `electron/preload.ts` - Secure bridge between renderer and main
- **Renderer**: Vue 3 application in `src/` directory

### Vue Application Structure
- **Entry Point**: `src/main.ts` - Vue app initialization with Pinia and router
- **Router**: `src/router/index.ts` - Hash-based routing for Electron compatibility
- **Layout**: `src/components/MainLayout.vue` - Main application layout
- **Views**: `src/views/` - Home, Tools, Settings pages
- **State**: Pinia store for theme management (`src/stores/theme.ts`)

### Key Features
- Frameless window with custom window controls
- Secure IPC communication via contextBridge
- SQLite database integration (better-sqlite3)
- Tailwind CSS for styling
- Vue Router with hash history for Electron compatibility

### Window Management
The app implements custom window controls through IPC:
- `window-minimize` - Minimize window
- `window-maximize` - Maximize/unmaximize window  
- `window-close` - Close window

### Build Configuration
- **Output**: `dist-electron/` for Electron files, `dist/` for Vue build
- **Installer**: Creates NSIS installer in `dist-app/` directory
- **Code Splitting**: Vendor chunks for Vue, Vue Router, Pinia, and Lucide icons

### Development Notes
- Uses hash-based routing for Electron compatibility
- Frameless window requires custom window controls
- SQLite database uses better-sqlite3 for native performance
- Tailwind CSS configured with Vite plugin