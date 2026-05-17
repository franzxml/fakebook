import { Bell, Check, CheckCheck, MessageCircle, ThumbsUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/layouts/AppLayout'
import { apiRequest } from '@/services/api'
import type { AppNotification } from '@/types/social'
import type {
  MarkNotificationsReadResponse,
  NotificationResponse,
  NotificationsResponse,
} from '@ppwl/shared'

type NotificationsPageProps = {
  notifications: AppNotification[]
  token?: string | null
}

const fallbackTokenKeys = ['ppwl-session-token', 'ppwl-auth-token', 'sessionToken', 'token']

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  for (const key of fallbackTokenKeys) {
    const token = window.localStorage.getItem(key)

    if (token) {
      return token
    }
  }

  return null
}

function getNotificationText(notification: AppNotification) {
  const actorName = notification.actor?.name ?? 'Seseorang'

  if (notification.type === 'post_like') {
    return `${actorName} menyukai postingan Anda`
  }

  if (notification.type === 'post_comment') {
    return `${actorName} mengomentari postingan Anda`
  }

  return `${actorName} berinteraksi dengan postingan Anda`
}

function getNotificationIcon(notification: AppNotification) {
  if (notification.type === 'post_like') {
    return <ThumbsUp className="size-4" aria-hidden="true" />
  }

  if (notification.type === 'post_comment') {
    return <MessageCircle className="size-4" aria-hidden="true" />
  }

  return <Bell className="size-4" aria-hidden="true" />
}

export function NotificationsPage({ notifications, token }: NotificationsPageProps) {
  const authToken = token ?? getStoredToken()
  const [items, setItems] = useState(() => notifications)
  const [isLoading, setIsLoading] = useState(Boolean(authToken))
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.isRead).length,
    [items],
  )

  useEffect(() => {
    if (!authToken) {
      return
    }

    let isActive = true

    apiRequest<NotificationsResponse>('/notifications', { token: authToken })
      .then((response) => {
        if (isActive) {
          setItems(response.notifications)
        }
      })
      .catch(() => {
        if (isActive) {
          setError('Notifikasi belum bisa dimuat dari server.')
          setItems(notifications)
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [authToken, notifications])

  async function markAsRead(notificationId: string) {
    setError(null)

    if (!authToken) {
      setItems((currentItems) =>
        currentItems.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification,
        ),
      )
      return
    }

    setIsUpdating(true)

    try {
      const response = await apiRequest<NotificationResponse>(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token: authToken,
      })

      setItems((currentItems) =>
        currentItems.map((notification) =>
          notification.id === notificationId ? response.notification : notification,
        ),
      )
    } catch {
      setError('Notifikasi gagal ditandai sebagai dibaca.')
    } finally {
      setIsUpdating(false)
    }
  }

  async function markAllAsRead() {
    setError(null)

    if (!authToken) {
      setItems((currentItems) =>
        currentItems.map((notification) => ({ ...notification, isRead: true })),
      )
      return
    }

    setIsUpdating(true)

    try {
      await apiRequest<MarkNotificationsReadResponse>('/notifications/read-all', {
        method: 'PATCH',
        token: authToken,
      })

      setItems((currentItems) =>
        currentItems.map((notification) => ({ ...notification, isRead: true })),
      )
    } catch {
      setError('Semua notifikasi gagal ditandai sebagai dibaca.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <AppLayout>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-950">Notifikasi</h1>
            <p className="mt-1 text-sm text-slate-500">
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua notifikasi sudah dibaca'}
            </p>
          </div>
          <Button
            variant="secondary"
            className="gap-2"
            disabled={isUpdating || unreadCount === 0}
            onClick={markAllAsRead}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            Tandai Dibaca
          </Button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 divide-y divide-slate-100">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Memuat notifikasi...</p>
          ) : null}

          {!isLoading && items.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="mx-auto size-8 text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-slate-700">Belum ada notifikasi</p>
            </div>
          ) : null}

          {!isLoading
            ? items.map((notification) => (
                <article
                  key={notification.id}
                  className={`flex gap-3 py-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50/60'}`}
                >
                  <div
                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
                      notification.isRead ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {getNotificationIcon(notification)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {getNotificationText(notification)}
                    </p>
                    {notification.post ? (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {notification.post.content}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {new Date(notification.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {!notification.isRead ? (
                    <button
                      type="button"
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Tandai notifikasi sebagai dibaca"
                      title="Tandai dibaca"
                      disabled={isUpdating}
                      onClick={() => void markAsRead(notification.id)}
                    >
                      <Check className="size-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </article>
              ))
            : null}
        </div>
      </section>
    </AppLayout>
  )
}
