import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '@/layouts/app-layout'
import { fetchPostDetail } from '@/services/api'
import type { FeedPost } from '@/types/social'
import type { PostComment } from '@/types/social'
import { PostDetailPage } from './post-detail-page'

type PostDetailRouteProps = {
  postId: string
}

type PostWithComments = FeedPost & { comments: PostComment[] }

export function PostDetailRoute({ postId }: PostDetailRouteProps) {
  const { data, isLoading, isError, error } = useQuery<{ post: PostWithComments }>({
    queryKey: ['post', postId],
    queryFn: () => fetchPostDetail(postId),
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10" role="status" aria-label="Memuat postingan">
          <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" aria-hidden="true" />
        </div>
      </AppLayout>
    )
  }

  if (isError || !data) {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-[650px] rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-red-600">
            {error instanceof Error ? error.message : 'Postingan tidak ditemukan.'}
          </p>
          <a href="/home" className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700">
            Kembali ke beranda
          </a>
        </div>
      </AppLayout>
    )
  }

  return <PostDetailPage post={data.post} comments={data.post.comments} />
}
