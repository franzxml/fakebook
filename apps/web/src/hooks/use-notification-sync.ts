import { useEffect } from 'react'
import { queryClient } from '@/lib/query-client'
import { useRealtimeStore } from '@/stores'
import { useNotificationsQuery } from './use-notifications'

export function useNotificationSync(token: string | null) {
  const connectRealtime = useRealtimeStore((state) => state.connect)
  const disconnectRealtime = useRealtimeStore((state) => state.disconnect)

  // Keep polling alive globally so badge count updates on every protected page.
  useNotificationsQuery(token)

  useEffect(() => {
    if (!token) {
      disconnectRealtime()
      queryClient.removeQueries({ queryKey: ['notifications'] })
      return undefined
    }

    connectRealtime(token)

    return () => {
      disconnectRealtime()
    }
  }, [connectRealtime, disconnectRealtime, token])
}
