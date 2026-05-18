import type { RefObject } from 'react'
import { PostDetailAvatar } from './PostDetailAvatar'
import { SendIcon } from './PostDetailIcons'

type CommentComposerProps = {
  value: string
  isSubmitting: boolean
  isAtLimit: boolean
  maxComments: number
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onSubmit: () => void
}

export function CommentComposer({
  value,
  isSubmitting,
  isAtLimit,
  maxComments,
  inputRef,
  onChange,
  onSubmit,
}: CommentComposerProps) {
  return (
    <div className="shrink-0 bg-white px-4 py-3" style={{ borderTop: '1px solid #DADDE1' }}>
      <div className="flex items-start gap-2">
        <PostDetailAvatar name="Khairunnisa" size="sm" />

        <div
          className="flex flex-1 flex-col rounded-[18px] px-3 py-2"
          style={{ backgroundColor: '#F0F2F5', opacity: isAtLimit ? 0.6 : 1 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSubmit()}
            placeholder={isAtLimit ? `Batas ${maxComments} komentar tercapai` : 'Komentar sebagai Khairunnisa...'}
            disabled={isAtLimit}
            className="w-full bg-transparent text-[14px] outline-none disabled:cursor-not-allowed"
            style={{ color: '#050505' }}
          />

          <div className="mt-2 flex select-none items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[13px] text-[#65676B]">
              <span className={isAtLimit ? 'opacity-40' : ''}>Smile</span>
              <span className={isAtLimit ? 'opacity-40' : ''}>Foto</span>
              <span className={isAtLimit ? 'opacity-40' : ''}>Tag</span>
              <span className={`rounded-[4px] bg-[#CED0D4] px-1 text-[10px] font-bold text-white ${isAtLimit ? 'opacity-40' : ''}`}>
                GIF
              </span>
            </div>

            <button
              onClick={onSubmit}
              disabled={!value.trim() || isSubmitting || isAtLimit}
              className="px-1 transition-opacity focus:outline-none disabled:opacity-30"
              style={{ color: '#1877F2' }}
              aria-label="Kirim"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
