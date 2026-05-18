import type { PostComment } from '@/types/social'
import { formatRelativeTime } from '../utils/postDetailFormatters'
import { PostDetailAvatar } from './PostDetailAvatar'

export function CommentList({ comments }: { comments: PostComment[] }) {
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

              <button
                className="flex size-7 items-center justify-center rounded-full text-xs font-bold text-[#65676B] opacity-0 transition-opacity hover:bg-[#F2F3F5] focus:outline-none group-hover:opacity-100"
                aria-label="Opsi komentar"
              >
                ...
              </button>
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
