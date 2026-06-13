import { useEffect, useState } from 'react'
import type { FeedPost, PublicUser } from '@ppwl/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PostDetailPage } from '@/routes/posts/post-detail-page'
import { fetchFeed } from '@/services/api'
import type { FeedResponse } from '@/services/api'
import { navigate } from '@/lib/navigation'
import { CreatePostBox } from './components/create-post-box'
import { HomeTopBar } from './components/home-top-bar'
import { PostCard } from './components/post-card'

const FEED_REALTIME_INTERVAL_MS = 3000
const FEED_PAGE_SIZE = 50

type HomePageProps = {
  currentUser?: PublicUser | null
}

function Composer({ currentUser, onPostCreated }: { currentUser?: PublicUser | null; onPostCreated: (post: FeedPost) => void }) {
  if (!currentUser) {
    return (
      <div className="rounded-xl bg-white p-4 text-center text-sm font-medium text-gray-500 shadow-sm ring-1 ring-gray-200">
        Login untuk membuat postingan.
      </div>
    )
  }

  return <CreatePostBox user={currentUser} onPostCreated={onPostCreated} />
}

function Feed({ currentUser }: { currentUser?: PublicUser | null }) {
  const queryClient = useQueryClient()
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [shouldFocusComment, setShouldFocusComment] = useState(false)

  const feedQuery = useQuery<FeedResponse>({
    queryKey: ['feed', currentUser?.id],
    queryFn: () => fetchFeed(1, FEED_PAGE_SIZE),
    enabled: Boolean(currentUser?.id),
    refetchInterval: FEED_REALTIME_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  const feedPosts = feedQuery.data?.posts ?? []
  const refetchFeed = feedQuery.refetch

  useEffect(() => {
    const handleRealtimeFeedChange = () => { void refetchFeed() }
    window.addEventListener('fakebook:feed-changed', handleRealtimeFeedChange)
    return () => { window.removeEventListener('fakebook:feed-changed', handleRealtimeFeedChange) }
  }, [refetchFeed])

  function updateFeedCache(updater: (posts: FeedPost[]) => FeedPost[]) {
    queryClient.setQueryData<FeedResponse>(['feed', currentUser?.id], (old) => {
      if (!old) return old
      return { ...old, posts: updater(old.posts) }
    })
  }

  function handlePostCreated(post: FeedPost) {
    updateFeedCache((posts) => [post, ...posts])
  }

  function handleLikeStatusChange(postId: string, nextLikeCount: number, nextLiked: boolean) {
    updateFeedCache((posts) =>
      posts.map((post) => {
        if (post.id !== postId) return post
        return {
          ...post,
          likes: currentUser?.id && nextLiked ? [{ userId: currentUser.id }] : [],
          _count: { ...post._count, likes: nextLikeCount },
        }
      }),
    )
  }

  function handleCommentCountChange(postId: string, nextCommentCount: number) {
    updateFeedCache((posts) =>
      posts.map((post) => {
        if (post.id !== postId) return post
        return { ...post, _count: { ...post._count, comments: nextCommentCount } }
      }),
    )
  }

  function handlePostUpdated(updatedPost: FeedPost) {
    updateFeedCache((posts) =>
      posts.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    )
  }

  function handlePostDeleted(postId: string) {
    updateFeedCache((posts) => posts.filter((post) => post.id !== postId))
    setSelectedPostId((current) => (current === postId ? null : current))
  }

  const selectedPost = selectedPostId
    ? feedPosts.find((post) => post.id === selectedPostId) ?? null
    : null
  const isLoadingFeed = feedQuery.isLoading && feedPosts.length === 0
  const feedError = feedQuery.isError ? 'Gagal memuat postingan dari backend.' : null

  return (
    <main className="mx-auto w-full max-w-[680px] space-y-4 px-3 pb-10">
      <Composer currentUser={currentUser} onPostCreated={handlePostCreated} />

      {isLoadingFeed ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm font-medium text-gray-500 shadow-sm ring-1 ring-gray-200">
          Memuat postingan...
        </div>
      ) : feedError ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm font-medium text-red-500 shadow-sm ring-1 ring-gray-200">
          {feedError}
        </div>
      ) : feedPosts.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm font-medium text-gray-500 shadow-sm ring-1 ring-gray-200">
          Belum ada postingan.
        </div>
      ) : (
        feedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            onLikeStatusChange={handleLikeStatusChange}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
            onOpenDetail={() => {
              setShouldFocusComment(false)
              setSelectedPostId(post.id)
            }}
            onOpenAuthor={() => navigate(`/users/${post.author.id}`)}
            onOpenComments={() => {
              setShouldFocusComment(true)
              setSelectedPostId(post.id)
            }}
          />
        ))
      )}

      {selectedPost && (
        <PostDetailPage
          key={selectedPost.id}
          post={selectedPost}
          autoFocusComment={shouldFocusComment}
          onCommentCountChange={(nextCommentCount) =>
            handleCommentCountChange(selectedPost.id, nextCommentCount)
          }
          onLikeStatusChange={(nextLikeCount, nextLiked) =>
            handleLikeStatusChange(selectedPost.id, nextLikeCount, nextLiked)
          }
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </main>
  )
}

export function HomePage({ currentUser }: HomePageProps) {
  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      <HomeTopBar currentPath="/home" currentUser={currentUser} />
      <div className="mx-auto flex max-w-[760px] justify-center pt-16">
        <Feed currentUser={currentUser} />
      </div>
    </div>
  )
}
