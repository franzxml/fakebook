import { Elysia, t } from 'elysia'
import { prisma } from '../../db'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import { publicAuthorSelect, commentInclude } from '../../lib/prismaSelects'
import { createComment } from '../../services/commentService'
import { broadcastFeedChanged } from '../../realtime/broadcast'

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

const getPostIncludeForUser = (userId: string) => ({
  ...postInclude,
  likes: {
    where: { userId },
    select: { userId: true },
  },
}) as const

const getPostDetailIncludeForUser = (userId: string) => ({
  ...postInclude,
  comments: {
    include: commentInclude,
    orderBy: {
      createdAt: 'asc',
    },
  },
  likes: {
    where: { userId },
    select: { userId: true },
  },
}) as const

const cleanImageUrls = (imageUrls: string[] | undefined) =>
  imageUrls?.map((imageUrl) => imageUrl.trim()).filter(Boolean) ?? []

export const postRoutes = new Elysia({ prefix: '/posts' })
  .get(
    '/feed',
    async ({ query, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const page = Number(query.page ?? 1)
      const limit = Math.min(Number(query.limit ?? 10), 50)
      const skip = (Math.max(page, 1) - 1) * limit

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          include: getPostIncludeForUser(user.id),
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
        include: getPostIncludeForUser(user.id),
      })

      broadcastFeedChanged('post_created', post.id)

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
      include: getPostDetailIncludeForUser(user.id),
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
        include: getPostIncludeForUser(user.id),
      })

      broadcastFeedChanged('post_updated', updatedPost.id)

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
    broadcastFeedChanged('post_deleted', params.postId)

    return { success: true }
  })
  .get('/:postId/comments', async ({ params, request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

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
      include: commentInclude,
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

      try {
        const comment = await createComment({
          postId: params.postId,
          userId: user.id,
          content: body.content,
          parentCommentId: body.parentCommentId,
        })

        if (!comment) {
          set.status = 404
          return errorPayload('Postingan tidak ditemukan.')
        }

        broadcastFeedChanged('comment_created', params.postId)
        set.status = 201
        return { comment }
      } catch (err) {
        if (err instanceof Error && err.message === 'PARENT_NOT_FOUND') {
          set.status = 404
          return errorPayload('Komentar yang dibalas tidak ditemukan.')
        }
        throw err
      }
    },
    {
      body: t.Object({
        content: t.String({ minLength: 1 }),
        parentCommentId: t.Optional(t.String({ minLength: 1 })),
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

    broadcastFeedChanged('post_liked', params.postId)

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

    broadcastFeedChanged('post_unliked', params.postId)

    return { success: true }
  })
