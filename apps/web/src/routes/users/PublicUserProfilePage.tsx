import { useEffect, useState } from 'react'
import type { FeedPost, PublicUser } from '@ppwl/shared'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { HomeTopBar } from '@/routes/home/components/HomeTopBar'
import { HomeAvatar } from '@/routes/home/components/HomeAvatar'
import { PostCard } from '@/routes/home/components/PostCard'
import { PostDetailPage } from '@/routes/posts/PostDetailPage'
import { fetchPublicUserProfile, getStoredUser } from '@/services/api'
import { navigate } from '@/lib/navigation'
import { getDisplayName } from '@/lib/userDisplay'

type PublicUserProfilePageProps = {
  userId: string
}

type PublicProfile = PublicUser & {
  createdAt: string
  posts: FeedPost[]
  _count: {
    posts: number
    comments: number
    likes: number
  }
}

export function PublicUserProfilePage({ userId }: PublicUserProfilePageProps) {
  const currentUser = getStoredUser()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null)
  const [shouldFocusComment, setShouldFocusComment] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    navigate('/users')
  }

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)
    setError(null)

    fetchPublicUserProfile(userId)
      .then((response) => {
        if (!isMounted) return
        setProfile(response.user)
        setPosts(response.user.posts)
      })
      .catch((fetchError) => {
        if (!isMounted) return
        setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat profil pengguna.')
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [userId])

  function handleLikeStatusChange(postId: string, nextLikeCount: number, nextLiked: boolean) {
    const updatePost = (post: FeedPost): FeedPost => ({
      ...post,
      likes: currentUser?.id && nextLiked ? [{ userId: currentUser.id }] : [],
      _count: {
        ...post._count,
        likes: nextLikeCount,
      },
    })

    setPosts((currentPosts) => currentPosts.map((post) => (post.id === postId ? updatePost(post) : post)))
    setSelectedPost((currentPost) => (currentPost?.id === postId ? updatePost(currentPost) : currentPost))
  }

  function handleCommentCountChange(postId: string, nextCommentCount: number) {
    const updatePost = (post: FeedPost): FeedPost => ({
      ...post,
      _count: {
        ...post._count,
        comments: nextCommentCount,
      },
    })

    setPosts((currentPosts) => currentPosts.map((post) => (post.id === postId ? updatePost(post) : post)))
    setSelectedPost((currentPost) => (currentPost?.id === postId ? updatePost(currentPost) : currentPost))
  }

  function handlePostUpdated(updatedPost: FeedPost) {
    setPosts((currentPosts) => currentPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
    setSelectedPost((currentPost) => (currentPost?.id === updatedPost.id ? updatedPost : currentPost))
  }

  function handlePostDeleted(postId: string) {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId))
    setSelectedPost((currentPost) => (currentPost?.id === postId ? null : currentPost))
  }

  const displayName = getDisplayName(profile)

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      <HomeTopBar currentPath="/users" currentUser={currentUser} />
      <main className="mx-auto w-full max-w-[760px] px-3 pb-10 pt-16">
        <button
          type="button"
          className="mb-3 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-gray-700 hover:bg-white"
          onClick={handleBack}
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

        {isLoading ? (
          <section className="grid min-h-[240px] place-items-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </section>
        ) : error || !profile ? (
          <section className="rounded-xl bg-white p-5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-gray-200">
            {error ?? 'Profil pengguna tidak ditemukan.'}
          </section>
        ) : (
          <>
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-start gap-4">
                <HomeAvatar name={displayName} imageUrl={profile.avatarUrl} size="h-20 w-20" />
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-2xl font-bold text-gray-950">{displayName}</h1>
                  {profile.bio ? (
                    <p className="mt-2 text-sm font-medium leading-relaxed text-gray-600">{profile.bio}</p>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-gray-500">Belum ada bio.</p>
                  )}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
                    <div>
                      <p className="text-lg font-bold">{profile._count.posts}</p>
                      <p className="text-xs font-semibold text-gray-500">Postingan</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{profile._count.comments}</p>
                      <p className="text-xs font-semibold text-gray-500">Komentar</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{profile._count.likes}</p>
                      <p className="text-xs font-semibold text-gray-500">Suka</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-4 space-y-4">
              {posts.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center text-sm font-medium text-gray-500 shadow-sm ring-1 ring-gray-200">
                  Belum ada postingan.
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onLikeStatusChange={handleLikeStatusChange}
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
            </section>
          </>
        )}

        {selectedPost && (
          <PostDetailPage
            key={selectedPost.id}
            post={selectedPost}
            autoFocusComment={shouldFocusComment}
            onCommentCountChange={(nextCommentCount) => handleCommentCountChange(selectedPost.id, nextCommentCount)}
            onLikeStatusChange={(nextLikeCount, nextLiked) => handleLikeStatusChange(selectedPost.id, nextLikeCount, nextLiked)}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </main>
    </div>
  )
}
