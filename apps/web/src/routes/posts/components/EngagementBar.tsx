import { formatCount } from '../utils/postDetailFormatters'
import { CommentIcon, LikeIcon } from './PostDetailIcons'

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
    <div
      className="flex items-center justify-between px-4 py-2.5"
      style={{ borderTop: '1px solid #DADDE1', borderBottom: '1px solid #DADDE1' }}
    >
      <div className="flex items-center gap-5">
        <button
          onClick={onLike}
          disabled={isUpdatingLike}
          className="flex items-center gap-1.5 py-0.5 hover:opacity-70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LikeIcon className="size-[20px]" filled={liked} style={{ color: liked ? '#1877F2' : '#65676B' }} />
          <span style={{ color: '#65676B', fontSize: '14px', fontWeight: 400 }}>{formatCount(likeCount)}</span>
        </button>
        <button
          onClick={onCommentFocus}
          disabled={disableCommentFocus}
          className="flex items-center gap-1.5 py-0.5 hover:opacity-70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CommentIcon className="size-[20px]" style={{ color: '#65676B' }} />
          <span style={{ color: '#65676B', fontSize: '14px', fontWeight: 400 }}>{formatCount(commentCount)}</span>
        </button>
      </div>
    </div>
  )
}
