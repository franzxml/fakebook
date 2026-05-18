import { Elysia, t } from 'elysia'
import { prisma } from '../../db/prisma'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'

const publicAuthorSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const

const postInclude = {
  author: { select: publicAuthorSelect },
  images: true,
  _count: {
    select: {
      comments: true,
      likes: true,
    },
  },
} as const

const postDetailInclude = {
  ...postInclude,
  comments: {
    include: {
      author: { select: publicAuthorSelect },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  likes: {
    include: {
      user: { select: publicAuthorSelect },
    },
  },
} as const

const cleanImageUrls = (imageUrls: string[] | undefined) =>
  imageUrls?.map((imageUrl) => imageUrl.trim()).filter(Boolean) ?? []

export const postRoutes = new Elysia({ prefix: '/posts' })
  .get(
    '/feed',
    async ({ query }) => {
      const page = Number(query.page ?? 1)
      const limit = Math.min(Number(query.limit ?? 10), 50)
      const skip = (Math.max(page, 1) - 1) * limit

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          include: postInclude,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.post.count(),
      ])

      return {
        posts,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )
  .get('/', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const posts = await prisma.post.findMany({
      include: postInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { posts }
  })
  .post(
    '/',
    async ({ body, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const imageUrls = cleanImageUrls(body.imageUrls)
      const post = await prisma.post.create({
        data: {
          userId: user.id,
          content: body.content.trim(),
          images: imageUrls.length
            ? {
                create: imageUrls.map((imageUrl) => ({ imageUrl })),
              }
            : undefined,
        },
        include: postInclude,
      })

      set.status = 201
      return { post }
    },
    {
      body: t.Object({
        content: t.String({ minLength: 1 }),
        imageUrls: t.Optional(t.Array(t.String({ minLength: 1 }))),
      }),
    },
  )
  .get('/:postId', async ({ params, request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      include: postDetailInclude,
    })

    if (!post) {
      set.status = 404
      return errorPayload('Postingan tidak ditemukan.')
    }

    return { post }
  })
  .patch(
    '/:postId',
    async ({ body, params, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const post = await prisma.post.findUnique({
        where: { id: params.postId },
        select: { userId: true },
      })

      if (!post) {
        set.status = 404
        return errorPayload('Postingan tidak ditemukan.')
      }

      if (post.userId !== user.id) {
        set.status = 403
        return errorPayload('Anda hanya dapat mengubah postingan milik sendiri.')
      }

      if (body.imageUrls) {
        await prisma.postImage.deleteMany({ where: { postId: params.postId } })
      }

      const imageUrls = cleanImageUrls(body.imageUrls)
      const updatedPost = await prisma.post.update({
        where: { id: params.postId },
        data: {
          ...(body.content ? { content: body.content.trim() } : {}),
          ...(body.imageUrls
            ? {
                images: {
                  create: imageUrls.map((imageUrl) => ({ imageUrl })),
                },
              }
            : {}),
        },
        include: postInclude,
      })

      return { post: updatedPost }
    },
    {
      body: t.Object({
        content: t.Optional(t.String({ minLength: 1 })),
        imageUrls: t.Optional(t.Array(t.String({ minLength: 1 }))),
      }),
    },
  )
  .delete('/:postId', async ({ params, request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      select: { userId: true },
    })

    if (!post) {
      set.status = 404
      return errorPayload('Postingan tidak ditemukan.')
    }

    if (post.userId !== user.id) {
      set.status = 403
      return errorPayload('Anda hanya dapat menghapus postingan milik sendiri.')
    }

    await prisma.post.delete({ where: { id: params.postId } })

    return { success: true }
  })
  .get('/:postId/comments', async ({ params, set }) => {
    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      select: { id: true },
    })

    if (!post) {
      set.status = 404
      return errorPayload('Postingan tidak ditemukan.')
    }

    const comments = await prisma.comment.findMany({
      where: { postId: params.postId },
      include: {
        author: { select: publicAuthorSelect },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return { comments }
  })
  .post(
    '/:postId/comments',
    async ({ body, params, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const post = await prisma.post.findUnique({
        where: { id: params.postId },
        select: { userId: true },
      })

      if (!post) {
        set.status = 404
        return errorPayload('Postingan tidak ditemukan.')
      }

      const comment = await prisma.comment.create({
        data: {
          postId: params.postId,
          userId: user.id,
          content: body.content.trim(),
        },
        include: {
          author: { select: publicAuthorSelect },
        },
      })

      if (post.userId !== user.id) {
        await prisma.notification.create({
          data: {
            recipientId: post.userId,
            actorId: user.id,
            postId: params.postId,
            type: 'post_comment',
          },
        })
      }

      set.status = 201
      return { comment }
    },
    {
      body: t.Object({
        content: t.String({ minLength: 1 }),
      }),
    },
  )
  .post('/:postId/likes', async ({ params, request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      select: { userId: true },
    })

    if (!post) {
      set.status = 404
      return errorPayload('Postingan tidak ditemukan.')
    }

    const like = await prisma.like.upsert({
      where: {
        postId_userId: {
          postId: params.postId,
          userId: user.id,
        },
      },
      update: {},
      create: {
        postId: params.postId,
        userId: user.id,
      },
    })

    if (post.userId !== user.id) {
      await prisma.notification.create({
        data: {
          recipientId: post.userId,
          actorId: user.id,
          postId: params.postId,
          type: 'post_like',
        },
      })
    }

    set.status = 201
    return { like }
  })
  .delete('/:postId/likes', async ({ params, request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    await prisma.like.deleteMany({
      where: {
        postId: params.postId,
        userId: user.id,
      },
    })

    return { success: true }
  })
