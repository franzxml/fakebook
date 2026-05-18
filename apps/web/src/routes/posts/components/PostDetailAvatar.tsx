export function PostDetailAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm'

  return (
    <div
      className={`${sizeClass} flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white`}
      style={{ backgroundColor: '#1877F2' }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
