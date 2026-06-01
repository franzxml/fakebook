import { useEffect, useState } from 'react'
import { apiRequest, getStoredSession, uploadImageFile } from '@/services/api'
import { notifyAuthStorageChanged } from '@/lib/navigation'
import { validateImageFile } from '@/lib/validateImageFile'
import type { PublicUser } from '@/types/social'

type ProfileFull = PublicUser & {
  createdAt: string
  updatedAt: string
  _count: { posts: number; comments: number; likes: number }
}

type StatusMessage = { ok: boolean; text: string }

export function useProfileEdit(profile: ProfileFull | null) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<StatusMessage | null>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.name)
    setUsername(profile.username ?? '')
    setEmail(profile.email)
    setBio(profile.bio ?? '')
    setAvatarUrl(profile.avatarUrl ?? '')
  }, [profile])

  function handleAvatarFileChange(file: File | undefined) {
    if (!file) return
    const error = validateImageFile(file)
    if (error) {
      setMessage({ ok: false, text: error })
      return
    }
    setAvatarFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
    setMessage(null)
  }

  async function handleSave(e: React.FormEvent, onSuccess: (user: PublicUser) => void) {
    e.preventDefault()
    if (!profile) return
    const token = getStoredSession()?.token
    if (!token) {
      setMessage({ ok: false, text: 'Sesi tidak ditemukan. Silakan login ulang.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const nextAvatarUrl = avatarFile ? await uploadImageFile(avatarFile, 'avatars', token) : avatarUrl
      const res = await apiRequest<{ user: PublicUser }>('/profile', {
        method: 'PATCH',
        token,
        body: {
          name: name.trim() !== profile.name ? name.trim() : undefined,
          username: username.trim() !== (profile.username ?? '') ? username.trim() : undefined,
          bio: bio.trim() !== (profile.bio ?? '') ? bio.trim() : undefined,
          email: email !== profile.email ? email : undefined,
          avatarUrl: nextAvatarUrl !== (profile.avatarUrl ?? '') ? nextAvatarUrl || null : undefined,
        },
      })
      setAvatarFile(null)
      setAvatarPreviewUrl(null)
      setAvatarUrl(res.user.avatarUrl ?? '')
      localStorage.setItem('user', JSON.stringify(res.user))
      notifyAuthStorageChanged()
      setMessage({ ok: true, text: 'Profil berhasil diperbarui.' })
      onSuccess(res.user)
    } catch {
      setMessage({ ok: false, text: 'Gagal memperbarui profil. Coba lagi.' })
    } finally {
      setIsSaving(false)
    }
  }

  return {
    name, setName,
    username, setUsername,
    email, setEmail,
    bio, setBio,
    avatarUrl, setAvatarUrl,
    avatarPreviewUrl,
    handleAvatarFileChange,
    handleSave,
    isSaving,
    message,
  }
}
