import type { FeedPost, PublicUser } from '@ppwl/shared'

export type { AppNotification, FeedPost, PublicUser } from '@ppwl/shared'
export type PostImage = FeedPost['images'][number]

export type PostComment = {
  id: string
  parentCommentId: string | null
  content: string
  author: PublicUser
  parentComment?: PostComment | null
  createdAt: string
  updatedAt: string
}
