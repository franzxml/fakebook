const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'File harus berupa gambar.'
  if (file.size > MAX_IMAGE_BYTES) return 'Ukuran gambar maksimal 5 MB.'
  return null
}
