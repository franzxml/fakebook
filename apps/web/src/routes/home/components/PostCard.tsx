import { useEffect, useState } from 'react'
import { MessageCircle, MoreHorizontal, Pencil, Share2, ThumbsUp, Trash2 } from 'lucide-react'
import type { FeedPost, PublicUser } from '@ppwl/shared'
import { deletePost, getStoredSession, likePost, unlikePost, updatePost } from '@/services/api'
import { HomeAvatar } from './HomeAvatar'

function PostMedia({ post }: { post: FeedPost }) {
  const imageUrl = post.images[0]?.imageUrl

  if (!imageUrl) return null

  return <img src={imageUrl} alt="" className="mt-3 max-h-[460px] w-full object-cover" />
}

function getLikedPostIds(userId?: string) {
  if (!userId) return new Set<string>()

  try {
    const raw = localStorage.getItem(`liked-posts:${userId}`)
    const ids = raw ? JSON.parse(raw) as string[] : []
    return new Set(ids)
  } catch {
    return new Set<string>()
  }
}

function saveLikedPostIds(userId: string, likedPostIds: Set<string>) {
  localStorage.setItem(`liked-posts:${userId}`, JSON.stringify([...likedPostIds]))
}

export function PostCard({
  post,
  currentUser,
  onOpenDetail,
  onOpenComments,
  onLikeCountChange,
  onPostUpdated,
  onPostDeleted,
}: {
  post: FeedPost
  currentUser?: PublicUser | null
  onOpenDetail: () => void
  onOpenComments: () => void
  onLikeCountChange: (postId: string, nextLikeCount: number) => void
  onPostUpdated: (post: FeedPost) => void
  onPostDeleted: (postId: string) => void
}) {
  const [liked, setLiked] = useState(() => getLikedPostIds(currentUser?.id).has(post.id))
  const [isUpdatingLike, setIsUpdatingLike] = useState(false)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const likeCount = post._count.likes
  const isOwner = Boolean(currentUser?.id && currentUser.id === post.author.id)

  useEffect(() => {
    setLiked(getLikedPostIds(currentUser?.id).has(post.id))
  }, [currentUser?.id, post.id])

  useEffect(() => {
    setEditContent(post.content)
  }, [post.content])

  async function handleLike() {
    const session = getStoredSession()

    if (!session?.token || !currentUser?.id || isUpdatingLike) return

    const nextLiked = !liked
    const nextLikeCount = Math.max(likeCount + (nextLiked ? 1 : -1), 0)
    const likedPostIds = getLikedPostIds(currentUser.id)

    setLiked(nextLiked)
    onLikeCountChange(post.id, nextLikeCount)
    setIsUpdatingLike(true)

    if (nextLiked) {
      likedPostIds.add(post.id)
    } else {
      likedPostIds.delete(post.id)
    }
    saveLikedPostIds(currentUser.id, likedPostIds)

    try {
      if (nextLiked) {
        await likePost(post.id, session.token)
      } else {
        await unlikePost(post.id, session.token)
      }
    } catch {
      const rollbackLikedPostIds = getLikedPostIds(currentUser.id)

      setLiked(liked)
      onLikeCountChange(post.id, likeCount)

      if (liked) {
        rollbackLikedPostIds.add(post.id)
      } else {
        rollbackLikedPostIds.delete(post.id)
      }
      saveLikedPostIds(currentUser.id, rollbackLikedPostIds)
    } finally {
      setIsUpdatingLike(false)
    }
  }

  async function handleSaveEdit() {
    const session = getStoredSession()
    const trimmedContent = editContent.trim()

    if (!session?.token || !trimmedContent || isSavingEdit) return

    setIsSavingEdit(true)
    setPostError(null)

    try {
      const updatedPost = await updatePost(post.id, trimmedContent, session.token)
      onPostUpdated(updatedPost)
      setIsEditing(false)
      setIsActionsOpen(false)
    } catch (error) {
      setPostError(error instanceof Error ? error.message : 'Postingan gagal diperbarui.')
    } finally {
      setIsSavingEdit(false)
    }
  }

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
      setIsActionsOpen(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <button className="flex gap-3 text-left" onClick={onOpenDetail}>
            <HomeAvatar name={post.author.name} imageUrl={post.author.avatarUrl} />
            <div>
              <h3 className="text-sm font-bold text-gray-900">{post.author.name}</h3>
              <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString('id-ID')} · publik</p>
            </div>
          </button>
          <div className="relative">
            <button
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              onClick={() => setIsActionsOpen((isOpen) => !isOpen)}
              aria-label="Menu postingan"
            >
              <MoreHorizontal size={20} />
            </button>
            {isActionsOpen ? (
              <div className="absolute right-0 top-10 z-20 w-52 rounded-lg bg-white p-2 shadow-xl ring-1 ring-black/10">
                {isOwner ? (
                  <>
                    <button
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-gray-800 hover:bg-gray-100"
                      onClick={() => {
                        setIsEditing(true)
                        setIsActionsOpen(false)
                      }}
                    >
                      <Pencil size={17} />
                      Edit postingan
                    </button>
                    <button
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isDeleting}
                      onClick={handleDeletePost}
                    >
                      <Trash2 size={17} />
                      {isDeleting ? 'Menghapus...' : 'Hapus postingan'}
                    </button>
                  </>
                ) : (
                  <p className="px-3 py-2 text-sm font-medium text-gray-500">Tidak ada aksi tersedia.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
        {isEditing ? (
          <div className="mt-3 space-y-3">
            <textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex justify-end gap-2">
              <button
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
                onClick={() => {
                  setEditContent(post.content)
                  setIsEditing(false)
                  setPostError(null)
                }}
              >
                Batal
              </button>
              <button
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingEdit || !editContent.trim()}
                onClick={handleSaveEdit}
              >
                {isSavingEdit ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        ) : (
          <button className="mt-3 block w-full text-left text-sm leading-relaxed text-gray-800" onClick={onOpenDetail}>
            {post.content}
          </button>
        )}
        {postError ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{postError}</p> : null}
      </div>

      <button className="block w-full text-left" onClick={onOpenDetail}>
        <PostMedia post={post} />
      </button>

      <div className="px-4 py-2">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-sm text-gray-500">
          <span>👍 {likeCount}</span>
          <button onClick={onOpenComments}>{post._count.comments} komentar · 0 dibagikan</button>
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1 text-sm font-semibold text-gray-600">
          <button
            className={`flex items-center justify-center gap-2 rounded-lg py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 ${liked ? 'text-blue-600' : ''}`}
            disabled={isUpdatingLike}
            onClick={handleLike}
          >
            <ThumbsUp size={19} fill={liked ? 'currentColor' : 'none'} /> Suka
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg py-2 hover:bg-gray-100" onClick={onOpenComments}>
            <MessageCircle size={19} /> Komentar
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg py-2 hover:bg-gray-100">
            <Share2 size={19} /> Bagikan
          </button>
        </div>
      </div>
    </article>
  )
}
