import { PrismaPg } from '@prisma/adapter-pg'
import { readFileSync } from 'node:fs'
import { config } from '../config'

type PgPrismaClient = import('../generated/prisma/client').PrismaClient

type PgClientModule = {
  PrismaClient: new (options: { adapter: PrismaPg }) => PgPrismaClient
}

let _createPgClient: (() => PgPrismaClient) | null = null

function createPostgresAdapter() {
  const rdsCaBundlePath = process.env.RDS_CA_BUNDLE_PATH

  return new PrismaPg({
    connectionString: config.db.pgUrl!,
    ...(rdsCaBundlePath
      ? {
          ssl: {
            ca: readFileSync(rdsCaBundlePath, 'utf8'),
            rejectUnauthorized: true,
          },
        }
      : {}),
  })
}

// Specifier disimpan di variabel agar TypeScript tidak me-resolve modul secara
// statis — modul prisma-pg hanya ada setelah `bun run prisma:generate:pg`,
// dan import literal akan gagal typecheck saat modul belum di-generate.
const PG_CLIENT_MODULE_PATH = '../generated/prisma-pg/client'

try {
  // as: modul dimuat dinamis sehingga TypeScript tidak bisa menginferensi
  // tipenya; bentuknya dijamin oleh Prisma generator (schema-pg.prisma).
  const mod = (await import(PG_CLIENT_MODULE_PATH)) as PgClientModule
  _createPgClient = () => new mod.PrismaClient({ adapter: createPostgresAdapter() })
} catch {
  // generated/prisma-pg belum ada — createPgClient akan mengembalikan null.
}

export function createPgClient(): PgPrismaClient | null {
  if (!config.db.pgUrl) return null
  if (!_createPgClient) {
    console.error(
      '[DB] prisma-pg belum di-generate. Jalankan perintah prisma:generate:pg di apps/api.',
    )
    return null
  }

  return _createPgClient()
}
