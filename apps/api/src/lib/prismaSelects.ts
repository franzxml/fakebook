/**
 * Shared Prisma select/include constants dipakai lintas route.
 */

export const publicAuthorSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  avatarUrl: true,
  bio: true,
} as const

export const commentInclude = {
  author: { select: publicAuthorSelect },
  parentComment: {
    include: {
      author: { select: publicAuthorSelect },
    },
  },
} as const
