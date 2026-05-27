import { useEffect } from 'react'
import { useNotificationStore, useRealtimeStore } from '@/stores'

const POLLING_INTERVAL_MS = 15000

export function useNotificationSync(token: string | null) {
  const fetchForToken = useNotificationStore((state) => state.fetchForToken)
  const resetNotifications = useNotificationStore((state) => state.reset)
  const connectRealtime = useRealtimeStore((state) => state.connect)
  const disconnectRealtime = useRealtimeStore((state) => state.disconnect)

  useEffect(() => {
    if (!token) {
      resetNotifications()
      disconnectRealtime()
      return undefined
    }

    void fetchForToken(token)
    connectRealtime(token)

    const intervalId = window.setInterval(() => {
      void fetchForToken(token)
    }, POLLING_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
      disconnectRealtime()
    }
  }, [connectRealtime, disconnectRealtime, fetchForToken, resetNotifications, token])
}
