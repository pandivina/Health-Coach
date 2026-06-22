// ─── lib/achievements.js ──────────────────────────────────────────────────
// Adaptado a la estructura real de la tabla achievements
import { supabase } from './supabase'

// Catálogo — usa trigger_type como identificador único
export const ACHIEVEMENTS = [
  { trigger_type:'first_week',   title:'Primera semana completa',    description:'7 días registrando datos seguidos',             icon:'🗓️', category:'constancia', xp_reward:50,  rarity:'common',   trigger_value:7   },
  { trigger_type:'water_10l',    title:'10 litros acumulados',        description:'Has bebido 10L de agua en total',               icon:'💧', category:'nutricion',  xp_reward:30,  rarity:'common',   trigger_value:10  },
  { trigger_type:'first_500kg',  title:'Primer entreno de 500kg+',    description:'Volumen total superior a 500kg en una sesión',  icon:'🏋️', category:'entreno',    xp_reward:75,  rarity:'rare',     trigger_value:500 },
  { trigger_type:'streak_30',    title:'Racha de hierro',             description:'30 días consecutivos activos',                  icon:'🔥', category:'constancia', xp_reward:150, rarity:'epic',     trigger_value:30  },
  { trigger_type:'meditation_7', title:'Mente en calma',              description:'7 días seguidos meditando',                     icon:'🧘', category:'bienestar',  xp_reward:60,  rarity:'common',   trigger_value:7   },
  { trigger_type:'level_10',     title:'Nivel 10 alcanzado',          description:'Pandi ha evolucionado contigo',                 icon:'⭐', category:'progreso',   xp_reward:100, rarity:'rare',     trigger_value:10  },
  { trigger_type:'perfect_day',  title:'Día perfecto',                description:'Comida, entreno, sueño y ánimo en un mismo día',icon:'🎯', category:'bienestar',  xp_reward:80,  rarity:'rare',     trigger_value:1   },
  { trigger_type:'journal_10',   title:'Diario fiel',                 description:'10 entradas en tu diario emocional',            icon:'📖', category:'bienestar',  xp_reward:40,  rarity:'common',   trigger_value:10  },
]

export async function checkAchievements(userId) {
  if (!userId) return []

  const safe = async (fn) => {
    try { return await fn } catch { return { data: null } }
  }

  try {
    // Logros ya ganados — identificados por trigger_type
    const existingR = await safe(
      supabase.from('achievements')
        .select('trigger_type')
        .eq('user_id', userId)
    )
    const earned = new Set((existingR.data || []).map(a => a.trigger_type))
    const newlyUnlocked = []

    async function unlock(triggerType) {
      if (earned.has(triggerType)) return
      const def = ACHIEVEMENTS.find(a => a.trigger_type === triggerType)
      if (!def) return
      const { error } = await safe(
        supabase.from('achievements').insert({
          user_id:       userId,
          title:         def.title,
          description:   def.description,
          icon:          def.icon,
          category:      def.category,
          xp_reward:     def.xp_reward,
          rarity:        def.rarity,
          trigger_type:  def.trigger_type,
          trigger_value: def.trigger_value,
          earned_at:     new Date().toISOString(),
        })
      )
      if (!error) newlyUnlocked.push(def)
    }

    // Datos necesarios
    const today = new Date().toISOString().split('T')[0]
    const [profileR, waterR, workoutR, journalR, mealR, sleepR, moodR] = await Promise.all([
      safe(supabase.from('user_profiles').select('level,streak,meditation_streak').eq('id', userId).single()),
      safe(supabase.from('hydration_logs').select('glasses').eq('user_id', userId)),
      safe(supabase.from('workout_sessions').select('total_volume_kg').eq('user_id', userId).eq('status','completed')),
      safe(supabase.from('journal_entries').select('id').eq('user_id', userId)),
      safe(supabase.from('meal_logs').select('id').eq('user_id', userId).eq('date', today)),
      safe(supabase.from('sleep_logs').select('id').eq('user_id', userId).eq('date', today)),
      safe(supabase.from('mood_logs').select('id').eq('user_id', userId).eq('date', today)),
    ])

    const profile      = profileR.data
    const totalWater   = (waterR.data || []).reduce((s, w) => s + (w.glasses || 0), 0) * 0.25
    const maxVolume    = Math.max(...(workoutR.data || []).map(w => w.total_volume_kg || 0), 0)
    const journalCount = (journalR.data || []).length

    if (profile?.streak >= 7)             await unlock('first_week')
    if (totalWater >= 10)                 await unlock('water_10l')
    if (maxVolume >= 500)                 await unlock('first_500kg')
    if (profile?.streak >= 30)           await unlock('streak_30')
    if (profile?.meditation_streak >= 7) await unlock('meditation_7')
    if (profile?.level >= 10)            await unlock('level_10')
    if (journalCount >= 10)              await unlock('journal_10')
    if (mealR.data?.length && workoutR.data?.length && sleepR.data?.length && moodR.data?.length) {
      await unlock('perfect_day')
    }

    return newlyUnlocked

  } catch (err) {
    console.warn('[checkAchievements] silenced:', err?.message)
    return []
  }
}
