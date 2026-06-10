import { useEffect, useState } from 'react'
import { AppLayout } from '@/layouts/app-layout'
import { fetchPostDetail } from '@/services/api'
import type { FeedPost, PostComment } from '@/types/social'
import { PostDetailPage } from './post-detail-page'

type PostDetailRouteProps = {
  postId: string
}

type PostWithComments = FeedPost & { comments: PostComment[] }

/**
 * Halaman deep link /posts/:id — fetch postingan berdasarkan id lalu render
 * PostDetailPage dalam mode non-modal (di dalam AppLayout).
 */
export function PostDetailRoute({ postId }: PostDetailRouteProps) {
  const [post, setPost] = useState<PostWithComments | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchPostDetail(postId)
        if (!isMounted) return
        setPost(response.post)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Gagal memuat postingan.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [postId])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10" role="status" aria-label="Memuat postingan">
          <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" aria-hidden="true" />
        </div>
      </AppLayout>
    )
  }

  if (error || !post) {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-[650px] rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-red-600">{error ?? 'Postingan tidak ditemukan.'}</p>
          <a href="/home" className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700">
            Kembali ke beranda
          </a>
        </div>
      </AppLayout>
    )
  }

  return <PostDetailPage post={post} comments={post.comments} />
}
