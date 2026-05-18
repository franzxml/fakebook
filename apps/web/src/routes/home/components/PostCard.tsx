import { useState } from 'react'
import { MessageCircle, ThumbsUp } from 'lucide-react'
import type { FeedPost } from '@ppwl/shared'
import { AvatarCircle } from '@/layouts/AppLayout'
import { formatRelativeTime } from '../utils/feedTimeFormatters'

type PostCardProps = {
  post: FeedPost
  onOpenDetail: () => void
  onOpenComments: () => void
}

export function PostCard({ post, onOpenDetail, onOpenComments }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post._count.likes)

  function handleLike() {
    setLiked((currentLiked) => {
      setLikeCount((currentCount) => currentCount + (currentLiked ? -1 : 1))
      return !currentLiked
    })
  }

  function navigate(path: string) {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm"
      onClick={onOpenDetail}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={(event) => {
            event.stopPropagation()
            navigate('/profile')
          }}
        >
          <AvatarCircle user={post.author} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {post.author.name}
          </p>
          <p className="text-xs text-slate-400">{formatRelativeTime(post.createdAt)}</p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {post.content}
        </p>
      </div>

      {post.images.length > 0 && (
        <div className={`grid gap-1 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.images.map((img) => (
            <img
              key={img.id}
              src={img.imageUrl}
              alt="Gambar postingan"
              className="max-h-80 w-full object-cover"
            />
          ))}
        </div>
      )}

      {(likeCount > 0 || post._count.comments > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-400">
          {likeCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1877f2] text-white">
                👍
              </span>
              {likeCount}
            </span>
          )}
          {post._count.comments > 0 && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                onOpenComments()
              }}
              className="ml-auto hover:underline"
            >
              {post._count.comments} komentar
            </button>
          )}
        </div>
      )}

      <div className="flex border-t border-slate-100">
        <button
          onClick={(event) => {
            event.stopPropagation()
            handleLike()
          }}
          className={[
            'flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50',
            liked ? 'text-[#1877f2]' : 'text-slate-500',
          ].join(' ')}
        >
          <ThumbsUp size={18} />
          Suka
        </button>

        <button
          onClick={(event) => {
            event.stopPropagation()
            onOpenComments()
          }}
          className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
        >
          <MessageCircle size={18} />
          Komentar
        </button>
      </div>
    </article>
  )
}
