// ─────────────────────────────────────────────────────────────────────────────
// PATCH useStore.js
// Añade healthProfile + fetchHealthProfile al store existente.
// Pega estas líneas dentro del create((set, get) => ({ ... }))
// justo después de la línea `profile: null,`
// ─────────────────────────────────────────────────────────────────────────────

// 1. En el objeto de estado inicial, después de `profile: null,`:
//
//   healthProfile: null,   // health_profiles row (peso, sueño, macros, snapshot inicial)

// 2. Añadir este método junto a fetchProfile:

fetchHealthProfile: async (userId) => {
  try {
    const { data, error } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (!error && data) {
      set({ healthProfile: data })
      return data
    }
  } catch {}
  return null
},

// 3. En fetchProfile, llama también a fetchHealthProfile al final.
//    Reemplaza el fetchProfile existente por este:

fetchProfile: async (userId) => {
  try {
    const [profileRes, healthRes] = await Promise.allSettled([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase.from('health_profiles').select('*').eq('user_id', userId).single(),
    ])

    if (profileRes.status === 'fulfilled' && !profileRes.value.error) {
      set({ profile: profileRes.value.data })
    }
    if (healthRes.status === 'fulfilled' && !healthRes.value.error) {
      set({ healthProfile: healthRes.value.data })
    }

    return profileRes.status === 'fulfilled' ? profileRes.value.data : null
  } catch {}
  return null
},

// 4. En logout, limpiar también healthProfile:
//    Busca la línea:  set({ session: null, user: null, profile: null })
//    Reemplázala por: set({ session: null, user: null, profile: null, healthProfile: null })

// ─────────────────────────────────────────────────────────────────────────────
// RESULTADO FINAL: el useStore completo con el patch aplicado
// Copia y pega este archivo completo como src/store/useStore.js
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  session:       null,
  user:          null,
  profile:       null,         // user_profiles row
  healthProfile: null,         // health_profiles row ← NUEVO
  loading:       true,

  // ── Setters ─────────────────────────────────────────────────────────────
  setSession:      (session)      => set({ session }),
  setUser:         (user)         => set({ user }),
  setProfile:      (profile)      => set({ profile }),
  setHealthProfile:(healthProfile)=> set({ healthProfile }),  // ← NUEVO
  setLoading:      (loading)      => set({ loading }),

  // ── Cargar perfil desde Supabase ─────────────────────────────────────────
  // Ahora carga user_profiles + health_profiles en paralelo
  fetchProfile: async (userId) => {
    try {
      const [profileRes, healthRes] = await Promise.allSettled([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('health_profiles').select('*').eq('user_id', userId).single(),
      ])

      if (profileRes.status === 'fulfilled' && !profileRes.value.error) {
        set({ profile: profileRes.value.data })
      }
      if (healthRes.status === 'fulfilled' && !healthRes.value.error) {
        set({ healthProfile: healthRes.value.data })
      }

      return profileRes.status === 'fulfilled' ? profileRes.value.data : null
    } catch {}
    return null
  },

  // ── Cargar solo health_profiles ──────────────────────────────────────────
  fetchHealthProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('health_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (!error && data) {
        set({ healthProfile: data })
        return data
      }
    } catch {}
    return null
  },

  // ── Actualizar perfil ────────────────────────────────────────────────────
  updateProfile: async (updates) => {
    const { user, profile } = get()
    if (!user) return { data: null, error: new Error('No user found') }

    const previousProfile = { ...profile }
    const optimisticData  = { ...profile, ...updates, updated_at: new Date().toISOString() }
    set({ profile: optimisticData })

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      if (data) set({ profile: data })
      return { data, error: null }

    } catch (error) {
      console.error('[Store] Error al actualizar perfil. Rollback...', error)
      set({ profile: previousProfile })
      return { data: null, error }
    }
  },

  // ── Sumar XP y subir nivel ────────────────────────────────────────────────
  addXP: async (amount) => {
    const { profile, user } = get()
    if (!profile || !user) return null

    const newXP    = (profile.xp || 0) + amount
    const newLevel = Math.floor(newXP / 500) + 1

    set({ profile: { ...profile, xp: newXP, level: newLevel } })

    supabase
      .from('user_profiles')
      .update({ xp: newXP, level: newLevel })
      .eq('id', user.id)
      .catch(err => console.error('[Offline] No se pudo sincronizar XP:', err))

    return newXP
  },

  addBondXP: async (amount) => {
    const { profile, user } = get()
    if (!profile || !user) return null

    const newBondXP    = (profile.bond_xp || 0) + amount
    const newBondLevel = newBondXP >= 1000 ? 5
      : newBondXP >= 600 ? 4
      : newBondXP >= 300 ? 3
      : newBondXP >= 100 ? 2 : 1

    set({ profile: { ...profile, bond_xp: newBondXP, bond_level: newBondLevel } })

    supabase
      .from('user_profiles')
      .update({ bond_xp: newBondXP, bond_level: newBondLevel })
      .eq('id', user.id)
      .catch(err => console.error('[Offline] No se pudo sincronizar Bond XP:', err))

    return { newBondXP, newBondLevel }
  },

  // ── Actualizar racha ──────────────────────────────────────────────────────
  updateStreak: async () => {
    const { profile, user } = get()
    if (!profile || !user) return null

    const today      = new Date().toISOString().split('T')[0]
    const lastActive = profile.last_active
    if (lastActive === today) return {
      shieldUsed: false,
      newStreak:  profile.streak,
      newShields: profile.streak_shields,
    }

    const yesterday    = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak  = profile.streak         || 0
    let newShields = profile.streak_shields || 0
    let shieldUsed = false

    if (lastActive === yesterdayStr) {
      newStreak += 1
      if (newStreak % 7 === 0 && newShields < 2) newShields += 1
    } else {
      if (newShields > 0) {
        newShields -= 1
        shieldUsed  = true
      } else {
        newStreak = 1
      }
    }

    set({ profile: { ...profile, streak: newStreak, streak_shields: newShields, last_active: today } })

    supabase
      .from('user_profiles')
      .update({ streak: newStreak, streak_shields: newShields, last_active: today })
      .eq('id', user.id)
      .catch(err => console.error('[Offline] Error guardando racha:', err))

    if (shieldUsed) {
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

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    set({ session: null, user: null, profile: null, healthProfile: null })
    try {
      localStorage.removeItem('pandi_workout_history_cache')
    } catch {}
  },
}))

// ── SUBSCRIPCIÓN GLOBAL PARA EL COACH IA ─────────────────────────────────────
if (typeof window !== 'undefined') {
  useStore.subscribe((state) => {
    window.__store_workout_state__ = state
  })
}
