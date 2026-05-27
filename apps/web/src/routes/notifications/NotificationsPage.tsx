import { Bell, CheckCheck, MessageCircle, MoreHorizontal, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { getStoredSession } from '@/services/api'
import { HomeTopBar } from '@/routes/home/components/HomeTopBar'
import { getNotificationContent, getNotificationKind } from '@/lib/notificationDisplay'
import { getDisplayName } from '@/lib/userDisplay'
import { useAuthStore, useNotificationStore } from '@/stores'
import type { AppNotification, PublicUser } from '@/types/social'

type NotificationsPageProps = {
  notifications: AppNotification[]
  token?: string | null
}

type FilterMode = 'all' | 'unread'

const fallbackTokenKeys = ['ppwl-session-token', 'ppwl-auth-token', 'sessionToken', 'token']

function getStoredToken() {
  if (typeof window === 'undefined') return null

  const session = getStoredSession()
  if (session?.token) return session.token

  for (const key of fallbackTokenKeys) {
    const token = window.localStorage.getItem(key)
    if (token) return token
  }

  return null
}

function getRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0)

  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} jam`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} hari`
}

function isRecentNotification(notification: AppNotification) {
  const diffMs = Date.now() - new Date(notification.createdAt).getTime()
  return diffMs < 1000 * 60 * 60 * 24 * 2
}

function Avatar({ user }: { user: PublicUser | null }) {
  const initial = getDisplayName(user).charAt(0).toUpperCase()

  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-300 text-lg font-bold text-white">
      {initial}
    </div>
  )
}

function NotificationBadge({ type }: { type: string }) {
  const isComment = getNotificationKind({ type }) === 'comment'
  const Icon = isComment ? MessageCircle : ThumbsUp

  return (
    <span className={`absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white text-white ${isComment ? 'bg-blue-600' : 'bg-[#1877f2]'}`}>
      <Icon size={15} fill="currentColor" />
    </span>
  )
}

function NotificationItem({
  notification,
  disabled,
  onRead,
}: {
  notification: AppNotification
  disabled: boolean
  onRead: (notificationId: string) => void
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-gray-100 ${notification.isRead ? '' : 'bg-blue-50'}`}
      disabled={disabled}
      onClick={() => {
        if (!notification.isRead) onRead(notification.id)
      }}
    >
      <span className="relative shrink-0">
        <Avatar user={notification.actor} />
        <NotificationBadge type={notification.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-3 text-[15px] leading-tight text-gray-950">
          {getNotificationContent(notification)}
        </span>
        <span className="mt-1 block text-sm font-semibold text-blue-600">
          {getRelativeTime(notification.createdAt)}
        </span>
      </span>
      {!notification.isRead ? <span className="h-3 w-3 shrink-0 rounded-full bg-blue-600" /> : null}
    </button>
  )
}

export function NotificationsPage({ notifications, token }: NotificationsPageProps) {
  const authToken = token ?? getStoredToken()
  const currentUser = useAuthStore((state) => state.user)
  const storeItems = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const isLoading = useNotificationStore((state) => state.isLoading)
  const isUpdating = useNotificationStore((state) => state.isUpdating)
  const error = useNotificationStore((state) => state.error)
  const markNotificationAsRead = useNotificationStore((state) => state.markAsRead)
  const markEveryNotificationAsRead = useNotificationStore((state) => state.markAllAsRead)
  const items = storeItems.length > 0 ? storeItems : notifications
  const [mode, setMode] = useState<FilterMode>('all')

  const filteredItems = mode === 'unread' ? items.filter((notification) => !notification.isRead) : items
  const newItems = filteredItems.filter(isRecentNotification)
  const previousItems = filteredItems.filter((notification) => !isRecentNotification(notification))

  async function markAsRead(notificationId: string) {
    await markNotificationAsRead(notificationId, authToken)
  }

  async function markAllAsRead() {
    await markEveryNotificationAsRead(authToken)
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-950">
      <HomeTopBar currentPath="/notifications" currentUser={currentUser} />
      <main className="mx-auto flex max-w-[1180px] justify-start px-4 pt-20">
        <section className="w-full max-w-[430px] rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Notifikasi</h1>
            <button className="grid h-9 w-9 place-items-center rounded-full text-gray-600 hover:bg-gray-100">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-900 hover:bg-gray-100'}`}
              onClick={() => setMode('all')}
            >
              Semua
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'unread' ? 'bg-blue-50 text-blue-600' : 'text-gray-900 hover:bg-gray-100'}`}
              onClick={() => setMode('unread')}
            >
              Belum Dibaca
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Baru</h2>
            <button
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-blue-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
              disabled={isUpdating || unreadCount === 0}
              onClick={markAllAsRead}
            >
              <CheckCheck size={16} />
              Tandai semua
            </button>
          </div>

          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          {isLoading ? <p className="py-8 text-center text-sm text-gray-500">Memuat notifikasi...</p> : null}

          {!isLoading && filteredItems.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="mx-auto h-9 w-9 text-gray-400" />
              <p className="mt-3 text-sm font-semibold text-gray-700">
                {mode === 'unread' ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}
              </p>
            </div>
          ) : null}

          {!isLoading && newItems.length > 0 ? (
            <div className="mt-2 space-y-1">
              {newItems.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  disabled={isUpdating}
                  onRead={markAsRead}
                />
              ))}
            </div>
          ) : null}

          {!isLoading && previousItems.length > 0 ? (
            <>
              <h2 className="mt-5 text-lg font-bold">Terdahulu</h2>
              <div className="mt-2 space-y-1">
                {previousItems.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    disabled={isUpdating}
                    onRead={markAsRead}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </main>
    </div>
  )
}
