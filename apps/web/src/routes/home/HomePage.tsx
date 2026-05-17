import { useState } from 'react'
import { ThumbsUp, MessageCircle, Image as ImageIcon, Send } from 'lucide-react'
import type { FeedPost, PublicUser } from '@ppwl/shared'
import { AppLayout, AvatarCircle } from '@/layouts/AppLayout'

type HomePageProps = {
  posts: FeedPost[]
  aside?: React.ReactNode
  currentUser?: PublicUser | null
}

export function HomePage({ posts, aside, currentUser }: HomePageProps) {
  return (
    <AppLayout aside={aside} currentUser={currentUser} currentPath="/home">
      <div className="mx-auto max-w-xl space-y-4">
        {/* Kotak buat postingan */}
        {currentUser && <CreatePostBox user={currentUser} />}

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-400">Belum ada postingan.</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </AppLayout>
  )
}

// ===== Komponen kotak buat postingan =====
function CreatePostBox({ user }: { user: PublicUser }) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting) return
    setIsSubmitting(true)

    // TODO: sambungkan ke createPost() dari api.ts
    // Untuk sekarang hanya reset form
    setTimeout(() => {
      setContent('')
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <AvatarCircle user={user} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Apa yang kamu pikirkan, ${user.name.split(' ')[0]}?`}
          rows={2}
          className="flex-1 resize-none rounded-full bg-[#f0f2f5] px-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-slate-100 transition-colors"
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
          <ImageIcon size={18} className="text-green-500" />
          Foto
        </button>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-[#1877f2] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={15} />
          {isSubmitting ? 'Mengirim...' : 'Kirim'}
        </button>
      </div>
    </div>
  )
}

// ===== Komponen kartu postingan =====
function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [showComments, setShowComments] = useState(false)

  function handleLike() {
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    //sambungkan ke API like/unlike karna sekarang ini hanya simulasi di frontend
  }

  function navigate(path: string) {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <article className="rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header postingan */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => navigate('/profile')}>
          <AvatarCircle user={post.author} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {post.author.name}
          </p>
          <p className="text-xs text-slate-400">{formatRelativeTime(post.createdAt)}</p>
        </div>
      </div>

      {/* Isi postingan */}
      <div className="px-4 pb-3">
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Gambar */}
      {post.images.length > 0 && (
        <div className={`grid gap-1 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.images.map((img) => (
            <img
              key={img.id}
              src={img.imageUrl}
              alt="Gambar postingan"
              className="w-full object-cover max-h-80"
            />
          ))}
        </div>
      )}

      {/* Statistik like & komentar */}
      {(likeCount > 0 || post._count.comments > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-400">
          {likeCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1877f2] text-white">
                👍
              </span>
              {likeCount}
            </span>
          )}
          {post._count.comments > 0 && (
            <button
              onClick={() => setShowComments((v) => !v)}
              className="ml-auto hover:underline"
            >
              {post._count.comments} komentar
            </button>
          )}
        </div>
      )}

      {/* Tombol aksi */}
      <div className="flex border-t border-slate-100">
        <button
          onClick={handleLike}
          className={[
            'flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50',
            liked ? 'text-[#1877f2]' : 'text-slate-500',
          ].join(' ')}
        >
          <ThumbsUp size={18} />
          Suka
        </button>

        <button
          onClick={() => navigate(`/posts/${post.id}`)}
          className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <MessageCircle size={18} />
          Komentar
        </button>
      </div>
    </article>
  )
}

// ===== Helper: format waktu relatif =====
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit yang lalu`
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays < 7) return `${diffDays} hari yang lalu`

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
