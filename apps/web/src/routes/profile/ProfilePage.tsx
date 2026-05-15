import { useEffect, useState } from 'react'
import { Camera, Check, Eye, EyeOff, KeyRound, Loader2, Save, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/layouts/AppLayout'
import { apiRequest } from '@/services/api'
import type { PublicUser } from '@/types/social'

type ProfileResponse = {
  profile: PublicUser & {
    createdAt: string
    updatedAt: string
    _count: { posts: number; comments: number; likes: number }
  }
}

type UpdateProfileResponse = {
  user: PublicUser
}

type UpdatePasswordResponse = {
  success: boolean
  message: string
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('session')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token ?? null
  } catch {
    return null
  }
}

function ProfileAvatar({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="size-20 rounded-full object-cover ring-2 ring-blue-100"
      />
    )
  }
  return (
    <div className="flex size-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-semibold text-blue-700 ring-2 ring-blue-200">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-slate-50 px-4 py-3">
      <span className="text-lg font-semibold text-slate-950">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

export function ProfilePage() {
  const token = getToken()

  const [profile, setProfile] = useState<ProfileResponse['profile'] | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [errorProfile, setErrorProfile] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!token) {
      setErrorProfile('Sesi tidak ditemukan. Silakan login ulang.')
      setLoadingProfile(false)
      return
    }

    apiRequest<ProfileResponse>('/profile', { token })
      .then((res) => {
        setProfile(res.profile)
        setName(res.profile.name)
        setEmail(res.profile.email)
        setAvatarUrl(res.profile.avatarUrl ?? '')
      })
      .catch(() => setErrorProfile('Gagal memuat profil. Coba refresh halaman.'))
      .finally(() => setLoadingProfile(false))
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !profile) return

    setSavingProfile(true)
    setProfileMsg(null)

    try {
      const res = await apiRequest<UpdateProfileResponse>('/profile', {
        method: 'PATCH',
        token,
        body: {
          name: name.trim() !== profile.name ? name.trim() : undefined,
          email: email !== profile.email ? email : undefined,
          avatarUrl: avatarUrl !== (profile.avatarUrl ?? '') ? avatarUrl || null : undefined,
        },
      })
      setProfile((prev) => (prev ? { ...prev, ...res.user } : prev))
      setProfileMsg({ ok: true, text: 'Profil berhasil diperbarui.' })
    } catch {
      setProfileMsg({ ok: false, text: 'Gagal memperbarui profil. Coba lagi.' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return

    setSavingPassword(true)
    setPasswordMsg(null)

    try {
      await apiRequest<UpdatePasswordResponse>('/profile/password', {
        method: 'PATCH',
        token,
        body: { currentPassword, newPassword },
      })
      setPasswordMsg({ ok: true, text: 'Password berhasil diperbarui.' })
      setCurrentPassword('')
      setNewPassword('')
    } catch {
      setPasswordMsg({ ok: false, text: 'Gagal ganti password. Periksa password lama kamu.' })
    } finally {
      setSavingPassword(false)
    }
  }

  if (loadingProfile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    )
  }

  if (errorProfile || !profile) {
    return (
      <AppLayout>
        <div className="rounded-lg border border-red-100 bg-red-50 p-5 text-sm text-red-600">
          {errorProfile ?? 'Profil tidak ditemukan.'}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-4">

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <ProfileAvatar avatarUrl={profile.avatarUrl} name={profile.name} />
            <div>
              <h1 className="text-xl font-semibold text-slate-950">{profile.name}</h1>
              <p className="text-sm text-slate-500">{profile.email}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatBadge label="Postingan" value={profile._count.posts} />
            <StatBadge label="Komentar" value={profile._count.comments} />
            <StatBadge label="Likes" value={profile._count.likes} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User className="size-4 text-slate-400" />
            <h2 className="font-semibold text-slate-950">Edit Profil</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Avatar URL
              <div className="mt-2 flex gap-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/foto.jpg"
                  className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <Button variant="secondary" type="button" aria-label="Preview avatar">
                  <Camera className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Nama
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={1}
                required
                className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                minLength={3}
                required
                className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </label>
            {profileMsg && (
              <p className={`text-sm ${profileMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                {profileMsg.text}
              </p>
            )}
            <Button type="submit" disabled={savingProfile} className="gap-2">
              {savingProfile
                ? <Loader2 className="size-4 animate-spin" />
                : <Save className="size-4" aria-hidden="true" />
              }
              Simpan Perubahan
            </Button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="size-4 text-slate-400" />
            <h2 className="font-semibold text-slate-950">Ganti Password</h2>
          </div>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Password Saat Ini
              <div className="relative mt-2">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-slate-200 px-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showCurrent ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password Baru
              <div className="relative mt-2">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-10 w-full rounded-md border border-slate-200 px-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showNew ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">Minimal 6 karakter</p>
            </label>
            {passwordMsg && (
              <p className={`flex items-center gap-1 text-sm ${passwordMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                {passwordMsg.ok && <Check className="size-3" />}
                {passwordMsg.text}
              </p>
            )}
            <Button type="submit" disabled={savingPassword} className="gap-2">
              {savingPassword
                ? <Loader2 className="size-4 animate-spin" />
                : <KeyRound className="size-4" aria-hidden="true" />
              }
              Perbarui Password
            </Button>
          </form>
        </section>

      </div>
    </AppLayout>
  )
}