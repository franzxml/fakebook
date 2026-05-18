import type { PostComment } from '@/types/social'

function createFallbackComment(id: string, content: string, name: string, minutesAgo: number): PostComment {
  const timestamp = new Date(Date.now() - 1000 * 60 * minutesAgo).toISOString()

  return {
    id,
    content,
    author: {
      id: `user-${id}`,
      name,
      email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
      avatarUrl: null,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const fallbackPostComments: PostComment[] = [
  createFallbackComment('c1', 'Semangat semuanya! Pasti bisa.', 'Dzaky Mubarak', 20),
  createFallbackComment('c2', 'Ayo kita kerjain bareng-bareng biar cepet selesai!', 'Ghina Audhiya', 10),
  createFallbackComment('c3', 'Mantap! Frontend udah mulai keliatan nih.', 'Florecita Wenny', 5),
]
