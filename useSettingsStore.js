import { create } from 'zustand'

export const useSettingsStore = create((set) => ({
  audioMode: 'beeps', // 'speech' | 'beeps' | 'silent'
  
  setAudioMode: (mode) => set({ audioMode: mode }),
}))
