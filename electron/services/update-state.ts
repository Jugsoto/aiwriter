export type AppUpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error'

export interface AppUpdateState {
  status: AppUpdateStatus
  currentVersion: string
  availableVersion: string | null
  releaseDate: string | null
  releaseNotes: string[]
  checkedAt: string | null
  downloadPercent: number
  transferredBytes: number
  totalBytes: number
  bytesPerSecond: number
  errorMessage: string | null
}

interface ReleaseNoteInfo {
  note?: string | null
}

interface UpdateReleaseInfo {
  version?: string
  releaseDate?: string
  releaseNotes?: string | ReleaseNoteInfo[] | null
}

interface DownloadProgressLike {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

export function createInitialUpdateState(currentVersion: string): AppUpdateState {
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

export function buildCheckingState(state: AppUpdateState): AppUpdateState {
  return {
    ...state,
    status: 'checking',
    checkedAt: new Date().toISOString(),
    errorMessage: null,
    downloadPercent: 0,
    transferredBytes: 0,
    totalBytes: 0,
    bytesPerSecond: 0
  }
}

export function buildAvailableState(currentVersion: string, info: UpdateReleaseInfo): AppUpdateState {
  return {
    status: 'available',
    currentVersion,
    availableVersion: info.version ?? null,
    releaseDate: info.releaseDate ?? null,
    releaseNotes: normalizeReleaseNotes(info.releaseNotes),
    checkedAt: new Date().toISOString(),
    downloadPercent: 0,
    transferredBytes: 0,
    totalBytes: 0,
    bytesPerSecond: 0,
    errorMessage: null
  }
}

export function buildNotAvailableState(currentVersion: string): AppUpdateState {
  return {
    ...createInitialUpdateState(currentVersion),
    status: 'not-available',
    checkedAt: new Date().toISOString()
  }
}

export function buildDownloadingState(state: AppUpdateState, progress: DownloadProgressLike): AppUpdateState {
  return {
    ...state,
    status: 'downloading',
    downloadPercent: clampPercent(progress.percent),
    transferredBytes: progress.transferred,
    totalBytes: progress.total,
    bytesPerSecond: progress.bytesPerSecond,
    errorMessage: null
  }
}

export function buildDownloadedState(state: AppUpdateState): AppUpdateState {
  return {
    ...state,
    status: 'downloaded',
    downloadPercent: 100,
    errorMessage: null
  }
}

export function buildErrorState(state: AppUpdateState, message: string): AppUpdateState {
  return {
    ...state,
    status: 'error',
    errorMessage: message,
    checkedAt: new Date().toISOString()
  }
}

export function normalizeReleaseNotes(notes: UpdateReleaseInfo['releaseNotes']): string[] {
  if (!notes) {
    return []
  }

  if (typeof notes === 'string') {
    return splitReleaseNotes(notes)
  }

  return notes
    .map(item => item.note?.trim() ?? '')
    .filter(Boolean)
}

function splitReleaseNotes(notes: string): string[] {
  return notes
    .split(/\r?\n/)
    .map(line => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

function clampPercent(percent: number): number {
  if (Number.isNaN(percent)) {
    return 0
  }

  if (percent < 0) {
    return 0
  }

  if (percent > 100) {
    return 100
  }

  return Math.round(percent * 100) / 100
}
