import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { appMetadata, createHealthPayload, type ApiHealth } from '@ppwl/shared'
import { config } from './config'
import { prisma } from './db'
import { authRoutes } from './routes/auth'
import { commentRoutes } from './routes/comments'
import { notificationRoutes } from './routes/notifications'
import { postRoutes } from './routes/posts'
import { profileRoutes } from './routes/profile'
import { uploadRoutes } from './routes/uploads'
import { userRoutes } from './routes/users'

const allowedCorsOrigins = config.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)

const app = new Elysia()

if (!config.isAwsLambda) {
  app.use(cors({ origin: allowedCorsOrigins }))
}

app
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400
      return { error: 'Data request tidak valid.' }
    }

    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Endpoint tidak ditemukan.' }
    }

    console.error(error)
    set.status = 500
    return { error: 'Terjadi kesalahan server.' }
  })
  .get('/', () => ({
    message: `${appMetadata.name} API`,
    docs: {
      health: '/health',
      auth: '/auth',
      posts: '/posts',
      comments: '/comments',
      notifications: '/notifications',
      profile: '/profile',
      uploads: '/uploads',
      users: '/users',
    },
  }))
  .get('/health', async (): Promise<ApiHealth> => {
    await prisma.$queryRaw`SELECT 1`

    return createHealthPayload()
  })
  .use(authRoutes)
  .use(postRoutes)
  .use(commentRoutes)
  .use(notificationRoutes)
  .use(profileRoutes)
  .use(uploadRoutes)
  .use(userRoutes)
  .listen(config.port)

console.info(
  `API ${appMetadata.name} berjalan di http://${app.server?.hostname ?? 'localhost'}:${app.server?.port}`,
)

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})

process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error)
})

let isShuttingDown = false

async function shutdownGracefully(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true

  console.info(`[shutdown] Menerima ${signal}, menutup koneksi database...`)

  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('[shutdown] Gagal menutup koneksi database:', error)
  }

  process.exit(0)
}

process.on('SIGTERM', () => void shutdownGracefully('SIGTERM'))
process.on('SIGINT', () => void shutdownGracefully('SIGINT'))
