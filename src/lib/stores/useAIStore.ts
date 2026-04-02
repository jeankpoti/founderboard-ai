import { create } from 'zustand'

interface AIGeneration {
  id: string
  orgId: string
  userId: string
  type: 'investor_update' | 'pitch_deck' | 'social_post' | 'custom'
  prompt: string
  output: string
  createdAt: Date
}

interface AIState {
  isGenerating: boolean
  currentOutput: string
  history: AIGeneration[]
  error: string | null

  // Actions
  setGenerating: (generating: boolean) => void
  setCurrentOutput: (output: string) => void
  appendToOutput: (chunk: string) => void
  clearOutput: () => void
  setHistory: (history: AIGeneration[]) => void
  addToHistory: (generation: AIGeneration) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  isGenerating: false,
  currentOutput: '',
  history: [],
  error: null,
}

export const useAIStore = create<AIState>((set) => ({
  ...initialState,

  setGenerating: (isGenerating) => set({ isGenerating }),
  setCurrentOutput: (currentOutput) => set({ currentOutput }),
  appendToOutput: (chunk) =>
    set((state) => ({ currentOutput: state.currentOutput + chunk })),
  clearOutput: () => set({ currentOutput: '' }),
  setHistory: (history) => set({ history }),
  addToHistory: (generation) =>
    set((state) => ({ history: [generation, ...state.history] })),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
