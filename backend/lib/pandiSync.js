// backend/lib/pandiSync.js
// Stub de sincronización de estado de Pandi
// Actualiza tummy_state y bond_xp en user_profiles tras eventos nutricionales

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function syncNutritionState(userId, { meals = [], goals = {} } = {}) {
  try {
    if (!userId || !meals.length) return
    const allQuality = meals.map(m => m.quality_score ?? 0.6)
    const avg        = allQuality.reduce((s, q) => s + q, 0) / allQuality.length
    const tummyState = avg >= 0.75 ? 'great'
                     : avg >= 0.5  ? 'good'
                     : avg >= 0.3  ? 'neutral'
                     : avg >= 0.15 ? 'bad' : 'terrible'

    await supabase.from('user_profiles')
      .update({ tummy_state: tummyState })
      .eq('id', userId)
  } catch (err) {
    console.warn('[pandiSync] syncNutritionState error:', err.message)
  }
}

async function syncWorkoutState(userId, { caloriesBurned = 0 } = {}) {
  try {
    if (!userId) return
    // Incrementar bond_xp por entreno completado
    const { data } = await supabase.from('user_profiles')
      .select('bond_xp').eq('id', userId).maybeSingle()
    if (data) {
      await supabase.from('user_profiles')
        .update({ bond_xp: (data.bond_xp || 0) + Math.min(caloriesBurned, 50) })
        .eq('id', userId)
    }
  } catch (err) {
    console.warn('[pandiSync] syncWorkoutState error:', err.message)
  }
}

module.exports = { syncNutritionState, syncWorkoutState }
