import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  // ── Auth ────────────────────────────────────────────────
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  // ── Cargar perfil desde Supabase ────────────────────────
  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) set({ profile: data })
    return data
  },

  // ── Actualizar perfil ───────────────────────────────────
  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) set({ profile: data })
    return { data, error }
  },

  // ── Sumar XP ────────────────────────────────────────────
  addXP: async (amount) => {
    const { profile, user } = get()
    if (!profile || !user) return
    const newXP = (profile.xp || 0) + amount
    const newLevel = Math.floor(newXP / 500) + 1
    await supabase
      .from('user_profiles')
      .update({ xp: newXP, level: newLevel })
      .eq('id', user.id)
    set({ profile: { ...profile, xp: newXP, level: newLevel } })
  },

  // ── Logout ──────────────────────────────────────────────
  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  },
}))
