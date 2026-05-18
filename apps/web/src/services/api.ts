import type { AuthResponse, FeedPost, PublicUser, SessionPayload } from '@ppwl/shared'
import type { NotificationsResponse } from '@ppwl/shared'
import type { PostComment } from '@/types/social'

export type FeedResponse = {
  posts: FeedPost[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type PostCommentsResponse = {
  comments: PostComment[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  token?: string
  body?: unknown
}

type LoginInput = {
  email: string
  password: string
}

type RegisterInput = {
  name: string
  email: string
  password: string
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
    const payload = await response.json().catch(() => null)
    const message = payload && typeof payload === 'object' && 'error' in payload
      ? String(payload.error)
      : 'Request API gagal.'

    throw new Error(message)
  }

  return response.json() as Promise<TResponse>
}

export function saveAuthSession(auth: AuthResponse) {
  localStorage.setItem('session', JSON.stringify(auth.session))
  localStorage.setItem('user', JSON.stringify(auth.user))
}

export function getStoredSession(): SessionPayload | null {
  try {
    const rawSession = localStorage.getItem('session')
    return rawSession ? JSON.parse(rawSession) as SessionPayload : null
  } catch {
    return null
  }
}

export function getStoredUser(): PublicUser | null {
  try {
    const rawUser = localStorage.getItem('user')
    return rawUser ? JSON.parse(rawUser) as PublicUser : null
  } catch {
    return null
  }
}

export async function login(input: LoginInput) {
  const auth = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  })

  saveAuthSession(auth)
  return auth
}

export async function register(input: RegisterInput) {
  const auth = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  })

  saveAuthSession(auth)
  return auth
}

/* Ambil daftar postingan untuk feed */
export async function fetchFeed(page = 1, limit = 10): Promise<FeedResponse> {
  return apiRequest<FeedResponse>(`/posts/feed?page=${page}&limit=${limit}`)
}

/* Ambil komentar postingan untuk modal/detail postingan */
export async function fetchPostComments(postId: string): Promise<PostCommentsResponse> {
  return apiRequest<PostCommentsResponse>(`/posts/${postId}/comments`)
}

/* Ambil notifikasi dummy dari backend untuk halaman list notifikasi */
export async function fetchNotificationFeed(): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>('/notifications/feed')
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
