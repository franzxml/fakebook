import { create } from 'zustand'
import type { FeedPost } from '@ppwl/shared'

type FeedStore = {
  posts: FeedPost[]
  setPosts: (posts: FeedPost[]) => void
  addPost: (post: FeedPost) => void
  updatePost: (post: FeedPost) => void
  deletePost: (postId: string) => void
}

export const useFeedStore = create<FeedStore>((set) => ({
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  updatePost: (updatedPost) =>
    set((state) => ({
      posts: state.posts.map((post) => post.id === updatedPost.id ? updatedPost : post),
    })),
  deletePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    })),
}))
