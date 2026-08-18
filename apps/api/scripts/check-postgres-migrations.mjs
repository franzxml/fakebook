import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const migrationRoot = join(apiRoot, 'prisma-pg', 'migrations')
const configPath = join(apiRoot, 'prisma-pg.config.ts')

const config = await readFile(configPath, 'utf8')
if (!config.includes("path: 'prisma-pg/migrations'")) {
  throw new Error('Konfigurasi PostgreSQL harus memakai prisma-pg/migrations.')
}

if (!config.includes("url.searchParams.set('sslcert', rdsCaBundlePath)")) {
  throw new Error('Migrasi PostgreSQL RDS harus memverifikasi CA bundle.')
}

const lock = await readFile(join(migrationRoot, 'migration_lock.toml'), 'utf8')
if (!lock.includes('provider = "postgresql"')) {
  throw new Error('Migration lock PostgreSQL harus memakai provider postgresql.')
}

const migrationNames = (await readdir(migrationRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

if (migrationNames[0] !== '0_init') {
  throw new Error('Baseline PostgreSQL 0_init wajib menjadi migrasi pertama.')
}

const sqliteOnlySyntax = /\bPRAGMA\b|\bDATETIME\b|sqlite_sequence/i
for (const migrationName of migrationNames) {
  const migrationPath = join(migrationRoot, migrationName, 'migration.sql')
  const migration = await readFile(migrationPath, 'utf8')

  if (sqliteOnlySyntax.test(migration)) {
    throw new Error(`Migrasi PostgreSQL ${migrationName} berisi sintaks SQLite.`)
  }
}

console.info(`Migrasi PostgreSQL tervalidasi: ${migrationNames.join(', ')}`)
