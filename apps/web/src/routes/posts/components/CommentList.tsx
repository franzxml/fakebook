import type { PostComment } from '@/types/social'
import { formatRelativeTime } from '../utils/postDetailFormatters'
import { PostDetailAvatar } from './PostDetailAvatar'

type CommentListProps = {
  comments: PostComment[]
  currentUserId?: string
  onEdit: (comment: PostComment) => void
  onDelete: (comment: PostComment) => void
  isBusy?: boolean
}

export function CommentList({ comments, currentUserId, onEdit, onDelete, isBusy = false }: CommentListProps) {
  return (
    <div className="space-y-3.5 px-4 py-2">
      {comments.map((comment) => (
        <div key={comment.id} className="group flex items-start gap-2.5">
          <PostDetailAvatar name={comment.author.name} size="sm" />
          <div className="flex max-w-[85%] flex-1 flex-col">
            <div className="flex items-center gap-2">
              <div className="inline-block rounded-[18px] bg-[#F0F2F5] px-3 py-2">
                <p style={{ color: '#050505', fontSize: '13px', fontWeight: 700, lineHeight: '1.2' }}>
                  {comment.author.name}
                </p>
                <p style={{ color: '#050505', fontSize: '14px', lineHeight: '1.4', marginTop: '2px' }}>
                  {comment.content}
                </p>
              </div>

              {currentUserId === comment.author.id ? (
                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    className="rounded-full px-2 py-1 text-xs font-bold text-[#65676B] hover:bg-[#F2F3F5] disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => onEdit(comment)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-full px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => onDelete(comment)}
                  >
                    Hapus
                  </button>
                </div>
              ) : null}
            </div>

            <p className="mt-1 px-2 text-[12px] text-[#65676B]">
              {formatRelativeTime(comment.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
