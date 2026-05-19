import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Loader2, Mail } from 'lucide-react'
import { requestPasswordReset, resetPassword } from '@/services/api'
import { navigate } from '@/lib/navigation'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleRequestReset(event: React.FormEvent) {
    event.preventDefault()
    if (isRequesting || !email.trim()) return

    setIsRequesting(true)
    setMessage(null)

    try {
      const response = await requestPasswordReset(email.trim())
      if (response.resetToken) setResetToken(response.resetToken)
      setMessage({
        ok: true,
        text: response.resetToken
          ? 'Token reset dibuat. Untuk tugas lokal ini token ditampilkan langsung karena belum ada layanan email.'
          : response.message,
      })
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Gagal membuat token reset.' })
    } finally {
      setIsRequesting(false)
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault()
    if (isResetting || !resetToken.trim() || password.length < 6) return

    setIsResetting(true)
    setMessage(null)

    try {
      const response = await resetPassword(resetToken.trim(), password)
      setMessage({ ok: true, text: response.message })
      setPassword('')
      setResetToken('')
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Password gagal direset.' })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f0f2f5] px-4 py-10 text-[#1c1e21]">
      <section className="w-full max-w-[500px] overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-[#dadde1] px-5 py-4">
          <h1 className="text-xl font-bold">Cari akun Anda</h1>
          <p className="mt-1 text-sm text-[#606770]">
            Masukkan email akun untuk membuat token reset password.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <form onSubmit={handleRequestReset} className="space-y-3">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#606770]">
                <Mail size={16} />
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-md border border-[#ccd0d5] px-3 text-base outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20"
                placeholder="nama@email.com"
                required
              />
            </label>
            <button
              type="submit"
              disabled={isRequesting}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1877f2] px-5 text-sm font-bold text-white hover:bg-[#166fe5] disabled:opacity-60"
            >
              {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Buat token reset
            </button>
          </form>

          {resetToken ? (
            <div className="rounded-lg bg-[#f0f2f5] p-3">
              <p className="text-xs font-semibold text-[#606770]">Token reset</p>
              <p className="mt-1 break-all font-mono text-sm text-[#050505]">{resetToken}</p>
            </div>
          ) : null}

          <form onSubmit={handleResetPassword} className="space-y-3 border-t border-[#dadde1] pt-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#606770]">
                <KeyRound size={16} />
                Token
              </span>
              <input
                type="text"
                value={resetToken}
                onChange={(event) => setResetToken(event.target.value)}
                className="h-12 w-full rounded-md border border-[#ccd0d5] px-3 text-base outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20"
                placeholder="Tempel token reset"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#606770]">
                <KeyRound size={16} />
                Password baru
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  className="h-12 w-full rounded-md border border-[#ccd0d5] px-3 pr-12 text-base outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/20"
                  placeholder="Minimal 6 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606770]"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>

            {message ? (
              <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-[#dadde1] pt-4">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="h-10 rounded-md bg-[#e4e6eb] px-5 text-sm font-bold text-[#050505] hover:bg-[#d8dadf]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isResetting}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1877f2] px-5 text-sm font-bold text-white hover:bg-[#166fe5] disabled:opacity-60"
              >
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reset password
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
