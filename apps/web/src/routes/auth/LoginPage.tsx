import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const footerLinks = [
  'Daftar',
  'Masuk',
  'Messenger',
  'Facebook Lite',
  'Video',
  'Meta Pay',
  'Meta Store',
  'Meta Quest',
  'Ray-Ban Meta',
  'Meta AI',
  'Instagram',
  'Threads',
  'Kebijakan Privasi',
  'Pusat Privasi',
  'Meta di Indonesia',
  'Tentang',
  'Buat Iklan',
  'Buat Halaman',
  'Developer',
  'Karier',
  'Cookie',
  'Pilihan Iklan',
  'Ketentuan',
  'Bantuan',
  'Pengunggahan Kontak & Non-Pengguna',
]

const footerLanguages = [
  'Bahasa Indonesia',
  'English (UK)',
  'Basa Jawa',
  'Bahasa Melayu',
  '日本語',
  'العربية',
  'Français (France)',
  'Bahasa lainnya...',
]

const loginHeroImages = [
  '/picture/login/login-1.png',
  '/picture/login/login-2.png',
  '/picture/login/login-3.png',
]

let cachedLoginHeroImage: string | null = null

function getRotatingLoginHeroImage() {
  if (cachedLoginHeroImage) {
    return cachedLoginHeroImage
  }

  if (typeof window === 'undefined') {
    cachedLoginHeroImage = loginHeroImages[0]
    return cachedLoginHeroImage
  }

  const storageKey = 'ppwl-login-hero-index'
  const previousIndex = Number(window.localStorage.getItem(storageKey) ?? '-1')
  const nextIndex = Number.isFinite(previousIndex) ? (previousIndex + 1) % loginHeroImages.length : 0

  window.localStorage.setItem(storageKey, String(nextIndex))
  cachedLoginHeroImage = loginHeroImages[nextIndex]

  return cachedLoginHeroImage
}

function getFooterLinkHref(index: number) {
  return index === 1 ? '/auth' : '/auth/register'
}

function isFooterLinkInteractive(index: number) {
  return index === 1
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
        <div
          aria-hidden="true"
          className="flex size-[92px] items-center justify-center rounded-full bg-[#0866ff] text-[96px] font-bold leading-none text-white"
        >
          <span className="-mt-1 font-sans">f</span>
        </div>
      </div>
      <div className="pb-14 text-center">
        <p className="text-sm font-semibold text-[#8a94a6]">from</p>
        <div className="mt-1 flex items-center justify-center gap-1 text-xl font-bold">
          <span className="text-2xl leading-none" aria-hidden="true">
            ∞
          </span>
          <span>Meta</span>
        </div>
      </div>
    </main>
  )
}

export function LoginPage() {
  const [loginHeroImage] = useState(getRotatingLoginHeroImage)
  const [emailError, setEmailError] = useState(false)
  const [loginError, setLoginError] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSplashVisible, setIsSplashVisible] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '').trim()
    const hasEmailError = !email || !email.includes('@')

    setEmailError(hasEmailError)
    setLoginError(Boolean(!hasEmailError && !password))

    if (!hasEmailError && password) {
      setIsSplashVisible(true)

      window.setTimeout(() => {
        window.history.pushState({}, '', '/home')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }, 1600)
    }
  }

  if (isSplashVisible) {
    return <LoginSplashScreen />
  }

  return (
    <main className="min-h-screen bg-white text-[#1c1e21]">
      <section className="grid min-h-[calc(100vh-12rem)] border-b border-[#dadde1] lg:grid-cols-[55%_45%]">
        <section className="relative hidden overflow-hidden border-r border-[#dadde1] bg-white px-10 py-10 lg:block">
          <div
            aria-hidden="true"
            className="flex size-[60px] items-center justify-center rounded-full bg-[#0866ff] text-[64px] font-bold leading-none text-white"
          >
            <span className="-mt-1 font-sans">f</span>
          </div>

          <img
            src={loginHeroImage}
            alt=""
            className="pointer-events-none absolute right-4 top-9 w-[min(45vw,580px)] select-none object-contain xl:right-8 2xl:w-[620px]"
            draggable={false}
          />

          <h1 className="absolute bottom-12 left-10 max-w-[22rem] text-[clamp(3.75rem,4.45vw,4.1rem)] font-bold leading-[1.08] tracking-normal text-[#050505]">
            <span className="block">Jelajahi</span>
            <span className="block">hal-hal yang</span>
            <span className="block text-[#1877f2]">Anda</span>
            <span className="block text-[#1877f2]">sukai.</span>
          </h1>
        </section>

        <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-6 py-12 lg:min-h-0">
          <div className="w-full max-w-[34rem]">
            <div
              aria-hidden="true"
              className="mx-auto mb-10 flex size-[60px] items-center justify-center rounded-full bg-[#0866ff] text-[64px] font-bold leading-none text-white lg:hidden"
            >
              <span className="-mt-1 font-sans">f</span>
            </div>

            <form
              className="mx-auto w-full max-w-[34rem]"
              aria-label="Masuk Facebook"
              noValidate
              onSubmit={handleSubmit}
            >
              <h2 className="mb-7 text-xl font-bold leading-tight text-[#1c1e21]">Masuk Facebook</h2>

              <div className="space-y-4">
                {loginError ? (
                  <div
                    className="flex gap-4 rounded-2xl border border-[#ccd0d5] px-6 py-5 text-base font-semibold leading-snug text-[#1c1e21]"
                    role="alert"
                  >
                    <CircleAlert className="mt-1 size-6 shrink-0 text-[#e41e3f]" aria-hidden="true" strokeWidth={2.2} />
                    <p>
                      Informasi login yang Anda masukkan salah.{' '}
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
                className="mt-6 h-11 w-full rounded-full bg-[#0866e8] px-6 text-base font-semibold text-white transition hover:bg-[#075bce] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1877f2]/25"
              >
                Login
              </button>

              <button
                type="button"
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

              <button
                type="button"
                className="mt-3 flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#ccd0d5] bg-white px-6 text-base font-semibold text-[#1c1e21] transition hover:bg-[#f2f3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f3033]"
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                  role="img"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                  />
                </svg>
                <span
                  className="sr-only"
                  aria-hidden="true"
                >
                  Google
                </span>
                <span>Login dengan Google</span>
              </button>

              <div className="mt-6 flex items-center justify-center gap-1 text-lg font-semibold text-[#1c1e21]">
                <span className="text-2xl font-bold leading-none text-[#0866ff]" aria-hidden="true">
                  ∞
                </span>
                <span>Meta</span>
              </div>
            </form>
          </div>
        </section>
      </section>

      <footer className="mx-auto max-w-[67rem] px-4 py-5 text-sm font-medium leading-[1.45] text-[#65676b]">
        <div className="flex flex-wrap gap-x-8 gap-y-2" aria-label="Bahasa" role="list">
          {footerLanguages.map((language) => (
            <span key={language} role="listitem">
              {language}
            </span>
          ))}
        </div>

        <nav className="mt-3 flex flex-wrap gap-x-3 gap-y-2" aria-label="Tautan Facebook">
          {footerLinks.map((link, index) => (
            isFooterLinkInteractive(index) ? (
              <a key={link} href={getFooterLinkHref(index)} className="hover:underline">
                {link}
              </a>
            ) : (
              <span key={link}>{link}</span>
            )
          ))}
        </nav>

        <p className="mt-4">Meta © 2026</p>
      </footer>
    </main>
  )
}
