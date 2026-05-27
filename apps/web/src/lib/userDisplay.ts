import type { PublicUser } from '@ppwl/shared'

export function getDisplayName(user?: Pick<PublicUser, 'name' | 'username'> | null) {
  return user?.username?.trim() || user?.name?.trim() || 'Pengguna'
}
