import { config } from '../config'

type PgPrismaClient = import('../generated/prisma/client').PrismaClient

type PgClientModule = {
  PrismaClient: new () => PgPrismaClient
}

let _createPgClient: (() => PgPrismaClient) | null = null

// Specifier disimpan di variabel agar TypeScript tidak me-resolve modul secara
// statis — modul prisma-pg hanya ada setelah `bun run prisma:generate:pg`,
// dan import literal akan gagal typecheck saat modul belum di-generate.
const PG_CLIENT_MODULE_PATH = '../generated/prisma-pg/client'

try {
  // as: modul dimuat dinamis sehingga TypeScript tidak bisa menginferensi
  // tipenya; bentuknya dijamin oleh Prisma generator (schema-pg.prisma).
  const mod = (await import(PG_CLIENT_MODULE_PATH)) as PgClientModule
  _createPgClient = () => new mod.PrismaClient()
} catch {
  // generated/prisma-pg belum ada — createPgClient akan mengembalikan null.
}

export function createPgClient(): PgPrismaClient | null {
  if (!config.db.pgUrl) return null
  if (!_createPgClient) {
    console.error('[DB] prisma-pg belum di-generate. Jalankan: bun run prisma:generate:pg')
    return null
  }

  return _createPgClient()
}
