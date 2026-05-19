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

export type CreatePostResponse = {
  post: FeedPost
}

export type UpdatePostResponse = {
  post: FeedPost
}

export type CreateCommentResponse = {
  comment: PostComment
}

const defaultLocalApiUrl = 'http://localhost:3000'
const productionApiUrl = 'https://2gtrnedjhmootg6bu5e24kwdmq0oyuns.lambda-url.us-east-1.on.aws'
const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
const isLocalBrowser = typeof window !== 'undefined'
  ? ['localhost', '127.0.0.1'].includes(window.location.hostname)
  : true

const apiBaseUrl = configuredApiUrl && (isLocalBrowser || configuredApiUrl !== defaultLocalApiUrl)
  ? configuredApiUrl
  : isLocalBrowser
    ? defaultLocalApiUrl
    : productionApiUrl

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

type GoogleOAuthInput = {
  credential?: string
  accessToken?: string
}

type ForgotPasswordResponse = {
  success: true
  resetToken?: string
  message: string
}

type ResetPasswordResponse = {
  success: true
  message: string
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

export function clearAuthSession() {
  localStorage.removeItem('session')
  localStorage.removeItem('user')
}

export async function login(input: LoginInput) {
  const auth = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  })

  saveAuthSession(auth)
  return auth
}

export async function logout(token?: string) {
  if (!token) return { success: true }

  return apiRequest<{ success: true }>('/auth/logout', {
    method: 'POST',
    token,
  })
}

export async function register(input: RegisterInput) {
  const auth = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  })

  saveAuthSession(auth)
  return auth
}

export async function loginWithGoogle(input: GoogleOAuthInput) {
  const auth = await apiRequest<AuthResponse>('/auth/oauth/google', {
    method: 'POST',
    body: input,
  })

  saveAuthSession(auth)
  return auth
}

export async function requestPasswordReset(email: string) {
  return apiRequest<ForgotPasswordResponse>('/auth/password/forgot', {
    method: 'POST',
    body: { email },
  })
}

export async function resetPassword(token: string, password: string) {
  return apiRequest<ResetPasswordResponse>('/auth/password/reset', {
    method: 'POST',
    body: { token, password },
  })
}

/* Ambil daftar postingan untuk feed */
export async function fetchFeed(page = 1, limit = 10): Promise<FeedResponse> {
  return apiRequest<FeedResponse>(`/posts/feed?page=${page}&limit=${limit}`)
}

/* Ambil komentar postingan untuk modal/detail postingan */
export async function fetchPostComments(postId: string): Promise<PostCommentsResponse> {
  return apiRequest<PostCommentsResponse>(`/posts/${postId}/comments`)
}

export async function createPostComment(postId: string, content: string, token: string): Promise<PostComment> {
  const response = await apiRequest<CreateCommentResponse>(`/posts/${postId}/comments`, {
    method: 'POST',
    token,
    body: { content },
  })

  return response.comment
}

export async function updateComment(commentId: string, content: string, token: string): Promise<PostComment> {
  const response = await apiRequest<{ comment: PostComment }>(`/comments/${commentId}`, {
    method: 'PATCH',
    token,
    body: { content },
  })

  return response.comment
}

export async function deleteComment(commentId: string, token: string) {
  return apiRequest<{ success: true }>(`/comments/${commentId}`, {
    method: 'DELETE',
    token,
  })
}

export async function likePost(postId: string, token: string) {
  return apiRequest<{ like: unknown }>(`/posts/${postId}/likes`, {
    method: 'POST',
    token,
  })
}

export async function unlikePost(postId: string, token: string) {
  return apiRequest<{ success: true }>(`/posts/${postId}/likes`, {
    method: 'DELETE',
    token,
  })
}

/* Ambil notifikasi dari backend untuk halaman list notifikasi */
export async function fetchNotificationFeed(): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>('/notifications/feed')
}

export async function fetchNotifications(token: string): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>('/notifications', { token })
}

/* Buat postingan baru */
export async function createPost(
  content: string,
  token: string,
  imageUrls: string[] = [],
): Promise<FeedPost> {
  const response = await apiRequest<CreatePostResponse>('/posts', {
    method: 'POST',
    token,
    body: { content, imageUrls },
  })

  return response.post
}

export async function updatePost(
  postId: string,
  content: string,
  token: string,
  imageUrls?: string[],
): Promise<FeedPost> {
  const response = await apiRequest<UpdatePostResponse>(`/posts/${postId}`, {
    method: 'PATCH',
    token,
    body: {
      content,
      ...(imageUrls ? { imageUrls } : {}),
    },
  })

  return response.post
}

export async function deletePost(postId: string, token: string) {
  return apiRequest<{ success: true }>(`/posts/${postId}`, {
    method: 'DELETE',
    token,
  })
}

/** Ambil detail satu postingan */
export async function fetchPostDetail(postId: string) {
  const res = await fetch(`${apiBaseUrl}/posts/${postId}`)
  if (!res.ok) throw new Error('Postingan tidak ditemukan')
  return res.json()
}

export { apiBaseUrl }
