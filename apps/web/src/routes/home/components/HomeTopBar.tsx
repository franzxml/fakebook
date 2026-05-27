import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, Home, LogOut, UsersRound } from 'lucide-react'
import type { PublicUser } from '@ppwl/shared'
import { navigate, notifyAuthStorageChanged } from '@/lib/navigation'
import { getDisplayName } from '@/lib/userDisplay'
import { clearAuthSession, getStoredSession, logout } from '@/services/api'
import { useNotificationStore, useUIStore } from '@/stores'
import { HomeAvatar } from './HomeAvatar'
import { NotificationDropdown } from './NotificationDropdown'

type HomeTopBarProps = {
  currentPath?: '/home' | '/users' | '/profile' | '/notifications'
  currentUser?: PublicUser | null
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 sm:h-10 sm:w-10"
    >
      {children}
    </button>
  )
}

export function HomeTopBar({ currentPath = '/home', currentUser }: HomeTopBarProps) {
  const notificationAreaRef = useRef<HTMLDivElement | null>(null)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const isNotificationsOpen = useUIStore((state) => state.notificationDropdownOpen)
  const toggleNotificationDropdown = useUIStore((state) => state.toggleNotificationDropdown)
  const setNotificationDropdownOpen = useUIStore((state) => state.setNotificationDropdownOpen)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const currentDisplayName = getDisplayName(currentUser)

  useEffect(() => {
    if (!isNotificationsOpen) return undefined

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (target instanceof Node && notificationAreaRef.current?.contains(target)) {
        return
      }

      setNotificationDropdownOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotificationDropdownOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNotificationsOpen, setNotificationDropdownOpen])

  async function handleLogout() {
    if (isLoggingOut) return

    const token = getStoredSession()?.token

    setIsLoggingOut(true)

    try {
      await logout(token)
    } catch {
      // Tetap logout lokal kalau request server gagal.
    } finally {
      setNotificationDropdownOpen(false)
      clearAuthSession()
      navigate('/auth')
      notifyAuthStorageChanged()
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="relative h-14 px-2 sm:px-4">
        <div className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center sm:left-4">
          <button
            type="button"
            onClick={() => navigate('/home')}
            aria-label="Beranda Fakebook"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0866ff] text-[17px] font-black leading-none tracking-normal text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.14)]"
          >
            fk
          </button>
        </div>

        <nav className="absolute left-1/2 top-0 flex h-full -translate-x-1/2 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className={`relative flex h-14 w-10 items-center justify-center rounded-md sm:w-16 md:w-24 ${currentPath === '/home' ? 'text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Beranda"
          >
            <Home size={25} />
            {currentPath === '/home' ? <span className="absolute bottom-0 h-1 w-full rounded-t-full bg-blue-600" /> : null}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className={`relative flex h-14 w-10 items-center justify-center rounded-md sm:w-16 md:w-24 ${currentPath === '/users' ? 'text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Halaman pengguna"
          >
            <UsersRound size={25} />
            {currentPath === '/users' ? <span className="absolute bottom-0 h-1 w-full rounded-t-full bg-blue-600" /> : null}
          </button>
        </nav>

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 sm:right-4 sm:gap-2">
          <div ref={notificationAreaRef}>
            <IconButton title="Notifikasi" onClick={toggleNotificationDropdown}>
              <Bell size={20} />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-red-600 px-1.5 text-center text-[11px] font-bold leading-5 text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </IconButton>
            {isNotificationsOpen ? <NotificationDropdown currentUser={currentUser} /> : null}
          </div>
          <button type="button" title="Profil" onClick={() => navigate('/profile')}>
            <HomeAvatar name={currentDisplayName} imageUrl={currentUser?.avatarUrl} size="h-9 w-9 sm:h-10 sm:w-10" />
          </button>
          <IconButton title="Logout" onClick={handleLogout}>
            <LogOut size={20} />
          </IconButton>
        </div>
      </div>
    </header>
  )
}
