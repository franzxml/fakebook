import { formatCount } from '../utils/postDetailFormatters'
import { CommentIcon, LikeIcon, ShareIcon } from './PostDetailIcons'

const DEFAULT_SHARE_COUNT = 4

type EngagementBarProps = {
  liked: boolean
  likeCount: number
  commentCount: number
  disableCommentFocus: boolean
  onLike: () => void
  onCommentFocus: () => void
}

export function EngagementBar({
  liked,
  likeCount,
  commentCount,
  disableCommentFocus,
  onLike,
  onCommentFocus,
}: EngagementBarProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5"
      style={{ borderTop: '1px solid #DADDE1', borderBottom: '1px solid #DADDE1' }}
    >
      <div className="flex items-center gap-5">
        <button onClick={onLike} className="flex items-center gap-1.5 py-0.5 hover:opacity-70 focus:outline-none">
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
        <button className="flex items-center gap-1.5 py-0.5 hover:opacity-70 focus:outline-none">
          <ShareIcon className="size-[20px]" style={{ color: '#65676B' }} />
          <span style={{ color: '#65676B', fontSize: '14px', fontWeight: 400 }}>
            {formatCount(DEFAULT_SHARE_COUNT)}
          </span>
        </button>
      </div>

      <div className="flex select-none items-center -space-x-1" aria-hidden="true">
        <div className="flex size-[18px] items-center justify-center rounded-full bg-[#1877F2] text-[10px] text-white shadow-sm">
          L
        </div>
        <div className="flex size-[18px] items-center justify-center rounded-full bg-[#F7B928] text-[10px] shadow-sm">
          H
        </div>
      </div>
    </div>
  )
}
