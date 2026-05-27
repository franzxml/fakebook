import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { appMetadata } from '@ppwl/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { syncLegacyAuthStorage, useAuthStore } from '@/stores'
import { useNotificationSync } from '@/hooks/useNotificationSync'
import {
  HomePage,
  ForgotPasswordPage,
  LoginPage,
  NotificationsPage,
  ProfilePage,
  PublicUserProfilePage,
  RegisterPage,
  UsersPage,
} from '@/routes'

const protectedPathPrefixes = ['/home', '/posts', '/notifications', '/profile', '/users']
const queryClient = new QueryClient()

function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some((pathPrefix) => (
    pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`)
  ))
}

function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false)
  const currentUser = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useNotificationSync(token)

  useEffect(() => {
    syncLegacyAuthStorage()
  }, [])

  useEffect(() => {
    if (!currentUser || pathname !== '/home' || localStorage.getItem('show_welcome_popup') !== '1') {
      return undefined
    }

    localStorage.removeItem('show_welcome_popup')
    setIsWelcomeVisible(true)

    const timeoutId = window.setTimeout(() => {
      setIsWelcomeVisible(false)
    }, 3200)

    return () => window.clearTimeout(timeoutId)
  }, [currentUser, pathname])

  useEffect(() => {
    const handleNavigation = () => {
      setPathname(window.location.pathname)
    }
    const handleStorage = () => {
      syncLegacyAuthStorage()
    }

    window.addEventListener('popstate', handleNavigation)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('popstate', handleNavigation)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // ===== ROUTING =====

  let page: ReactNode
  const canAccessProtectedPath = Boolean(currentUser && token && isAuthenticated)

  if (pathname === '/' || pathname === '/auth' || pathname === '/login') {
    page = <LoginPage />
  } else if (pathname === '/auth/forgot-password' || pathname === '/forgot-password') {
    page = <ForgotPasswordPage />
  } else if (pathname === '/auth/register' || pathname === '/register') {
    page = <RegisterPage />
  } else if (isProtectedPath(pathname) && !canAccessProtectedPath) {
    page = <LoginPage />
  } else if (pathname === '/home') {
    page = <HomePage currentUser={currentUser} />
  } else if (pathname.startsWith('/posts/')) {
    page = <NotFoundPage />
  } else if (pathname === '/notifications') {
    page = <NotificationsPage notifications={[]} />
  } else if (pathname === '/profile') {
    page = <ProfilePage />
  } else if (pathname === '/users') {
    page = <UsersPage users={[]} />
  } else if (pathname.startsWith('/users/')) {
    const userId = pathname.split('/')[2]
    page = userId ? <PublicUserProfilePage userId={userId} /> : <NotFoundPage />
  } else {
    page = <NotFoundPage />
  }

  return (
    <QueryClientProvider client={queryClient}>
      {page}
      {isWelcomeVisible && currentUser ? <WelcomePopup name={currentUser.name} /> : null}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}

function WelcomePopup({ name }: { name: string }) {
  return (
    <div className="fixed left-1/2 top-16 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-blue-100 bg-white px-4 py-3 text-gray-950 shadow-xl shadow-blue-950/10">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
          <CheckCircle2 size={20} />
        </span>
        <div>
          <p className="text-sm font-bold">Selamat datang di Fakebook</p>
          <p className="mt-0.5 text-sm font-medium leading-snug text-gray-600">
            Halo, {name}. Akun Anda sudah siap digunakan.
          </p>
        </div>
      </div>
    </div>
  )
}

function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">{appMetadata.name}</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">Halaman tidak ditemukan</h1>
        <a href="/" className="mt-5 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700">
          Kembali ke beranda
        </a>
      </section>
    </main>
  )
}

export default App
