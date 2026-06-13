import { Elysia, t } from 'elysia'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import * as userService from '../../services/user-service'

export const userRoutes = new Elysia({ prefix: '/users' })
  .get('/', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const users = await userService.listUsers()

    return {
      users,
      meta: { total: users.length },
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

      const user = await userService.getUserProfile(params.userId, currentUser.id)

      if (!user) {
        set.status = 404
        return errorPayload('Pengguna tidak ditemukan.')
      }

      return { user }
    },
    { params: t.Object({ userId: t.String() }) },
  )
