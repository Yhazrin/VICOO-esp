import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  currentLocale: string;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLocale: (locale: string) => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      currentLocale: 'zh',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setLocale: (currentLocale) => set({ currentLocale }),
      notificationCount: 3,
      setNotificationCount: (count) => set({ notificationCount: count }),
    }),
    {
      name: 'vicoo-admin-settings',
    }
  )
);
