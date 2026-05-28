import { useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { getStoredUser } from '@/services/api'
import { getDisplayName } from '@/lib/userDisplay'
import type { FeedPost, PostComment } from '@/types/social'
import { CommentComposer } from './components/CommentComposer'
import { CommentList } from './components/CommentList'
import { EngagementBar } from './components/EngagementBar'
import { ModalHeader } from './components/ModalHeader'
import { PostBody } from './components/PostBody'
import { usePostComments } from './hooks/usePostComments'
import { usePostLike } from './hooks/usePostLike'

const MAX_COMMENTS = 50

type PostDetailPageProps = {
  post: FeedPost
  comments?: PostComment[]
  autoFocusComment?: boolean
  onCommentCountChange?: (nextCommentCount: number) => void
  onLikeStatusChange?: (nextLikeCount: number, nextLiked: boolean) => void
  onClose?: () => void
}

function stopPropagation(event: React.MouseEvent) {
  event.stopPropagation()
}

export function PostDetailPage({
  post,
  comments: initialComments,
  autoFocusComment = false,
  onCommentCountChange,
  onLikeStatusChange,
  onClose,
}: PostDetailPageProps) {
  const currentUser = getStoredUser()
  const isModal = Boolean(onClose)
  const authorDisplayName = getDisplayName(post.author)
  const {
    cancelComposerMode,
    commentError,
    commentInput,
    comments,
    composerError,
    deleteSelectedComment,
    editingCommentId,
    inputRef,
    isAtLimit,
    isLoadingComments,
    isSubmitting,
    isUpdatingComment,
    replyingToComment,
    setCommentInput,
    startEditComment,
    startReplyComment,
    submitComment,
  } = usePostComments({
    initialComments,
    maxComments: MAX_COMMENTS,
    onCommentCountChange,
    postId: post.id,
  })
  const {
    handleLike,
    isUpdatingLike,
    likeCount,
    likeError,
    liked,
  } = usePostLike({
    currentUserId: currentUser?.id,
    onLikeStatusChange,
    post,
  })

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
    if (!autoFocusComment) return

    window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 150)
  }, [autoFocusComment, inputRef])

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
      <ModalHeader authorName={authorDisplayName} onClose={onClose} />

      <div className="flex-1 overflow-y-auto">
        <PostBody post={post} />
        <EngagementBar
          liked={liked}
          likeCount={likeCount}
          commentCount={comments.length}
          disableCommentFocus={isAtLimit}
          isUpdatingLike={isUpdatingLike}
          onLike={handleLike}
          onCommentFocus={() => inputRef.current?.focus()}
        />

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
          <CommentList
            comments={comments}
            currentUserId={currentUser?.id}
            isBusy={isUpdatingComment || isSubmitting}
            onEdit={startEditComment}
            onDelete={deleteSelectedComment}
            onReply={startReplyComment}
          />
        )}
      </div>

      {editingCommentId || replyingToComment ? (
        <div className="border-t border-blue-100 bg-blue-50 px-4 py-2 text-center text-xs font-semibold text-blue-700">
          {editingCommentId ? 'Mengedit komentar.' : `Membalas ${getDisplayName(replyingToComment?.author)}.`}
          <button className="ml-2 font-bold underline" onClick={cancelComposerMode}>
            Batal
          </button>
        </div>
      ) : null}
      <CommentComposer
        currentUser={currentUser}
        value={commentInput}
        isSubmitting={isSubmitting}
        isAtLimit={!editingCommentId && isAtLimit}
        maxComments={MAX_COMMENTS}
        placeholder={replyingToComment ? `Balas ${getDisplayName(replyingToComment.author)}...` : undefined}
        inputRef={inputRef}
        onChange={setCommentInput}
        onSubmit={submitComment}
      />
      {composerError || likeError ? (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-700" role="alert">
          {composerError ?? likeError}
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
