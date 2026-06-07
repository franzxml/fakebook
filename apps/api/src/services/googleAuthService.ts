import { config } from '../config'
import { normalizeEmail } from '../http/auth'

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

export type GoogleProfile = {
  providerAccountId: string
  email: string
  name: string
  avatarUrl: string | null
}

function buildProfile(sub: string, email: string, name: string, picture?: string): GoogleProfile {
  return {
    providerAccountId: sub,
    email: normalizeEmail(email),
    name: name.trim(),
    avatarUrl: picture || null,
  }
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const googleClientId = config.google.clientId

  if (!googleClientId) throw new Error('GOOGLE_CLIENT_ID belum dikonfigurasi.')

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  )

  if (!response.ok) throw new Error('Credential Google tidak valid.')

  const payload = await response.json() as GoogleTokenInfo

  if (payload.aud !== googleClientId) throw new Error('Credential Google tidak sesuai dengan aplikasi ini.')
  if (payload.email_verified !== true && payload.email_verified !== 'true') throw new Error('Email Google belum terverifikasi.')
  if (!payload.sub || !payload.email || !payload.name) throw new Error('Profil Google tidak lengkap.')

  return buildProfile(payload.sub, payload.email, payload.name, payload.picture)
}

export async function verifyGoogleAccessToken(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error('Credential Google tidak valid.')

  const payload = await response.json() as GoogleUserInfo

  if (payload.email_verified !== true) throw new Error('Email Google belum terverifikasi.')
  if (!payload.sub || !payload.email || !payload.name) throw new Error('Profil Google tidak lengkap.')

  return buildProfile(payload.sub, payload.email, payload.name, payload.picture)
}
