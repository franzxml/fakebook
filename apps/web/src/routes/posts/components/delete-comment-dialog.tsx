import { useEffect } from 'react'
import type { PostComment } from '@/types/social'

type DeleteCommentDialogProps = {
  comment: PostComment
  isDeleting?: boolean
  error?: string | null
  onClose: () => void
  onConfirm: () => void
}

export function DeleteCommentDialog({ comment, isDeleting, error, onClose, onConfirm }: DeleteCommentDialogProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isDeleting) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isDeleting, onClose])

  const preview = comment.content.length > 100
    ? `${comment.content.slice(0, 100)}...`
    : comment.content

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-fb-overlay p-4"
      onClick={() => { if (!isDeleting) onClose() }}
    >
      <div
        className="w-full max-w-[400px] overflow-hidden rounded-xl bg-white shadow-[0_12px_28px_rgb(0_0_0/0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-fb-divider px-4 py-[14px] text-center">
          <h2 className="text-[17px] font-bold text-fb-text">
            Hapus Komentar?
          </h2>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <p className="text-sm text-fb-text-secondary text-center mb-3">
            Komentar ini akan dihapus permanen dan tidak bisa dikembalikan.
          </p>
          <div className="rounded-lg bg-fb-surface px-3 py-2 text-sm text-fb-text">
            "{preview}"
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex border-t border-fb-divider">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 border-r border-fb-divider py-3 text-sm font-semibold text-fb-text transition-colors hover:bg-fb-surface disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}
