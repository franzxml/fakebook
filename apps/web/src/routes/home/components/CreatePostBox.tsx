import { useState } from 'react'
import { Image as ImageIcon, Send } from 'lucide-react'
import type { PublicUser } from '@ppwl/shared'
import { AvatarCircle } from '@/layouts/AppLayout'

export function CreatePostBox({ user }: { user: PublicUser }) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting) return
    setIsSubmitting(true)

    // TODO: sambungkan ke createPost() dari api.ts
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
          onChange={(event) => setContent(event.target.value)}
          placeholder={`Apa yang kamu pikirkan, ${user.name.split(' ')[0]}?`}
          rows={2}
          className="flex-1 resize-none rounded-full bg-[#f0f2f5] px-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:bg-slate-100"
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100">
          <ImageIcon size={18} className="text-green-500" />
          Foto
        </button>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-[#1877f2] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={15} />
          {isSubmitting ? 'Mengirim...' : 'Kirim'}
        </button>
      </div>
    </div>
  )
}
