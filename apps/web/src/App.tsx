import { useEffect, useMemo, useState } from 'react'
import { appMetadata, type ApiHealth } from '@ppwl/shared'
import { Toaster, toast } from 'sonner'
import { apiBaseUrl, getStoredUser } from '@/services/api'
import {
  HomePage,
  LoginPage,
  NotificationsPage,
  PostDetailPage,
  ProfilePage,
  RegisterPage,
  UsersPage,
} from '@/routes'
import type { AppNotification, FeedPost, PostComment, PublicUser } from '@/types/social'

const demoUser: PublicUser = {
  id: 'user-frans',
  name: 'Frans Maylandgo Saragih',
  email: 'frans@example.test',
  avatarUrl: null,
}

const demoUsers: PublicUser[] = [
  demoUser,
  {
    id: 'user-dzaky',
    name: 'Dzaky Mubarak',
    email: 'dzaky@example.test',
    avatarUrl: null,
  },
  {
    id: 'user-ghina',
    name: 'Ghina Audhiya Khairunisa',
    email: 'ghina@example.test',
    avatarUrl: null,
  },
]

const demoPosts: FeedPost[] = [
  {
    id: 'demo-post-1',
    content: 'Menyiapkan halaman feed awal untuk tugas besar cloning Facebook.',
    author: demoUsers[1],
    images: [],
    createdAt: new Date('2026-05-09T08:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-05-09T08:00:00.000Z').toISOString(),
    _count: {
      comments: 2,
      likes: 8,
    },
  },
  {
    id: 'demo-post-2',
    content: 'Monorepo sudah siap dipakai untuk pengembangan frontend dan backend.',
    author: demoUsers[2],
    images: [],
    createdAt: new Date('2026-05-09T07:30:00.000Z').toISOString(),
    updatedAt: new Date('2026-05-09T07:30:00.000Z').toISOString(),
    _count: {
      comments: 1,
      likes: 5,
    },
  },
]

const demoComments: PostComment[] = [
  {
    id: 'comment-1',
    content: 'Route detail postingan sudah bisa dibuka dari URL lokal.',
    author: demoUsers[0],
    createdAt: new Date('2026-05-09T08:10:00.000Z').toISOString(),
    updatedAt: new Date('2026-05-09T08:10:00.000Z').toISOString(),
  },
  {
    id: 'comment-2',
    content: 'Komponen komentar siap disambungkan ke API.',
    author: demoUsers[2],
    createdAt: new Date('2026-05-09T08:15:00.000Z').toISOString(),
    updatedAt: new Date('2026-05-09T08:15:00.000Z').toISOString(),
  },
]

const demoNotifications: AppNotification[] = [
  {
    id: 'notification-1',
    type: 'post_like',
    isRead: false,
    actor: demoUsers[1],
    post: {
      id: demoPosts[0].id,
      content: demoPosts[0].content,
      createdAt: demoPosts[0].createdAt,
    },
    createdAt: new Date('2026-05-09T08:20:00.000Z').toISOString(),
  },
  {
    id: 'notification-2',
    type: 'post_comment',
    isRead: true,
    actor: demoUsers[2],
    post: {
      id: demoPosts[1].id,
      content: demoPosts[1].content,
      createdAt: demoPosts[1].createdAt,
    },
    createdAt: new Date('2026-05-09T08:25:00.000Z').toISOString(),
  },
]

function App() {
  const [health, setHealth] = useState<ApiHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(() => getStoredUser() ?? demoUser)

  useEffect(() => {
    const handleNavigation = () => {
      setPathname(window.location.pathname)
      setCurrentUser(getStoredUser() ?? demoUser)
    }
    const handleStorage = () => setCurrentUser(getStoredUser() ?? demoUser)

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

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${apiBaseUrl}/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('API tidak tersedia.')
        return response.json() as Promise<ApiHealth>
      })
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [])

  const apiStatus = isLoading ? 'Mengecek API' : health ? 'API aktif' : 'API offline'

  const aside = useMemo(
    () => (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Status backend</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{apiStatus}</p>
        {health ? <p className="mt-2 text-sm text-slate-500">Versi {health.version}</p> : null}
      </div>
    ),
    [apiStatus, health],
  )

  // ===== ROUTING =====

  let page: React.ReactNode

  if (pathname === '/' || pathname === '/auth' || pathname === '/login') {
    page = <LoginPage />
  } else if (pathname === '/auth/register' || pathname === '/register') {
    page = <RegisterPage />
  } else if (pathname === '/home') {
    page = (
      <HomePage
        posts={demoPosts}
        aside={aside}
        currentUser={currentUser}
      />
    )
  } else if (pathname.startsWith('/posts/')) {
    page = <PostDetailPage post={demoPosts[0]} comments={demoComments} />
  } else if (pathname === '/notifications') {
    page = <NotificationsPage notifications={demoNotifications} />
  } else if (pathname === '/profile') {
    page = <ProfilePage />
  } else if (pathname === '/users') {
    page = <UsersPage users={demoUsers} />
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
