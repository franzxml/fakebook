import type { AppNotification } from '@/types/social'

const TWO_DAYS_MS = 1000 * 60 * 60 * 24 * 2

export function getRelativeTime(value: string) {
  const diffMinutes = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 60000), 0)

  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} jam`

  return `${Math.floor(diffHours / 24)} hari`
}

export function isRecentNotification(notification: AppNotification) {
  return Date.now() - new Date(notification.createdAt).getTime() < TWO_DAYS_MS
}

export function groupNotificationsByRecency(
  notifications: AppNotification[],
  mode: 'all' | 'unread' = 'all',
) {
  const filtered = mode === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications

  return {
    filtered,
    recent: filtered.filter(isRecentNotification),
    previous: filtered.filter((n) => !isRecentNotification(n)),
  }
}
