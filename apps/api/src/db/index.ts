import { db } from './db'
import { createPgClient } from './dbPostgres'

/**
 * Unified database client.
 *
 * Urutan prioritas:
 * 1. PostgreSQL RDS (jika DATABASE_PG_URL tersedia dan dapat terhubung)
 * 2. Turso / SQLite lokal (fallback via DATABASE_URL)
 *
 * Timeout koneksi ke RDS: 3 detik.
 * Jika RDS tidak responsif dalam 3 detik, fallback ke Turso otomatis.
 */

type PrismaInstance = typeof db

const PG_CONNECT_TIMEOUT_MS = 3000

async function resolvePrisma(): Promise<PrismaInstance> {
  if (!process.env.DATABASE_PG_URL) {
    const provider = process.env.DATABASE_AUTH_TOKEN ? 'Turso' : 'SQLite lokal'
    console.log(`[DB] Menggunakan ${provider}.`)
    return db
  }

  const pgClient = createPgClient()

  if (!pgClient) {
    console.warn('[DB] Gagal membuat klien PostgreSQL. Fallback ke Turso.')
    return db
  }

  try {
    await Promise.race([
      pgClient.$connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), PG_CONNECT_TIMEOUT_MS),
      ),
    ])
    console.log('[DB] Menggunakan PostgreSQL RDS.')
    return pgClient as unknown as PrismaInstance
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.warn(`[DB] PostgreSQL RDS tidak tersedia (${reason}). Fallback ke Turso.`)
    await pgClient.$disconnect().catch(() => {})
    return db
  }
}

export const prisma = await resolvePrisma()
