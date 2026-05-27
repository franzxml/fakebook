import { useEffect, useState } from 'react'
import type { PublicUser } from '@/types/social'
import { fetchUsers, getStoredUser } from '@/services/api'
import { HomeTopBar } from '@/routes/home/components/HomeTopBar'
import { getDisplayName } from '@/lib/userDisplay'
import { navigate } from '@/lib/navigation'

type UsersPageProps = {
  users: PublicUser[]
}

export function UsersPage({ users }: UsersPageProps) {
  const [allUsers, setAllUsers] = useState<PublicUser[]>(users)
  const [isLoading, setIsLoading] = useState(users.length === 0)
  const [error, setError] = useState<string | null>(null)
  const currentUser = getStoredUser()

  useEffect(() => {
    let isMounted = true

    fetchUsers()
      .then((response) => {
        if (!isMounted) return
        setAllUsers(response.users)
        setError(null)
      })
      .catch(() => {
        if (!isMounted) return
        setError('Gagal memuat daftar pengguna.')
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      <HomeTopBar currentPath="/users" currentUser={currentUser} />
      <main className="mx-auto w-full max-w-[760px] px-3 pb-10 pt-16">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Pengguna Fakebook</h1>

          {isLoading ? (
            <p className="mt-5 text-sm font-medium text-gray-500">Memuat pengguna...</p>
          ) : error ? (
            <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>
          ) : allUsers.length === 0 ? (
            <p className="mt-5 text-sm font-medium text-gray-500">Belum ada pengguna.</p>
          ) : (
            <div className="mt-4 divide-y divide-gray-100">
              {allUsers.map((user) => {
                const displayName = getDisplayName(user)

                return (
                  <button
                    key={user.id}
                    type="button"
                    className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-gray-50"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="size-11 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold text-gray-900">{displayName}</h2>
                      {user.bio ? <p className="mt-1 line-clamp-2 text-xs font-medium text-gray-500">{user.bio}</p> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
