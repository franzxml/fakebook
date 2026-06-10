import { Avatar } from '@/components/avatar'
import type { FeedPost } from '@/types/social'
import { getDisplayName } from '@/lib/user-display'

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
          <p className="text-[15px] font-semibold leading-[1.2] text-fb-text">
            {authorDisplayName}
          </p>
          <p className="mt-[3px] flex items-center gap-1 text-[12px] text-fb-text-secondary">
            Publik
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="text-[15px] leading-[1.45] text-fb-text">
          {post.content}
        </p>
        {post.images.length > 0 && (
          <div className={`mt-3 grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.images.map((img) => (
              <img
                key={img.id}
                src={img.imageUrl}
                alt=""
                className={`w-full rounded-lg object-cover ${post.images.length === 1 ? 'max-h-[400px]' : 'max-h-[200px]'}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
