import { create } from 'zustand'
import type { AppNotification } from '@ppwl/shared'
import { useNotificationStore } from './notificationStore'

type RealtimeStore = {
  socketConnected: boolean
  socketError: string | null
  websocketUrl: string | null
  connect: (token: string | null) => void
  disconnect: () => void
}

let socket: WebSocket | null = null

const configuredWebsocketUrl = (import.meta.env.VITE_WEBSOCKET_URL as string | undefined)?.trim() || null

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  socketConnected: false,
  socketError: null,
  websocketUrl: configuredWebsocketUrl,
  connect: (token) => {
    if (!token || !configuredWebsocketUrl || socket?.readyState === WebSocket.OPEN) return

    socket?.close()
    socket = new WebSocket(`${configuredWebsocketUrl}?token=${encodeURIComponent(token)}`)

    socket.addEventListener('open', () => {
      set({ socketConnected: true, socketError: null })
    })

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as { type?: string; notification?: AppNotification }

        if (payload.type === 'notification' && payload.notification) {
          useNotificationStore.getState().prependNotification(payload.notification)
        } else if (payload.type === 'feed_changed') {
          window.dispatchEvent(new CustomEvent('fakebook:feed-changed', { detail: payload }))
        }
      } catch {
        set({ socketError: 'Pesan realtime tidak valid.' })
      }
    })

    socket.addEventListener('close', () => {
      set({ socketConnected: false })
      socket = null
    })

    socket.addEventListener('error', () => {
      set({ socketConnected: false, socketError: 'Koneksi realtime gagal.' })
    })
  },
  disconnect: () => {
    socket?.close()
    socket = null
    set({ socketConnected: false })
  },
}))
