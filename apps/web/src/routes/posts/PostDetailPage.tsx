import { useEffect, useRef, useState } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import type { FeedPost, PostComment } from '@/types/social'
import { CommentComposer } from './components/CommentComposer'
import { CommentList } from './components/CommentList'
import { EngagementBar } from './components/EngagementBar'
import { ModalHeader } from './components/ModalHeader'
import { PostBody } from './components/PostBody'
import { fallbackPostComments } from './data/fallbackPostComments'

const MAX_COMMENTS = 5

type PostDetailPageProps = {
  post: FeedPost
  comments?: PostComment[]
  onClose?: () => void
}

function stopPropagation(event: React.MouseEvent) {
  event.stopPropagation()
}

export function PostDetailPage({ post, comments: initialComments, onClose }: PostDetailPageProps) {
  const [comments, setComments] = useState<PostComment[]>(
    initialComments?.length ? initialComments : fallbackPostComments,
  )
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post._count.likes || 8)
  const [commentInput, setCommentInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isModal = Boolean(onClose)
  const isAtLimit = comments.length >= MAX_COMMENTS

  useEffect(() => {
    if (!onClose) return undefined

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose?.()
    }

    const originalOverflow = document.body.style.overflow

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = originalOverflow
    }
  }, [onClose])

  function handleLike() {
    setLiked((currentLiked) => {
      setLikeCount((currentCount) => currentCount + (currentLiked ? -1 : 1))
      return !currentLiked
    })
  }

  function handleSubmitComment() {
    const trimmed = commentInput.trim()
    if (!trimmed || isSubmitting || isAtLimit) return

    setIsSubmitting(true)

    setTimeout(() => {
      const now = new Date().toISOString()

      setComments((currentComments) => [
        ...currentComments,
        {
          id: `c-${Date.now()}`,
          content: trimmed,
          author: { id: 'me', name: 'Khairunnisa', email: 'khrnsa@example.com', avatarUrl: null },
          createdAt: now,
          updatedAt: now,
        },
      ])
      setCommentInput('')
      setIsSubmitting(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }, 150)
  }

  const content = (
    <div
      className="relative flex max-h-[92vh] w-full max-w-[650px] flex-col overflow-hidden bg-white"
      style={{
        boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
        fontFamily: 'Arial, system-ui, Helvetica, sans-serif',
        borderRadius: '12px',
      }}
      onClick={stopPropagation}
    >
      <ModalHeader authorName={post.author.name} onClose={onClose} />

      <div className="flex-1 overflow-y-auto">
        <PostBody post={post} />
        <EngagementBar
          liked={liked}
          likeCount={likeCount}
          commentCount={comments.length}
          disableCommentFocus={isAtLimit}
          onLike={handleLike}
          onCommentFocus={() => inputRef.current?.focus()}
        />

        <div className="flex items-center px-4 pt-2 pb-1">
          <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[14px] font-semibold text-[#65676B] transition-colors hover:bg-[#F2F3F5] focus:outline-none">
            Paling relevan <span className="translate-y-[1px] text-[10px] text-[#65676B]">v</span>
          </button>
        </div>

        <CommentList comments={comments} />
      </div>

      <CommentComposer
        value={commentInput}
        isSubmitting={isSubmitting}
        isAtLimit={isAtLimit}
        maxComments={MAX_COMMENTS}
        inputRef={inputRef}
        onChange={setCommentInput}
        onSubmit={handleSubmitComment}
      />
    </div>
  )

  if (!isModal) {
    return (
      <AppLayout>
        <div className="flex justify-center">
          {content}
        </div>
      </AppLayout>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      {content}
    </div>
  )
}
