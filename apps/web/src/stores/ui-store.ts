import { create } from 'zustand'

type UIStore = {
  notificationDropdownOpen: boolean
  setNotificationDropdownOpen: (isOpen: boolean) => void
  toggleNotificationDropdown: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  notificationDropdownOpen: false,
  setNotificationDropdownOpen: (notificationDropdownOpen) => set({ notificationDropdownOpen }),
  toggleNotificationDropdown: () =>
    set((state) => ({
      notificationDropdownOpen: !state.notificationDropdownOpen,
    })),
}))
