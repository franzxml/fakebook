import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NotificationResponse, NotificationsResponse } from '@ppwl/shared'
import { apiRequest, fetchNotifications } from '@/services/api'

export function useNotificationsQuery(token: string | null) {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', token],
    queryFn: () => fetchNotifications(token!),
    enabled: Boolean(token),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    staleTime: 10000,
  })
}

export function useMarkAsReadMutation(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest<NotificationResponse>(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token: token ?? undefined,
      }),
    onSuccess: (data, notificationId) => {
      queryClient.setQueryData<NotificationsResponse>(['notifications', token], (old) => {
        if (!old) return old
        const nextNotifications = old.notifications.map((n) =>
          n.id === notificationId ? data.notification : n,
        )
        return {
          ...old,
          notifications: nextNotifications,
          unreadCount: nextNotifications.filter((n) => !n.isRead).length,
        }
      })
    },
  })
}

export function useMarkAllAsReadMutation(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      apiRequest<{ success: true; updated: number }>('/notifications/read-all', {
        method: 'PATCH',
        token: token ?? undefined,
      }),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResponse>(['notifications', token], (old) => {
        if (!old) return old
        return {
          ...old,
          notifications: old.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }
      })
    },
  })
}
