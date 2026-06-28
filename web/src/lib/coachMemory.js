/**
 * coachMemory.js
 * Construye el objeto de contexto del Santuario que se envía a /api/coach
 * en cada llamada. Permite que Pandi sepa en qué estado emocional y
 * de progreso está el usuario sin necesidad de que el usuario lo explique.
 *
 * USO:
 *   import { buildCoachMemory } from '../lib/coachMemory'
 *   const memory = await buildCoachMemory(supabase, userId)
 *   fetch('/api/coach', { body: JSON.stringify({ messages, sanctuaryContext: memory }) })
 */

import { supabase } from './supabase'

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const safe = async (fn) => {
  try { return await fn } catch { return { data: null, error: null } }
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ─── BUILD COACH MEMORY ───────────────────────────────────────────────────────

/**
 * buildCoachMemory(userId, extraContext?)
 *
 * extraContext permite pasar datos del componente que ya los tiene en state
 * para evitar queries duplicadas. Ejemplo desde Mood.jsx:
 *   buildCoachMemory(userId, {
 *     currentMood: 3,
 *     recoveryLight: 'YELLOW',
 *     activeTab: 'breathing',
 *     habitsChecked: { agua: true, meditacion: false }
 *   })
 */
export async function buildCoachMemory(userId, extraContext = {}) {
  if (!userId) return null

  const t = today()
  const last3dates = [t, daysAgo(1), daysAgo(2)]

  // ─── QUERIES PARALELAS ────────────────────────────────────────────────────
  const [moodRes, habitRes, waterRes, meditationRes, breathingRes, profileRes] = await Promise.all([
    // Últimos 3 días de mood
    safe(supabase
      .from('mood_logs')
      .select('date, mood, notes')
      .eq('user_id', userId)
      .in('date', last3dates)
      .order('date', { ascending: false })
    ),
    // Hábitos de hoy (desde localStorage via extraContext — no hay tabla dedicada)
    Promise.resolve({ data: null }),
    // Agua de hoy
    safe(supabase
      .from('hydration_logs')
      .select('glasses, goal')
      .eq('user_id', userId)
      .eq('date', t)
      .maybeSingle()
    ),
    // Racha de meditación
    safe(supabase
      .from('meditation_streak')
      .select('streak, last_date')
      .eq('user_id', userId)
      .maybeSingle()
    ),
    // Sesión de respiración hoy
    safe(supabase
      .from('breathing_sessions')
      .select('id, technique, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', t + 'T00:00:00')
      .limit(1)
    ),
    // Perfil — primary_focus, coach_strictness, energy_style
    safe(supabase
      .from('user_profiles')
      .select('level, streak, primary_focus, coach_strictness, energy_style, name')
      .eq('id', userId)
      .maybeSingle()
    ),
  ])

  const moodLogs     = moodRes.data      || []
  const water        = waterRes.data     || null
  const medStreak    = meditationRes.data|| null
  const breathToday  = breathingRes.data || []
  const profile      = profileRes.data   || {}

  // ─── PROCESADO ────────────────────────────────────────────────────────────

  const todayMoodLog = moodLogs.find(l => l.date === t)
  const mood         = extraContext.currentMood ?? todayMoodLog?.mood ?? null
  const moodNotes    = todayMoodLog?.notes ?? null
  const moodLast3    = moodLogs.map(l => l.mood).filter(Boolean)

  // Racha baja: todos los últimos 3 días con mood ≤ 2
  const consecutiveLowMood = moodLast3.length >= 3 && moodLast3.every(m => m <= 2)

  // Mood mejorando: hoy > ayer
  const moodImproving = moodLast3.length >= 2 && moodLast3[0] > moodLast3[1]

  // Santuario — estado de recuperación
  const recoveryLight = extraContext.recoveryLight ??
    (mood ? (mood >= 4 ? 'GREEN' : mood === 3 ? 'YELLOW' : 'RED') : 'GREEN')

  // Hábitos desde extraContext (ya los tiene Mood.jsx en state)
  const habitsChecked  = extraContext.habitsChecked ?? {}
  const habitsDone     = Object.values(habitsChecked).filter(Boolean).length
  const habitsTotal    = Object.keys(habitsChecked).length || 0
  const habitsPct      = habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : null

  // Agua
  const waterGlasses = water?.glasses ?? 0
  const waterGoal    = water?.goal    ?? 8

  // Meditación hoy (desde medStreak o desde sessions)
  const meditationDoneToday = medStreak?.last_date === t

  // Respiración hoy
  const breathingDoneToday = breathToday.length > 0

  // Último tab visitado en el Santuario
  const activeTab = extraContext.activeTab ?? null

  // Horas desde última visita al Santuario (localStorage)
  let lastSanctuaryVisitHours = null
  try {
    const last = localStorage.getItem('pandi_last_sanctuary_visit')
    if (last) {
      const diff = (Date.now() - parseInt(last)) / (1000 * 60 * 60)
      lastSanctuaryVisitHours = Math.round(diff)
    }
  } catch {}

  // Sugerencia de tab según estado (lógica proactiva Capa 2)
  const suggestedTab = (() => {
    if (!mood) return 'checkin'
    if (consecutiveLowMood) return 'breathing'     // urgente: calmarse
    if (mood <= 2) return 'breathing'               // ánimo bajo → respirar
    if (mood === 3 && !meditationDoneToday) return 'meditation'
    if (mood >= 4 && !meditationDoneToday) return 'meditation'
    return null // ya está bien cubierto
  })()

  // ─── PAYLOAD FINAL ────────────────────────────────────────────────────────
  return {
    // Identidad del usuario
    user: {
      name:             profile.name           || null,
      level:            profile.level          || 1,
      streak:           profile.streak         || 0,
      primary_focus:    profile.primary_focus  || null,   // 'nutrition' | 'exercise' | 'calm'
      coach_strictness: profile.coach_strictness ?? 0.5,  // 0.0 a 1.0
      energy_style:     profile.energy_style   || null,   // 'morning_person' | 'night_owl' | etc.
    },

    // Estado de hoy
    today: {
      mood,
      mood_notes:          moodNotes,
      recovery_light:      recoveryLight,
      habits_pct:          habitsPct,
      habits_done:         habitsDone,
      habits_total:        habitsTotal,
      meditation_done:     meditationDoneToday,
      breathing_done:      breathingDoneToday,
      water_glasses:       waterGlasses,
      water_goal:          waterGoal,
      active_tab:          activeTab,
    },

    // Streaks
    streak: {
      meditation_days: medStreak?.streak     ?? 0,
      app_days:        profile.streak        ?? 0,
    },

    // Historial reciente
    history: {
      mood_last3:           moodLast3,
      journal_last3:        moodLogs.map(l => l.notes).filter(Boolean),
      consecutive_low_mood: consecutiveLowMood,
      mood_improving:       moodImproving,
    },

    // Contexto del Santuario
    sanctuary: {
      last_visit_hours:  lastSanctuaryVisitHours,
      suggested_tab:     suggestedTab,
      recovery_light:    recoveryLight,
    },
  }
}

/**
 * recordSanctuaryVisit()
 * Llama esto cuando el usuario entra al Santuario (Mood.jsx useEffect)
 * para que el Coach sepa cuánto tiempo lleva sin visitarlo.
 */
export function recordSanctuaryVisit() {
  try { localStorage.setItem('pandi_last_sanctuary_visit', Date.now().toString()) } catch {}
}

/**
 * getSanctuaryWelcomeMessage(memory)
 * Genera un mensaje de bienvenida contextual en el frontend
 * sin necesitar una llamada al backend.
 * Úsalo en Mood.jsx al montar, si no quieres gastar un mensaje del límite.
 */
export function getSanctuaryWelcomeMessage(memory) {
  if (!memory) return null

  const { today: t, history, sanctuary, user } = memory
  const name = user?.name?.split(' ')[0] || ''

  // Orden de prioridad de mensajes
  if (history.consecutive_low_mood) {
    return `Pandi nota que llevas unos días difíciles, ${name}. Aquí estoy contigo. 🤍`
  }
  if (sanctuary.last_visit_hours > 24) {
    return `Llevabas un tiempo fuera del Santuario. Me alegra que hayas vuelto. 🐼`
  }
  if (t.mood >= 4) {
    return `¡Qué buena energía traes hoy! El Santuario lo nota. ✨`
  }
  if (t.mood !== null && t.mood <= 2) {
    return `Sé que no es un día fácil. Respira. Estamos juntos. 🌿`
  }
  if (history.mood_improving) {
    return `El ánimo va mejorando. Cada día cuenta, ${name}. 🌱`
  }
  if (sanctuary.suggested_tab === 'breathing') {
    return `Hoy el Santuario tiene un ambiente tranquilo. ¿Empezamos con una respiración?`
  }
  if (sanctuary.suggested_tab === 'meditation') {
    return `Buen momento para meditar. Pandi ya está listo. 🧘`
  }

  return null  // Sin mensaje especial — silencio también es válido
}
