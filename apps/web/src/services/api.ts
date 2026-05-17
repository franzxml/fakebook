import type { FeedPost } from '@ppwl/shared'

export type FeedResponse = {
  posts: FeedPost[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  token?: string
  body?: unknown
}

export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}) {
  const headers = new Headers()

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    throw new Error('Request API gagal.')
  }

  return response.json() as Promise<TResponse>
}

/* Ambil daftar postingan untuk feed */
export async function fetchFeed(page = 1, limit = 10): Promise<FeedResponse> {
  const res = await fetch(
    `${apiBaseUrl}/posts/feed?page=${page}&limit=${limit}`,
  )
  if (!res.ok) throw new Error('Gagal mengambil feed')
  return res.json() as Promise<FeedResponse>
}

/* Buat postingan baru */
export async function createPost(
  content: string,
  token: string,
): Promise<FeedPost> {
  const res = await fetch(`${apiBaseUrl}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Gagal membuat postingan')
  return res.json() as Promise<FeedPost>
}

/** Ambil detail satu postingan */
export async function fetchPostDetail(postId: string) {
  const res = await fetch(`${apiBaseUrl}/posts/${postId}`)
  if (!res.ok) throw new Error('Postingan tidak ditemukan')
  return res.json()
}

export { apiBaseUrl }
