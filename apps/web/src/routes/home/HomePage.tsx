import { useEffect, useState } from 'react'
import type { FeedPost, PublicUser } from '@ppwl/shared'
import { useQuery } from '@tanstack/react-query'
import { PostDetailPage } from '@/routes/posts/PostDetailPage'
import { fetchFeed } from '@/services/api'
import { navigate } from '@/lib/navigation'
import { useFeedStore } from '@/stores'
import { CreatePostBox } from './components/CreatePostBox'
import { HomeTopBar } from './components/HomeTopBar'
import { PostCard } from './components/PostCard'

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
  const feedPosts = useFeedStore((state) => state.posts)
  const setFeedPosts = useFeedStore((state) => state.setPosts)
  const addFeedPost = useFeedStore((state) => state.addPost)
  const updateFeedPost = useFeedStore((state) => state.updatePost)
  const deleteFeedPost = useFeedStore((state) => state.deletePost)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [shouldFocusComment, setShouldFocusComment] = useState(false)
  const feedQuery = useQuery({
    queryKey: ['feed', currentUser?.id],
    queryFn: () => fetchFeed(1, FEED_PAGE_SIZE),
    enabled: Boolean(currentUser?.id),
    refetchInterval: FEED_REALTIME_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })
  const refetchFeed = feedQuery.refetch

  useEffect(() => {
    if (feedQuery.data?.posts) {
      setFeedPosts(feedQuery.data.posts)
    }
  }, [feedQuery.data?.posts, setFeedPosts])

  useEffect(() => {
    const handleRealtimeFeedChange = () => {
      void refetchFeed()
    }

    window.addEventListener('fakebook:feed-changed', handleRealtimeFeedChange)

    return () => {
      window.removeEventListener('fakebook:feed-changed', handleRealtimeFeedChange)
    }
  }, [refetchFeed])

  const selectedPost = selectedPostId ? feedPosts.find((post) => post.id === selectedPostId) ?? null : null
  const isLoadingFeed = feedQuery.isLoading && feedPosts.length === 0
  const feedError = feedQuery.isError ? 'Gagal memuat postingan dari backend.' : null

  function handleLikeStatusChange(postId: string, nextLikeCount: number, nextLiked: boolean) {
    const currentPost = feedPosts.find((post) => post.id === postId)
    if (currentPost) {
      updateFeedPost({
        ...currentPost,
        likes: currentUser?.id && nextLiked ? [{ userId: currentUser.id }] : [],
        _count: {
          ...currentPost._count,
          likes: nextLikeCount,
        },
      })
    }
  }

  function handleCommentCountChange(postId: string, nextCommentCount: number) {
    const currentPost = feedPosts.find((post) => post.id === postId)
    if (currentPost) {
      updateFeedPost({
        ...currentPost,
        _count: {
          ...currentPost._count,
          comments: nextCommentCount,
        },
      })
    }
  }

  function handlePostUpdated(updatedPost: FeedPost) {
    updateFeedPost(updatedPost)
  }

  function handlePostDeleted(postId: string) {
    deleteFeedPost(postId)
    setSelectedPostId((currentPostId) => currentPostId === postId ? null : currentPostId)
  }

  return (
    <main className="mx-auto w-full max-w-[680px] space-y-4 px-3 pb-10">
      <Composer currentUser={currentUser} onPostCreated={addFeedPost} />

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
          onCommentCountChange={(nextCommentCount) => handleCommentCountChange(selectedPost.id, nextCommentCount)}
          onLikeStatusChange={(nextLikeCount, nextLiked) => handleLikeStatusChange(selectedPost.id, nextLikeCount, nextLiked)}
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
