import { useEffect, useState } from 'react'
import { getStoredSession, updatePost, uploadImageFile } from '@/services/api'
import type { FeedPost } from '@/types/social'

type UsePostEditOptions = {
  post: FeedPost
  onSuccess?: (updatedPost: FeedPost) => void
}

export function usePostEdit({ post, onSuccess }: UsePostEditOptions) {
  const [content, setContent] = useState(post.content)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
    post.images.map((img) => img.imageUrl),
  )
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function removeExistingImage(index: number) {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  function addNewImages(files: File[], currentExistingCount: number) {
    const totalCurrent = currentExistingCount + newImageFiles.length
    if (totalCurrent >= 1) return
    const valid = files.filter((f) => f.type.startsWith('image/')).slice(0, 1)
    if (!valid[0]) return
    setNewImageFiles([valid[0]])
    const preview = URL.createObjectURL(valid[0])
    setNewImagePreviews([preview])
  }

  function removeNewImage(index: number) {
    const previewUrl = newImagePreviews[index]
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function submitEdit() {
    const trimmed = content.trim()
    if (!trimmed) {
      setError('Konten postingan tidak boleh kosong.')
      return
    }

    const session = getStoredSession()
    if (!session?.token) {
      setError('Sesi tidak ditemukan. Silakan login ulang.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let uploadedUrls: string[] = []

      if (newImageFiles.length > 0) {
        uploadedUrls = await Promise.all(
          newImageFiles.map((file) => uploadImageFile(file, 'posts', session.token)),
        )
      }

      const allImageUrls = [...existingImageUrls, ...uploadedUrls]
      const imageUrlsChanged =
        allImageUrls.length !== post.images.length ||
        allImageUrls.some((url, i) => url !== post.images[i]?.imageUrl)

      const updatedPost = await updatePost(
        post.id,
        trimmed,
        session.token,
        imageUrlsChanged ? allImageUrls : undefined,
      )

      newImagePreviews.forEach((url) => URL.revokeObjectURL(url))
      onSuccess?.(updatedPost)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui postingan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    content,
    setContent,
    existingImageUrls,
    removeExistingImage,
    newImagePreviews,
    addNewImages,
    removeNewImage,
    isSubmitting,
    error,
    submitEdit,
  }
}
