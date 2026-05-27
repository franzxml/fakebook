import { useEffect, useState } from 'react'
import { Camera, Check, Eye, EyeOff, KeyRound, Loader2, Mail, Save, User } from 'lucide-react'
import { apiRequest, getStoredUser, uploadImageFile } from '@/services/api'
import { notifyAuthStorageChanged } from '@/lib/navigation'
import { HomeTopBar } from '@/routes/home/components/HomeTopBar'
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

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
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
      {message.ok ? <Check className="mr-1 inline h-4 w-4" /> : null}
      {message.text}
    </p>
  )
}

export function ProfilePage() {
  const [token] = useState(getToken)
  const [storedUser, setStoredUser] = useState<PublicUser | null>(() => getStoredUser())

  const [profile, setProfile] = useState<ProfileResponse['profile'] | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(Boolean(token))
  const [errorProfile, setErrorProfile] = useState<string | null>(
    token ? null : 'Sesi tidak ditemukan. Silakan login ulang.',
  )

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function handleAvatarFileChange(file: File | undefined) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setProfileMsg({ ok: false, text: 'File avatar harus berupa gambar.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ ok: false, text: 'Ukuran avatar maksimal 5 MB.' })
      return
    }

    setAvatarFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
    setProfileMsg(null)
  }

  useEffect(() => {
    if (!token) return

    apiRequest<ProfileResponse>('/profile', { token })
      .then((res) => {
        setProfile(res.profile)
        setName(res.profile.name)
        setUsername(res.profile.username ?? '')
        setEmail(res.profile.email)
        setBio(res.profile.bio ?? '')
        setAvatarUrl(res.profile.avatarUrl ?? '')
        setStoredUser(res.profile)
      })
      .catch(() => setErrorProfile('Gagal memuat profil. Coba refresh halaman.'))
      .finally(() => setLoadingProfile(false))
  }, [token])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !profile) return

    setSavingProfile(true)
    setProfileMsg(null)

    try {
      const nextAvatarUrl = avatarFile ? await uploadImageFile(avatarFile, 'avatars', token) : avatarUrl
      const res = await apiRequest<UpdateProfileResponse>('/profile', {
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
      const nextProfile = { ...profile, ...res.user }
      setProfile(nextProfile)
      setStoredUser(res.user)
      setAvatarFile(null)
      setAvatarPreviewUrl(null)
      setAvatarUrl(res.user.avatarUrl ?? '')
      localStorage.setItem('user', JSON.stringify(res.user))
      notifyAuthStorageChanged()
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
      <div className="grid min-h-screen place-items-center bg-[#f0f2f5]">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    )
  }

  if (errorProfile || !profile) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] pt-20">
        <main className="mx-auto max-w-xl rounded-xl bg-white p-5 text-sm font-semibold text-red-700 shadow-sm">
          {errorProfile ?? 'Profil tidak ditemukan.'}
        </main>
      </div>
    )
  }

  const previewAvatar = avatarPreviewUrl || avatarUrl || null

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-950">
      <HomeTopBar currentPath="/profile" currentUser={storedUser ?? profile} />

      <main className="mx-auto max-w-[980px] px-4 pb-12 pt-14">
        <section className="bg-white px-6 py-5 shadow-sm">
          <div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
              <p className="mt-1 text-sm font-semibold text-gray-600">
                @{profile.username ?? 'username'}
              </p>
              {profile.bio ? (
                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-gray-600">{profile.bio}</p>
              ) : null}
            </div>

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
          </div>
        </section>

        <div className="mt-4">
          <div className="space-y-4">
            <section className="rounded-xl bg-white p-5 shadow-sm" id="edit-profile-form">
              <h2 className="text-xl font-bold">Edit profil</h2>
              <p className="mt-1 text-sm text-gray-500">Ubah nama, username, bio, foto profil, dan email akun.</p>

              <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                  <AvatarPreview avatarUrl={previewAvatar} name={name || profile.name} size="h-20 w-20" />
                  <div className="flex-1 space-y-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-300">
                      <Camera size={16} />
                      Upload foto
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => handleAvatarFileChange(event.target.files?.[0])}
                      />
                    </label>
                    <Field label="Avatar URL" icon={<Camera size={16} />}>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarFile(null)
                          setAvatarPreviewUrl(null)
                          setAvatarUrl(e.target.value)
                        }}
                        placeholder="https://example.com/foto.jpg"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Nama" icon={<User size={16} />}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={1}
                    required
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Username" icon={<User size={16} />}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    minLength={3}
                    required
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Bio" icon={<User size={16} />}>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={160}
                    placeholder="Tulis sedikit tentang diri Anda."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Email" icon={<Mail size={16} />}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    minLength={3}
                    required
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </Field>

                <StatusMessage message={profileMsg} />

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan perubahan
                </button>
              </form>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Keamanan dan login</h2>
              <p className="mt-1 text-sm text-gray-500">Ganti password akun manual Anda.</p>

              <form onSubmit={handleSavePassword} className="mt-5 space-y-4">
                <Field label="Password saat ini" icon={<KeyRound size={16} />}>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="h-11 w-full rounded-lg border border-gray-300 px-3 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                    >
                      {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>

                <Field label="Password baru" icon={<KeyRound size={16} />}>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 w-full rounded-lg border border-gray-300 px-3 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs font-medium text-gray-500">Minimal 6 karakter</p>
                </Field>

                <StatusMessage message={passwordMsg} />

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Perbarui password
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
