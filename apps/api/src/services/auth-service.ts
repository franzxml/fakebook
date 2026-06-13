import { prisma } from '../db'
import { createSession, normalizeEmail } from '../http/auth'
import { isUniqueConstraintError } from '../lib/prisma-errors'
import { createUniqueUsername, usernameFromProfile } from '../lib/user-utils'

const RESET_TOKEN_DURATION_MS = 1000 * 60 * 30

const DUMMY_PASSWORD_HASH = await Bun.password.hash('fakebook-dummy-password')

type RegisterInput = {
  name: string
  email: string
  password: string
  username?: string
  avatarUrl?: string
}

type RegisterResult =
  | { ok: true; user: Awaited<ReturnType<typeof prisma.user.create>>; session: Awaited<ReturnType<typeof createSession>> }
  | { ok: false; status: 409; message: string }

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const email = normalizeEmail(input.email)
  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    return { ok: false, status: 409, message: 'Email sudah digunakan.' }
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        username: await createUniqueUsername(
          input.username || usernameFromProfile(input.name, email),
        ),
        email,
        passwordHash: await Bun.password.hash(input.password),
        avatarUrl: input.avatarUrl,
        bio: null,
      },
    })

    const session = await createSession(user.id)
    return { ok: true, user, session }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, status: 409, message: 'Email atau username sudah digunakan.' }
    }
    throw error
  }
}

type LoginResult =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>; session: Awaited<ReturnType<typeof createSession>> }
  | { ok: false; status: 401; message: string }

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = normalizeEmail(email)
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  if (!user?.passwordHash) {
    await Bun.password.verify(password, DUMMY_PASSWORD_HASH)
    return { ok: false, status: 401, message: 'Email atau kata sandi tidak valid.' }
  }

  const isValid = await Bun.password.verify(password, user.passwordHash)

  if (!isValid) {
    return { ok: false, status: 401, message: 'Email atau kata sandi tidak valid.' }
  }

  const session = await createSession(user.id)
  return { ok: true, user, session }
}

export async function logoutUser(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } })
}

export async function findUserIdByEmailForReset(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  })
  return user?.passwordHash ? user.id : null
}

export async function createPasswordResetToken(userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId } })

    return tx.passwordResetToken.create({
      data: {
        userId,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
      },
    })
  })
}

type ResetPasswordResult =
  | { ok: true }
  | { ok: false; status: 400; message: string }

export async function resetUserPassword(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!resetToken || resetToken.expiresAt <= new Date()) {
    return { ok: false, status: 400, message: 'Token reset password tidak valid atau sudah kedaluwarsa.' }
  }

  const newPasswordHash = await Bun.password.hash(newPassword)

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: newPasswordHash },
    })

    await tx.passwordResetToken.delete({ where: { id: resetToken.id } })
    await tx.session.deleteMany({ where: { userId: resetToken.userId } })
  })

  return { ok: true }
}
