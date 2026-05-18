import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { FeedPost, PublicUser } from '@ppwl/shared'
import { AppLayout } from '@/layouts/AppLayout'
import { PostDetailPage } from '@/routes/posts/PostDetailPage'
import { fetchFeed } from '@/services/api'
import { CreatePostBox } from './components/CreatePostBox'
import { PostCard } from './components/PostCard'

type HomePageProps = {
  posts: FeedPost[]
  aside?: ReactNode
  currentUser?: PublicUser | null
}

export function HomePage({ posts, aside, currentUser }: HomePageProps) {
  const [feedPosts, setFeedPosts] = useState(posts)
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null)
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)
  const [feedError, setFeedError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchFeed()
      .then((response) => {
        if (!isMounted) return
        setFeedPosts(response.posts)
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

  return (
    <AppLayout aside={aside} currentUser={currentUser} currentPath="/home">
      <div className="mx-auto max-w-xl space-y-4">
        {currentUser && <CreatePostBox user={currentUser} />}

        {isLoadingFeed ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-400">Memuat postingan...</p>
          </div>
        ) : feedError ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-red-500">{feedError}</p>
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-400">Belum ada postingan.</p>
          </div>
        ) : (
          feedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenDetail={() => setSelectedPost(post)}
            />
          ))
        )}
      </div>

      {selectedPost && (
        <PostDetailPage
          key={selectedPost.id}
          post={selectedPost}
          comments={[]}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </AppLayout>
  )
}
