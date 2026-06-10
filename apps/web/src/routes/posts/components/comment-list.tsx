import { Avatar } from '@/components/avatar'
import type { PostComment } from '@/types/social'
import { getDisplayName } from '@/lib/user-display'
import { formatRelativeTime, groupRepliesByParent } from '../utils/formatters'

type CommentListProps = {
  comments: PostComment[]
  currentUserId?: string
  onEdit: (comment: PostComment) => void
  onDelete: (comment: PostComment) => void
  onReply: (comment: PostComment) => void
  isBusy?: boolean
}

export function CommentList({ comments, currentUserId, onEdit, onDelete, onReply, isBusy = false }: CommentListProps) {
  const { parentComments, repliesByParentId } = groupRepliesByParent(comments)

  function renderComment(comment: PostComment, isReply = false) {
    const authorDisplayName = getDisplayName(comment.author)

    return (
      <div key={comment.id} className={`group flex items-start gap-2.5 ${isReply ? 'ml-10' : ''}`}>
        <Avatar imageUrl={comment.author.avatarUrl} name={authorDisplayName} size="size-8" />
        <div className="flex max-w-[85%] flex-1 flex-col">
          <div className="flex items-center gap-2">
            <div className="inline-block rounded-[18px] bg-fb-surface px-3 py-2">
              <p className="text-[13px] font-bold leading-[1.2] text-fb-text">
                {authorDisplayName}
              </p>
              {comment.parentComment && isReply ? (
                <p className="mt-0.5 text-[12px] font-semibold text-fb-text-secondary">
                  membalas {getDisplayName(comment.parentComment.author)}
                </p>
              ) : null}
              <p className="mt-0.5 text-[14px] leading-[1.4] text-fb-text">
                {comment.content}
              </p>
            </div>

            {currentUserId === comment.author.id ? (
              <div className="flex [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover:opacity-100">
                <button
                  className="rounded-full px-2 py-1 text-xs font-bold text-fb-text-secondary hover:bg-[#F2F3F5] disabled:opacity-50"
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

          <div className="mt-1 flex items-center gap-3 px-2 text-[12px] text-fb-text-secondary">
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
