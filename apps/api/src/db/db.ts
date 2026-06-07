import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma/client'
import { config } from '../config'

export function createLibSqlClient() {
  const adapter = new PrismaLibSql({
    url: config.db.url,
    authToken: config.db.authToken,
  })

  return new PrismaClient({ adapter })
}

export const db = createLibSqlClient()
