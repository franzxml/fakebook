import { useState } from 'react'
import { CheckCheck, MessageCircle, MoreHorizontal, ThumbsUp } from 'lucide-react'
import type { PublicUser } from '@ppwl/shared'
import { getStoredSession } from '@/services/api'
import { getDisplayName } from '@/lib/user-display'
import { getNotificationKind, getNotificationText } from '@/lib/notification-display'
import { getRelativeTime, groupNotificationsByRecency } from '@/lib/notification-utils'
import { useNotificationStore } from '@/stores'
import type { AppNotification } from '@/types/social'

export function NotificationDropdown({ currentUser }: { currentUser?: PublicUser | null }) {
  const token = getStoredSession()?.token
  const items = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const isLoading = useNotificationStore((state) => state.isLoading)
  const isUpdating = useNotificationStore((state) => state.isUpdating)
  const error = useNotificationStore((state) => state.error)
  const markNotificationAsRead = useNotificationStore((state) => state.markAsRead)
  const markEveryNotificationAsRead = useNotificationStore((state) => state.markAllAsRead)
  const [mode, setMode] = useState<'all' | 'unread'>('all')

  const { recent: newItems, previous: previousItems, filtered: filteredItems } = groupNotificationsByRecency(items, mode)

  async function markAsRead(notificationId: string) {
    await markNotificationAsRead(notificationId, token ?? null)
  }

  async function markAllAsRead() {
    await markEveryNotificationAsRead(token ?? null)
  }

  function renderNotification(notification: AppNotification) {
    const actor = notification.actor
    const avatarUrl = actor?.avatarUrl
    const initial = getDisplayName(actor).charAt(0).toUpperCase()
    const isCommentNotification = getNotificationKind(notification) === 'comment'

    return (
      <button
        key={notification.id}
        type="button"
        disabled={isUpdating}
        className={`flex w-full items-start gap-2 rounded-lg p-2 text-left transition hover:bg-gray-100 min-[375px]:gap-3 ${notification.isRead ? '' : 'bg-blue-50'}`}
        onClick={() => {
          if (!notification.isRead) void markAsRead(notification.id)
        }}
      >
        <span className="relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover min-[375px]:h-12 min-[375px]:w-12 sm:h-14 sm:w-14" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-300 text-base font-bold text-white min-[375px]:h-12 min-[375px]:w-12 sm:h-14 sm:w-14 sm:text-lg">
              {initial}
            </span>
          )}
          <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-blue-600 text-white sm:h-7 sm:w-7">
            {isCommentNotification ? <MessageCircle size={15} fill="currentColor" aria-hidden="true" /> : <ThumbsUp size={15} fill="currentColor" aria-hidden="true" />}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-3 break-words text-[14px] leading-snug text-gray-950 min-[375px]:text-[15px]">{getNotificationText(notification)}</span>
          <span className="mt-1 block text-sm font-semibold text-blue-600">{getRelativeTime(notification.createdAt)}</span>
        </span>
        {!notification.isRead ? <span className="h-3 w-3 shrink-0 rounded-full bg-blue-600" /> : null}
      </button>
    )
  }

  return (
    <section className="fixed left-2 right-2 top-16 z-50 max-h-[calc(100vh-4.75rem)] overflow-y-auto rounded-xl bg-white p-3 text-gray-950 shadow-2xl ring-1 ring-black/10 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[390px] sm:p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Notifikasi</h2>
        <button className="grid h-9 w-9 place-items-center rounded-full text-gray-600 hover:bg-gray-100" aria-label="Opsi notifikasi">
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1.5 sm:gap-2">
        <button
          className={`rounded-full px-3 py-2 text-sm font-semibold sm:px-4 ${mode === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-900 hover:bg-gray-100'}`}
          onClick={() => setMode('all')}
        >
          Semua
        </button>
        <button
          className={`rounded-full px-3 py-2 text-sm font-semibold sm:px-4 ${mode === 'unread' ? 'bg-blue-50 text-blue-600' : 'text-gray-900 hover:bg-gray-100'}`}
          onClick={() => setMode('unread')}
        >
          Belum Dibaca
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-base font-bold sm:text-lg">Baru</h3>
        <button
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 min-[375px]:text-sm"
          disabled={isUpdating || unreadCount === 0}
          onClick={markAllAsRead}
        >
          <CheckCheck size={16} aria-hidden="true" />
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
