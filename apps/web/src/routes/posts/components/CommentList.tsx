import type { PostComment } from '@/types/social'
import { getDisplayName } from '@/lib/userDisplay'
import { formatRelativeTime } from '../utils/postDetailFormatters'
import { PostDetailAvatar } from './PostDetailAvatar'

type CommentListProps = {
  comments: PostComment[]
  currentUserId?: string
  onEdit: (comment: PostComment) => void
  onDelete: (comment: PostComment) => void
  onReply: (comment: PostComment) => void
  isBusy?: boolean
}

export function CommentList({ comments, currentUserId, onEdit, onDelete, onReply, isBusy = false }: CommentListProps) {
  const parentComments = comments.filter((comment) => !comment.parentCommentId)
  const repliesByParentId = comments.reduce<Record<string, PostComment[]>>((groups, comment) => {
    if (comment.parentCommentId) {
      groups[comment.parentCommentId] = [...(groups[comment.parentCommentId] ?? []), comment]
    }

    return groups
  }, {})

  function renderComment(comment: PostComment, isReply = false) {
    const authorDisplayName = getDisplayName(comment.author)

    return (
      <div key={comment.id} className={`group flex items-start gap-2.5 ${isReply ? 'ml-10' : ''}`}>
        <PostDetailAvatar avatarUrl={comment.author.avatarUrl} name={authorDisplayName} size="sm" />
        <div className="flex max-w-[85%] flex-1 flex-col">
          <div className="flex items-center gap-2">
            <div className="inline-block rounded-[18px] bg-[#F0F2F5] px-3 py-2">
              <p style={{ color: '#050505', fontSize: '13px', fontWeight: 700, lineHeight: '1.2' }}>
                {authorDisplayName}
              </p>
              {comment.parentComment && isReply ? (
                <p className="mt-0.5 text-[12px] font-semibold text-[#65676B]">
                  membalas {getDisplayName(comment.parentComment.author)}
                </p>
              ) : null}
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

          <div className="mt-1 flex items-center gap-3 px-2 text-[12px] text-[#65676B]">
            <span>{formatRelativeTime(comment.createdAt)}</span>
            {currentUserId ? (
              <button
                className="font-bold hover:underline disabled:opacity-50"
                disabled={isBusy}
                onClick={() => onReply(comment)}
              >
                Balas
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3.5 px-4 py-2">
      {parentComments.map((comment) => (
        <div key={comment.id} className="space-y-2">
          {renderComment(comment)}
          {(repliesByParentId[comment.id] ?? []).map((reply) => renderComment(reply, true))}
        </div>
      ))}
    </div>
  )
}
