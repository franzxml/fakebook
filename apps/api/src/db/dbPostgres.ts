/**
 * Klien database PostgreSQL — dipakai untuk production (AWS RDS).
 * Jalankan dulu: bun run prisma:generate:pg
 * Schema: prisma/schema-pg.prisma
 */

type PgPrismaClient = import('../generated/prisma/client').PrismaClient

let _createPgClient: (() => PgPrismaClient) | null = null

try {
  // Dynamic require agar tidak crash saat prisma-pg belum di-generate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = require('../generated/prisma-pg/client') as any
  _createPgClient = () => new mod.PrismaClient() as PgPrismaClient
} catch {
  // generated/prisma-pg belum ada — jalankan: bun run prisma:generate:pg
}

export function createPgClient(): PgPrismaClient | null {
  if (!process.env.DATABASE_PG_URL) return null
  if (!_createPgClient) {
    console.error('[DB] prisma-pg belum di-generate. Jalankan: bun run prisma:generate:pg')
    return null
  }

  return _createPgClient()
}
