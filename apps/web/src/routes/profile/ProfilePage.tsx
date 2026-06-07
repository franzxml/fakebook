import { useEffect, useState } from 'react'
import { Camera, Check, Eye, EyeOff, KeyRound, Loader2, Mail, Save, User } from 'lucide-react'
import { apiRequest, getStoredSession, getStoredUser } from '@/services/api'
import { HomeTopBar } from '@/routes/home/components/HomeTopBar'
import type { PublicUser } from '@/types/social'
import { usePasswordChange } from './hooks/usePasswordChange'
import { useProfileEdit } from './hooks/useProfileEdit'

type ProfileFull = PublicUser & {
  createdAt: string
  updatedAt: string
  _count: { posts: number; comments: number; likes: number }
}

type ProfileResponse = {
  profile: ProfileFull
}

function AvatarPreview({ avatarUrl, name, size = 'h-32 w-32' }: { avatarUrl: string | null; name: string; size?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${size} rounded-full object-cover ring-4 ring-white`} />
  }

  return (
    <div className={`${size} flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-300 text-4xl font-bold text-white ring-4 ring-white`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {label}
      </span>
      {children}
    </label>
  )
}

function StatusMessage({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null

  return (
    <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {message.ok ? <Check className="mr-1 inline h-4 w-4" aria-hidden="true" /> : null}
      {message.text}
    </p>
  )
}

export function ProfilePage() {
  const [storedUser, setStoredUser] = useState<PublicUser | null>(() => getStoredUser())
  const [profile, setProfile] = useState<ProfileFull | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const profileEdit = useProfileEdit(profile)
  const passwordChange = usePasswordChange()

  useEffect(() => {
    const token = getStoredSession()?.token
    if (!token) {
      setLoadError('Sesi tidak ditemukan. Silakan login ulang.')
      setIsLoading(false)
      return
    }

    async function load() {
      try {
        const res = await apiRequest<ProfileResponse>('/profile', { token })
        setProfile(res.profile)
        setStoredUser(res.profile)
      } catch {
        setLoadError('Gagal memuat profil. Coba refresh halaman.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f0f2f5]" role="status" aria-label="Memuat profil">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-hidden="true" />
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] pt-20">
        <main className="mx-auto max-w-xl rounded-xl bg-white p-5 text-sm font-semibold text-red-700 shadow-sm">
          {loadError ?? 'Profil tidak ditemukan.'}
        </main>
      </div>
    )
  }

  const previewAvatar = profileEdit.avatarPreviewUrl || profileEdit.avatarUrl || null

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-950">
      <HomeTopBar currentPath="/profile" currentUser={storedUser ?? profile} />

      <main className="mx-auto max-w-[980px] px-4 pb-12 pt-14">
        <section className="bg-white px-6 py-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            @{profile.username ?? 'username'}
          </p>
          {profile.bio ? (
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-gray-600">{profile.bio}</p>
          ) : null}

          <div className="mt-5 grid grid-cols-3 border-t border-gray-200 pt-4 text-center">
            <div>
              <p className="text-xl font-bold">{profile._count.posts}</p>
              <p className="text-sm font-semibold text-gray-500">Postingan</p>
            </div>
            <div>
              <p className="text-xl font-bold">{profile._count.comments}</p>
              <p className="text-sm font-semibold text-gray-500">Komentar</p>
            </div>
            <div>
              <p className="text-xl font-bold">{profile._count.likes}</p>
              <p className="text-sm font-semibold text-gray-500">Suka</p>
            </div>
          </div>
        </section>

        <div className="mt-4 space-y-4">
          {/* Edit Profil */}
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Edit profil</h2>
            <p className="mt-1 text-sm text-gray-500">Ubah nama, username, bio, foto profil, dan email akun.</p>

            <form
              onSubmit={(e) => profileEdit.handleSave(e, (user) => {
                setProfile((prev) => prev ? { ...prev, ...user } : prev)
                setStoredUser(user)
              })}
              className="mt-5 space-y-4"
            >
              <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                <AvatarPreview avatarUrl={previewAvatar} name={profileEdit.name || profile.name} size="h-20 w-20" />
                <div className="flex-1 space-y-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-300">
                    <Camera size={16} aria-hidden="true" />
                    Upload foto
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => profileEdit.handleAvatarFileChange(e.target.files?.[0])}
                    />
                  </label>
                  <Field label="Avatar URL" icon={<Camera size={16} aria-hidden="true" />}>
                    <input
                      type="url"
                      value={profileEdit.avatarUrl}
                      onChange={(e) => profileEdit.setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/foto.jpg"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </Field>
                </div>
              </div>

              <Field label="Nama" icon={<User size={16} aria-hidden="true" />}>
                <input
                  type="text"
                  value={profileEdit.name}
                  onChange={(e) => profileEdit.setName(e.target.value)}
                  minLength={1}
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <Field label="Username" icon={<User size={16} aria-hidden="true" />}>
                <input
                  type="text"
                  value={profileEdit.username}
                  onChange={(e) => profileEdit.setUsername(e.target.value.toLowerCase())}
                  minLength={3}
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <Field label="Bio" icon={<User size={16} aria-hidden="true" />}>
                <textarea
                  value={profileEdit.bio}
                  onChange={(e) => profileEdit.setBio(e.target.value)}
                  rows={3}
                  maxLength={160}
                  placeholder="Tulis sedikit tentang diri Anda."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <Field label="Email" icon={<Mail size={16} aria-hidden="true" />}>
                <input
                  type="email"
                  value={profileEdit.email}
                  onChange={(e) => profileEdit.setEmail(e.target.value)}
                  minLength={3}
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <StatusMessage message={profileEdit.message} />

              <button
                type="submit"
                disabled={profileEdit.isSaving}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileEdit.isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                Simpan perubahan
              </button>
            </form>
          </section>

          {/* Ganti Password */}
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Keamanan dan login</h2>
            <p className="mt-1 text-sm text-gray-500">Ganti password akun manual Anda.</p>

            <form onSubmit={passwordChange.handleSave} className="mt-5 space-y-4">
              <Field label="Password saat ini" icon={<KeyRound size={16} aria-hidden="true" />}>
                <div className="relative">
                  <input
                    type={passwordChange.showCurrent ? 'text' : 'password'}
                    value={passwordChange.currentPassword}
                    onChange={(e) => passwordChange.setCurrentPassword(e.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    aria-label={passwordChange.showCurrent ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => passwordChange.setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  >
                    {passwordChange.showCurrent ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </Field>

              <Field label="Password baru" icon={<KeyRound size={16} aria-hidden="true" />}>
                <div className="relative">
                  <input
                    type={passwordChange.showNew ? 'text' : 'password'}
                    value={passwordChange.newPassword}
                    onChange={(e) => passwordChange.setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    aria-label={passwordChange.showNew ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => passwordChange.setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  >
                    {passwordChange.showNew ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                <p className="mt-1 text-xs font-medium text-gray-500">Minimal 6 karakter</p>
              </Field>

              <StatusMessage message={passwordChange.message} />

              <button
                type="submit"
                disabled={passwordChange.isSaving}
                className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordChange.isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
                Perbarui password
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
