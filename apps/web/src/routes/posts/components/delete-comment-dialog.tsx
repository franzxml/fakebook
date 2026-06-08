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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={() => { if (!isDeleting) onClose() }}
    >
      <div
        className="w-full max-w-[400px] overflow-hidden bg-white"
        style={{
          borderRadius: '12px',
          boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
          fontFamily: 'Arial, system-ui, Helvetica, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-4 py-[14px] text-center"
          style={{ borderBottom: '1px solid #DADDE1' }}
        >
          <h2 style={{ color: '#050505', fontSize: '17px', fontWeight: 700 }}>
            Hapus Komentar?
          </h2>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <p className="text-sm text-[#65676B] text-center mb-3">
            Komentar ini akan dihapus permanen dan tidak bisa dikembalikan.
          </p>
          <div
            className="rounded-lg px-3 py-2 text-sm text-[#050505]"
            style={{ backgroundColor: '#F0F2F5' }}
          >
            "{preview}"
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex border-t"
          style={{ borderColor: '#DADDE1' }}
        >
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 text-sm font-semibold transition-colors hover:bg-[#F0F2F5] disabled:opacity-50"
            style={{ color: '#050505', borderRight: '1px solid #DADDE1' }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 text-sm font-semibold transition-colors hover:bg-red-50 disabled:opacity-50"
            style={{ color: '#E02424' }}
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}
