import { prisma } from '../db'
import { normalizeEmail } from '../http/auth'
import { normalizeUsername } from '../lib/user-utils'

type ProfileUpdateInput = {
  name?: string
  username?: string
  bio?: string
  email?: string
  avatarUrl?: string | null
}

type ProfileUpdateError = {
  status: 400 | 409
  message: string
}

type ProfileUpdateData = {
  name?: string
  username?: string
  bio?: string | null
  email?: string
  avatarUrl?: string | null
}

type ValidateResult =
  | { ok: true; data: ProfileUpdateData }
  | { ok: false; error: ProfileUpdateError }

/**
 * Validasi dan normalisasi data update profil.
 * Return data siap-pakai jika valid, atau error dengan status code.
 */
export async function validateProfileUpdate(
  userId: string,
  body: ProfileUpdateInput,
): Promise<ValidateResult> {
  const data: ProfileUpdateData = {}

  if (body.name) data.name = body.name.trim()
  if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl
  if (body.bio !== undefined) data.bio = body.bio.trim() || null

  // Validasi email
  if (body.email) {
    const email = normalizeEmail(body.email)
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser && existingUser.id !== userId) {
      return { ok: false, error: { status: 409, message: 'Email sudah digunakan.' } }
    }
    data.email = email
  }

  // Validasi username
  if (body.username !== undefined) {
    const username = normalizeUsername(body.username)
    if (username.length < 3) {
      return { ok: false, error: { status: 400, message: 'Username minimal 3 karakter.' } }
    }
    const existingUsername = await prisma.user.findFirst({
      where: { username, id: { not: userId } },
    })
    if (existingUsername) {
      return { ok: false, error: { status: 409, message: 'Username sudah digunakan.' } }
    }
    data.username = username
  }

  return { ok: true, data }
}
