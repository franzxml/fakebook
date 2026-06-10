import { Elysia, t } from 'elysia'
import { prisma } from '../../db'
import { getCurrentUser, getSessionToken, toPublicUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import { isUniqueConstraintError } from '../../lib/prisma-errors'
import { validateProfileUpdate } from '../../services/profile-service'

const NAME_MAX_LENGTH = 100
const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 30
const BIO_MAX_LENGTH = 500
const EMAIL_MAX_LENGTH = 254
const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_LENGTH = 128
const AVATAR_URL_MAX_LENGTH = 2048

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

      try {
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: result.data,
        })

        return { user: toPublicUser(updatedUser) }
      } catch (error) {
        // Race: validasi unik email/username lolos tapi user lain commit
        // duluan — tangkap P2002 dan balas 409 alih-alih 500.
        if (isUniqueConstraintError(error)) {
          set.status = 409
          return errorPayload('Email atau username sudah digunakan.')
        }
        throw error
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: NAME_MAX_LENGTH })),
        username: t.Optional(t.String({ minLength: USERNAME_MIN_LENGTH, maxLength: USERNAME_MAX_LENGTH })),
        bio: t.Optional(t.String({ maxLength: BIO_MAX_LENGTH })),
        email: t.Optional(t.String({ format: 'email', maxLength: EMAIL_MAX_LENGTH })),
        avatarUrl: t.Optional(t.Nullable(t.String({ maxLength: AVATAR_URL_MAX_LENGTH }))),
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

      const newPasswordHash = await Bun.password.hash(body.newPassword)
      const currentToken = getSessionToken(request.headers)

      // Transaksi: ganti password sekaligus revoke semua sesi lain.
      // Sesi yang sedang dipakai tetap hidup agar user tidak ter-logout.
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { passwordHash: newPasswordHash },
        })

        await tx.session.deleteMany({
          where: {
            userId: user.id,
            ...(currentToken ? { token: { not: currentToken } } : {}),
          },
        })
      })

      return { success: true, message: 'Password berhasil diperbarui.' }
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 1, maxLength: PASSWORD_MAX_LENGTH }),
        newPassword: t.String({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH }),
      }),
    },
  )
