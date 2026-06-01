import { Avatar } from '@/components/Avatar'
import type { FeedPost } from '@/types/social'
import { getDisplayName } from '@/lib/userDisplay'

type PostBodyProps = {
  post: FeedPost
}

export function PostBody({ post }: PostBodyProps) {
  const authorDisplayName = getDisplayName(post.author)

  return (
    <>
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Avatar imageUrl={post.author.avatarUrl} name={authorDisplayName} />
        <div className="flex-1">
          <p style={{ color: '#050505', fontSize: '15px', fontWeight: 600, lineHeight: '1.2' }}>
            {authorDisplayName}
          </p>
          <p className="flex items-center gap-1" style={{ color: '#65676B', fontSize: '12px', marginTop: '3px' }}>
            Publik
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <p style={{ color: '#050505', fontSize: '15px', lineHeight: '1.45' }}>
          {post.content}
        </p>
        {post.images.length > 0 && (
          <div className={`mt-3 grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.images.map((img) => (
              <img
                key={img.id}
                src={img.imageUrl}
                alt=""
                className="w-full rounded-lg object-cover"
                style={{ maxHeight: post.images.length === 1 ? '400px' : '200px' }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
