import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

const normalize = (value) => (
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/[._]{2,}/g, '.')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 30) || 'user'
)

const users = await db.execute("SELECT id, name, email FROM users WHERE username IS NULL OR username = ''")
const usedRows = await db.execute("SELECT username FROM users WHERE username IS NOT NULL AND username != ''")
const used = new Set(usedRows.rows.map((row) => String(row.username)))

for (const user of users.rows) {
  const base = normalize(String(user.name || String(user.email).split('@')[0] || 'user'))
  let candidate = base
  let suffix = 1

  while (used.has(candidate)) {
    suffix += 1
    candidate = `${base.slice(0, Math.max(1, 30 - String(suffix).length - 1))}.${suffix}`
  }

  used.add(candidate)
  await db.execute({
    sql: 'UPDATE users SET username = ? WHERE id = ?',
    args: [candidate, String(user.id)],
  })
}

console.log(`backfilled ${users.rows.length} users`)
