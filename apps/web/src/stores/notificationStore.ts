import { create } from 'zustand'
import type { AppNotification, MarkNotificationsReadResponse, NotificationResponse } from '@ppwl/shared'
import { apiRequest, fetchNotifications } from '@/services/api'

type NotificationStore = {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  lastFetchedAt: number | null
  setNotifications: (notifications: AppNotification[]) => void
  prependNotification: (notification: AppNotification) => void
  fetchForToken: (token: string | null) => Promise<void>
  markAsRead: (notificationId: string, token: string | null) => Promise<void>
  markAllAsRead: (token: string | null) => Promise<void>
  reset: () => void
}

function countUnread(notifications: AppNotification[]) {
  return notifications.filter((notification) => !notification.isRead).length
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isUpdating: false,
  error: null,
  lastFetchedAt: null,
  setNotifications: (notifications) => {
    set({
      notifications,
      unreadCount: countUnread(notifications),
      lastFetchedAt: Date.now(),
      error: null,
    })
  },
  prependNotification: (notification) => {
    const nextNotifications = [
      notification,
      ...get().notifications.filter((item) => item.id !== notification.id),
    ]

    set({
      notifications: nextNotifications,
      unreadCount: countUnread(nextNotifications),
      lastFetchedAt: Date.now(),
      error: null,
    })
  },
  fetchForToken: async (token) => {
    if (!token) {
      get().reset()
      return
    }

    set({ isLoading: true, error: null })

    try {
      const response = await fetchNotifications(token)
      get().setNotifications(response.notifications)
    } catch {
      set({ error: 'Notifikasi belum bisa dimuat dari server.' })
    } finally {
      set({ isLoading: false })
    }
  },
  markAsRead: async (notificationId, token) => {
    if (!token) return

    set({ isUpdating: true, error: null })

    try {
      const response = await apiRequest<NotificationResponse>(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token,
      })
      const nextNotifications = get().notifications.map((notification) =>
        notification.id === notificationId ? response.notification : notification,
      )
      get().setNotifications(nextNotifications)
    } catch {
      set({ error: 'Notifikasi gagal ditandai sebagai dibaca.' })
    } finally {
      set({ isUpdating: false })
    }
  },
  markAllAsRead: async (token) => {
    if (!token || get().unreadCount === 0) return

    set({ isUpdating: true, error: null })

    try {
      await apiRequest<MarkNotificationsReadResponse>('/notifications/read-all', {
        method: 'PATCH',
        token,
      })
      const nextNotifications = get().notifications.map((notification) => ({ ...notification, isRead: true }))
      get().setNotifications(nextNotifications)
    } catch {
      set({ error: 'Semua notifikasi gagal ditandai sebagai dibaca.' })
    } finally {
      set({ isUpdating: false })
    }
  },
  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isUpdating: false,
      error: null,
      lastFetchedAt: null,
    })
  },
}))
