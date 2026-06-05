import { prisma } from '../db'

/**
 * Normalisasi username: lowercase, hapus karakter non-valid,
 * hapus titik/underscore berurutan, potong ke 30 karakter.
 */
export function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/[._]{2,}/g, '.')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 30)
}

/**
 * Buat username dari nama dan email sebagai fallback.
 */
export function usernameFromProfile(name: string, email: string) {
  return normalizeUsername(name) || normalizeUsername(email.split('@')[0] ?? '') || 'user'
}

/**
 * Buat username unik — tambah suffix numerik jika sudah ada di database.
 */
export async function createUniqueUsername(baseUsername: string) {
  const base = normalizeUsername(baseUsername) || 'user'
  let candidate = base
  let suffix = 1

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1
    candidate = `${base.slice(0, Math.max(1, 30 - String(suffix).length - 1))}.${suffix}`
  }

  return candidate
}
