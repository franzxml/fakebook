import { prisma } from '../db'
import { commentInclude } from '../lib/prisma-selects'

type CreateCommentInput = {
  postId: string
  userId: string
  content: string
  parentCommentId?: string
}

/**
 * Buat komentar baru beserta notifikasi yang relevan.
 * Return null jika postingan tidak ditemukan.
 * Throw error jika parent comment tidak valid.
 */
export async function createComment({ postId, userId, content, parentCommentId }: CreateCommentInput) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  })

  if (!post) return null

  let resolvedParentId: string | undefined
  let parentCommentOwnerId: string | undefined

  if (parentCommentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: { id: true, postId: true, userId: true, parentCommentId: true },
    })

    if (!parentComment || parentComment.postId !== postId) {
      throw new Error('PARENT_NOT_FOUND')
    }

    resolvedParentId = parentComment.parentCommentId ?? parentComment.id
    parentCommentOwnerId = parentComment.userId
  }

  // Transaksi: komentar dan notifikasinya harus tersimpan bersama agar
  // kegagalan parsial tidak meninggalkan komentar tanpa notifikasi.
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        postId,
        userId,
        parentCommentId: resolvedParentId,
        content: content.trim(),
      },
      include: commentInclude,
    })

    // Notifikasi ke pemilik komentar yang dibalas
    if (parentCommentOwnerId && parentCommentOwnerId !== userId) {
      await tx.notification.create({
        data: {
          recipientId: parentCommentOwnerId,
          actorId: userId,
          postId,
          type: 'comment_reply',
        },
      })
    }

    // Notifikasi ke pemilik postingan (jika bukan diri sendiri atau sudah dinotif atas)
    if (post.userId !== userId && post.userId !== parentCommentOwnerId) {
      await tx.notification.create({
        data: {
          recipientId: post.userId,
          actorId: userId,
          postId,
          type: 'post_comment',
        },
      })
    }

    return comment
  })
}
