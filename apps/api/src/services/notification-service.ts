import { prisma } from '../db'
import { publicAuthorSelect } from '../lib/prisma-selects'

const notificationInclude = {
  actor: { select: publicAuthorSelect },
  post: {
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
  },
} as const

const MAX_NOTIFICATIONS_LIST = 100

export async function getNotificationsForUser(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      include: notificationInclude,
      orderBy: { createdAt: 'desc' },
      take: MAX_NOTIFICATIONS_LIST,
    }),
    prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    }),
  ])

  return { notifications, unreadCount }
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { recipientId: userId, isRead: false },
  })
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, recipientId: userId },
  })

  if (!notification) return null

  return prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
    include: notificationInclude,
  })
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true },
  })

  return { success: true, updated: result.count }
}
