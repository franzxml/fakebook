import { prisma } from '../db'
import { normalizeEmail } from '../http/auth'
import { isUniqueConstraintError } from '../lib/prisma-errors'
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

export async function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
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
      _count: { select: { posts: true, comments: true, likes: true } },
    },
  })
}

type UpdateProfileResult =
  | { ok: true; user: Awaited<ReturnType<typeof prisma.user.update>> }
  | { ok: false; status: 409; message: string }

export async function updateProfile(userId: string, data: ProfileUpdateData): Promise<UpdateProfileResult> {
  try {
    const user = await prisma.user.update({ where: { id: userId }, data })
    return { ok: true, user }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, status: 409, message: 'Email atau username sudah digunakan.' }
    }
    throw error
  }
}

type ChangePasswordResult =
  | { ok: true }
  | { ok: false; status: 400 | 401; message: string }

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  currentToken: string | null,
): Promise<ChangePasswordResult> {
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  })

  if (!userRecord?.passwordHash) {
    return { ok: false, status: 400, message: 'Akun Google tidak bisa ganti password di sini.' }
  }

  const isValid = await Bun.password.verify(currentPassword, userRecord.passwordHash)
  if (!isValid) {
    return { ok: false, status: 401, message: 'Password saat ini tidak sesuai.' }
  }

  const isSame = await Bun.password.verify(newPassword, userRecord.passwordHash)
  if (isSame) {
    return { ok: false, status: 400, message: 'Password baru tidak boleh sama dengan yang lama.' }
  }

  const newPasswordHash = await Bun.password.hash(newPassword)

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash: newPasswordHash } })
    await tx.session.deleteMany({
      where: {
        userId,
        ...(currentToken ? { token: { not: currentToken } } : {}),
      },
    })
  })

  return { ok: true }
}
