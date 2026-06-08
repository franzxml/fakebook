import { Elysia, t } from 'elysia'
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
import { usernameFromProfile, createUniqueUsername } from '../../lib/user-utils'
import { verifyGoogleCredential, verifyGoogleAccessToken, type GoogleProfile } from '../../services/google-auth-service'

const RESET_TOKEN_DURATION_MS = 1000 * 60 * 30

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

      const user = await prisma.user.create({
        data: {
          name: body.name.trim(),
          username: await createUniqueUsername(body.username || usernameFromProfile(body.name, email)),
          email,
          passwordHash: await Bun.password.hash(body.password),
          avatarUrl: body.avatarUrl,
          bio: null,
        },
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
        name: t.String({ minLength: 1 }),
        email: t.String({ minLength: 3 }),
        password: t.String({ minLength: 6 }),
        avatarUrl: t.Optional(t.String()),
        username: t.Optional(t.String({ minLength: 3 })),
      }),
    },
  )
  .post(
    '/login',
    async ({ body, set }) => {
      const email = normalizeEmail(body.email)
      const user = await prisma.user.findUnique({ where: { email } })

      if (!user?.passwordHash) {
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
        email: t.String({ minLength: 3 }),
        password: t.String({ minLength: 1 }),
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

      const user = await prisma.user.upsert({
        where: { email: googleProfile.email },
        update: {
          name: googleProfile.name,
          avatarUrl: googleProfile.avatarUrl,
        },
        create: {
          name: googleProfile.name,
          username: await createUniqueUsername(usernameFromProfile(googleProfile.name, googleProfile.email)),
          email: googleProfile.email,
          avatarUrl: googleProfile.avatarUrl,
          bio: null,
        },
      })

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: googleProfile.providerAccountId,
          },
        },
        update: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          provider: 'google',
          providerAccountId: googleProfile.providerAccountId,
        },
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
        credential: t.Optional(t.String({ minLength: 1 })),
        accessToken: t.Optional(t.String({ minLength: 1 })),
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
      const email = normalizeEmail(body.email)
      const user = await prisma.user.findUnique({ where: { email } })

      if (!user) {
        return {
          success: true,
          message: 'Jika email terdaftar, token reset password akan dibuat.',
        }
      }

      if (!user.passwordHash) {
        return {
          success: true,
          message: 'Akun Google tidak menggunakan password lokal.',
        }
      }

      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

      const resetToken = await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: crypto.randomUUID(),
          expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
        },
      })

      return {
        success: true,
        resetToken: resetToken.token,
        message: 'Token reset password berhasil dibuat.',
      }
    },
    {
      body: t.Object({
        email: t.String({ minLength: 3 }),
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

      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: await Bun.password.hash(body.password) },
      })

      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      await prisma.session.deleteMany({ where: { userId: resetToken.userId } })

      return {
        success: true,
        message: 'Password berhasil direset. Silakan login ulang.',
      }
    },
    {
      body: t.Object({
        token: t.String({ minLength: 1 }),
        password: t.String({ minLength: 6 }),
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
