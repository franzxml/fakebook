import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import type { FeedPost, PublicUser } from '@ppwl/shared'
import { deletePost, getStoredSession } from '@/services/api'
import { getDisplayName } from '@/lib/userDisplay'
import { Avatar } from '@/components/Avatar'
import { PostEditModal } from '@/routes/posts/components/PostEditModal'
import { usePostLike } from '@/routes/posts/hooks/usePostLike'
import { PostActionsMenu } from './PostActionsMenu'

function PostMedia({ post }: { post: FeedPost }) {
  const imageUrl = post.images[0]?.imageUrl

  if (!imageUrl) return null

  return <img src={imageUrl} alt="" className="mt-3 max-h-[460px] w-full object-cover" />
}

export function PostCard({
  post,
  currentUser,
  onOpenDetail,
  onOpenComments,
  onLikeStatusChange,
  onPostUpdated,
  onPostDeleted,
  onOpenAuthor,
}: {
  post: FeedPost
  currentUser?: PublicUser | null
  onOpenDetail: () => void
  onOpenComments: () => void
  onLikeStatusChange: (postId: string, nextLikeCount: number, nextLiked: boolean) => void
  onPostUpdated: (post: FeedPost) => void
  onPostDeleted: (postId: string) => void
  onOpenAuthor?: () => void
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const { handleLike, isUpdatingLike, likeCount, liked } = usePostLike({
    post,
    currentUserId: currentUser?.id,
    onLikeStatusChange: (nextLikeCount, nextLiked) => onLikeStatusChange(post.id, nextLikeCount, nextLiked),
  })

  const isOwner = Boolean(currentUser?.id && currentUser.id === post.author.id)
  const authorDisplayName = getDisplayName(post.author)

  async function handleDeletePost() {
    const session = getStoredSession()

    if (!session?.token || isDeleting) return
    if (!window.confirm('Hapus postingan ini?')) return

    setIsDeleting(true)
    setPostError(null)

    try {
      await deletePost(post.id, session.token)
      onPostDeleted(post.id)
    } catch (error) {
      setPostError(error instanceof Error ? error.message : 'Postingan gagal dihapus.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <article className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <button
              className="flex gap-3 text-left"
              onClick={(event) => {
                event.stopPropagation()
                if (onOpenAuthor) {
                  onOpenAuthor()
                } else {
                  onOpenDetail()
                }
              }}
            >
              <Avatar name={authorDisplayName} imageUrl={post.author.avatarUrl} />
              <div>
                <h3 className="text-sm font-bold text-gray-900">{authorDisplayName}</h3>
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString('id-ID')} · publik</p>
              </div>
            </button>
            <PostActionsMenu
              isOwner={isOwner}
              isDeleting={isDeleting}
              onEdit={() => setIsEditModalOpen(true)}
              onDelete={handleDeletePost}
            />
          </div>

          <button className="mt-3 block w-full text-left text-sm leading-relaxed text-gray-800" onClick={onOpenDetail}>
            {post.content}
          </button>

          {postError ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{postError}</p> : null}
        </div>

        <button className="block w-full text-left" onClick={onOpenDetail}>
          <PostMedia post={post} />
        </button>

        <div className="px-4 py-2">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-sm text-gray-500">
            <span>👍 {likeCount}</span>
            <button onClick={onOpenComments}>{post._count.comments} komentar</button>
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1 text-sm font-semibold text-gray-600">
            <button
              className={`flex items-center justify-center gap-2 rounded-lg py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 ${liked ? 'text-blue-600' : ''}`}
              disabled={isUpdatingLike}
              onClick={handleLike}
            >
              <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[19px]">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              Suka
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg py-2 hover:bg-gray-100" onClick={onOpenComments}>
              <MessageCircle size={19} /> Komentar
            </button>
          </div>
        </div>
      </article>

      {isEditModalOpen && (
        <PostEditModal
          post={post}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updatedPost) => {
            onPostUpdated(updatedPost)
            setIsEditModalOpen(false)
          }}
        />
      )}
    </>
  )
}
