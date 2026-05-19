import { MoreHorizontal } from 'lucide-react'
import type { PublicUser } from '@ppwl/shared'
import { contacts, leftMenus, sponsored } from '../data/homeContent'
import { HomeAvatar } from './HomeAvatar'

export function LeftSidebar({ currentUser }: { currentUser?: PublicUser | null }) {
  const menuItems = leftMenus.map((item, index) => index === 0 && currentUser ? { ...item, label: currentUser.name } : item)

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[290px] shrink-0 overflow-y-auto px-3 lg:block">
      <div className="space-y-1">
        {menuItems.map((item) => (
          <button key={item.label} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left font-medium text-gray-800 transition hover:bg-gray-200">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-blue-600">
              <item.icon size={20} />
            </div>
            <span className="line-clamp-1 text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 border-t border-gray-300 pt-4 text-xs text-gray-500">
        Privasi · Ketentuan · Iklan · Pilihan Iklan · Cookie · Meta © 2026
      </div>
    </aside>
  )
}

export function RightSidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[320px] shrink-0 overflow-y-auto px-3 xl:block">
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-600">Bersponsor</h3>
        <div className="space-y-2">
          {sponsored.map((ad) => (
            <button key={ad.title} className="flex w-full gap-3 rounded-xl p-2 text-left transition hover:bg-gray-200">
              <img src={ad.image} alt="" className="h-20 w-28 rounded-lg object-cover" />
              <div className="pt-1">
                <p className="text-sm font-semibold leading-tight text-gray-800">{ad.title}</p>
                <p className="mt-1 text-xs text-gray-500">{ad.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 border-t border-gray-300 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-600">Kontak</h3>
          <MoreHorizontal size={19} className="text-gray-500" />
        </div>

        {contacts.map((name) => (
          <button key={name} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-200">
            <div className="relative">
              <HomeAvatar name={name} size="h-9 w-9" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
            </div>
            <span className="text-sm font-medium text-gray-800">{name}</span>
          </button>
        ))}
      </section>
    </aside>
  )
}
