import { Elysia, t } from 'elysia'
import { prisma } from '../../db'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import { isUniqueConstraintError } from '../../lib/prisma-errors'
import { publicAuthorSelect, commentInclude } from '../../lib/prisma-selects'
import { createComment } from '../../services/comment-service'
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

/**
 * Parse nilai integer positif dari query string.
 * Input non-angka, negatif, atau nol jatuh ke fallback agar tidak
 * menghasilkan NaN/take negatif yang membuat Prisma melempar error.
 */
const parsePositiveInt = (raw: string | undefined, fallback: number, max: number): number => {
  const parsed = Math.trunc(Number(raw))
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

const MAX_FEED_LIMIT = 50
const MAX_FEED_PAGE = 10_000
const POST_CONTENT_MAX_LENGTH = 5000
const COMMENT_CONTENT_MAX_LENGTH = 2000
const IMAGE_URL_MAX_LENGTH = 2048

export const postRoutes = new Elysia({ prefix: '/posts' })
  .get(
    '/feed',
    async ({ query, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const page = parsePositiveInt(query.page, 1, MAX_FEED_PAGE)
      const limit = parsePositiveInt(query.limit, 10, MAX_FEED_LIMIT)
      const skip = (page - 1) * limit

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
        content: t.String({ minLength: 1, maxLength: POST_CONTENT_MAX_LENGTH }),
        imageUrls: t.Optional(
          t.Array(t.String({ minLength: 1, maxLength: IMAGE_URL_MAX_LENGTH }), { maxItems: 1 }),
        ),
      }),
    },
  )
  .get(
    '/:postId',
    async ({ params, request, set }) => {
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
    },
    { params: t.Object({ postId: t.String() }) },
  )
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

      const imageUrls = cleanImageUrls(body.imageUrls)
      // Transaksi: hapus gambar lama dan update post harus atomic agar
      // kegagalan di tengah tidak meninggalkan post tanpa gambar.
      const updatedPost = await prisma.$transaction(async (tx) => {
        if (body.imageUrls) {
          await tx.postImage.deleteMany({ where: { postId: params.postId } })
        }

        return tx.post.update({
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
      })

      broadcastFeedChanged('post_updated', updatedPost.id)

      return { post: updatedPost }
    },
    {
      params: t.Object({ postId: t.String() }),
      body: t.Object({
        content: t.Optional(t.String({ minLength: 1, maxLength: POST_CONTENT_MAX_LENGTH })),
        imageUrls: t.Optional(
          t.Array(t.String({ minLength: 1, maxLength: IMAGE_URL_MAX_LENGTH }), { maxItems: 1 }),
        ),
      }),
    },
  )
  .delete(
    '/:postId',
    async ({ params, request, set }) => {
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
    },
    { params: t.Object({ postId: t.String() }) },
  )
  .get(
    '/:postId/comments',
    async ({ params, request, set }) => {
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
    },
    { params: t.Object({ postId: t.String() }) },
  )
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
      params: t.Object({ postId: t.String() }),
      body: t.Object({
        content: t.String({ minLength: 1, maxLength: COMMENT_CONTENT_MAX_LENGTH }),
        parentCommentId: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
      }),
    },
  )
  .post(
    '/:postId/likes',
    async ({ params, request, set }) => {
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

      const likeWhere = {
        postId_userId: {
          postId: params.postId,
          userId: user.id,
        },
      }

      try {
        // Transaksi: like + notifikasi atomic. Notifikasi hanya dibuat saat
        // like benar-benar baru agar re-like berulang tidak membanjiri
        // notifikasi pemilik post.
        const result = await prisma.$transaction(async (tx) => {
          const existingLike = await tx.like.findUnique({ where: likeWhere })

          if (existingLike) {
            return { like: existingLike, isNewLike: false }
          }

          const like = await tx.like.create({
            data: {
              postId: params.postId,
              userId: user.id,
            },
          })

          if (post.userId !== user.id) {
            await tx.notification.create({
              data: {
                recipientId: post.userId,
                actorId: user.id,
                postId: params.postId,
                type: 'post_like',
              },
            })
          }

          return { like, isNewLike: true }
        })

        if (result.isNewLike) {
          broadcastFeedChanged('post_liked', params.postId)
        }

        set.status = 201
        return { like: result.like }
      } catch (error) {
        // Dua request like bersamaan: yang kalah race kena P2002 — perlakukan
        // sebagai idempoten, kembalikan like yang sudah ada.
        if (isUniqueConstraintError(error)) {
          const existingLike = await prisma.like.findUnique({ where: likeWhere })

          if (existingLike) {
            set.status = 201
            return { like: existingLike }
          }
        }

        throw error
      }
    },
    { params: t.Object({ postId: t.String() }) },
  )
  .delete(
    '/:postId/likes',
    async ({ params, request, set }) => {
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
    },
    { params: t.Object({ postId: t.String() }) },
  )
