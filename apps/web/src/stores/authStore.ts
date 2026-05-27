import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PublicUser, SessionPayload } from '@ppwl/shared'

type AuthStore = {
  user: PublicUser | null
  session: SessionPayload | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: PublicUser, session: SessionPayload) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, session) => {
        set({
          user,
          session,
          token: session.token,
          isAuthenticated: true,
        })
      },
      clearAuth: () => {
        set({
          user: null,
          session: null,
          token: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

export function syncLegacyAuthStorage() {
  const { user, session, setAuth, clearAuth } = useAuthStore.getState()

  if (user && session?.token) return

  try {
    const rawUser = localStorage.getItem('user')
    const rawSession = localStorage.getItem('session')

    if (!rawUser || !rawSession) {
      clearAuth()
      return
    }

    setAuth(JSON.parse(rawUser) as PublicUser, JSON.parse(rawSession) as SessionPayload)
  } catch {
    clearAuth()
  }
}
