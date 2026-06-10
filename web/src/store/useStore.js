import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  // ─── ESTADO EXISTENTE — NO MODIFICADO ────────────────────────────────────
  session:       null,
  user:          null,
  profile:       null,
  healthProfile: null,
  loading:       true,

  setSession:        (session)       => set({ session }),
  setUser:           (user)          => set({ user }),
  setProfile:        (profile)       => set({ profile }),
  setHealthProfile:  (healthProfile) => set({ healthProfile }),
  setLoading:        (loading)       => set({ loading }),

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
        .from('health_profiles').select('*').eq('user_id', userId).single()
      if (!error && data) { set({ healthProfile: data }); return data }
    } catch {}
    return null
  },

  updateProfile: async (updates) => {
    const { user, profile } = get()
    if (!user) return { data: null, error: new Error('No user found') }
    const previousProfile = { ...profile }
    set({ profile: { ...profile, ...updates, updated_at: new Date().toISOString() } })
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id).select().single()
      if (error) throw error
      if (data) set({ profile: data })
      return { data, error: null }
    } catch (error) {
      set({ profile: previousProfile })
      return { data: null, error }
    }
  },

  // LEGACY: NO MODIFICAR — Sistema XP
  addXP: async (amount) => {
    const { profile, user } = get()
    if (!profile || !user) return null
    const newXP    = (profile.xp || 0) + amount
    const newLevel = Math.floor(newXP / 500) + 1
    set({ profile: { ...profile, xp: newXP, level: newLevel } })
    supabase.from('user_profiles').update({ xp: newXP, level: newLevel }).eq('id', user.id)
      .catch(err => console.error('[Offline] XP sync error:', err))
    return newXP
  },

  // LEGACY: NO MODIFICAR — Sistema Bond XP
  addBondXP: async (amount) => {
    const { profile, user } = get()
    if (!profile || !user) return null
    const newBondXP    = (profile.bond_xp || 0) + amount
    const newBondLevel = newBondXP >= 1000 ? 5 : newBondXP >= 600 ? 4 : newBondXP >= 300 ? 3 : newBondXP >= 100 ? 2 : 1
    set({ profile: { ...profile, bond_xp: newBondXP, bond_level: newBondLevel } })
    supabase.from('user_profiles').update({ bond_xp: newBondXP, bond_level: newBondLevel }).eq('id', user.id)
      .catch(err => console.error('[Offline] BondXP sync error:', err))
    return { newBondXP, newBondLevel }
  },

  // LEGACY: NO MODIFICAR — Sistema Streak
  updateStreak: async () => {
    const { profile, user } = get()
    if (!profile || !user) return null
    const today      = new Date().toISOString().split('T')[0]
    const lastActive = profile.last_active
    if (lastActive === today) return { shieldUsed: false, newStreak: profile.streak, newShields: profile.streak_shields }
    const yesterday    = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    let newStreak  = profile.streak          || 0
    let newShields = profile.streak_shields || 0
    let shieldUsed = false
    if (lastActive === yesterdayStr) {
      newStreak += 1
      if (newStreak % 7 === 0 && newShields < 2) newShields += 1
    } else {
      if (newShields > 0) { newShields -= 1; shieldUsed = true }
      else newStreak = 1
    }
    set({ profile: { ...profile, streak: newStreak, streak_shields: newShields, last_active: today } })
    supabase.from('user_profiles').update({ streak: newStreak, streak_shields: newShields, last_active: today }).eq('id', user.id)
      .catch(err => console.error('[Offline] Streak sync error:', err))
    if (shieldUsed) {
      import('../lib/api').then(({ api }) => {
        api.notifications.send({ title: '🛡️ ¡Escudo activado!', body: `Tu racha de ${newStreak} días está a salvo. Vuelve mañana.`, url: '/home', tag: 'shield' }).catch(() => {})
      })
    }
    return { shieldUsed, newStreak, newShields }
  },

  logout: async () => {
    try { await supabase.auth.signOut() } catch {}
    set({ session: null, user: null, profile: null, healthProfile: null, coachState: { ...initialCoachState } })
    try { localStorage.removeItem('pandi_workout_history_cache') } catch {}
  },

  saveDailyGoals: async (goals) => {
    const { user } = get()
    if (!user) return { data: null, error: 'No user found' }
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('daily_goals').upsert({ user_id: user.id, date: today, goals, completed: [false, false, false] })
      .select().single()
    if (error) { console.error('[Store] Error saving daily goals:', error); return { data: null, error } }
    return { data, error: null }
  },

  // ─── COACH STATE — CAPA NUEVA, NO TOCA LO ANTERIOR ───────────────────────

  coachState: {
    // Check-in diario
    todayCheckin: null,          // { energy_level, stress_level, created_at }
    checkinDone: false,

    // Tareas inteligentes
    smartTasks: [],              // [{ id, title, category, priority_score, context_tags, is_completed }]

    // Motor de decisión — lo que el coach decide mostrar proactivamente
    coachSuggestion: null,       // { message, type, priority, action }

    // Perfil profundo — aprende del usuario con el tiempo
    deepProfile: {
      energy_pattern:    null,   // { peak_hours: [9,17], low_energy_triggers: [] }
      wellbeing_goals:   null,   // { quit_smoking: false, meditation_goal: 20 }
      onboarding_data:   null,   // respuestas del onboarding: mind, water, sleep, movement, food, intention
    },

    lastEvaluated: null,         // timestamp del último cálculo del motor
  },

  // ── Guardar check-in diario ──────────────────────────────────────────────
  saveCheckin: async ({ energy_level, stress_level, mood }) => {
    const { user } = get()
    if (!user) return null
    try {
      const { data, error } = await supabase
        .from('daily_checkins')
        .upsert({
          user_id: user.id,
          energy_level,
          stress_level,
          mood: mood || null,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id,date' })
        .select().single()
      if (!error && data) {
        set(s => ({ coachState: { ...s.coachState, todayCheckin: data, checkinDone: true } }))
        // Evaluar contexto tras check-in
        get().evaluateCoachContext()
        return data
      }
    } catch (err) { console.error('[Coach] Checkin error:', err) }
    return null
  },

  // ── Cargar check-in de hoy ────────────────────────────────────────────────
  loadTodayCheckin: async () => {
    const { user } = get()
    if (!user) return null
    const today = new Date().toISOString().split('T')[0]
    try {
      const { data } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today + 'T00:00:00')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) set(s => ({ coachState: { ...s.coachState, todayCheckin: data, checkinDone: true } }))
      return data
    } catch { return null }
  },

  // ── Cargar tareas inteligentes ────────────────────────────────────────────
  loadSmartTasks: async () => {
    const { user } = get()
    if (!user) return []
    try {
      const { data } = await supabase
        .from('smart_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('priority_score', { ascending: false })
        .limit(10)
      if (data) set(s => ({ coachState: { ...s.coachState, smartTasks: data } }))
      return data || []
    } catch { return [] }
  },

  // ── Crear tarea inteligente ───────────────────────────────────────────────
  createSmartTask: async ({ title, category, due_date, context_tags, priority_score }) => {
    const { user } = get()
    if (!user) return null
    try {
      const { data, error } = await supabase
        .from('smart_tasks')
        .insert({
          user_id: user.id,
          title,
          category:       category || 'wellness',
          due_date:       due_date || null,
          context_tags:   context_tags || [],
          priority_score: priority_score || 50,
          is_completed:   false,
        })
        .select().single()
      if (!error && data) {
        set(s => ({ coachState: { ...s.coachState, smartTasks: [data, ...s.coachState.smartTasks] } }))
        return data
      }
    } catch (err) { console.error('[Coach] Task create error:', err) }
    return null
  },

  // ── Completar tarea ───────────────────────────────────────────────────────
  completeSmartTask: async (taskId) => {
    const { user } = get()
    if (!user) return
    try {
      await supabase.from('smart_tasks').update({ is_completed: true }).eq('id', taskId).eq('user_id', user.id)
      set(s => ({
        coachState: {
          ...s.coachState,
          smartTasks: s.coachState.smartTasks.filter(t => t.id !== taskId),
        }
      }))
      get().addXP(10) // XP por completar tarea
    } catch (err) { console.error('[Coach] Task complete error:', err) }
  },

  // ── Motor de decisión del Coach ───────────────────────────────────────────
  // Compara el check-in del día con las tareas pendientes y el perfil
  // y decide qué mensaje proactivo mostrar
  evaluateCoachContext: () => {
    const { coachState, profile, healthProfile } = get()
    const { todayCheckin, smartTasks, deepProfile } = coachState

    const energy  = todayCheckin?.energy_level  || 3
    const stress  = todayCheckin?.stress_level  || 3
    const onboarding = deepProfile?.onboarding_data || {}

    let suggestion = null

    // ── Reglas del motor de decisión ──────────────────────────────────────

    // 1. Alta tensión → priorizar descanso o meditación
    if (stress >= 4 || energy <= 2) {
      const calmTask = smartTasks.find(t =>
        t.context_tags?.includes('calm') ||
        t.context_tags?.includes('meditation') ||
        t.category === 'psychology'
      )
      suggestion = {
        type:     'calm',
        priority: 'high',
        message:  stress >= 4
          ? `Detecto estrés alto hoy. ${calmTask ? `¿Hacemos "${calmTask.title}" ahora?` : 'Tómate 5 minutos para respirar.'}`
          : `Tu energía está baja hoy. No es día de forzar. ¿Qué necesitas?`,
        action: calmTask ? { label: 'Hacer ahora', taskId: calmTask.id } : null,
      }
    }

    // 2. Energía alta → sugerir tarea de alta prioridad
    else if (energy >= 4 && smartTasks.length > 0) {
      const topTask = smartTasks[0]
      suggestion = {
        type:     'productivity',
        priority: 'medium',
        message:  `Tienes buena energía hoy. ${topTask ? `"${topTask.title}" está pendiente con alta prioridad.` : '¿En qué quieres avanzar?'}`,
        action: topTask ? { label: 'Ver tarea', taskId: topTask.id } : null,
      }
    }

    // 3. Adaptar según intención del onboarding
    else if (onboarding.intention === 'family') {
      suggestion = {
        type:     'intention',
        priority: 'low',
        message:  'Recuerda que cada hábito que construyes hoy es tiempo de calidad que ganarás para quienes amas.',
        action:   null,
      }
    }

    else if (onboarding.intention === 'health' && healthProfile?.target_weight_kg) {
      const diff = (healthProfile.weight_kg || 0) - healthProfile.target_weight_kg
      suggestion = {
        type:     'health',
        priority: 'low',
        message:  diff > 0
          ? `Te quedan ${diff.toFixed(1)}kg para tu objetivo. Cada día cuenta.`
          : '¡Has alcanzado tu objetivo de peso! Ahora toca mantenerlo.',
        action: null,
      }
    }

    // 4. Sin check-in hecho → recordar hacerlo
    else if (!coachState.checkinDone) {
      suggestion = {
        type:     'checkin',
        priority: 'medium',
        message:  '¿Cómo estás hoy? Un check-in rápido me ayuda a acompañarte mejor.',
        action:   { label: 'Check-in', route: '/mood' },
      }
    }

    set(s => ({
      coachState: {
        ...s.coachState,
        coachSuggestion: suggestion,
        lastEvaluated:   new Date().toISOString(),
      }
    }))

    return suggestion
  },

  // ── Cargar perfil profundo desde Supabase ─────────────────────────────────
  loadDeepProfile: async () => {
    const { user } = get()
    if (!user) return null
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('energy_pattern, wellbeing_goals, onboarding_data')
        .eq('id', user.id)
        .single()
      if (data) {
        set(s => ({
          coachState: {
            ...s.coachState,
            deepProfile: {
              energy_pattern:  data.energy_pattern  || null,
              wellbeing_goals: data.wellbeing_goals  || null,
              onboarding_data: data.onboarding_data  || null,
            }
          }
        }))
        return data
      }
    } catch { return null }
    return null
  },

  // ── Inicializar todo el coach al hacer login ──────────────────────────────
  initCoach: async () => {
    const { loadTodayCheckin, loadSmartTasks, loadDeepProfile, evaluateCoachContext } = get()
    await Promise.allSettled([
      loadTodayCheckin(),
      loadSmartTasks(),
      loadDeepProfile(),
    ])
    evaluateCoachContext()
  },
}))

if (typeof window !== 'undefined') {
  useStore.subscribe((state) => {
    window.__store_workout_state__ = state
  })
}

// Estado inicial del coach para reset en logout
const initialCoachState = {
  todayCheckin:    null,
  checkinDone:     false,
  smartTasks:      [],
  coachSuggestion: null,
  deepProfile: { energy_pattern: null, wellbeing_goals: null, onboarding_data: null },
  lastEvaluated:   null,
}
