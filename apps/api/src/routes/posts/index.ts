import { Elysia, t } from 'elysia'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import { createComment } from '../../services/comment-service'
import * as likeService from '../../services/like-service'
import * as postService from '../../services/post-service'
import { broadcastFeedChanged } from '../../realtime/broadcast'

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
      const { posts, total } = await postService.getFeed(user.id, page, limit)

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

      const post = await postService.createPost(user.id, body.content, body.imageUrls ?? [])
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

      const post = await postService.getPost(params.postId, user.id)

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

      const ownership = await postService.getPostOwnership(params.postId)

      if (!ownership) {
        set.status = 404
        return errorPayload('Postingan tidak ditemukan.')
      }

      if (ownership.userId !== user.id) {
        set.status = 403
        return errorPayload('Anda hanya dapat mengubah postingan milik sendiri.')
      }

      const updatedPost = await postService.updatePost(
        params.postId,
        user.id,
        body.content,
        body.imageUrls,
      )

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

      const ownership = await postService.getPostOwnership(params.postId)

      if (!ownership) {
        set.status = 404
        return errorPayload('Postingan tidak ditemukan.')
      }

      if (ownership.userId !== user.id) {
        set.status = 403
        return errorPayload('Anda hanya dapat menghapus postingan milik sendiri.')
      }

      await postService.deletePost(params.postId)
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

      const ownership = await postService.getPostOwnership(params.postId)

      if (!ownership) {
        set.status = 404
        return errorPayload('Postingan tidak ditemukan.')
      }

      const comments = await postService.listPostComments(params.postId)
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

      const ownership = await postService.getPostOwnership(params.postId)

      if (!ownership) {
        set.status = 404
        return errorPayload('Postingan tidak ditemukan.')
      }

      const result = await likeService.likePost(params.postId, user.id, ownership.userId)

      if (result.isNewLike) {
        broadcastFeedChanged('post_liked', params.postId)
      }

      set.status = 201
      return { like: result.like }
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

      await likeService.unlikePost(params.postId, user.id)
      broadcastFeedChanged('post_unliked', params.postId)

      return { success: true }
    },
    { params: t.Object({ postId: t.String() }) },
  )
