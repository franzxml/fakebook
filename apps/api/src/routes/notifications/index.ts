import { Elysia } from 'elysia'
import { prisma } from '../../db/prisma'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const

const notificationInclude = {
  actor: { select: publicUserSelect },
  post: {
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
  },
} as const

export const notificationRoutes = new Elysia({ prefix: '/notifications' })
  .get('/', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const notifications = await prisma.notification.findMany({
      where: { recipientId: user.id },
      include: notificationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: user.id,
        isRead: false,
      },
    })

    return { notifications, unreadCount }
  })
  .get('/unread-count', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: user.id,
        isRead: false,
      },
    })

    return { unreadCount }
  })
  .patch('/read-all', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const result = await prisma.notification.updateMany({
      where: {
        recipientId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return {
      success: true,
      updated: result.count,
    }
  })
  .patch('/:notificationId/read', async ({ params, request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.notificationId,
        recipientId: user.id,
      },
    })

    if (!notification) {
      set.status = 404
      return errorPayload('Notifikasi tidak ditemukan.')
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
      include: notificationInclude,
    })

    return { notification: updatedNotification }
  })
