type HomeAvatarProps = {
  name?: string | null
  imageUrl?: string | null
  size?: string
}

export function HomeAvatar({ name = 'Fakebook', imageUrl, size = 'h-10 w-10' }: HomeAvatarProps) {
  const displayName = name?.trim() || 'Fakebook'
  const initial = displayName.charAt(0).toUpperCase()

  if (imageUrl) {
    return <img src={imageUrl} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  }

  return (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-300 text-sm font-bold text-white`}>
      {initial}
    </div>
  )
}
