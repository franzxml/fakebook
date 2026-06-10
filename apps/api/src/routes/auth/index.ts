import { Elysia, t } from 'elysia'
import { config } from '../../config'
import { prisma } from '../../db'
import {
  createSession,
  getCurrentUser,
  getSessionToken,
  normalizeEmail,
  toPublicUser,
  toSessionPayload,
} from '../../http/auth'
import { errorPayload } from '../../http/errors'
import { isUniqueConstraintError } from '../../lib/prisma-errors'
import { usernameFromProfile, createUniqueUsername } from '../../lib/user-utils'
import { verifyGoogleCredential, verifyGoogleAccessToken, type GoogleProfile } from '../../services/google-auth-service'

const RESET_TOKEN_DURATION_MS = 1000 * 60 * 30
const NAME_MAX_LENGTH = 100
const EMAIL_MAX_LENGTH = 254
const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_LENGTH = 128
const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 30
const AVATAR_URL_MAX_LENGTH = 2048

// Hash dummy untuk menyamakan waktu respons login saat email tidak terdaftar,
// agar keberadaan akun tidak bisa ditebak dari perbedaan timing.
const DUMMY_PASSWORD_HASH = await Bun.password.hash('fakebook-dummy-password')

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/register',
    async ({ body, set }) => {
      const email = normalizeEmail(body.email)
      const existingUser = await prisma.user.findUnique({ where: { email } })

      if (existingUser) {
        set.status = 409
        return errorPayload('Email sudah digunakan.')
      }

      let user
      try {
        user = await prisma.user.create({
          data: {
            name: body.name.trim(),
            username: await createUniqueUsername(body.username || usernameFromProfile(body.name, email)),
            email,
            passwordHash: await Bun.password.hash(body.password),
            avatarUrl: body.avatarUrl,
            bio: null,
          },
        })
      } catch (error) {
        // Race: dua registrasi bersamaan dengan email/username sama — yang
        // kalah race kena P2002, balas 409 alih-alih 500.
        if (isUniqueConstraintError(error)) {
          set.status = 409
          return errorPayload('Email atau username sudah digunakan.')
        }
        throw error
      }

      const session = await createSession(user.id)

      set.status = 201
      return {
        user: toPublicUser(user),
        session: toSessionPayload(session),
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: NAME_MAX_LENGTH }),
        email: t.String({ format: 'email', maxLength: EMAIL_MAX_LENGTH }),
        password: t.String({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH }),
        avatarUrl: t.Optional(t.String({ maxLength: AVATAR_URL_MAX_LENGTH })),
        username: t.Optional(t.String({ minLength: USERNAME_MIN_LENGTH, maxLength: USERNAME_MAX_LENGTH })),
      }),
    },
  )
  .post(
    '/login',
    async ({ body, set }) => {
      const email = normalizeEmail(body.email)
      const user = await prisma.user.findUnique({ where: { email } })

      if (!user?.passwordHash) {
        // Tetap lakukan verifikasi terhadap hash dummy supaya durasi respons
        // mirip dengan kasus email terdaftar (mitigasi timing attack).
        await Bun.password.verify(body.password, DUMMY_PASSWORD_HASH)
        set.status = 401
        return errorPayload('Email atau kata sandi tidak valid.')
      }

      const isValidPassword = await Bun.password.verify(body.password, user.passwordHash)

      if (!isValidPassword) {
        set.status = 401
        return errorPayload('Email atau kata sandi tidak valid.')
      }

      const session = await createSession(user.id)

      return {
        user: toPublicUser(user),
        session: toSessionPayload(session),
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email', maxLength: EMAIL_MAX_LENGTH }),
        password: t.String({ minLength: 1, maxLength: PASSWORD_MAX_LENGTH }),
      }),
    },
  )
  .post(
    '/oauth/google',
    async ({ body, set }) => {
      let googleProfile: GoogleProfile

      try {
        if (body.credential) {
          googleProfile = await verifyGoogleCredential(body.credential)
        } else if (body.accessToken) {
          googleProfile = await verifyGoogleAccessToken(body.accessToken)
        } else {
          throw new Error('Credential Google tidak tersedia.')
        }
      } catch (error) {
        set.status = 401
        return errorPayload(error instanceof Error ? error.message : 'Login Google gagal.')
      }

      // Username dibuat di luar transaksi karena melakukan query lookup berulang.
      const generatedUsername = await createUniqueUsername(
        usernameFromProfile(googleProfile.name, googleProfile.email),
      )

      // Transaksi: user dan account Google harus tersimpan bersama agar tidak
      // ada user tanpa link account ketika salah satu query gagal.
      const user = await prisma.$transaction(async (tx) => {
        const upsertedUser = await tx.user.upsert({
          where: { email: googleProfile.email },
          update: {
            name: googleProfile.name,
            avatarUrl: googleProfile.avatarUrl,
          },
          create: {
            name: googleProfile.name,
            username: generatedUsername,
            email: googleProfile.email,
            avatarUrl: googleProfile.avatarUrl,
            bio: null,
          },
        })

        await tx.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: 'google',
              providerAccountId: googleProfile.providerAccountId,
            },
          },
          update: {
            userId: upsertedUser.id,
          },
          create: {
            userId: upsertedUser.id,
            provider: 'google',
            providerAccountId: googleProfile.providerAccountId,
          },
        })

        return upsertedUser
      })

      const session = await createSession(user.id)

      set.status = 201
      return {
        user: toPublicUser(user),
        session: toSessionPayload(session),
      }
    },
    {
      body: t.Object({
        credential: t.Optional(t.String({ minLength: 1, maxLength: 4096 })),
        accessToken: t.Optional(t.String({ minLength: 1, maxLength: 4096 })),
      }),
    },
  )
  .post('/logout', async ({ request }) => {
    const token = getSessionToken(request.headers)

    if (token) {
      await prisma.session.deleteMany({ where: { token } })
    }

    return { success: true }
  })
  .post(
    '/password/forgot',
    async ({ body }) => {
      // Pesan response identik untuk semua kasus agar email terdaftar
      // tidak bisa dienumerasi dari perbedaan response.
      const genericResponse = {
        success: true as const,
        message: 'Jika email terdaftar, token reset password akan dibuat.',
      }

      const email = normalizeEmail(body.email)
      const user = await prisma.user.findUnique({ where: { email } })

      if (!user?.passwordHash) {
        return genericResponse
      }

      const resetToken = await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({ where: { userId: user.id } })

        return tx.passwordResetToken.create({
          data: {
            userId: user.id,
            token: crypto.randomUUID(),
            expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
          },
        })
      })

      // Belum ada layanan email, jadi token hanya diekspos di environment
      // development. Di production (Lambda) token tidak boleh keluar dari API
      // karena siapa pun yang tahu email korban bisa mengambil alih akun.
      if (!config.isAwsLambda) {
        return { ...genericResponse, resetToken: resetToken.token }
      }

      return genericResponse
    },
    {
      body: t.Object({
        email: t.String({ format: 'email', maxLength: 254 }),
      }),
    },
  )
  .post(
    '/password/reset',
    async ({ body, set }) => {
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token: body.token },
      })

      if (!resetToken || resetToken.expiresAt <= new Date()) {
        set.status = 400
        return errorPayload('Token reset password tidak valid atau sudah kedaluwarsa.')
      }

      const newPasswordHash = await Bun.password.hash(body.password)

      // Transaksi: ganti password, hapus token, dan revoke semua sesi harus
      // atomic — kegagalan parsial bisa meninggalkan token reusable atau
      // sesi lama yang masih hidup setelah password berubah.
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash: newPasswordHash },
        })

        await tx.passwordResetToken.delete({ where: { id: resetToken.id } })
        await tx.session.deleteMany({ where: { userId: resetToken.userId } })
      })

      return {
        success: true,
        message: 'Password berhasil direset. Silakan login ulang.',
      }
    },
    {
      body: t.Object({
        token: t.String({ minLength: 1, maxLength: 64 }),
        password: t.String({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH }),
      }),
    },
  )
  .get('/me', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    return { user: toPublicUser(user) }
  })
