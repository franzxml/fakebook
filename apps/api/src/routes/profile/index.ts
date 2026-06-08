import { Elysia, t } from 'elysia'
import { prisma } from '../../db'
import { getCurrentUser, toPublicUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import { validateProfileUpdate } from '../../services/profile-service'

export const profileRoutes = new Elysia({ prefix: '/profile' })

  // ─── GET /profile ──────────────────────────────────────────────
  .get('/', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        emailVerifiedAt: true,
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
    })

    return { profile }
  })

  // ─── PATCH /profile ────────────────────────────────────────────
  // Update nama, username, bio, email, avatar — BUKAN password
  .patch(
    '/',
    async ({ body, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      if (!body.name && body.username === undefined && body.bio === undefined && !body.email && body.avatarUrl === undefined) {
        set.status = 400
        return errorPayload('Tidak ada data yang diperbarui.')
      }

      const result = await validateProfileUpdate(user.id, body)

      if (!result.ok) {
        set.status = result.error.status
        return errorPayload(result.error.message)
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: result.data,
      })

      return { user: toPublicUser(updatedUser) }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        username: t.Optional(t.String({ minLength: 3 })),
        bio: t.Optional(t.String()),
        email: t.Optional(t.String({ minLength: 3 })),
        avatarUrl: t.Optional(t.Nullable(t.String())),
      }),
    },
  )

  // ─── PATCH /profile/password ────────────────────────────────────
  // Ganti password — wajib verifikasi password lama
  .patch(
    '/password',
    async ({ body, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      })

      if (!userWithPassword?.passwordHash) {
        set.status = 400
        return errorPayload('Akun Google tidak bisa ganti password di sini.')
      }

      const isValid = await Bun.password.verify(body.currentPassword, userWithPassword.passwordHash)
      if (!isValid) {
        set.status = 401
        return errorPayload('Password saat ini tidak sesuai.')
      }

      const isSame = await Bun.password.verify(body.newPassword, userWithPassword.passwordHash)
      if (isSame) {
        set.status = 400
        return errorPayload('Password baru tidak boleh sama dengan yang lama.')
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await Bun.password.hash(body.newPassword) },
      })

      return { success: true, message: 'Password berhasil diperbarui.' }
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 1 }),
        newPassword: t.String({ minLength: 6 }),
      }),
    },
  )
