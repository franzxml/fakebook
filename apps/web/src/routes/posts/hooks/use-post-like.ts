import { useState } from 'react'
import { getStoredSession, likePost, unlikePost } from '@/services/api'
import type { FeedPost } from '@/types/social'

type UsePostLikeOptions = {
  post: FeedPost
  currentUserId?: string
  onLikeStatusChange?: (nextLikeCount: number, nextLiked: boolean) => void
}

function isPostLikedByUser(post: FeedPost, userId?: string) {
  return Boolean(userId && post.likes?.some((like) => like.userId === userId))
}

export function usePostLike({ post, currentUserId, onLikeStatusChange }: UsePostLikeOptions) {
  const [optimisticState, setOptimisticState] = useState<{ liked: boolean; likeCount: number } | null>(null)
  const [isUpdatingLike, setIsUpdatingLike] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)
  const liked = optimisticState?.liked ?? isPostLikedByUser(post, currentUserId)
  const likeCount = optimisticState?.likeCount ?? post._count.likes

  async function handleLike() {
    const session = getStoredSession()

    if (!session?.token || isUpdatingLike) {
      setLikeError('Sesi tidak ditemukan. Silakan login ulang.')
      return
    }

    const nextLiked = !liked
    const nextLikeCount = Math.max(likeCount + (nextLiked ? 1 : -1), 0)

    setIsUpdatingLike(true)
    setLikeError(null)
    setOptimisticState({ liked: nextLiked, likeCount: nextLikeCount })
    onLikeStatusChange?.(nextLikeCount, nextLiked)

    try {
      if (nextLiked) {
        await likePost(post.id, session.token)
      } else {
        await unlikePost(post.id, session.token)
      }
    } catch (error) {
      const rollbackLikeCount = Math.max(nextLikeCount + (nextLiked ? -1 : 1), 0)
      setOptimisticState({ liked: !nextLiked, likeCount: rollbackLikeCount })
      onLikeStatusChange?.(rollbackLikeCount, !nextLiked)
      setLikeError(error instanceof Error ? error.message : 'Aksi suka gagal diproses.')
    } finally {
      setOptimisticState(null)
      setIsUpdatingLike(false)
    }
  }

  return {
    handleLike,
    isUpdatingLike,
    likeCount,
    likeError,
    liked,
  }
}
