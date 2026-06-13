import { Elysia, t } from 'elysia'
import { getCurrentUser, getSessionToken, toPublicUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import * as profileService from '../../services/profile-service'

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

    const profile = await profileService.getProfile(user.id)
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

      const validated = await profileService.validateProfileUpdate(user.id, body)

      if (!validated.ok) {
        set.status = validated.error.status
        return errorPayload(validated.error.message)
      }

      const result = await profileService.updateProfile(user.id, validated.data)

      if (!result.ok) {
        set.status = result.status
        return errorPayload(result.message)
      }

      return { user: toPublicUser(result.user) }
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

      const currentToken = getSessionToken(request.headers)
      const result = await profileService.changePassword(user.id, body.currentPassword, body.newPassword, currentToken)

      if (!result.ok) {
        set.status = result.status
        return errorPayload(result.message)
      }

      return { success: true, message: 'Password berhasil diperbarui.' }
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 1, maxLength: PASSWORD_MAX_LENGTH }),
        newPassword: t.String({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH }),
      }),
    },
  )
