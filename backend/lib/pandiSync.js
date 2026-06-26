// backend/lib/pandiSync.js
// Lazy initialization — no crea el cliente Supabase al importar,
// solo cuando se llama a una función. Evita el crash en arranque.

let _supabase = null

function getSupabase() {
  if (_supabase) return _supabase
  const { createClient } = require('@supabase/supabase-js')
  _supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
  return _supabase
}

async function syncNutritionState(userId, { meals = [], goals = {} } = {}) {
  try {
    if (!userId || !meals.length) return
    const allQuality = meals.map(m => m.quality_score ?? 0.6)
    const avg        = allQuality.reduce((s, q) => s + q, 0) / allQuality.length
    const tummyState = avg >= 0.75 ? 'great'
                     : avg >= 0.5  ? 'good'
                     : avg >= 0.3  ? 'neutral'
                     : avg >= 0.15 ? 'bad' : 'terrible'

    await getSupabase().from('user_profiles')
      .update({ tummy_state: tummyState })
      .eq('id', userId)
  } catch (err) {
    console.warn('[pandiSync] syncNutritionState error:', err.message)
  }
}

async function syncWorkoutState(userId, { caloriesBurned = 0 } = {}) {
  try {
    if (!userId) return
    const sb = getSupabase()
    const { data } = await sb.from('user_profiles')
      .select('bond_xp').eq('id', userId).maybeSingle()
    if (data) {
      await sb.from('user_profiles')
        .update({ bond_xp: (data.bond_xp || 0) + Math.min(caloriesBurned, 50) })
        .eq('id', userId)
    }
  } catch (err) {
    console.warn('[pandiSync] syncWorkoutState error:', err.message)
  }
}

module.exports = { syncNutritionState, syncWorkoutState }
