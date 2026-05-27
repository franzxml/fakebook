import type { RefObject } from 'react'
import type { PublicUser } from '@/types/social'
import { getDisplayName } from '@/lib/userDisplay'
import { PostDetailAvatar } from './PostDetailAvatar'
import { SendIcon } from './PostDetailIcons'

type CommentComposerProps = {
  currentUser: PublicUser | null
  value: string
  isSubmitting: boolean
  isAtLimit: boolean
  maxComments: number
  placeholder?: string
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onSubmit: () => void
}

export function CommentComposer({
  currentUser,
  value,
  isSubmitting,
  isAtLimit,
  maxComments,
  placeholder,
  inputRef,
  onChange,
  onSubmit,
}: CommentComposerProps) {
  const displayName = getDisplayName(currentUser)

  return (
    <div className="shrink-0 bg-white px-4 py-3" style={{ borderTop: '1px solid #DADDE1' }}>
      <div className="flex items-start gap-2">
        <PostDetailAvatar avatarUrl={currentUser?.avatarUrl} name={displayName} size="sm" />

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
            placeholder={isAtLimit ? `Batas ${maxComments} komentar tercapai` : placeholder ?? `Komentar sebagai ${displayName}...`}
            disabled={isAtLimit || !currentUser}
            className="w-full bg-transparent text-[14px] outline-none disabled:cursor-not-allowed"
            style={{ color: '#050505' }}
          />

          <div className="mt-2 flex justify-end pt-1">
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
