import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { appMetadata, createHealthPayload, type ApiHealth } from '@ppwl/shared'
import { prisma } from './db/prisma'
import { authRoutes } from './routes/auth'
import { commentRoutes } from './routes/comments'
import { notificationRoutes } from './routes/notifications'
import { postRoutes } from './routes/posts'
import { profileRoutes } from './routes/profile'
import { userRoutes } from './routes/users'

const port = Number(process.env.PORT ?? 3000)
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
const allowedCorsOrigins = corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
const isAwsLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

const app = new Elysia()

if (!isAwsLambda) {
  app.use(cors({ origin: allowedCorsOrigins }))
}

app
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400
      return { error: 'Data request tidak valid.' }
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
  .use(userRoutes)
  .listen(port)

console.info(
  `API ${appMetadata.name} berjalan di http://${app.server?.hostname ?? 'localhost'}:${app.server?.port}`,
)
