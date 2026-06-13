import { create } from 'zustand'
import type { NotificationsResponse } from '@ppwl/shared'
import { connectRealtimeSocket, disconnectRealtimeSocket } from '@/lib/realtime-socket'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from './auth-store'

type RealtimeStore = {
  socketConnected: boolean
  socketError: string | null
  websocketUrl: string | null
  connect: (token: string | null) => void
  disconnect: () => void
}

// as: import.meta.env mengembalikan any untuk key kustom; nilai dipangkas
// dan difallback ke null sebelum dipakai.
const configuredWebsocketUrl = (import.meta.env.VITE_WEBSOCKET_URL as string | undefined)?.trim() || null

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  socketConnected: false,
  socketError: null,
  websocketUrl: configuredWebsocketUrl,
  connect: (token) => {
    if (!token || !configuredWebsocketUrl) return

    connectRealtimeSocket(configuredWebsocketUrl, token, {
      onConnected: () => set({ socketConnected: true, socketError: null }),
      onDisconnected: () => set({ socketConnected: false }),
      onError: (message) => set({ socketError: message }),
      onNotification: (notification) => {
        const currentToken = useAuthStore.getState().token
        if (!currentToken) return

        queryClient.setQueryData<NotificationsResponse>(
          ['notifications', currentToken],
          (old) => {
            if (!old) return old
            const nextNotifications = [
              notification,
              ...old.notifications.filter((n) => n.id !== notification.id),
            ]
            return {
              ...old,
              notifications: nextNotifications,
              unreadCount: nextNotifications.filter((n) => !n.isRead).length,
            }
          },
        )
      },
      onFeedChanged: (payload) => {
        window.dispatchEvent(new CustomEvent('fakebook:feed-changed', { detail: payload }))
      },
    })
  },
  disconnect: () => {
    disconnectRealtimeSocket()
    set({ socketConnected: false })
  },
}))
