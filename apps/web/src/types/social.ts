import type { PublicAuthor } from '@ppwl/shared'

export type { AppNotification, FeedPost, PublicAuthor, PublicUser } from '@ppwl/shared'

export type PostComment = {
  id: string
  parentCommentId: string | null
  content: string
  author: PublicAuthor
  parentComment?: PostComment | null
  createdAt: string
  updatedAt: string
}
