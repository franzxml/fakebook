import { prisma } from '../db'
import { commentInclude, publicAuthorSelect } from '../lib/prisma-selects'

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

const postIncludeForUser = (userId: string) => ({
  ...postInclude,
  likes: {
    where: { userId },
    select: { userId: true },
  },
}) as const

const postDetailIncludeForUser = (userId: string) => ({
  ...postInclude,
  comments: {
    include: commentInclude,
    orderBy: { createdAt: 'asc' as const },
  },
  likes: {
    where: { userId },
    select: { userId: true },
  },
}) as const

const cleanUrls = (urls: string[] | undefined) =>
  urls?.map((u) => u.trim()).filter(Boolean) ?? []

export async function getFeed(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      include: postIncludeForUser(userId),
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count(),
  ])

  return { posts, total }
}

export async function getPost(postId: string, userId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: postDetailIncludeForUser(userId),
  })
}

export async function getPostOwnership(postId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  })
}

export async function createPost(userId: string, content: string, imageUrls: string[]) {
  const urls = cleanUrls(imageUrls)

  return prisma.post.create({
    data: {
      userId,
      content: content.trim(),
      images: urls.length
        ? { create: urls.map((imageUrl) => ({ imageUrl })) }
        : undefined,
    },
    include: postIncludeForUser(userId),
  })
}

export async function updatePost(
  postId: string,
  userId: string,
  content: string | undefined,
  imageUrls: string[] | undefined,
) {
  const urls = imageUrls !== undefined ? cleanUrls(imageUrls) : undefined

  return prisma.$transaction(async (tx) => {
    if (urls !== undefined) {
      await tx.postImage.deleteMany({ where: { postId } })
    }

    return tx.post.update({
      where: { id: postId },
      data: {
        ...(content ? { content: content.trim() } : {}),
        ...(urls !== undefined
          ? { images: { create: urls.map((imageUrl) => ({ imageUrl })) } }
          : {}),
      },
      include: postIncludeForUser(userId),
    })
  })
}

export async function deletePost(postId: string) {
  await prisma.post.delete({ where: { id: postId } })
}

export async function listPostComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId },
    include: commentInclude,
    orderBy: { createdAt: 'asc' },
  })
}
