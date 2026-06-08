import { Elysia, t } from 'elysia'
import { prisma } from '../../db'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import { publicAuthorSelect } from '../../lib/prisma-selects'

export const userRoutes = new Elysia({ prefix: '/users' })
  .get('/', async ({ request, set }) => {
    const currentUser = await getCurrentUser(request.headers)

    if (!currentUser) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const users = await prisma.user.findMany({
      select: {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      users,
      meta: {
        total: users.length,
      },
    }
  })
  .get(
    '/:userId',
    async ({ params, request, set }) => {
      const currentUser = await getCurrentUser(request.headers)

      if (!currentUser) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: {
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
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true,
            },
          },
        },
      })

      if (!user) {
        set.status = 404
        return errorPayload('Pengguna tidak ditemukan.')
      }

      return { user }
    },
    { params: t.Object({ userId: t.String() }) },
  )
