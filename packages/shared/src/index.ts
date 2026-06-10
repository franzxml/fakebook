export type ApiHealth = {
  status: 'ok'
  appName: string
  version: string
  timestamp: string
}

/**
 * Identitas user yang aman ditampilkan ke user lain (author post/komentar,
 * daftar pengguna, notifikasi). Tidak memuat email atau data privat lain.
 */
export type PublicAuthor = {
  id: string
  name: string
  username: string | null
  avatarUrl: string | null
  bio: string | null
}

/**
 * Profil user untuk pemiliknya sendiri (response auth & /profile).
 * Email hanya boleh muncul di sini, bukan di PublicAuthor.
 */
export type PublicUser = PublicAuthor & {
  email: string
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
  author: PublicAuthor
  images: {
    id: string
    imageUrl: string
    createdAt: string
  }[]
  likes?: {
    userId: string
  }[]
  createdAt: string
  updatedAt: string
  _count: {
    comments: number
    likes: number
  }
}

export type NotificationType = 'post_like' | 'post_comment' | 'comment_reply'

export type AppNotification = {
  id: string
  type: NotificationType | string
  isRead: boolean
  actor: PublicAuthor | null
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
  name: 'Fakebook',
  version: '0.1.0',
} as const

export const createHealthPayload = (date = new Date()): ApiHealth => ({
  status: 'ok',
  appName: appMetadata.name,
  version: appMetadata.version,
  timestamp: date.toISOString(),
})
