import { formatCount } from '../utils/formatters'
import { CommentIcon, LikeIcon } from './icons'

type EngagementBarProps = {
  liked: boolean
  likeCount: number
  commentCount: number
  disableCommentFocus: boolean
  isUpdatingLike?: boolean
  onLike: () => void
  onCommentFocus: () => void
}

export function EngagementBar({
  liked,
  likeCount,
  commentCount,
  disableCommentFocus,
  isUpdatingLike = false,
  onLike,
  onCommentFocus,
}: EngagementBarProps) {
  return (
    <div className="flex items-center justify-between border-y border-fb-divider px-4 py-2.5">
      <div className="flex items-center gap-5">
        <button
          onClick={onLike}
          disabled={isUpdatingLike}
          className="flex items-center gap-1.5 py-0.5 hover:opacity-70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LikeIcon className={`size-[20px] ${liked ? 'text-fb-blue' : 'text-fb-text-secondary'}`} filled={liked} />
          <span className="text-[14px] font-normal text-fb-text-secondary">{formatCount(likeCount)}</span>
        </button>
        <button
          onClick={onCommentFocus}
          disabled={disableCommentFocus}
          className="flex items-center gap-1.5 py-0.5 hover:opacity-70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CommentIcon className="size-[20px] text-fb-text-secondary" />
          <span className="text-[14px] font-normal text-fb-text-secondary">{formatCount(commentCount)}</span>
        </button>
      </div>
    </div>
  )
}
