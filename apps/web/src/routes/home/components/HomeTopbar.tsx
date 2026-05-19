import { useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, Gamepad2, Home, LogOut, Menu, MessageCircle, Search, UsersRound, Video } from 'lucide-react'
import type { PublicUser } from '@ppwl/shared'
import { navigate, notifyAuthStorageChanged } from '@/lib/navigation'
import { clearAuthSession, getStoredSession, logout } from '@/services/api'
import { HomeAvatar } from './HomeAvatar'
import { NotificationDropdown } from './NotificationDropdown'

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
      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
    >
      {children}
    </button>
  )
}

export function HomeTopbar({ currentUser }: { currentUser?: PublicUser | null }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return

    const token = getStoredSession()?.token

    setIsLoggingOut(true)

    try {
      await logout(token)
    } catch {
      // Tetap logout lokal kalau request server gagal.
    } finally {
      clearAuthSession()
      navigate('/auth')
      notifyAuthStorageChanged()
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-3xl font-black text-white"
          >
            f
          </button>
          <div className="hidden h-10 w-64 items-center gap-2 rounded-full bg-gray-100 px-4 text-gray-500 md:flex">
            <Search size={18} />
            <span className="text-sm">Cari di Facebook</span>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 md:hidden">
            <Search size={19} />
          </button>
        </div>

        <nav className="hidden h-full items-center gap-2 md:flex">
          <button className="relative flex h-14 w-24 items-center justify-center text-blue-600">
            <Home size={25} />
            <span className="absolute bottom-0 h-1 w-full rounded-t-full bg-blue-600" />
          </button>
          <button className="flex h-12 w-24 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100">
            <Video size={25} />
          </button>
          <button className="flex h-12 w-24 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100">
            <UsersRound size={25} />
          </button>
          <button className="flex h-12 w-24 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100">
            <Gamepad2 size={25} />
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <IconButton title="Menu">
            <Menu size={20} />
          </IconButton>
          <IconButton title="Messenger">
            <MessageCircle size={20} />
          </IconButton>
          <IconButton title="Notifikasi" onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}>
            <Bell size={20} />
          </IconButton>
          <button type="button" title="Profil" onClick={() => navigate('/profile')}>
            <HomeAvatar name={currentUser?.name} imageUrl={currentUser?.avatarUrl} />
          </button>
          <IconButton title="Logout" onClick={handleLogout}>
            <LogOut size={20} />
          </IconButton>
        </div>
      </div>
      {isNotificationsOpen ? <NotificationDropdown currentUser={currentUser} /> : null}
    </header>
  )
}
