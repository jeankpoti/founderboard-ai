import { create } from 'zustand'
import type { User } from '@/types/user'

interface AuthState {
  user: User | null
  currentOrgId: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setCurrentOrgId: (orgId: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  user: null,
  currentOrgId: null,
  isLoading: true,
  error: null,
}

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setCurrentOrgId: (currentOrgId) => set({ currentOrgId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
