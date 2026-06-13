import { prisma } from '../db'
import { isUniqueConstraintError } from '../lib/prisma-errors'

export async function likePost(postId: string, userId: string, postUserId: string) {
  const likeWhere = {
    postId_userId: { postId, userId },
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingLike = await tx.like.findUnique({ where: likeWhere })

      if (existingLike) {
        return { like: existingLike, isNewLike: false }
      }

      const like = await tx.like.create({
        data: { postId, userId },
      })

      if (postUserId !== userId) {
        await tx.notification.create({
          data: {
            recipientId: postUserId,
            actorId: userId,
            postId,
            type: 'post_like',
          },
        })
      }

      return { like, isNewLike: true }
    })

    return result
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existingLike = await prisma.like.findUnique({ where: likeWhere })
      if (existingLike) return { like: existingLike, isNewLike: false }
    }

    throw error
  }
}

export async function unlikePost(postId: string, userId: string) {
  await prisma.like.deleteMany({ where: { postId, userId } })
}
