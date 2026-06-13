import { Elysia, t } from 'elysia'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import * as notificationService from '../../services/notification-service'

export const notificationRoutes = new Elysia({ prefix: '/notifications' })
  .get('/', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    return notificationService.getNotificationsForUser(user.id)
  })
  .get('/unread-count', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const unreadCount = await notificationService.getUnreadCount(user.id)
    return { unreadCount }
  })
  .patch('/read-all', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    return notificationService.markAllNotificationsRead(user.id)
  })
  .patch(
    '/:notificationId/read',
    async ({ params, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const notification = await notificationService.markNotificationRead(
        params.notificationId,
        user.id,
      )

      if (!notification) {
        set.status = 404
        return errorPayload('Notifikasi tidak ditemukan.')
      }

      return { notification }
    },
    { params: t.Object({ notificationId: t.String() }) },
  )
