import { useEffect, useState } from 'react'
import { CheckCheck, MessageCircle, MoreHorizontal, ThumbsUp } from 'lucide-react'
import type { MarkNotificationsReadResponse, NotificationResponse, PublicUser } from '@ppwl/shared'
import { apiRequest, fetchNotifications, getStoredSession } from '@/services/api'
import type { AppNotification } from '@/types/social'

function getNotificationText(notification: AppNotification) {
  const actorName = notification.actor?.name ?? 'Seseorang'

  if (notification.type === 'post_like') {
    return `${actorName} menyukai postingan Anda.`
  }

  if (notification.type === 'post_comment') {
    return `${actorName} mengomentari postingan Anda${notification.post?.content ? `: ${notification.post.content}` : '.'}`
  }

  return `${actorName} berinteraksi dengan postingan Anda.`
}

function getRelativeTime(value: string) {
  const diffMinutes = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 60000), 0)

  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} jam`

  return `${Math.floor(diffHours / 24)} hari`
}

function isRecentNotification(notification: AppNotification) {
  return Date.now() - new Date(notification.createdAt).getTime() < 1000 * 60 * 60 * 24 * 2
}

export function NotificationDropdown({ currentUser }: { currentUser?: PublicUser | null }) {
  const token = getStoredSession()?.token
  const [items, setItems] = useState<AppNotification[]>([])
  const [mode, setMode] = useState<'all' | 'unread'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (!token) {
      setItems([])
      setError('Login untuk melihat notifikasi akun Anda.')
      setIsLoading(false)
      return () => {
        isMounted = false
      }
    }

    fetchNotifications(token)
      .then((response) => {
        if (!isMounted) return
        setItems(response.notifications)
        setError(null)
      })
      .catch(() => {
        if (!isMounted) return
        setError('Notifikasi belum bisa dimuat dari server.')
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const unreadCount = items.filter((notification) => !notification.isRead).length
  const filteredItems = mode === 'unread' ? items.filter((notification) => !notification.isRead) : items
  const newItems = filteredItems.filter(isRecentNotification)
  const previousItems = filteredItems.filter((notification) => !isRecentNotification(notification))

  async function markAsRead(notificationId: string) {
    if (!token) return

    setIsUpdating(true)
    setError(null)

    try {
      const response = await apiRequest<NotificationResponse>(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token,
      })
      setItems((currentItems) =>
        currentItems.map((notification) => notification.id === notificationId ? response.notification : notification),
      )
    } catch {
      setError('Notifikasi gagal ditandai sebagai dibaca.')
    } finally {
      setIsUpdating(false)
    }
  }

  async function markAllAsRead() {
    if (!token || unreadCount === 0) return

    setIsUpdating(true)
    setError(null)

    try {
      await apiRequest<MarkNotificationsReadResponse>('/notifications/read-all', {
        method: 'PATCH',
        token,
      })
      setItems((currentItems) => currentItems.map((notification) => ({ ...notification, isRead: true })))
    } catch {
      setError('Semua notifikasi gagal ditandai sebagai dibaca.')
    } finally {
      setIsUpdating(false)
    }
  }

  function renderNotification(notification: AppNotification) {
    const actor = notification.actor
    const avatarUrl = actor?.avatarUrl
    const initial = actor?.name?.charAt(0).toUpperCase() || 'F'

    return (
      <button
        key={notification.id}
        type="button"
        disabled={isUpdating}
        className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-gray-100 ${notification.isRead ? '' : 'bg-blue-50'}`}
        onClick={() => {
          if (!notification.isRead) void markAsRead(notification.id)
        }}
      >
        <span className="relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-300 text-lg font-bold text-white">
              {initial}
            </span>
          )}
          <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-blue-600 text-white">
            {notification.type === 'post_comment' ? <MessageCircle size={15} fill="currentColor" /> : <ThumbsUp size={15} fill="currentColor" />}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-3 text-[15px] leading-tight text-gray-950">{getNotificationText(notification)}</span>
          <span className="mt-1 block text-sm font-semibold text-blue-600">{getRelativeTime(notification.createdAt)}</span>
        </span>
        {!notification.isRead ? <span className="h-3 w-3 shrink-0 rounded-full bg-blue-600" /> : null}
      </button>
    )
  }

  return (
    <section className="absolute right-4 top-14 z-50 max-h-[calc(100vh-4.5rem)] w-[390px] overflow-y-auto rounded-xl bg-white p-4 text-gray-950 shadow-2xl ring-1 ring-black/10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Notifikasi</h2>
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
        <h3 className="text-lg font-bold">Baru</h3>
        <button
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-blue-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
          disabled={isUpdating || unreadCount === 0}
          onClick={markAllAsRead}
        >
          <CheckCheck size={16} />
          Tandai semua
        </button>
      </div>

      {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
      {isLoading ? <p className="py-8 text-center text-sm text-gray-500">Memuat notifikasi...</p> : null}
      {!isLoading && filteredItems.length === 0 ? (
        <p className="py-8 text-center text-sm font-semibold text-gray-600">
          {currentUser ? 'Belum ada notifikasi' : 'Login untuk melihat notifikasi'}
        </p>
      ) : null}

      {!isLoading && newItems.length > 0 ? <div className="mt-2 space-y-1">{newItems.map(renderNotification)}</div> : null}
      {!isLoading && previousItems.length > 0 ? (
        <>
          <h3 className="mt-5 text-lg font-bold">Terdahulu</h3>
          <div className="mt-2 space-y-1">{previousItems.map(renderNotification)}</div>
        </>
      ) : null}
    </section>
  )
}
