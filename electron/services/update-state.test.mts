import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAvailableState,
  buildDownloadingState,
  createInitialUpdateState,
  normalizeReleaseNotes
} from './update-state.ts'

test('normalizeReleaseNotes splits markdown list text into clean lines', () => {
  const notes = normalizeReleaseNotes('- 第一条\n* 第二条\n\n第三条')
  assert.deepEqual(notes, ['第一条', '第二条', '第三条'])
})

test('buildAvailableState keeps version metadata and normalized notes', () => {
  const state = buildAvailableState('0.9.3', {
    version: '0.9.4',
    releaseDate: '2026-04-06T00:00:00.000Z',
    releaseNotes: [{ note: '修复更新流程' }, { note: '优化弹窗状态' }]
  })

  assert.equal(state.status, 'available')
  assert.equal(state.currentVersion, '0.9.3')
  assert.equal(state.availableVersion, '0.9.4')
  assert.deepEqual(state.releaseNotes, ['修复更新流程', '优化弹窗状态'])
})

test('buildDownloadingState clamps progress into valid percentage range', () => {
  const nextState = buildDownloadingState(createInitialUpdateState('0.9.3'), {
    percent: 120.456,
    transferred: 120,
    total: 100,
    bytesPerSecond: 30
  })

  assert.equal(nextState.status, 'downloading')
  assert.equal(nextState.downloadPercent, 100)
  assert.equal(nextState.transferredBytes, 120)
  assert.equal(nextState.totalBytes, 100)
})
