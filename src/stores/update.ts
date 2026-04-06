import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AppUpdateState } from '@/electron.d'

function createInitialState(currentVersion = '0.0.0'): AppUpdateState {
  return {
    status: 'idle',
    currentVersion,
    availableVersion: null,
    releaseDate: null,
    releaseNotes: [],
    checkedAt: null,
    downloadPercent: 0,
    transferredBytes: 0,
    totalBytes: 0,
    bytesPerSecond: 0,
    errorMessage: null
  }
}

export const useUpdateStore = defineStore('update', () => {
  const state = ref<AppUpdateState>(createInitialState())
  const initialized = ref(false)
  let unsubscribe: (() => void) | null = null

  const hasUpdate = computed(() => ['available', 'downloading', 'downloaded'].includes(state.value.status))
  const isChecking = computed(() => state.value.status === 'checking')
  const isDownloading = computed(() => state.value.status === 'downloading')
  const isDownloaded = computed(() => state.value.status === 'downloaded')

  async function initialize() {
    if (initialized.value) {
      return
    }

    state.value = await window.electronAPI.getAppUpdateState()
    unsubscribe = window.electronAPI.onAppUpdateStateChanged((nextState) => {
      state.value = nextState
    })
    initialized.value = true
  }

  async function refreshState() {
    await initialize()
    state.value = await window.electronAPI.getAppUpdateState()
    return state.value
  }

  async function checkForUpdates() {
    await initialize()
    state.value = await window.electronAPI.checkForAppUpdates()
    return state.value
  }

  async function downloadUpdate() {
    await initialize()
    state.value = await window.electronAPI.downloadAppUpdate()
    return state.value
  }

  async function installUpdate() {
    await initialize()
    state.value = await window.electronAPI.installAppUpdate()
    return state.value
  }

  function dispose() {
    unsubscribe?.()
    unsubscribe = null
    initialized.value = false
  }

  return {
    state,
    hasUpdate,
    isChecking,
    isDownloading,
    isDownloaded,
    initialize,
    refreshState,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dispose
  }
})
