import type { RefObject } from 'react'
import { Avatar } from '@/components/avatar'
import type { PublicUser } from '@/types/social'
import { getDisplayName } from '@/lib/user-display'
import { CheckIcon, SendIcon } from './icons'

type CommentComposerProps = {
  currentUser: PublicUser | null
  value: string
  isSubmitting: boolean
  isAtLimit: boolean
  isEditing?: boolean
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
  isEditing = false,
  maxComments,
  placeholder,
  inputRef,
  onChange,
  onSubmit,
}: CommentComposerProps) {
  const displayName = getDisplayName(currentUser)

  return (
    <div
      className={`shrink-0 border-t px-4 py-3 ${isEditing ? 'border-fb-edit-divider bg-fb-edit-surface' : 'border-fb-divider bg-white'}`}
    >
      <div className="flex items-start gap-2">
        <Avatar imageUrl={currentUser?.avatarUrl} name={displayName} size="size-8" />

        <div
          className={`flex flex-1 flex-col rounded-[18px] px-3 py-2 ${
            isEditing ? 'border-[1.5px] border-blue-300 bg-blue-100' : 'bg-fb-surface'
          } ${isAtLimit ? 'opacity-60' : ''}`}
        >
          <input
            ref={inputRef}
            type="text"
            aria-label={isEditing ? 'Edit komentar' : 'Tulis komentar'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSubmit()}
            placeholder={isAtLimit ? `Batas ${maxComments} komentar tercapai` : placeholder ?? `Komentar sebagai ${displayName}...`}
            disabled={isAtLimit || !currentUser}
            className="w-full bg-transparent text-[14px] text-fb-text outline-none disabled:cursor-not-allowed"
          />

          <div className="mt-2 flex justify-end pt-1">
            <button
              onClick={onSubmit}
              disabled={!value.trim() || isSubmitting || isAtLimit}
              className="px-1 text-fb-blue transition-opacity focus:outline-none disabled:opacity-30"
              aria-label={isEditing ? 'Simpan' : 'Kirim'}
            >
              {isEditing ? <CheckIcon className="size-4" /> : <SendIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
