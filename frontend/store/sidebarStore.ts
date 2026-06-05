// ═══════════════════════════════════════════════════════════════
// FILE: store/sidebarStore.ts
// PURPOSE: Global sidebar state using Zustand.
//          Controls open/closed/collapsed state of the sidebar
//          and the mobile drawer version.
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SidebarState } from '@/types'

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen:       true,
      isMobileOpen: false,
      isCollapsed:  false,

      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: 'cyberguard_sidebar',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
)
