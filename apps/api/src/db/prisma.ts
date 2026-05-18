import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma/client'

const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
const adapter = new PrismaLibSql({
  url: databaseUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

export const prisma = new PrismaClient({ adapter })
