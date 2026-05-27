import { useEffect, useRef, useState } from 'react'
import {
  createPostComment,
  deleteComment,
  fetchPostComments,
  getStoredSession,
  updateComment,
} from '@/services/api'
import type { PostComment } from '@/types/social'

type UsePostCommentsOptions = {
  initialComments?: PostComment[]
  maxComments: number
  postId: string
  onCommentCountChange?: (nextCommentCount: number) => void
}

function focusInput(input: HTMLInputElement | null) {
  window.setTimeout(() => input?.focus(), 50)
}

export function usePostComments({
  initialComments,
  maxComments,
  postId,
  onCommentCountChange,
}: UsePostCommentsOptions) {
  const [comments, setComments] = useState<PostComment[]>(initialComments ?? [])
  const [commentInput, setCommentInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [replyingToComment, setReplyingToComment] = useState<PostComment | null>(null)
  const [isUpdatingComment, setIsUpdatingComment] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [composerError, setComposerError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAtLimit = comments.length >= maxComments

  useEffect(() => {
    let isMounted = true

    setIsLoadingComments(true)
    fetchPostComments(postId)
      .then((response) => {
        if (!isMounted) return
        setCommentError(null)
        setComments(response.comments)
        onCommentCountChange?.(response.comments.length)
      })
      .catch(() => {
        if (!isMounted) return
        setCommentError('Gagal memuat komentar dari backend.')
        setComments([])
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoadingComments(false)
      })

    return () => {
      isMounted = false
    }
  }, [onCommentCountChange, postId])

  async function submitComment() {
    const trimmed = commentInput.trim()
    if (!trimmed || isSubmitting || (!editingCommentId && isAtLimit)) return

    const session = getStoredSession()

    if (!session?.token) {
      setComposerError('Sesi tidak ditemukan. Silakan login ulang.')
      return
    }

    setIsSubmitting(true)
    setComposerError(null)

    try {
      if (editingCommentId) {
        const comment = await updateComment(editingCommentId, trimmed, session.token)
        setComments((currentComments) =>
          currentComments.map((currentComment) => currentComment.id === comment.id ? comment : currentComment),
        )
        setEditingCommentId(null)
      } else {
        const comment = await createPostComment(postId, trimmed, session.token, replyingToComment?.id)
        setComments((currentComments) => {
          const nextComments = [...currentComments, comment]
          onCommentCountChange?.(nextComments.length)
          return nextComments
        })
        setReplyingToComment(null)
      }
      setCommentInput('')
      focusInput(inputRef.current)
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : 'Komentar gagal dikirim.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function startEditComment(comment: PostComment) {
    setEditingCommentId(comment.id)
    setReplyingToComment(null)
    setCommentInput(comment.content)
    setComposerError(null)
    focusInput(inputRef.current)
  }

  function startReplyComment(comment: PostComment) {
    setEditingCommentId(null)
    setReplyingToComment(comment)
    setCommentInput('')
    setComposerError(null)
    focusInput(inputRef.current)
  }

  function cancelComposerMode() {
    setEditingCommentId(null)
    setReplyingToComment(null)
    setCommentInput('')
    setComposerError(null)
  }

  async function deleteSelectedComment(comment: PostComment) {
    const session = getStoredSession()

    if (!session?.token || isUpdatingComment) {
      setComposerError('Sesi tidak ditemukan. Silakan login ulang.')
      return
    }

    if (!window.confirm('Hapus komentar ini?')) return

    setIsUpdatingComment(true)
    setComposerError(null)

    try {
      await deleteComment(comment.id, session.token)
      setComments((currentComments) => {
        const nextComments = currentComments.filter((currentComment) => (
          currentComment.id !== comment.id && currentComment.parentCommentId !== comment.id
        ))
        onCommentCountChange?.(nextComments.length)
        return nextComments
      })
      if (editingCommentId === comment.id || replyingToComment?.id === comment.id) {
        cancelComposerMode()
      }
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : 'Komentar gagal dihapus.')
    } finally {
      setIsUpdatingComment(false)
    }
  }

  return {
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
  }
}
