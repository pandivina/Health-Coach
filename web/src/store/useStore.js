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
    const { user, profile } = get()
    if (!user) return { data: null, error: new Error('No user found') }

    // Guardar copia del estado anterior por si hay que hacer Rollback
    const previousProfile = { ...profile }

    // ⚡ ACTUALIZACIÓN OPTIMISTA: Cambiamos la UI de inmediato
    const optimisticData = { ...profile, ...updates, updated_at: new Date().toISOString() }
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
      console.error("[Store] Error al actualizar perfil. Aplicando Rollback...", error)
      set({ profile: previousProfile }) // Revertimos al estado real si la red falló de forma catastrófica
      return { data: null, error }
    }
  },

  // ── Sumar XP y subir nivel ──────────────────────────────
  addXP: async (amount) => {
    const { profile, user } = get()
    if (!profile || !user) return null

    const newXP = (profile.xp || 0) + amount
    const newLevel = Math.floor(newXP / 500) + 1

    // ⚡ ACTUALIZACIÓN OPTIMISTA: El usuario ve subir su barra de experiencia al instante
    set({ profile: { ...profile, xp: newXP, level: newLevel } })

    // Petición asíncrona "silenciosa" en segundo plano
    supabase
      .from('user_profiles')
      .update({ xp: newXP, level: newLevel })
      .eq('id', user.id)
      .catch(err => console.error("[Offline] No se pudo sincronizar la XP con Supabase:", err))

    return newXP
  },

  addBondXP: async (amount) => {
    const { profile, user } = get()
    if (!profile || !user) return null

    const newBondXP = (profile.bond_xp || 0) + amount
    const newBondLevel = newBondXP >= 1000 ? 5
      : newBondXP >= 600 ? 4
      : newBondXP >= 300 ? 3
      : newBondXP >= 100 ? 2 : 1

    // ⚡ ACTUALIZACIÓN OPTIMISTA: Sube el nivel de afinidad sin lag de red
    set({ profile: { ...profile, bond_xp: newBondXP, bond_level: newBondLevel } })

    // Sincronización en segundo plano sin bloquear el hilo principal de la UI
    supabase
      .from('user_profiles')
      .update({ bond_xp: newBondXP, bond_level: newBondLevel })
      .eq('id', user.id)
      .catch(err => console.error("[Offline] No se pudo sincronizar el Bond XP:", err))

    return { newBondXP, newBondLevel }
  },

  // ── Actualizar racha ────────────────────────────────────
  updateStreak: async () => {
    const { profile, user } = get()
    if (!profile || !user) return null

    const today      = new Date().toISOString().split('T')[0]
    const lastActive = profile.last_active
    if (lastActive === today) return { shieldUsed: false, newStreak: profile.streak, newShields: profile.streak_shields }

    const yesterday    = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak  = profile.streak  || 0
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

    // ⚡ ACTUALIZACIÓN OPTIMISTA: Asegura que los fuegos de la racha brillen de inmediato
    set({ profile: { ...profile, streak: newStreak, streak_shields: newShields, last_active: today } })

    // Sincronización asíncrona con Supabase
    supabase
      .from('user_profiles')
      .update({ streak: newStreak, streak_shields: newShields, last_active: today })
      .eq('id', user.id)
      .catch(err => console.error("[Offline] Error guardando racha:", err))

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

  // ── Logout ──────────────────────────────────────────────
  logout: async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    // Limpiamos estados locales obligatoriamente pase lo que pase con la red
    set({ session: null, user: null, profile: null })
    try {
      localStorage.removeItem('pandi_workout_history_cache') // Limpiar caché de historial por seguridad
    } catch {}
  },
})) // <--- Aquí termina de crearse tu useStore de Zustand. ¡No metas nada más adentro!

// ─── SUBSCRIPCIÓN GLOBAL PARA EL COACH IA (VA AFUERA DEL STORE) ──────────────
if (typeof window !== 'undefined') {
  useStore.subscribe((state) => {
    window.__store_workout_state__ = state
  })
}
