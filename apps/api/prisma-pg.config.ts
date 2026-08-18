import 'dotenv/config'
import { defineConfig } from 'prisma/config'

function getDatabaseUrl() {
  const databaseUrl =
    process.env.DATABASE_PG_URL ?? 'postgresql://postgres:postgres@localhost:5432/fakebook'
  const rdsCaBundlePath = process.env.RDS_CA_BUNDLE_PATH

  if (!rdsCaBundlePath) return databaseUrl

  const url = new URL(databaseUrl)
  url.searchParams.set('sslmode', 'require')
  url.searchParams.set('sslcert', rdsCaBundlePath)
  url.searchParams.set('sslaccept', 'strict')
  return url.toString()
}

export default defineConfig({
  schema: 'prisma/schema-pg.prisma',
  migrations: {
    path: 'prisma-pg/migrations',
  },
  datasource: {
    url: getDatabaseUrl(),
  },
})
