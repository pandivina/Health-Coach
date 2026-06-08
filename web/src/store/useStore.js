import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  session:       null,
  user:          null,
  profile:       null,
  healthProfile: null,
  loading:       true,

  setSession:       (session)       => set({ session }),
  setUser:          (user)          => set({ user }),
  setProfile:       (profile)       => set({ profile }),
  setHealthProfile: (healthProfile) => set({ healthProfile }),
  setLoading:       (loading)       => set({ loading }),

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
      console.error('[Store] Rollback...', error)
      set({ profile: previousProfile })
      return { data: null, error }
    }
  },

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
      .catch(err => console.error('[Offline] XP sync error:', err))
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
      .catch(err => console.error('[Offline] BondXP sync error:', err))
    return { newBondXP, newBondLevel }
  },

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
      .catch(err => console.error('[Offline] Streak sync error:', err))
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

  logout: async () => {
    try { await supabase.auth.signOut() } catch {}
    set({ session: null, user: null, profile: null, healthProfile: null })
    try { localStorage.removeItem('pandi_workout_history_cache') } catch {}
  },
}))

saveDailyGoals: async (goals) => {
    const { user } = get()
    if (!user) return { data: null, error: 'No user found' }

    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('daily_goals')
      .upsert({ 
        user_id: user.id, 
        date: today, 
        goals: goals, 
        completed: [false, false, false] 
      })
      .select()
      .single()

    if (error) {
      console.error('[Store] Error saving daily goals:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  },
}))
if (typeof window !== 'undefined') {
  useStore.subscribe((state) => {
    window.__store_workout_state__ = state
  })
}
