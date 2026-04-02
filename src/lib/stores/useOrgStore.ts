import { create } from 'zustand'
import type { Organization, Membership } from '@/types/organization'

interface OrgState {
  organization: Organization | null
  members: Membership[]
  isLoading: boolean
  error: string | null

  // Actions
  setOrganization: (org: Organization | null) => void
  setMembers: (members: Membership[]) => void
  addMember: (member: Membership) => void
  updateMember: (memberId: string, updates: Partial<Membership>) => void
  removeMember: (memberId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  organization: null,
  members: [],
  isLoading: true,
  error: null,
}

export const useOrgStore = create<OrgState>((set) => ({
  ...initialState,

  setOrganization: (organization) => set({ organization }),
  setMembers: (members) => set({ members }),
  addMember: (member) => set((state) => ({ members: [...state.members, member] })),
  updateMember: (memberId, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, ...updates } : m
      ),
    })),
  removeMember: (memberId) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== memberId),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
