import { create } from 'zustand'
import { connectRealtimeSocket, disconnectRealtimeSocket } from '@/lib/realtime-socket'
import { useNotificationStore } from './notification-store'

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

// Manajemen koneksi WebSocket (reconnect, parsing pesan) hidup di
// lib/realtime-socket.ts — store ini hanya memegang state koneksi.
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
        useNotificationStore.getState().prependNotification(notification)
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
