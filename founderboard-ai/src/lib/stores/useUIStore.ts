import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'

  // Modal states
  isCreateTaskModalOpen: boolean
  isEditMetricModalOpen: boolean
  isInviteMemberModalOpen: boolean

  // Active selections
  activeMetricId: string | null
  activeTaskId: string | null

  // Actions
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Modal actions
  openCreateTaskModal: () => void
  closeCreateTaskModal: () => void
  openEditMetricModal: (metricId: string) => void
  closeEditMetricModal: () => void
  openInviteMemberModal: () => void
  closeInviteMemberModal: () => void

  setActiveTaskId: (id: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      isCreateTaskModalOpen: false,
      isEditMetricModalOpen: false,
      isInviteMemberModalOpen: false,
      activeMetricId: null,
      activeTaskId: null,

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),

      openCreateTaskModal: () => set({ isCreateTaskModalOpen: true }),
      closeCreateTaskModal: () => set({ isCreateTaskModalOpen: false }),
      openEditMetricModal: (metricId) =>
        set({ isEditMetricModalOpen: true, activeMetricId: metricId }),
      closeEditMetricModal: () =>
        set({ isEditMetricModalOpen: false, activeMetricId: null }),
      openInviteMemberModal: () => set({ isInviteMemberModalOpen: true }),
      closeInviteMemberModal: () => set({ isInviteMemberModalOpen: false }),

      setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
    }),
    {
      name: 'founderboard-ui',
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
    }
  )
)
