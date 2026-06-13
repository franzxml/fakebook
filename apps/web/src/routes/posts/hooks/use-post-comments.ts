import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()
  const [commentInput, setCommentInput] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [replyingToComment, setReplyingToComment] = useState<PostComment | null>(null)
  const [composerError, setComposerError] = useState<string | null>(null)
  const [commentToDelete, setCommentToDelete] = useState<PostComment | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onCommentCountChangeRef = useRef(onCommentCountChange)

  useEffect(() => {
    onCommentCountChangeRef.current = onCommentCountChange
  }, [onCommentCountChange])

  const commentsQuery = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchPostComments(postId),
    initialData: initialComments !== undefined ? { comments: initialComments } : undefined,
  })

  const comments = commentsQuery.data?.comments ?? []
  const isAtLimit = comments.length >= maxComments

  useEffect(() => {
    onCommentCountChangeRef.current?.(comments.length)
  }, [comments.length])

  const createMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) => {
      const session = getStoredSession()
      if (!session?.token) throw new Error('Sesi tidak ditemukan. Silakan login ulang.')
      return createPostComment(postId, content, session.token, parentId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setReplyingToComment(null)
      setCommentInput('')
      focusInput(inputRef.current)
    },
    onError: (error) => {
      setComposerError(error instanceof Error ? error.message : 'Komentar gagal dikirim.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => {
      const session = getStoredSession()
      if (!session?.token) throw new Error('Sesi tidak ditemukan. Silakan login ulang.')
      return updateComment(commentId, content, session.token)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setEditingCommentId(null)
      setCommentInput('')
      focusInput(inputRef.current)
    },
    onError: (error) => {
      setComposerError(error instanceof Error ? error.message : 'Komentar gagal diperbarui.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => {
      const session = getStoredSession()
      if (!session?.token) throw new Error('Sesi tidak ditemukan. Silakan login ulang.')
      return deleteComment(commentId, session.token)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setCommentToDelete(null)
    },
    onError: (error) => {
      setDeleteError(error instanceof Error ? error.message : 'Komentar gagal dihapus.')
    },
  })

  function submitComment() {
    const trimmed = commentInput.trim()
    if (!trimmed || createMutation.isPending || updateMutation.isPending || (!editingCommentId && isAtLimit)) return
    setComposerError(null)
    if (editingCommentId) {
      updateMutation.mutate({ commentId: editingCommentId, content: trimmed })
    } else {
      createMutation.mutate({ content: trimmed, parentId: replyingToComment?.id })
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

  function deleteSelectedComment(comment: PostComment) {
    setDeleteError(null)
    setCommentToDelete(comment)
  }

  function cancelDelete() {
    setCommentToDelete(null)
    setDeleteError(null)
  }

  function confirmDeleteComment() {
    if (!commentToDelete) return
    if (editingCommentId === commentToDelete.id || replyingToComment?.id === commentToDelete.id) {
      cancelComposerMode()
    }
    setDeleteError(null)
    deleteMutation.mutate(commentToDelete.id)
  }

  return {
    cancelComposerMode,
    cancelDelete,
    commentError: commentsQuery.isError ? 'Gagal memuat komentar dari backend.' : null,
    commentInput,
    commentToDelete,
    comments,
    composerError,
    confirmDeleteComment,
    deleteError,
    deleteSelectedComment,
    editingCommentId,
    inputRef,
    isAtLimit,
    isLoadingComments: commentsQuery.isLoading,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isUpdatingComment: deleteMutation.isPending,
    replyingToComment,
    setCommentInput,
    startEditComment,
    startReplyComment,
    submitComment,
  }
}
