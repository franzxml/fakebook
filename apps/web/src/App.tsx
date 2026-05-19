import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { appMetadata } from '@ppwl/shared'
import { Toaster, toast } from 'sonner'
import { getStoredUser } from '@/services/api'
import {
  HomePage,
  ForgotPasswordPage,
  LoginPage,
  NotificationsPage,
  ProfilePage,
  RegisterPage,
  UsersPage,
} from '@/routes'
import type { PublicUser } from '@/types/social'

function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(() => getStoredUser())

  useEffect(() => {
    const handleNavigation = () => {
      setPathname(window.location.pathname)
      setCurrentUser(getStoredUser())
    }
    const handleStorage = () => setCurrentUser(getStoredUser())

    window.addEventListener('popstate', handleNavigation)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('popstate', handleNavigation)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (pathname !== '/home') return

    const welcomeName = window.sessionStorage.getItem('ppwl-welcome-toast')

    if (!welcomeName) return

    window.sessionStorage.removeItem('ppwl-welcome-toast')
    toast.success(`Selamat datang, ${welcomeName}`, {
      description: 'Login berhasil. Notifikasi dan beranda sudah tersambung ke backend.',
    })
  }, [pathname])

  // ===== ROUTING =====

  let page: ReactNode

  if (pathname === '/' || pathname === '/auth' || pathname === '/login') {
    page = <LoginPage />
  } else if (pathname === '/auth/forgot-password' || pathname === '/forgot-password') {
    page = <ForgotPasswordPage />
  } else if (pathname === '/auth/register' || pathname === '/register') {
    page = <RegisterPage />
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
  } else {
    page = <NotFoundPage />
  }

  return (
    <>
      {page}
      <Toaster richColors position="top-right" />
    </>
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
