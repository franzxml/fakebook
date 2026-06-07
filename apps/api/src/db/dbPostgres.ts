import { config } from '../config'

type PgPrismaClient = import('../generated/prisma/client').PrismaClient

let _createPgClient: (() => PgPrismaClient) | null = null

try {
  // require() dipakai agar tidak crash saat modul prisma-pg belum di-generate.
  // Jalankan: bun run prisma:generate:pg
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = require('../generated/prisma-pg/client') as any
  _createPgClient = () => new mod.PrismaClient() as PgPrismaClient
} catch {
  // generated/prisma-pg belum ada
}

export function createPgClient(): PgPrismaClient | null {
  if (!config.db.pgUrl) return null
  if (!_createPgClient) {
    console.error('[DB] prisma-pg belum di-generate. Jalankan: bun run prisma:generate:pg')
    return null
  }

  return _createPgClient()
}
