import { useEffect, useRef, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { loginWithGoogle } from '@/services/api'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            element: HTMLElement,
            options: {
              theme: 'outline'
              size: 'large'
              type: 'standard'
              shape: 'pill'
              text: 'signin_with' | 'signup_with'
              width: number
            },
          ) => void
        }
      }
    }
  }
}

type GoogleAuthButtonProps = {
  mode: 'login' | 'register'
}

function navigateHome(userName: string) {
  window.sessionStorage.setItem('ppwl-welcome-toast', userName)
  window.history.pushState({}, '', '/home')
  window.dispatchEvent(new PopStateEvent('popstate'))
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(
    googleClientId ? null : 'Login Google belum dikonfigurasi.',
  )
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!googleClientId) {
      return undefined
    }

    let isActive = true

    loadGoogleIdentityScript()
      .then(() => {
        if (!isActive || !containerRef.current || !window.google?.accounts?.id) return

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response.credential) {
              setError('Credential Google tidak tersedia.')
              return
            }

            setError(null)

            try {
              const auth = await loginWithGoogle({ credential: response.credential })
              navigateHome(auth.user.name)
            } catch (googleError) {
              setError(googleError instanceof Error ? googleError.message : 'Login Google gagal.')
            }
          },
        })

        containerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          width: 320,
        })
        setIsReady(true)
      })
      .catch((scriptError) => {
        if (!isActive) return
        setError(scriptError instanceof Error ? scriptError.message : 'Google OAuth gagal dimuat.')
      })

    return () => {
      isActive = false
    }
  }, [mode])

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="flex min-h-11 justify-center"
        aria-busy={!isReady && !error}
      />
      {error ? (
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-[#e41e3f]" role="alert">
          <CircleAlert className="size-4" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}
