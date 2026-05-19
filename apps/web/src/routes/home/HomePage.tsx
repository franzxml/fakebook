import { useEffect, useState } from 'react'
import type { FeedPost, PublicUser } from '@ppwl/shared'
import { PostDetailPage } from '@/routes/posts/PostDetailPage'
import { fetchFeed } from '@/services/api'
import { CreatePostBox } from './components/CreatePostBox'
import { LeftSidebar, RightSidebar } from './components/HomeSidebars'
import { HomeTopbar } from './components/HomeTopbar'
import { PostCard } from './components/PostCard'
import { Stories } from './components/Stories'

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
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null)
  const [shouldFocusComment, setShouldFocusComment] = useState(false)
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)
  const [feedError, setFeedError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchFeed()
      .then((response) => {
        if (!isMounted) return
        setFeedPosts(response.posts)
        setFeedError(null)
      })
      .catch(() => {
        if (!isMounted) return
        setFeedError('Gagal memuat postingan dari backend.')
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoadingFeed(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function handleLikeCountChange(postId: string, nextLikeCount: number) {
    setFeedPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              _count: {
                ...post._count,
                likes: nextLikeCount,
              },
            }
          : post,
      ),
    )
  }

  function handlePostUpdated(updatedPost: FeedPost) {
    setFeedPosts((currentPosts) =>
      currentPosts.map((post) => post.id === updatedPost.id ? updatedPost : post),
    )
    setSelectedPost((currentPost) => currentPost?.id === updatedPost.id ? updatedPost : currentPost)
  }

  function handlePostDeleted(postId: string) {
    setFeedPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId))
    setSelectedPost((currentPost) => currentPost?.id === postId ? null : currentPost)
  }

  return (
    <main className="mx-auto w-full max-w-[680px] space-y-4 px-3 pb-10">
      <Stories />
      <Composer currentUser={currentUser} onPostCreated={(post) => setFeedPosts((currentPosts) => [post, ...currentPosts])} />

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
            onLikeCountChange={handleLikeCountChange}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
            onOpenDetail={() => {
              setShouldFocusComment(false)
              setSelectedPost(post)
            }}
            onOpenComments={() => {
              setShouldFocusComment(true)
              setSelectedPost(post)
            }}
          />
        ))
      )}

      {selectedPost && (
        <PostDetailPage
          key={selectedPost.id}
          post={selectedPost}
          comments={[]}
          autoFocusComment={shouldFocusComment}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </main>
  )
}

export function HomePage({ currentUser }: HomePageProps) {
  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      <HomeTopbar currentUser={currentUser} />
      <div className="mx-auto flex max-w-[1460px] gap-4 pt-16">
        <LeftSidebar currentUser={currentUser} />
        <Feed currentUser={currentUser} />
        <RightSidebar />
      </div>
    </div>
  )
}
