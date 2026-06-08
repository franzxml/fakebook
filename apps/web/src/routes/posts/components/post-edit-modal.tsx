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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={() => { if (!isSubmitting) onClose() }}
    >
      <div
        className="relative flex w-full max-w-[560px] flex-col overflow-hidden bg-white"
        style={{
          borderRadius: '12px',
          boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
          fontFamily: 'Arial, system-ui, Helvetica, sans-serif',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative flex shrink-0 items-center justify-center px-4 py-[14px]"
          style={{ borderBottom: '1px solid #DADDE1' }}
        >
          <h2 style={{ color: '#050505', fontSize: '17px', fontWeight: 700 }}>
            Edit Postingan
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute right-4 flex size-[32px] items-center justify-center rounded-full transition-colors hover:bg-[#E4E6EB] disabled:opacity-50"
            style={{ backgroundColor: '#F0F2F5' }}
            aria-label="Tutup"
          >
            <span style={{ color: '#050505', fontSize: '15px', fontWeight: 600 }}>×</span>
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
            className="w-full resize-none rounded-lg px-3 py-2 text-[15px] outline-none disabled:opacity-60"
            style={{
              backgroundColor: '#F0F2F5',
              color: '#050505',
              lineHeight: '1.45',
              border: 'none',
            }}
            placeholder="Apa yang sedang kamu pikirkan?"
          />

          {/* Seksi Gambar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#65676B]">
                Gambar {hasImage ? '(1/1)' : '(0/1)'}
              </p>
              {hasImage && (
                <p className="text-xs text-[#65676B]">Maksimal 1 gambar</p>
              )}
            </div>

            {/* Preview gambar existing */}
            {existingImageUrls.map((url, i) => (
              <div key={`existing-${i}`} className="relative mb-3 overflow-hidden rounded-xl" style={{ border: '2px solid #DADDE1' }}>
                <img
                  src={url}
                  alt=""
                  className="w-full object-cover"
                  style={{ maxHeight: '280px' }}
                />
                <div className="absolute inset-0 flex items-start justify-end p-2">
                  <button
                    onClick={() => removeExistingImage(i)}
                    disabled={isSubmitting}
                    className="flex size-8 items-center justify-center rounded-full text-white font-bold text-base shadow-md transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    aria-label="Hapus gambar"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Preview gambar baru */}
            {newImagePreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative mb-3 overflow-hidden rounded-xl" style={{ border: '2px solid #1877F2' }}>
                <img
                  src={url}
                  alt=""
                  className="w-full object-cover"
                  style={{ maxHeight: '280px' }}
                />
                <div className="absolute inset-0 flex items-start justify-end p-2">
                  <button
                    onClick={() => removeNewImage(i)}
                    disabled={isSubmitting}
                    className="flex size-8 items-center justify-center rounded-full text-white font-bold text-base shadow-md transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(24,119,242,0.85)' }}
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
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
              style={{
                backgroundColor: canAddImage ? '#F0F2F5' : '#E4E6EB',
                color: canAddImage ? '#1877F2' : '#BCC0C4',
                border: '2px dashed',
                borderColor: canAddImage ? '#1877F2' : '#DADDE1',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
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
        <div
          className="shrink-0 flex justify-end gap-2 px-4 py-3"
          style={{ borderTop: '1px solid #DADDE1' }}
        >
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-5 py-2 text-sm font-semibold transition-colors hover:bg-[#F0F2F5] disabled:opacity-50"
            style={{ color: '#050505' }}
          >
            Batal
          </button>
          <button
            onClick={submitEdit}
            disabled={isSubmitting || !content.trim()}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#1877F2' }}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
