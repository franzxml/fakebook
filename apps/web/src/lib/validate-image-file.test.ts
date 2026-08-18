import { describe, expect, test } from 'vitest'
import { validateImageFile } from './validate-image-file'

function createFile(size: number, type: string) {
  return new File([new Uint8Array(size)], 'upload', { type })
}

describe('validateImageFile', () => {
  test('menerima gambar hingga 5 MiB', () => {
    expect(validateImageFile(createFile(5 * 1024 * 1024, 'image/png'))).toBeNull()
  })

  test('menolak file non-gambar', () => {
    expect(validateImageFile(createFile(1, 'text/plain'))).toBe('File harus berupa gambar.')
  })

  test('menolak gambar yang melebihi 5 MiB', () => {
    expect(validateImageFile(createFile(5 * 1024 * 1024 + 1, 'image/jpeg'))).toBe(
      'Ukuran gambar maksimal 5 MB.',
    )
  })
})
