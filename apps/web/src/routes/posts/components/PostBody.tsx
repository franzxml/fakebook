import type { FeedPost } from '@/types/social'
import { PostDetailAvatar } from './PostDetailAvatar'

export function PostBody({ post }: { post: FeedPost }) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <PostDetailAvatar name={post.author.name} />
        <div>
          <p style={{ color: '#050505', fontSize: '15px', fontWeight: 600, lineHeight: '1.2' }}>
            {post.author.name}
          </p>
          <p className="flex items-center gap-1" style={{ color: '#65676B', fontSize: '12px', marginTop: '3px' }}>
            9 Mei · Publik
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <p style={{ color: '#050505', fontSize: '15px', lineHeight: '1.45' }}>
          {post.content}
        </p>
      </div>
    </>
  )
}
