import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { loginWithGoogle } from '@/services/api'
import { navigate } from '@/lib/navigation'

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim()

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (options: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void
          }
        }
      }
    }
  }
}

type GoogleAuthButtonProps = {
  mode: 'login' | 'register'
}

const googleButtonText = {
  login: 'Login dengan Google',
  register: 'Daftar dengan Google',
} satisfies Record<GoogleAuthButtonProps['mode'], string>

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
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
  )
}

function navigateHome(userName: string) {
  window.sessionStorage.setItem('ppwl-welcome-toast', userName)
  navigate('/home')
}

function loadGoogleIdentityScript() {
  const existingScript = document.querySelector<HTMLScriptElement>(
    'script[src="https://accounts.google.com/gsi/client"]',
  )

  if (existingScript) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Script Google gagal dimuat.'))
    document.head.appendChild(script)
  })
}

export function GoogleAuthButton({ mode }: GoogleAuthButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(!googleClientId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!googleClientId) {
      return undefined
    }

    let isActive = true

    loadGoogleIdentityScript()
      .then(() => {
        if (!isActive || !window.google?.accounts?.oauth2) return

        setIsReady(true)
      })
      .catch((scriptError) => {
        if (!isActive) return
        setError(scriptError instanceof Error ? scriptError.message : 'Google OAuth gagal dimuat.')
      })

    return () => {
      isActive = false
    }
  }, [])

  function handleGoogleLogin() {
    setError(null)

    if (!googleClientId) {
      setError('Google OAuth belum dikonfigurasi.')
      return
    }

    setIsSubmitting(true)

    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      callback: async (response) => {
        if (response.error) {
          setError('Login Google dibatalkan.')
          setIsSubmitting(false)
          return
        }

        if (!response.access_token) {
          setError('Credential Google tidak tersedia.')
          setIsSubmitting(false)
          return
        }

        try {
          const auth = await loginWithGoogle({ accessToken: response.access_token })
          navigateHome(auth.user.name)
        } catch (loginError) {
          setError(loginError instanceof Error ? loginError.message : 'Login Google gagal.')
        } finally {
          setIsSubmitting(false)
        }
      },
    })

    if (!tokenClient) {
      setError('Google OAuth belum siap.')
      setIsSubmitting(false)
      return
    }

    tokenClient.requestAccessToken({ prompt: 'select_account' })
  }

  if (!googleClientId) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#d8dce1] bg-white px-6 text-base font-semibold text-[#1c1e21] transition hover:bg-[#f2f3f5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1877f2]/20"
          onClick={handleGoogleLogin}
        >
          <GoogleIcon />
          <span>{isSubmitting ? 'Memproses...' : googleButtonText[mode]}</span>
        </button>
        {error ? (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-[#e41e3f]" role="alert">
            <CircleAlert className="size-4" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={!isReady || isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#d8dce1] bg-white px-6 text-base font-semibold text-[#1c1e21] transition hover:bg-[#f2f3f5] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1877f2]/20"
        onClick={handleGoogleLogin}
      >
        <GoogleIcon />
        <span>{isSubmitting ? 'Memproses...' : googleButtonText[mode]}</span>
      </button>
      {error ? (
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-[#e41e3f]" role="alert">
          <CircleAlert className="size-4" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}
