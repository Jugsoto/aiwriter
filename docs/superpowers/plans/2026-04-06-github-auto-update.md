# GitHub Auto Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom JSON-based updater with GitHub Releases powered Electron auto updates and remove announcement features.

**Architecture:** Add a dedicated main-process update service backed by `electron-updater`, expose update state and actions through IPC, and simplify the renderer to consume a single update store. Remove all announcement routes, views, and old remote update fetching.

**Tech Stack:** Electron, electron-builder, electron-updater, Vue 3, Pinia, TypeScript

---

### Task 1: Prepare Build And Documentation

**Files:**
- Modify: `package.json`
- Create: `docs/superpowers/specs/2026-04-06-github-auto-update-design.md`
- Create: `docs/superpowers/plans/2026-04-06-github-auto-update.md`

- [ ] Add `electron-updater` dependency and GitHub publish config
- [ ] Keep Windows NSIS target unchanged
- [ ] Preserve current app metadata and output directory

### Task 2: Add Main-Process Update Service

**Files:**
- Create: `electron/services/update-service.ts`
- Modify: `electron/core/app.ts`
- Modify: `electron/handlers/system-handlers.ts`

- [ ] Define update state shape and release note normalization helpers
- [ ] Wrap `electron-updater` check, download, and install APIs
- [ ] Broadcast update state changes to the main window
- [ ] Skip auto update checks in development

### Task 3: Expose IPC And Renderer Types

**Files:**
- Modify: `electron/preload.ts`
- Modify: `src/electron.d.ts`

- [ ] Add update action APIs for check, download, install, and state read
- [ ] Add update event subscription API with cleanup support
- [ ] Type the renderer-facing update payloads

### Task 4: Refactor Update UI

**Files:**
- Modify: `src/stores/update.ts`
- Modify: `src/components/settings/AboutUs.vue`
- Modify: `src/components/modal/UpdateModal.vue`
- Modify: `src/views/Home.vue`

- [ ] Replace old remote JSON update flow with IPC-backed store
- [ ] Show proper action buttons for available/downloading/downloaded states
- [ ] Keep manual-check feedback and startup background check behavior

### Task 5: Remove Announcement Feature

**Files:**
- Delete: `src/views/Announcements.vue`
- Modify: `src/router/index.ts`
- Modify: `src/views/Tools.vue`
- Modify: `src/views/Home.vue`
- Delete or Replace: `src/services/updateChecker.ts`

- [ ] Remove announcement route and page entry points
- [ ] Remove announcement button from the home view
- [ ] Delete dead code related to announcements and external download URLs

### Task 6: Verify

**Files:**
- N/A

- [ ] Run targeted type verification
- [ ] Run build verification
- [ ] Review for leftover `latest.json` and announcement references
