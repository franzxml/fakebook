import { prisma } from '../db'
import { publicAuthorSelect } from '../lib/prisma-selects'

const MAX_USERS_LIST = 200
const MAX_USER_POSTS = 100

const userListSelect = {
  ...publicAuthorSelect,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      posts: true,
      comments: true,
      likes: true,
    },
  },
} as const

const userProfileSelect = (userId: string) => ({
  ...publicAuthorSelect,
  createdAt: true,
  posts: {
    include: {
      author: { select: publicAuthorSelect },
      images: true,
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
      likes: {
        where: { userId },
        select: { userId: true },
      },
    },
    orderBy: { createdAt: 'desc' as const },
    take: MAX_USER_POSTS,
  },
  _count: {
    select: {
      posts: true,
      comments: true,
      likes: true,
    },
  },
})

export async function listUsers() {
  return prisma.user.findMany({
    select: userListSelect,
    orderBy: { createdAt: 'desc' },
    take: MAX_USERS_LIST,
  })
}

export async function getUserProfile(userId: string, currentUserId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: userProfileSelect(currentUserId),
  })
}
