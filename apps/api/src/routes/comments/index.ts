import { Elysia, t } from 'elysia'
import { getCurrentUser } from '../../http/auth'
import { errorPayload } from '../../http/errors'
import { editComment, deleteComment } from '../../services/comment-service'
import { broadcastFeedChanged } from '../../realtime/broadcast'

const COMMENT_CONTENT_MAX_LENGTH = 2000

export const commentRoutes = new Elysia({ prefix: '/comments' })
  .patch(
    '/:commentId',
    async ({ body, params, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const result = await editComment(params.commentId, user.id, body.content)

      if (!result) {
        set.status = 404
        return errorPayload('Komentar tidak ditemukan.')
      }

      if ('error' in result) {
        set.status = 403
        return errorPayload('Anda hanya dapat mengubah komentar milik sendiri.')
      }

      broadcastFeedChanged('comment_updated', result.postId)

      return { comment: result.comment }
    },
    {
      params: t.Object({ commentId: t.String() }),
      body: t.Object({
        content: t.String({ minLength: 1, maxLength: COMMENT_CONTENT_MAX_LENGTH }),
      }),
    },
  )
  .delete(
    '/:commentId',
    async ({ params, request, set }) => {
      const user = await getCurrentUser(request.headers)

      if (!user) {
        set.status = 401
        return errorPayload('Sesi tidak valid.')
      }

      const result = await deleteComment(params.commentId, user.id)

      if (!result) {
        set.status = 404
        return errorPayload('Komentar tidak ditemukan.')
      }

      if ('error' in result) {
        set.status = 403
        return errorPayload('Anda hanya dapat menghapus komentar milik sendiri.')
      }

      broadcastFeedChanged('comment_deleted', result.postId)

      return { success: true }
    },
    { params: t.Object({ commentId: t.String() }) },
  )
