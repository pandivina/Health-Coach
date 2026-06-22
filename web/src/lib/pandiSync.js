// ─── backend/lib/pandiSync.js ─────────────────────────────────────────────────
// Motor de sincronización del estado de Pandi basado en logs diarios del usuario
// Exporta syncPandiState() — invocable en background desde cualquier endpoint

const { supabaseAdmin } = require('../middleware/auth')

const clamp = (val, min = 0, max = 100) => Math.min(Math.max(Math.round(val), min), max)

/**
 * Calcula y persiste el estado de Pandi para un usuario.
 * Diseñado para invocarse en background (fire-and-forget) tras cada log.
 * @param {string} userId
 */
async function syncPandiState(userId) {
  const today = new Date().toISOString().split('T')[0] // fecha en UTC

  // ── Consultas paralelas — un único roundtrip ──────────────────────────────
  const [mealsR, waterR, sleepR, moodR, profileR] = await Promise.all([
    supabaseAdmin
      .from('meal_logs')
      .select('quality_score, calories, created_at')
      .eq('user_id', userId)
      .eq('date', today),

    supabaseAdmin
      .from('hydration_logs')                     // tabla real confirmada
      .select('glasses')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle(),

    supabaseAdmin
      .from('sleep_logs')
      .select('hours, quality')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle(),

    supabaseAdmin
      .from('mood_logs')
      .select('mood')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(5),

    supabaseAdmin
      .from('user_profiles')
      .select('pandi_hunger, pandi_energy, pandi_happiness, pandi_care_updated_at')
      .eq('id', userId)
      .single(),
  ])

  const meals   = mealsR.data   || []
  const water   = waterR.data
  const sleep   = sleepR.data
  const moods   = moodR.data    || []
  const profile = profileR.data || {}

  // ── HAMBRE (pandi_hunger) ─────────────────────────────────────────────────
  // Base 30. Cada comida con quality_score suma proporcional hasta 100.
  // Sin registros: decaimiento de 4 puntos/hora desde la última actualización.
  let pandi_hunger
  if (meals.length > 0) {
    const validScores = meals.filter(m => m.quality_score != null)
    if (validScores.length > 0) {
      const avgQuality = validScores.reduce((s, m) => s + m.quality_score, 0) / validScores.length
      // 0-1 score → 0-70 puntos extra sobre la base de 30
      pandi_hunger = clamp(30 + avgQuality * 70 * Math.min(meals.length / 3, 1))
    } else {
      // Comidas sin quality_score: base 50 por tener registros
      pandi_hunger = clamp(30 + (meals.length / 3) * 40)
    }
  } else {
    // Decaimiento por tiempo sin registrar
    const lastUpdate = profile.pandi_care_updated_at
      ? new Date(profile.pandi_care_updated_at)
      : new Date()
    const hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)
    const currentHunger = profile.pandi_hunger ?? 70
    pandi_hunger = clamp(currentHunger - hoursAgo * 4)
  }

  // ── ENERGÍA (pandi_energy) ────────────────────────────────────────────────
  // Basada en horas de sueño. 8h = 100. Sin registro: decaimiento 2pt/hora.
  let pandi_energy
  if (sleep?.hours != null) {
    const sleepScore = Math.min(sleep.hours / 8, 1)
    const qualityBonus = sleep.quality != null ? (sleep.quality / 5) * 10 : 0
    pandi_energy = clamp(sleepScore * 90 + qualityBonus)
  } else {
    const lastUpdate = profile.pandi_care_updated_at
      ? new Date(profile.pandi_care_updated_at)
      : new Date()
    const hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)
    const currentEnergy = profile.pandi_energy ?? 70
    pandi_energy = clamp(currentEnergy - hoursAgo * 2)
  }

  // ── FELICIDAD (pandi_happiness) ───────────────────────────────────────────
  // 70% mood promedio del día + 30% nivel de hambre actual
  let pandi_happiness
  if (moods.length > 0) {
    const avgMood = moods.reduce((s, m) => s + (m.mood || 3), 0) / moods.length
    const moodComponent    = (avgMood / 5) * 100  // 1-5 → 0-100
    const hungerComponent  = pandi_hunger
    pandi_happiness = clamp(moodComponent * 0.7 + hungerComponent * 0.3)
  } else {
    // Sin mood registrado: depende principalmente del hambre
    pandi_happiness = clamp(pandi_hunger * 0.6 + 20)
  }

  // ── TUMMY STATE ───────────────────────────────────────────────────────────
  // Refleja hidratación y calidad de comida combinadas
  const totalMl = (water?.glasses || 0) * 250 // 1 vaso ≈ 250ml
  const avgFoodQuality = meals.length > 0
    ? meals.filter(m => m.quality_score != null)
            .reduce((s, m) => s + m.quality_score, 0) /
      Math.max(meals.filter(m => m.quality_score != null).length, 1) * 100
    : 0

  let tummy_state
  if (totalMl < 1000) {
    tummy_state = 'thirsty'
  } else if (totalMl > 1500 && avgFoodQuality > 80) {
    tummy_state = 'full_and_happy'
  } else if (totalMl >= 1000 && totalMl <= 2000) {
    tummy_state = 'normal'
  } else {
    tummy_state = 'neutral'
  }

  // ── PERSISTIR ─────────────────────────────────────────────────────────────
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      pandi_hunger,
      pandi_energy,
      pandi_happiness,
      tummy_state,
      pandi_care_updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw new Error(`pandiSync update failed: ${error.message}`)

  return { pandi_hunger, pandi_energy, pandi_happiness, tummy_state }
}

module.exports = { syncPandiState }
