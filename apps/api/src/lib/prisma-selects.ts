/**
 * Shared Prisma select/include constants dipakai lintas route.
 */

// email sengaja TIDAK di-select: select ini dipakai untuk data yang tampil
// ke user lain (feed, komentar, daftar pengguna) dan email bersifat privat.
export const publicAuthorSelect = {
  id: true,
  name: true,
  username: true,
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
