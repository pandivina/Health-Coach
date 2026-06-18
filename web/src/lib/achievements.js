// ─── lib/achievements.js ──────────────────────────────────────────────────
// Catálogo de logros + comprobación contra datos reales del usuario

import { supabase } from './supabase'

export const ACHIEVEMENTS = [
  { id:'first_week',     title:'Primera semana completa',     description:'7 días registrando datos seguidos', emoji:'🗓️' },
  { id:'water_10l',      title:'10 litros acumulados',         description:'Has bebido 10L de agua en total',    emoji:'💧' },
  { id:'first_500kg',    title:'Primer entreno de 500kg+',      description:'Volumen total superior a 500kg',     emoji:'🏋️' },
  { id:'streak_30',      title:'Racha de hierro',               description:'30 días consecutivos activos',       emoji:'🔥' },
  { id:'meditation_7',   title:'Mente en calma',                description:'7 días seguidos meditando',          emoji:'🧘' },
  { id:'level_10',       title:'Nivel 10 alcanzado',            description:'Pandi ha evolucionado contigo',      emoji:'⭐' },
  { id:'perfect_day',    title:'Día perfecto',                  description:'Comida, entreno, sueño y ánimo en un mismo día', emoji:'🎯' },
  { id:'journal_10',     title:'Diario fiel',                   description:'10 entradas en tu diario emocional', emoji:'📖' },
]

export async function checkAchievements(userId) {
  if (!userId) return []
  const newlyUnlocked = []
  const safe = async fn => { try { return await fn } catch { return { data: null } } }

  const { data: existing } = await supabase
    .from('achievements').select('achievement_id').eq('user_id', userId)
  const unlockedIds = new Set((existing || []).map(a => a.achievement_id))

  async function unlock(id) {
    if (unlockedIds.has(id)) return
    const def = ACHIEVEMENTS.find(a => a.id === id)
    if (!def) return
    const { error } = await supabase.from('achievements').insert({
      user_id: userId, achievement_id: id, title: def.title, description: def.description,
    })
    if (!error) newlyUnlocked.push(def)
  }

  const [profileR, waterR, workoutR, journalR, mealR, sleepR, moodR] = await Promise.all([
    safe(supabase.from('user_profiles').select('level,streak,meditation_streak').eq('id', userId).single()),
    safe(supabase.from('hydration_logs').select('glasses').eq('user_id', userId)),
    safe(supabase.from('workout_sessions').select('total_volume_kg').eq('user_id', userId).eq('status','completed')),
    safe(supabase.from('journal_entries').select('id').eq('user_id', userId)),
    safe(supabase.from('meal_logs').select('id').eq('user_id', userId).eq('date', new Date().toISOString().split('T')[0])),
    safe(supabase.from('sleep_logs').select('id').eq('user_id', userId).eq('date', new Date().toISOString().split('T')[0])),
    safe(supabase.from('mood_logs').select('id').eq('user_id', userId).eq('date', new Date().toISOString().split('T')[0])),
  ])

  const profile = profileR.data
  const totalWater = (waterR.data || []).reduce((s, w) => s + (w.glasses || 0), 0) * 0.25 // litros
  const maxVolume = Math.max(...(workoutR.data || []).map(w => w.total_volume_kg || 0), 0)
  const journalCount = (journalR.data || []).length

  if (profile?.streak >= 7)  await unlock('first_week')
  if (totalWater >= 10)      await unlock('water_10l')
  if (maxVolume >= 500)      await unlock('first_500kg')
  if (profile?.streak >= 30) await unlock('streak_30')
  if (profile?.meditation_streak >= 7) await unlock('meditation_7')
  if (profile?.level >= 10)  await unlock('level_10')
  if (journalCount >= 10)    await unlock('journal_10')

  if (mealR.data?.length && workoutR.data?.length && sleepR.data?.length && moodR.data?.length) {
    await unlock('perfect_day')
  }

  return newlyUnlocked
}
