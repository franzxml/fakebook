import { Elysia, t } from 'elysia'
import { prisma } from '../../db/prisma'
import {
  createSession,
  getCurrentUser,
  getSessionToken,
  normalizeEmail,
  toPublicUser,
  toSessionPayload,
} from '../../http/auth'
import { errorPayload } from '../../http/errors'

type GoogleTokenInfo = {
  aud?: string
  sub?: string
  email?: string
  email_verified?: string | boolean
  name?: string
  picture?: string
}

type GoogleUserInfo = {
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

type GoogleProfile = {
  providerAccountId: string
  email: string
  name: string
  avatarUrl: string | null
}

async function verifyGoogleCredential(credential: string) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID

  if (!googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID belum dikonfigurasi.')
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  )

  if (!response.ok) {
    throw new Error('Credential Google tidak valid.')
  }

  const payload = await response.json() as GoogleTokenInfo

  if (payload.aud !== googleClientId) {
    throw new Error('Credential Google tidak sesuai dengan aplikasi ini.')
  }

  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    throw new Error('Email Google belum terverifikasi.')
  }

  if (!payload.sub || !payload.email || !payload.name) {
    throw new Error('Profil Google tidak lengkap.')
  }

  return {
    providerAccountId: payload.sub,
    email: normalizeEmail(payload.email),
    name: payload.name.trim(),
    avatarUrl: payload.picture || null,
  }
}

async function verifyGoogleAccessToken(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Credential Google tidak valid.')
  }

  const payload = await response.json() as GoogleUserInfo

  if (payload.email_verified !== true) {
    throw new Error('Email Google belum terverifikasi.')
  }

  if (!payload.sub || !payload.email || !payload.name) {
    throw new Error('Profil Google tidak lengkap.')
  }

  return {
    providerAccountId: payload.sub,
    email: normalizeEmail(payload.email),
    name: payload.name.trim(),
    avatarUrl: payload.picture || null,
  }
}

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
          email,
          passwordHash: await Bun.password.hash(body.password),
          avatarUrl: body.avatarUrl,
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
          email: googleProfile.email,
          avatarUrl: googleProfile.avatarUrl,
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
  .get('/me', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    return { user: toPublicUser(user) }
  })
