type AvatarProps = {
  name: string
  imageUrl?: string | null
  size?: string
}

export function Avatar({ name, imageUrl, size = 'size-10' }: AvatarProps) {
  const initial = (name?.trim() || '?').charAt(0).toUpperCase()

  if (imageUrl) {
    return <img src={imageUrl} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  }

  return (
    <div className={`${size} flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-300 font-bold text-white`}>
      {initial}
    </div>
  )
}
