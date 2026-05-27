import { Elysia, t } from 'elysia'
import { prisma } from '../../db/prisma'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import { broadcastRealtime } from '../../realtime/broadcast'

const publicAuthorSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  avatarUrl: true,
  bio: true,
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
    include: {
      author: { select: publicAuthorSelect },
      parentComment: {
        include: {
          author: { select: publicAuthorSelect },
        },
      },
    },
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

const commentInclude = {
  author: { select: publicAuthorSelect },
  parentComment: {
    include: {
      author: { select: publicAuthorSelect },
    },
  },
} as const

const broadcastFeedChanged = (reason: string, postId: string) => {
  broadcastRealtime({ type: 'feed_changed', reason, postId }).catch((error) => {
    console.error('Gagal broadcast realtime feed:', error)
  })
}

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
  .get('/', async ({ request, set }) => {
    const user = await getCurrentUser(request.headers)

    if (!user) {
      set.status = 401
      return errorPayload('Sesi tidak valid.')
    }

    const posts = await prisma.post.findMany({
      include: getPostIncludeForUser(user.id),
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

      const post = await prisma.post.findUnique({
        where: { id: params.postId },
        select: { userId: true },
      })

      if (!post) {
        set.status = 404
        return errorPayload('Postingan tidak ditemukan.')
      }

      let parentCommentId: string | undefined
      let parentCommentOwnerId: string | undefined

      if (body.parentCommentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: body.parentCommentId },
          select: {
            id: true,
            postId: true,
            userId: true,
            parentCommentId: true,
          },
        })

        if (!parentComment || parentComment.postId !== params.postId) {
          set.status = 404
          return errorPayload('Komentar yang dibalas tidak ditemukan.')
        }

        parentCommentId = parentComment.parentCommentId ?? parentComment.id
        parentCommentOwnerId = parentComment.userId
      }

      const comment = await prisma.comment.create({
        data: {
          postId: params.postId,
          userId: user.id,
          parentCommentId,
          content: body.content.trim(),
        },
        include: commentInclude,
      })

      if (parentCommentOwnerId && parentCommentOwnerId !== user.id) {
        await prisma.notification.create({
          data: {
            recipientId: parentCommentOwnerId,
            actorId: user.id,
            postId: params.postId,
            type: 'comment_reply',
          },
        })
      }

      if (post.userId !== user.id && post.userId !== parentCommentOwnerId) {
        await prisma.notification.create({
          data: {
            recipientId: post.userId,
            actorId: user.id,
            postId: params.postId,
            type: 'post_comment',
          },
        })
      }

      broadcastFeedChanged('comment_created', params.postId)

      set.status = 201
      return { comment }
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
