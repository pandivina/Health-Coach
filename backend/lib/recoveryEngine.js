// ─── backend/lib/recoveryEngine.js ───────────────────────────────────────────
// Calcula el Espejo Metabólico: 3 ejes + Coach Score + Semáforo
// Llamado por /api/recovery/calculate y por el cron nocturno

const { supabaseAdmin } = require('../middleware/auth')

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(Math.round(v * 10) / 10, min), max)

/**
 * Calcula y persiste el Recovery Score completo para un usuario.
 * @param {string} userId
 * @returns {{ physical_score, mental_score, env_score, coach_score, semaphore, details }}
 */
async function calculateRecovery(userId) {
  const today     = new Date().toISOString().split('T')[0]
  const week_ago  = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  // ── Datos paralelos ───────────────────────────────────────────────────────
  const [sleepR, moodR, moodWeekR, waterR, workoutR, rpeR, ritualR, profileR, calsR] = await Promise.all([
    supabaseAdmin.from('sleep_logs').select('hours, quality').eq('user_id', userId).eq('date', today).maybeSingle(),
    supabaseAdmin.from('mood_logs').select('mood').eq('user_id', userId).eq('date', today).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from('mood_logs').select('mood, date').eq('user_id', userId).gte('date', week_ago).order('date'),
    supabaseAdmin.from('hydration_logs').select('glasses, goal').eq('user_id', userId).eq('date', today).maybeSingle(),
    supabaseAdmin.from('workout_sessions').select('id').eq('user_id', userId).eq('status', 'completed').gte('created_at', today + 'T00:00:00').maybeSingle(),
    supabaseAdmin.from('rpe_logs').select('rpe').eq('user_id', userId).eq('date', today).maybeSingle(),
    supabaseAdmin.from('night_ritual_logs').select('completed').eq('user_id', userId).eq('date', today).maybeSingle(),
    supabaseAdmin.from('user_profiles').select('meditation_streak, is_smoker, streak').eq('id', userId).single(),
    supabaseAdmin.from('meal_logs').select('calories, quality_score').eq('user_id', userId).eq('date', today),
  ])

  const sleep   = sleepR.data
  const mood    = moodR.data?.mood
  const moodWeek= moodWeekR.data || []
  const water   = waterR.data
  const workout = workoutR.data
  const rpe     = rpeR.data?.rpe
  const ritual  = ritualR.data?.completed
  const profile = profileR.data || {}
  const meals   = calsR.data || []

  // ══════════════════════════════════════════════════════════════════════════
  // EJE 1 — FÍSICO (40% del score total)
  // ══════════════════════════════════════════════════════════════════════════
  let physical = 50 // base neutral

  // Sueño: 8h = 100 puntos, escalado
  if (sleep?.hours != null) {
    const sleepBase    = Math.min(sleep.hours / 8, 1) * 80
    const qualityBonus = sleep.quality != null ? (sleep.quality / 5) * 20 : 10
    physical = sleepBase + qualityBonus
  }

  // RPE: esfuerzo percibido. Alto RPE ayer = necesita recuperación hoy
  if (rpe != null) {
    // RPE 1-4: ligero, suma. RPE 7-10: intenso, resta según nivel
    if (rpe <= 4)       physical = clamp(physical + 10)
    else if (rpe <= 6)  physical = clamp(physical)        // neutro
    else if (rpe <= 8)  physical = clamp(physical - 10)
    else                physical = clamp(physical - 20)   // RPE 9-10: muy exigente
  }

  // Entrenamiento completado hoy: bonus pequeño
  if (workout) physical = clamp(physical + 5)

  physical = clamp(physical)

  // ══════════════════════════════════════════════════════════════════════════
  // EJE 2 — MENTAL (35% del score total)
  // ══════════════════════════════════════════════════════════════════════════
  let mental = 50

  // Mood de hoy
  if (mood != null) mental = (mood / 5) * 80

  // Tendencia semanal de mood
  if (moodWeek.length >= 3) {
    const recent = moodWeek.slice(-3).map(m => m.mood)
    const older  = moodWeek.slice(0, -3).map(m => m.mood)
    const recentAvg = recent.reduce((s, m) => s + m, 0) / recent.length
    const olderAvg  = older.length ? older.reduce((s, m) => s + m, 0) / older.length : recentAvg
    const trend = recentAvg - olderAvg
    if (trend > 0.5)       mental = clamp(mental + 10) // mejorando
    else if (trend < -0.5) mental = clamp(mental - 10) // empeorando
  }

  // Racha de meditación
  const medStreak = profile.meditation_streak || 0
  mental = clamp(mental + Math.min(medStreak * 2, 15))

  // Ritual nocturno completado
  if (ritual) mental = clamp(mental + 10)

  mental = clamp(mental)

  // ══════════════════════════════════════════════════════════════════════════
  // EJE 3 — AMBIENTAL/HÁBITOS (25% del score total)
  // ══════════════════════════════════════════════════════════════════════════
  let env = 50

  // Hidratación
  const glasses  = water?.glasses || 0
  const waterGoal= water?.goal    || 8
  const waterPct = Math.min(glasses / waterGoal, 1)
  env = waterPct * 60 // hasta 60 puntos por hidratación

  // Calidad de comida
  const validMeals = meals.filter(m => m.quality_score != null)
  if (validMeals.length > 0) {
    const avgQ = validMeals.reduce((s, m) => s + m.quality_score, 0) / validMeals.length
    env = clamp(env + avgQ * 30) // hasta 30 puntos por calidad
  }

  // Fumador activo resta
  if (profile.is_smoker) env = clamp(env - 15)

  // Racha general de la app (constancia)
  const streakBonus = Math.min((profile.streak || 0), 10)
  env = clamp(env + streakBonus)

  env = clamp(env)

  // ══════════════════════════════════════════════════════════════════════════
  // COACH SCORE GLOBAL
  // ══════════════════════════════════════════════════════════════════════════
  const coach_score = clamp(physical * 0.40 + mental * 0.35 + env * 0.25)

  const semaphore = coach_score > 65 ? 'GREEN' : coach_score > 40 ? 'YELLOW' : 'RED'

  const details = {
    sleep_hours:    sleep?.hours,
    sleep_quality:  sleep?.quality,
    mood_today:     mood,
    mood_trend:     moodWeek.length >= 3 ? (moodWeek.slice(-3).reduce((s,m)=>s+m.mood,0)/3).toFixed(1) : null,
    rpe_today:      rpe,
    water_pct:      Math.round(waterPct * 100),
    meditation_streak: medStreak,
    ritual_done:    !!ritual,
    workout_done:   !!workout,
  }

  // ── Persistir ─────────────────────────────────────────────────────────────
  await Promise.all([
    supabaseAdmin.from('recovery_logs').upsert({
      user_id: userId, date: today,
      physical_score: physical, mental_score: mental, env_score: env,
      coach_score, semaphore, details,
    }, { onConflict: 'user_id,date' }),

    supabaseAdmin.from('user_profiles').update({
      coach_score, semaphore
    }).eq('id', userId),
  ])

  return { physical_score: physical, mental_score: mental, env_score: env, coach_score, semaphore, details }
}

module.exports = { calculateRecovery }
