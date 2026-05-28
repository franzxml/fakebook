import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { login } from '@/services/api'
import { navigate } from '@/lib/navigation'
import { GoogleAuthButton } from './components/GoogleAuthButton'

const loginHeroImage = '/images/auth/auth-hero.svg'
const loginSplashDurationMs = 1000

function FakebookLogo({ className = 'size-[60px] text-2xl' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-2xl bg-[#0866ff] font-black leading-none tracking-normal text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.14)] ${className}`}
    >
      fk
    </div>
  )
}

function LoginField({
  error,
  label,
  name,
  onChange,
  shouldShowPasswordToggle,
  showPassword,
  togglePasswordVisibility,
  type,
}: {
  error?: boolean
  label: string
  name: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  shouldShowPasswordToggle?: boolean
  showPassword?: boolean
  togglePasswordVisibility?: () => void
  type: 'email' | 'password'
}) {
  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <label className="relative block">
      <input
        name={name}
        type={inputType}
        aria-label={label}
        aria-invalid={error ? 'true' : undefined}
        placeholder=" "
        className={`peer h-[72px] w-full rounded-2xl border bg-white px-4 pb-2 pt-8 text-base font-semibold text-[#1c1e21] outline-none transition placeholder:text-transparent focus:border-2 ${
          error ? 'border-[#e41e3f] focus:border-[#e41e3f]' : 'border-[#ccd0d5] focus:border-[#2f3033]'
        } ${type === 'password' ? 'pr-14' : ''}`}
        onChange={onChange}
      />
      <span
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold transition-all peer-focus:top-4 peer-focus:translate-y-0 peer-focus:text-[15px] peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[15px] ${
          error ? 'text-[#e41e3f]' : 'text-[#606770]'
        }`}
      >
        {label}
      </span>
      {type === 'password' && shouldShowPasswordToggle ? (
        <button
          type="button"
          aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-[#1c1e21] transition hover:bg-[#f2f3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]"
          onClick={togglePasswordVisibility}
        >
          {showPassword ? (
            <Eye className="size-6" aria-hidden="true" strokeWidth={2.8} />
          ) : (
            <EyeOff className="size-6" aria-hidden="true" strokeWidth={2.8} />
          )}
        </button>
      ) : null}
    </label>
  )
}

function LoginSplashScreen() {
  return (
    <main className="fixed inset-0 z-50 flex min-h-screen flex-col bg-[#f7f8fb] text-[#0866ff]">
      <div className="grid flex-1 place-items-center">
        <FakebookLogo className="size-[92px] rounded-[26px] text-[38px]" />
      </div>
    </main>
  )
}

export function LoginPage() {
  const [emailError, setEmailError] = useState(false)
  const [loginError, setLoginError] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSplashVisible, setIsSplashVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('Informasi login yang Anda masukkan salah.')

  function showSplashThenNavigateHome() {
    flushSync(() => {
      setIsSplashVisible(true)
    })

    window.setTimeout(() => {
      navigate('/home')
    }, loginSplashDurationMs)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '').trim()
    const hasEmailError = !email || !email.includes('@')

    setEmailError(hasEmailError)
    setLoginError(Boolean(!hasEmailError && !password))

    if (!hasEmailError && password) {
      setIsSubmitting(true)
      setLoginError(false)

      try {
        await login({ email, password })
        showSplashThenNavigateHome()
      } catch (error) {
        setLoginError(true)
        setErrorMessage(error instanceof Error ? error.message : 'Informasi login yang Anda masukkan salah.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  function handleGoogleAuthenticated() {
    showSplashThenNavigateHome()
  }

  if (isSplashVisible) {
    return <LoginSplashScreen />
  }

  return (
    <main className="min-h-screen bg-white text-[#1c1e21]">
      <section className="grid min-h-screen lg:grid-cols-[55%_45%]">
        <section className="relative hidden overflow-hidden border-r border-[#dadde1] bg-white px-10 py-10 lg:block">
          <FakebookLogo />

          <img
            src={loginHeroImage}
            alt=""
            className="pointer-events-none absolute right-4 top-20 w-[min(38vw,520px)] select-none rounded-[2rem] object-contain xl:right-8 xl:top-14 xl:w-[min(45vw,580px)] 2xl:w-[620px]"
            draggable={false}
          />

          <h1 className="absolute bottom-12 left-10 max-w-[22rem] text-[clamp(3.75rem,4.45vw,4.1rem)] font-bold leading-[1.08] tracking-normal text-[#050505]">
            <span className="block">Jelajahi</span>
            <span className="block">hal-hal yang</span>
            <span className="block text-[#1877f2]">Anda</span>
            <span className="block text-[#1877f2]">cintai.</span>
          </h1>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-12 lg:min-h-0">
          <div className="w-full max-w-[34rem]">
            <FakebookLogo className="mx-auto mb-10 size-[60px] text-2xl lg:hidden" />

            <form
              className="mx-auto w-full max-w-[34rem]"
              aria-label="Masuk Fakebook"
              noValidate
              onSubmit={handleSubmit}
            >
              <h2 className="mb-7 text-xl font-bold leading-tight text-[#1c1e21]">Masuk Fakebook</h2>

              <div className="space-y-4">
                {loginError ? (
                  <div
                    className="flex gap-4 rounded-2xl border border-[#ccd0d5] px-6 py-5 text-base font-semibold leading-snug text-[#1c1e21]"
                    role="alert"
                  >
                    <CircleAlert className="mt-1 size-6 shrink-0 text-[#e41e3f]" aria-hidden="true" strokeWidth={2.2} />
                    <p>
                      {errorMessage}{' '}
                      <span className="font-bold text-[#0866e8]">
                        Cari akun Anda dan login.
                      </span>
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <LoginField
                    name="email"
                    type="email"
                    label="Email atau nomor ponsel"
                    error={emailError}
                    onChange={() => {
                      setEmailError(false)
                      setLoginError(false)
                    }}
                  />
                  {emailError ? (
                    <p className="flex gap-2 text-[15px] font-semibold leading-snug text-[#e41e3f]" role="alert">
                      <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" strokeWidth={2.2} />
                      <span>
                        Email atau nomor ponsel yang Anda masukkan tidak terhubung ke akun.{' '}
                        <span className="font-bold text-[#0866e8]">
                          Cari akun Anda dan login.
                        </span>
                      </span>
                    </p>
                  ) : null}
                </div>
                <LoginField
                  name="password"
                  type="password"
                  label="Kata sandi"
                  shouldShowPasswordToggle={password.length > 0}
                  showPassword={showPassword}
                  togglePasswordVisibility={() => setShowPassword((isShown) => !isShown)}
                  onChange={(event) => {
                    setPassword(event.currentTarget.value)
                    setLoginError(false)
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 h-11 w-full rounded-full bg-[#0866e8] px-6 text-base font-semibold text-white transition hover:bg-[#075bce] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1877f2]/25"
              >
                {isSubmitting ? 'Memproses...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/auth/forgot-password')}
                className="mt-3 flex h-11 w-full items-center justify-center rounded-full text-base font-semibold text-[#1c1e21] transition hover:bg-[#f2f3f5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1877f2]/25"
              >
                Lupa kata sandi?
              </button>

              <a
                href="/auth/register"
                className="mt-8 flex h-11 w-full items-center justify-center rounded-full border border-[#0866e8] px-6 text-base font-semibold text-[#0866e8] transition hover:bg-[#f2f3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866e8]"
              >
                Buat akun baru
              </a>

              <div className="mt-3">
                <GoogleAuthButton mode="login" onAuthenticated={handleGoogleAuthenticated} />
              </div>

            </form>
          </div>
        </section>
      </section>
    </main>
  )
}
