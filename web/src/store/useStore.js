import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,   // user_profiles row
  loading: true,

  // ── Setters ─────────────────────────────────────────────
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  // ── Cargar perfil desde Supabase ────────────────────────
  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) {
        set({ profile: data })
        return data
      }
    } catch {}
    return null
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

  // ── Sumar XP y subir nivel ──────────────────────────────
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
    return newXP
  },

  // ── Actualizar racha ────────────────────────────────────
  updateStreak: async () => {
    const { profile, user } = get()
    if (!profile || !user) return
    const today = new Date().toISOString().split('T')[0]
    const lastActive = profile.last_active
    if (lastActive === today) return // ya contado hoy

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const newStreak = lastActive === yesterdayStr ? (profile.streak || 0) + 1 : 1
    await supabase
      .from('user_profiles')
      .update({ streak: newStreak, last_active: today })
      .eq('id', user.id)
    set({ profile: { ...profile, streak: newStreak, last_active: today } })
  },

  // ── Logout ──────────────────────────────────────────────
  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  },
}))
