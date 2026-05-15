import { Elysia, t } from 'elysia'
import { prisma } from '../../db/prisma'
import { getCurrentUser, normalizeEmail, toPublicUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'

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
        email: true,
        avatarUrl: true,
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
  // Update nama, email, avatar — BUKAN password
  .patch(
    '/',
    async ({ body, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      if (!body.name && !body.email && body.avatarUrl === undefined) {
        set.status = 400
        return errorPayload('Tidak ada data yang diperbarui.')
      }

      const email = body.email ? normalizeEmail(body.email) : undefined

      if (email && email !== user.email) {
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
          set.status = 409
          return errorPayload('Email sudah digunakan.')
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(body.name ? { name: body.name.trim() } : {}),
          ...(email ? { email } : {}),
          ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        },
      })

      return { user: toPublicUser(updatedUser) }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
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

      if (!user.passwordHash) {
        set.status = 400
        return errorPayload('Akun Google tidak bisa ganti password di sini.')
      }

      const isValid = await Bun.password.verify(body.currentPassword, user.passwordHash)
      if (!isValid) {
        set.status = 401
        return errorPayload('Password saat ini tidak sesuai.')
      }

      const isSame = await Bun.password.verify(body.newPassword, user.passwordHash)
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