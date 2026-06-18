// ─── lib/meditationStreak.js ──────────────────────────────────────────────
// Gestión de racha de meditación independiente + desbloqueo de accesorios

import { supabase } from './supabase'

// Accesorios desbloqueables por racha de meditación
export const MEDITATION_ACCESSORIES = [
  { id: 'flower_crown', streakRequired: 3,  name: 'Corona de flores', emoji: '🌸' },
  { id: 'zen_cushion',  streakRequired: 7,  name: 'Cojín zen',        emoji: '🧘' },
  { id: 'incense',      streakRequired: 14, name: 'Incienso',         emoji: '🕯️' },
  { id: 'golden_aura',  streakRequired: 30, name: 'Aura dorada',      emoji: '✨' },
]

// Llamar al completar una sesión de meditación
export async function registerMeditationSession(userId) {
  if (!userId) return { streak: 0, newAccessory: null }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('meditation_streak, meditation_last_date, meditation_best_streak')
      .eq('id', userId).single()

    if (!profile) return { streak: 0, newAccessory: null }

    // Ya meditó hoy — no duplicar el incremento
    if (profile.meditation_last_date === today) {
      return { streak: profile.meditation_streak, newAccessory: null }
    }

    const continuesStreak = profile.meditation_last_date === yesterday
    const newStreak = continuesStreak ? (profile.meditation_streak || 0) + 1 : 1
    const newBest = Math.max(newStreak, profile.meditation_best_streak || 0)

    await supabase.from('user_profiles').update({
      meditation_streak: newStreak,
      meditation_last_date: today,
      meditation_best_streak: newBest,
    }).eq('id', userId)

    // Comprobar si desbloquea un accesorio nuevo
    const accessory = MEDITATION_ACCESSORIES.find(a => a.streakRequired === newStreak)
    let newAccessory = null

    if (accessory) {
      const { data: existing } = await supabase
        .from('pet_accessories').select('id')
        .eq('user_id', userId).eq('accessory_id', accessory.id).maybeSingle()

      if (!existing) {
        await supabase.from('pet_accessories').insert({
          user_id: userId, accessory_id: accessory.id,
        })
        newAccessory = accessory
      }
    }

    return { streak: newStreak, newAccessory }
  } catch (err) {
    console.error('registerMeditationSession error:', err.message)
    return { streak: 0, newAccessory: null }
  }
}

export async function getMeditationStreak(userId) {
  if (!userId) return 0
  try {
    const { data } = await supabase
      .from('user_profiles').select('meditation_streak, meditation_last_date')
      .eq('id', userId).single()

    if (!data) return 0

    // Si la última meditación fue antes de ayer, la racha visual ya se rompió
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (data.meditation_last_date !== today && data.meditation_last_date !== yesterday) {
      return 0
    }
    return data.meditation_streak || 0
  } catch {
    return 0
  }
}
