import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma/client'

/**
 * Klien database libSQL — dipakai untuk:
 * - Development lokal (SQLite file)
 * - Fallback production (Turso) jika PostgreSQL RDS tidak tersedia
 */
export function createLibSqlClient() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  return new PrismaClient({ adapter })
}

export const db = createLibSqlClient()
