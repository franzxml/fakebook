export type ApiHealth = {
  status: 'ok'
  appName: string
  version: string
  timestamp: string
}

export type PublicUser = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export type SessionPayload = {
  token: string
  expiresAt: string
}

export type AuthResponse = {
  user: PublicUser
  session: SessionPayload
}

export type FeedPost = {
  id: string
  content: string
  author: PublicUser
  images: {
    id: string
    imageUrl: string
    createdAt: string
  }[]
  createdAt: string
  updatedAt: string
  _count: {
    comments: number
    likes: number
  }
}

export type NotificationType = 'post_like' | 'post_comment'

export type AppNotification = {
  id: string
  type: NotificationType | string
  isRead: boolean
  actor: PublicUser | null
  post: {
    id: string
    content: string
    createdAt: string
  } | null
  createdAt: string
}

export type NotificationsResponse = {
  notifications: AppNotification[]
  unreadCount: number
}

export type NotificationResponse = {
  notification: AppNotification
}

export type MarkNotificationsReadResponse = {
  success: true
  updated: number
}

export const appMetadata = {
  name: 'PPWL Clone Facebook',
  version: '0.1.0',
} as const

export const createHealthPayload = (date = new Date()): ApiHealth => ({
  status: 'ok',
  appName: appMetadata.name,
  version: appMetadata.version,
  timestamp: date.toISOString(),
})
