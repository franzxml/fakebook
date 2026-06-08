import { useState } from 'react'
import { apiRequest, getStoredSession } from '@/services/api'

type StatusMessage = { ok: boolean; text: string }

export function usePasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<StatusMessage | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const token = getStoredSession()?.token
    if (!token) {
      setMessage({ ok: false, text: 'Sesi tidak ditemukan. Silakan login ulang.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await apiRequest('/profile/password', {
        method: 'PATCH',
        token,
        body: { currentPassword, newPassword },
      })
      setMessage({ ok: true, text: 'Password berhasil diperbarui.' })
      setCurrentPassword('')
      setNewPassword('')
    } catch {
      setMessage({ ok: false, text: 'Gagal ganti password. Periksa password lama kamu.' })
    } finally {
      setIsSaving(false)
    }
  }

  return {
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    showCurrent, setShowCurrent,
    showNew, setShowNew,
    isSaving,
    message,
    handleSave,
  }
}
