import { describe, expect, test } from 'bun:test'
import { appMetadata, createHealthPayload } from './index'

describe('createHealthPayload', () => {
  test('mengembalikan metadata dan timestamp ISO yang stabil', () => {
    const date = new Date('2026-08-18T00:00:00.000Z')

    expect(createHealthPayload(date)).toEqual({
      status: 'ok',
      appName: appMetadata.name,
      version: appMetadata.version,
      timestamp: '2026-08-18T00:00:00.000Z',
    })
  })
})
