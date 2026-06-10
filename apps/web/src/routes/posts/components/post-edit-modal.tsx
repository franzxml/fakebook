import { useRef } from 'react'
import type { FeedPost } from '@/types/social'
import { usePostEdit } from '../hooks/use-post-edit'

type PostEditModalProps = {
  post: FeedPost
  onClose: () => void
  onSuccess?: (updatedPost: FeedPost) => void
}

export function PostEditModal({ post, onClose, onSuccess }: PostEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    content,
    setContent,
    existingImageUrls,
    removeExistingImage,
    newImagePreviews,
    addNewImages,
    removeNewImage,
    isSubmitting,
    error,
    submitEdit,
  } = usePostEdit({ post, onSuccess })

  const totalImages = existingImageUrls.length + newImagePreviews.length
  const hasImage = totalImages > 0
  const canAddImage = totalImages < 1

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) {
      addNewImages(files, existingImageUrls.length)
      event.target.value = ''
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={() => { if (!isSubmitting) onClose() }}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_12px_28px_rgb(0_0_0/0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-center border-b border-fb-divider px-4 py-[14px]">
          <h2 className="text-[17px] font-bold text-fb-text">
            Edit Postingan
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute right-4 flex size-[32px] items-center justify-center rounded-full bg-fb-surface transition-colors hover:bg-fb-hover disabled:opacity-50"
            aria-label="Tutup"
          >
            <span className="text-[15px] font-semibold text-fb-text">×</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Textarea konten */}
          <textarea
            aria-label="Edit konten postingan"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            className="w-full resize-none rounded-lg border-none bg-fb-surface px-3 py-2 text-[15px] leading-[1.45] text-fb-text outline-none disabled:opacity-60"
            placeholder="Apa yang sedang kamu pikirkan?"
          />

          {/* Seksi Gambar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-fb-text-secondary">
                Gambar {hasImage ? '(1/1)' : '(0/1)'}
              </p>
              {hasImage && (
                <p className="text-xs text-fb-text-secondary">Maksimal 1 gambar</p>
              )}
            </div>

            {/* Preview gambar existing */}
            {existingImageUrls.map((url, i) => (
              <div key={`existing-${i}`} className="relative mb-3 overflow-hidden rounded-xl border-2 border-fb-divider">
                <img
                  src={url}
                  alt=""
                  className="max-h-[280px] w-full object-cover"
                />
                <div className="absolute inset-0 flex items-start justify-end p-2">
                  <button
                    onClick={() => removeExistingImage(i)}
                    disabled={isSubmitting}
                    className="flex size-8 items-center justify-center rounded-full bg-black/60 text-base font-bold text-white shadow-md transition-opacity hover:opacity-80 disabled:opacity-50"
                    aria-label="Hapus gambar"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Preview gambar baru */}
            {newImagePreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative mb-3 overflow-hidden rounded-xl border-2 border-fb-blue">
                <img
                  src={url}
                  alt=""
                  className="max-h-[280px] w-full object-cover"
                />
                <div className="absolute inset-0 flex items-start justify-end p-2">
                  <button
                    onClick={() => removeNewImage(i)}
                    disabled={isSubmitting}
                    className="flex size-8 items-center justify-center rounded-full bg-fb-blue/85 text-base font-bold text-white shadow-md transition-opacity hover:opacity-80 disabled:opacity-50"
                    aria-label="Hapus gambar baru"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Tombol tambah / ganti gambar */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => canAddImage && fileInputRef.current?.click()}
              disabled={isSubmitting || !canAddImage}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                canAddImage
                  ? 'border-fb-blue bg-fb-surface text-fb-blue'
                  : 'border-fb-divider bg-fb-hover text-[#BCC0C4]'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {canAddImage ? (hasImage ? 'Ganti Gambar' : 'Tambah Gambar') : 'Sudah ada 1 gambar'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-fb-divider px-4 py-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-fb-text transition-colors hover:bg-fb-surface disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={submitEdit}
            disabled={isSubmitting || !content.trim()}
            className="rounded-lg bg-fb-blue px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
