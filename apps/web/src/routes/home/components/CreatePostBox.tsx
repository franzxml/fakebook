import { useState } from 'react'
import { Image as ImageIcon, Send, X } from 'lucide-react'
import type { PublicUser } from '@ppwl/shared'
import { AvatarCircle } from '@/layouts/AppLayout'
import { getDisplayName } from '@/lib/userDisplay'
import { createPost, getStoredSession, uploadImageFile } from '@/services/api'
import type { FeedPost } from '@/types/social'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

type CreatePostBoxProps = {
  user: PublicUser
  onPostCreated?: (post: FeedPost) => void
}

export function CreatePostBox({ user, onPostCreated }: CreatePostBoxProps) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const displayName = getDisplayName(user)

  function handleImageChange(file: File | undefined) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar.')
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError('Ukuran gambar maksimal 5 MB.')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSubmit() {
    const trimmed = content.trim()
    if ((!trimmed && !imagePreview) || isSubmitting) return

    const session = getStoredSession()

    if (!session?.token) {
      setError('Sesi tidak ditemukan. Silakan login ulang.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const imageUrl = imageFile ? await uploadImageFile(imageFile, 'posts', session.token) : null
      const post = await createPost(trimmed || ' ', session.token, imageUrl ? [imageUrl] : [])
      setContent('')
      setImageFile(null)
      setImagePreview(null)
      onPostCreated?.(post)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Postingan gagal dibuat.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <AvatarCircle user={user} />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={`Apa yang kamu pikirkan, ${displayName.split(' ')[0]}?`}
          rows={2}
          className="flex-1 resize-none rounded-full bg-[#f0f2f5] px-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:bg-slate-100"
        />
      </div>

      {imagePreview ? (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-100">
          <img src={imagePreview} alt="Pratinjau gambar postingan" className="max-h-72 w-full object-cover" />
          <button
            type="button"
            className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-slate-950/70 text-white transition hover:bg-slate-950"
            aria-label="Hapus gambar"
            onClick={() => {
              setImageFile(null)
              setImagePreview(null)
            }}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => handleImageChange(event.target.files?.[0])}
          />
          <ImageIcon size={18} className="text-green-500" />
          Foto
        </label>

        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && !imagePreview) || isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-[#1877f2] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={15} />
          {isSubmitting ? 'Mengirim...' : 'Kirim'}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
