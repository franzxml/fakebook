import type { ReactNode } from 'react'
import { Home, Bell, Users, User, LogOut } from 'lucide-react'
import type { PublicUser } from '@ppwl/shared'

type AppLayoutProps = {
  children: ReactNode
  aside?: ReactNode
  currentUser?: PublicUser | null
  currentPath?: string
}

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

type NavItem = {
  label: string
  path: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Beranda', path: '/home', icon: <Home size={22} /> },
  { label: 'Notifikasi', path: '/notifications', icon: <Bell size={22} /> },
  { label: 'Pengguna', path: '/users', icon: <Users size={22} /> },
  { label: 'Profil', path: '/profile', icon: <User size={22} /> },
]

export function AppLayout({ children, aside, currentUser, currentPath = '' }: AppLayoutProps) {
  // Mengambil title secara dinamis dari <title> yang ada di apps/web/index.html
  // Jika di index.html tertulis "PPWL Clone Facebook", maka otomatis terambil teks tersebut.
  const siteTitle = typeof document !== 'undefined' ? document.title : 'Facebook'
  
  // Opsional: Jika ingin logonya hanya menampilkan kata terakhir (ex: "facebook") dari "PPWL Clone Facebook"
  const logoText = siteTitle.split(' ').pop()?.toLowerCase() || 'facebook'

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* ===== NAVBAR ===== */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Logo Dinamis berdasarkan index.html */}
          <button
            onClick={() => navigate('/home')}
            className="text-2xl font-extrabold tracking-tight text-[#1877f2] select-none lowercase"
            title={siteTitle}
          >
            {logoText}
          </button>

          {/* Nav tengah */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  className={[
                    'flex flex-col items-center justify-center px-8 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'text-[#1877f2] border-b-2 border-[#1877f2]'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                  ].join(' ')}
                >
                  {item.icon}
                </button>
              )
            })}
          </nav>

          {/* Kanan: avatar + logout */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-slate-100 transition-colors"
                >
                  <AvatarCircle user={currentUser} size="sm" />
                  <span className="hidden md:block text-sm font-medium text-slate-800 max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  title="Keluar"
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="rounded-lg bg-[#1877f2] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#166fe5] transition-colors"
              >
                Masuk
              </button>
            )}
          </div>
        </div>

        {/* Nav bawah untuk mobile */}
        <nav className="flex md:hidden border-t border-slate-100 bg-white">
          {navItems.map((item) => {
            const isActive = currentPath === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={item.label}
                className={[
                  'flex flex-1 flex-col items-center justify-center py-2 text-xs transition-colors',
                  isActive
                    ? 'text-[#1877f2] border-b-2 border-[#1877f2]'
                    : 'text-slate-500',
                ].join(' ')}
              >
                {item.icon}
                <span className="mt-0.5 text-[10px]">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </header>

      {/* ===== BODY ===== */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-6">
          {/* Konten utama */}
          <div className="min-w-0 flex-1">{children}</div>

          {/* Aside (opsional) */}
          {aside && (
            <aside className="hidden lg:block w-72 shrink-0 space-y-4">
              {aside}
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}

// ===== Komponen Avatar =====
type AvatarProps = {
  user: Pick<PublicUser, 'name' | 'avatarUrl'>
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarCircle({ user, size = 'md' }: AvatarProps) {
  const sizeClass = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }[size]

  const initials = (user.name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || 'User'}
        className={`${sizeClass} rounded-full object-cover bg-slate-200`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-[#1877f2] font-semibold text-white select-none`}
    >
      {initials}
    </div>
  )
}