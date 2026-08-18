import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './api'

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('menyajikan pesan yang jelas ketika API tidak dapat dihubungi', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiRequest('/health')).rejects.toThrow(
      'Layanan sedang tidak dapat dihubungi. Silakan coba lagi beberapa saat lagi.',
    )
  })

  it('tidak menampilkan nilai error API yang kosong', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: null }), { status: 403 })),
    )

    await expect(apiRequest('/health')).rejects.toThrow('Request API gagal.')
  })
})
