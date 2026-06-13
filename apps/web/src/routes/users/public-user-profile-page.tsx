import { useState } from 'react'
import type { FeedPost } from '@ppwl/shared'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { HomeTopBar } from '@/routes/home/components/home-top-bar'
import { Avatar } from '@/components/avatar'
import { PostCard } from '@/routes/home/components/post-card'
import { PostDetailPage } from '@/routes/posts/post-detail-page'
import { fetchPublicUserProfile, getStoredUser } from '@/services/api'
import { navigate } from '@/lib/navigation'
import { getDisplayName } from '@/lib/user-display'
import type { PublicAuthor } from '@/types/social'

type PublicUserProfilePageProps = {
  userId: string
}

type PublicProfile = PublicAuthor & {
  createdAt: string
  posts: FeedPost[]
  _count: {
    posts: number
    comments: number
    likes: number
  }
}

type ProfileResponse = {
  user: PublicProfile
}

export function PublicUserProfilePage({ userId }: PublicUserProfilePageProps) {
  const queryClient = useQueryClient()
  const currentUser = getStoredUser()
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null)
  const [shouldFocusComment, setShouldFocusComment] = useState(false)

  const { data: profileData, isLoading, isError, error } = useQuery<ProfileResponse>({
    queryKey: ['user', userId, 'profile'],
    queryFn: () => fetchPublicUserProfile(userId),
  })

  const profile = profileData?.user ?? null
  const posts = profile?.posts ?? []
  const displayName = getDisplayName(profile)

  function updateProfileCache(updater: (posts: FeedPost[]) => FeedPost[]) {
    queryClient.setQueryData<ProfileResponse>(['user', userId, 'profile'], (old) => {
      if (!old) return old
      return { ...old, user: { ...old.user, posts: updater(old.user.posts) } }
    })
  }

  function handleLikeStatusChange(postId: string, nextLikeCount: number, nextLiked: boolean) {
    const update = (post: FeedPost): FeedPost => ({
      ...post,
      likes: currentUser?.id && nextLiked ? [{ userId: currentUser.id }] : [],
      _count: { ...post._count, likes: nextLikeCount },
    })
    updateProfileCache((items) => items.map((p) => (p.id === postId ? update(p) : p)))
    setSelectedPost((current) => (current?.id === postId ? update(current) : current))
  }

  function handleCommentCountChange(postId: string, nextCommentCount: number) {
    const update = (post: FeedPost): FeedPost => ({
      ...post,
      _count: { ...post._count, comments: nextCommentCount },
    })
    updateProfileCache((items) => items.map((p) => (p.id === postId ? update(p) : p)))
    setSelectedPost((current) => (current?.id === postId ? update(current) : current))
  }

  function handlePostUpdated(updatedPost: FeedPost) {
    updateProfileCache((items) => items.map((p) => (p.id === updatedPost.id ? updatedPost : p)))
    setSelectedPost((current) => (current?.id === updatedPost.id ? updatedPost : current))
  }

  function handlePostDeleted(postId: string) {
    updateProfileCache((items) => items.filter((p) => p.id !== postId))
    setSelectedPost((current) => (current?.id === postId ? null : current))
  }

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate('/users')
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      <HomeTopBar currentPath="/users" currentUser={currentUser} />
      <main className="mx-auto w-full max-w-[760px] px-3 pb-10 pt-16">
        <button
          type="button"
          className="mb-3 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-gray-700 hover:bg-white"
          onClick={handleBack}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Kembali
        </button>

        {isLoading ? (
          <section className="grid min-h-[240px] place-items-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200" role="status" aria-label="Memuat profil">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-hidden="true" />
          </section>
        ) : isError || !profile ? (
          <section className="rounded-xl bg-white p-5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-gray-200">
            {error instanceof Error ? error.message : 'Profil pengguna tidak ditemukan.'}
          </section>
        ) : (
          <>
            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Avatar name={displayName} imageUrl={profile.avatarUrl} size="h-16 w-16 sm:h-20 sm:w-20" />
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-2xl font-bold text-gray-950">{displayName}</h1>
                  {profile.bio ? (
                    <p className="mt-2 text-sm font-medium leading-relaxed text-gray-600">{profile.bio}</p>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-gray-500">Belum ada bio.</p>
                  )}
                  <div className="mt-4 grid grid-cols-3 gap-1 border-t border-gray-100 pt-4 text-center min-[375px]:gap-2">
                    <div className="min-w-0">
                      <p className="text-lg font-bold">{profile._count.posts}</p>
                      <p className="truncate text-[11px] font-semibold text-gray-500 min-[375px]:text-xs">Postingan</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold">{profile._count.comments}</p>
                      <p className="truncate text-[11px] font-semibold text-gray-500 min-[375px]:text-xs">Komentar</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold">{profile._count.likes}</p>
                      <p className="truncate text-[11px] font-semibold text-gray-500 min-[375px]:text-xs">Suka</p>
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
            onCommentCountChange={(nextCommentCount) =>
              handleCommentCountChange(selectedPost.id, nextCommentCount)
            }
            onLikeStatusChange={(nextLikeCount, nextLiked) =>
              handleLikeStatusChange(selectedPost.id, nextLikeCount, nextLiked)
            }
            onClose={() => setSelectedPost(null)}
          />
        )}
      </main>
    </div>
  )
}
