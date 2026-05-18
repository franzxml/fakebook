import { useEffect, useRef, useState } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { createPostComment, fetchPostComments, getStoredSession, getStoredUser, likePost, unlikePost } from '@/services/api'
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
  autoFocusComment?: boolean
  onClose?: () => void
}

function stopPropagation(event: React.MouseEvent) {
  event.stopPropagation()
}

export function PostDetailPage({ post, comments: initialComments, autoFocusComment = false, onClose }: PostDetailPageProps) {
  const [comments, setComments] = useState<PostComment[]>(initialComments ?? fallbackPostComments)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [commentInput, setCommentInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingLike, setIsUpdatingLike] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [composerError, setComposerError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const currentUser = getStoredUser()
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

  useEffect(() => {
    let isMounted = true

    fetchPostComments(post.id)
      .then((response) => {
        if (!isMounted) return
        setCommentError(null)
        setComments(response.comments)
      })
      .catch(() => {
        if (!isMounted) return
        setCommentError('Gagal memuat komentar dari backend.')
        setComments(initialComments ?? fallbackPostComments)
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoadingComments(false)
      })

    return () => {
      isMounted = false
    }
  }, [initialComments, post.id])

  useEffect(() => {
    if (!autoFocusComment) return

    window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 150)
  }, [autoFocusComment])

  async function handleLike() {
    const session = getStoredSession()

    if (!session?.token || isUpdatingLike) {
      setComposerError('Sesi tidak ditemukan. Silakan login ulang.')
      return
    }

    const nextLiked = !liked

    setIsUpdatingLike(true)
    setComposerError(null)
    setLiked(nextLiked)
    setLikeCount((currentCount) => Math.max(currentCount + (nextLiked ? 1 : -1), 0))

    try {
      if (nextLiked) {
        await likePost(post.id, session.token)
      } else {
        await unlikePost(post.id, session.token)
      }
    } catch (error) {
      setLiked(!nextLiked)
      setLikeCount((currentCount) => Math.max(currentCount + (nextLiked ? -1 : 1), 0))
      setComposerError(error instanceof Error ? error.message : 'Aksi suka gagal diproses.')
    } finally {
      setIsUpdatingLike(false)
    }
  }

  async function handleSubmitComment() {
    const trimmed = commentInput.trim()
    if (!trimmed || isSubmitting || isAtLimit) return

    const session = getStoredSession()

    if (!session?.token) {
      setComposerError('Sesi tidak ditemukan. Silakan login ulang.')
      return
    }

    setIsSubmitting(true)
    setComposerError(null)

    try {
      const comment = await createPostComment(post.id, trimmed, session.token)
      setComments((currentComments) => [...currentComments, comment])
      setCommentInput('')
      setTimeout(() => inputRef.current?.focus(), 50)
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : 'Komentar gagal dikirim.')
    } finally {
      setIsSubmitting(false)
    }
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
          shareCount={0}
          disableCommentFocus={isAtLimit}
          isUpdatingLike={isUpdatingLike}
          onLike={handleLike}
          onCommentFocus={() => inputRef.current?.focus()}
        />

        <div className="flex items-center px-4 pt-2 pb-1">
          <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[14px] font-semibold text-[#65676B] transition-colors hover:bg-[#F2F3F5] focus:outline-none">
            Paling relevan <span className="translate-y-[1px] text-[10px] text-[#65676B]">v</span>
          </button>
        </div>

        {isLoadingComments ? (
          <div className="px-4 py-6 text-center text-sm text-[#65676B]">
            Memuat komentar...
          </div>
        ) : commentError ? (
          <div className="px-4 py-6 text-center text-sm font-medium text-red-500">
            {commentError}
          </div>
        ) : comments.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-[#65676B]">
            Belum ada komentar.
          </div>
        ) : (
          <CommentList comments={comments} />
        )}
      </div>

      <CommentComposer
        currentUser={currentUser}
        value={commentInput}
        isSubmitting={isSubmitting}
        isAtLimit={isAtLimit}
        maxComments={MAX_COMMENTS}
        inputRef={inputRef}
        onChange={setCommentInput}
        onSubmit={handleSubmitComment}
      />
      {composerError ? (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-700" role="alert">
          {composerError}
        </p>
      ) : null}
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
