import { Elysia, t } from 'elysia'
import { config } from '../../config'
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
import {
  GoogleServiceUnavailableError,
  verifyGoogleCredential,
  verifyGoogleAccessToken,
  loginWithGoogle,
  type GoogleProfile,
} from '../../services/google-auth-service'
import * as authService from '../../services/auth-service'

const NAME_MAX_LENGTH = 100
const EMAIL_MAX_LENGTH = 254
const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_LENGTH = 128
const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 30
const AVATAR_URL_MAX_LENGTH = 2048

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/register',
    async ({ body, set }) => {
      const result = await authService.registerUser({
        name: body.name,
        email: body.email,
        password: body.password,
        username: body.username,
        avatarUrl: body.avatarUrl,
      })

      if (!result.ok) {
        set.status = result.status
        return errorPayload(result.message)
      }

      set.status = 201
      return {
        user: toPublicUser(result.user),
        session: toSessionPayload(result.session),
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
      const result = await authService.loginUser(body.email, body.password)

      if (!result.ok) {
        set.status = result.status
        return errorPayload(result.message)
      }

      return {
        user: toPublicUser(result.user),
        session: toSessionPayload(result.session),
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
        set.status = error instanceof GoogleServiceUnavailableError ? 503 : 401
        return errorPayload(error instanceof Error ? error.message : 'Login Google gagal.')
      }

      const generatedUsername = await createUniqueUsername(
        usernameFromProfile(googleProfile.name, googleProfile.email),
      )

      const user = await loginWithGoogle(googleProfile, generatedUsername)

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
      await authService.logoutUser(token)
    }

    return { success: true }
  })
  .post(
    '/password/forgot',
    async ({ body }) => {
      const genericResponse = {
        success: true as const,
        message: 'Jika email terdaftar, token reset password akan dibuat.',
      }

      const email = normalizeEmail(body.email)
      const userId = await authService.findUserIdByEmailForReset(email)

      if (!userId) {
        return genericResponse
      }

      const resetToken = await authService.createPasswordResetToken(userId)

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
      const result = await authService.resetUserPassword(body.token, body.password)

      if (!result.ok) {
        set.status = result.status
        return errorPayload(result.message)
      }

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
