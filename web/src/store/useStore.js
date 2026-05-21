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
  addBondXP: async (amount) => {
  const { profile, user } = get()
  if (!profile || !user) return
  const newBondXP    = (profile.bond_xp || 0) + amount
  const newBondLevel = newBondXP >= 1000 ? 5
    : newBondXP >= 600 ? 4
    : newBondXP >= 300 ? 3
    : newBondXP >= 100 ? 2 : 1
  await supabase.from('user_profiles')
    .update({ bond_xp: newBondXP, bond_level: newBondLevel })
    .eq('id', user.id)
  set({ profile: { ...profile, bond_xp: newBondXP, bond_level: newBondLevel } })
  return { newBondXP, newBondLevel }
},

  // ── Actualizar racha ────────────────────────────────────
  updateStreak: async () => {
  const { profile, user } = get()
  if (!profile || !user) return

  const today      = new Date().toISOString().split('T')[0]
  const lastActive = profile.last_active
  if (lastActive === today) return // ya contado hoy

  const yesterday    = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak  = profile.streak  || 0
  let newShields = profile.streak_shields || 0
  let shieldUsed = false

  if (lastActive === yesterdayStr) {
    // Día consecutivo — sumar racha
    newStreak += 1
    // Ganar escudo cada 7 días (máximo 2)
    if (newStreak % 7 === 0 && newShields < 2) newShields += 1
  } else {
    // Racha rota — ¿hay escudo disponible?
    if (newShields > 0) {
      newShields -= 1
      shieldUsed  = true
      // La racha continúa — no se reinicia
    } else {
      newStreak = 1
    }
  }

  await supabase
    .from('user_profiles')
    .update({ streak: newStreak, streak_shields: newShields, last_active: today })
    .eq('id', user.id)

  set({ profile: { ...profile, streak: newStreak, streak_shields: newShields, last_active: today } })
    if (shieldUsed) {
  // Importar api aquí para evitar dependencia circular
  import('../lib/api').then(({ api }) => {
    api.notifications.send({
      title: '🛡️ ¡Escudo activado!',
      body:  `Tu racha de ${newStreak} días está a salvo. Vuelve mañana.`,
      url:   '/home',
      tag:   'shield',
    }).catch(() => {})
  })
}
  return { shieldUsed, newStreak, newShields }
},

  // ── Logout ──────────────────────────────────────────────
  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  },
}))
