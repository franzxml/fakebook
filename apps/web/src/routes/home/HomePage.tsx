import { useState } from 'react'
import type { ReactNode } from 'react'
import type { FeedPost, PublicUser } from '@ppwl/shared'
import { AppLayout } from '@/layouts/AppLayout'
import { PostDetailPage } from '@/routes/posts/PostDetailPage'
import { CreatePostBox } from './components/CreatePostBox'
import { PostCard } from './components/PostCard'

type HomePageProps = {
  posts: FeedPost[]
  aside?: ReactNode
  currentUser?: PublicUser | null
}

export function HomePage({ posts, aside, currentUser }: HomePageProps) {
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null)

  return (
    <AppLayout aside={aside} currentUser={currentUser} currentPath="/home">
      <div className="mx-auto max-w-xl space-y-4">
        {currentUser && <CreatePostBox user={currentUser} />}

        {posts.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-400">Belum ada postingan.</p>
          </div>
        ) : (
          posts.map((post) => (
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
          post={selectedPost}
          comments={[]}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </AppLayout>
  )
}
