const express = require('express');
const router = express.Router();
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

// Definición de todos los logros
const ACHIEVEMENTS = [
  // Nutrición
  { id: 'first_meal',       title: 'Primera comida',        icon: '🍎', description: 'Registraste tu primera comida',            xp: 50  },
  { id: 'calorie_goal',     title: 'Objetivo calórico',     icon: '🎯', description: 'Alcanzaste tu objetivo calórico del día',   xp: 30  },
  { id: 'protein_goal',     title: 'Rey de la proteína',    icon: '💪', description: 'Alcanzaste tu objetivo de proteína',        xp: 30  },
  { id: 'week_nutrition',   title: 'Semana perfecta',       icon: '📅', description: 'Registraste comidas 7 días seguidos',       xp: 100 },
  { id: 'photo_analysis',   title: 'Fotógrafo nutricional', icon: '📸', description: 'Analizaste una comida con la cámara',       xp: 25  },

  // Entrenamiento
  { id: 'first_workout',    title: 'Primer entreno',        icon: '🏋️', description: 'Completaste tu primer entrenamiento',       xp: 75  },
  { id: 'workout_streak_3', title: 'Racha de 3',            icon: '🔥', description: 'Entrena 3 días consecutivos',               xp: 100 },
  { id: 'workout_streak_7', title: 'Semana activa',         icon: '⚡', description: 'Entrena 7 días consecutivos',               xp: 200 },
  { id: 'first_pr',         title: 'Nuevo récord',          icon: '🏆', description: 'Batiste tu primer récord personal',         xp: 150 },
  { id: '10_workouts',      title: 'Veterano',              icon: '🎖️', description: 'Completaste 10 entrenamientos',             xp: 200 },

  // Sueño
  { id: 'first_sleep',      title: 'Dulces sueños',         icon: '🌙', description: 'Registraste tu primera noche de sueño',    xp: 20  },
  { id: 'sleep_goal',       title: 'Descanso perfecto',     icon: '⭐', description: 'Dormiste 7+ horas con calidad 4+',          xp: 50  },
  { id: 'sleep_week',       title: 'Buen dormidor',         icon: '💤', description: 'Registraste sueño 7 días seguidos',         xp: 100 },

  // Hidratación
  { id: 'hydration_goal',   title: 'Bien hidratado',        icon: '💧', description: 'Alcanzaste tu meta de hidratación',         xp: 20  },
  { id: 'hydration_week',   title: 'Acuático',              icon: '🌊', description: 'Meta de hidratación 7 días seguidos',       xp: 100 },

  // Salud general
  { id: 'first_weight',     title: 'Primer pesaje',         icon: '⚖️', description: 'Registraste tu primer peso',                xp: 25  },
  { id: 'weight_loss_1',    title: 'Primer kilo',           icon: '📉', description: 'Perdiste tu primer kilo',                   xp: 150 },
  { id: 'first_lab',        title: 'Analítica subida',      icon: '🔬', description: 'Subiste tu primera analítica',              xp: 100 },

  // Racha general
  { id: 'streak_7',         title: 'Una semana',            icon: '📆', description: '7 días consecutivos usando la app',         xp: 150 },
  { id: 'streak_30',        title: 'Un mes',                icon: '🌟', description: '30 días consecutivos usando la app',        xp: 500 },

  // Antitabaco
  { id: 'no_smoking_1',     title: 'Un día sin fumar',      icon: '🚭', description: 'Primer día sin fumar',                     xp: 100 },
  { id: 'no_smoking_7',     title: 'Una semana libre',      icon: '🌿', description: 'Una semana sin fumar',                     xp: 300 },
  { id: 'no_smoking_30',    title: 'Un mes libre',          icon: '🏅', description: 'Un mes sin fumar',                         xp: 1000 },
]

const ACCESSORIES = [
  { id: 'birrete',    icon: '🎓', name: 'Birrete',       trigger: 'onboarding_done',    desc: 'Completaste el onboarding'         },
  { id: 'mancuerna',  icon: '🏋️', name: 'Mancuerna',     trigger: 'workout_10',         desc: '10 entrenamientos completados'     },
  { id: 'delantal',   icon: '🥗', name: 'Delantal',      trigger: 'nutrition_30',       desc: '30 días de nutrición registrada'   },
  { id: 'cojin',      icon: '🧘', name: 'Cojín zen',     trigger: 'meditation_20',      desc: '20 sesiones de meditación'         },
  { id: 'botella',    icon: '💧', name: 'Botella',       trigger: 'hydration_7',        desc: 'Meta de agua 7 días seguidos'      },
  { id: 'luna',       icon: '🌙', name: 'Gorro de luna', trigger: 'sleep_14',           desc: 'Sueño registrado 14 días seguidos' },
  { id: 'collar',     icon: '❤️', name: 'Collar',        trigger: 'streak_60',          desc: '60 días de racha'                  },
  { id: 'corona',     icon: '👑', name: 'Corona',        trigger: 'level_10',           desc: 'Alcanzaste el nivel 10'            },
]

async function unlockAccessory(userId, accessoryId) {
  try {
    await supabaseAdmin.from('panda_accessories')
      .upsert({ user_id: userId, accessory_id: accessoryId }, { onConflict: 'user_id,accessory_id' })
  } catch {}
}

// POST /api/achievements/check — verificar y otorgar logros
router.post('/check', requireAuth, async (req, res) => {
  try {
    const { trigger } = req.body // tipo de acción que dispara la verificación
    const userId = req.user.id

    // Logros ya obtenidos
    const { data: existing } = await supabaseAdmin.from('achievements')
      .select('title').eq('user_id', userId)
    const existingTitles = new Set((existing || []).map(a => a.title))

    const newAchievements = []

    // Verificar según el trigger
    if (trigger === 'meal_logged') {
      const { count } = await supabaseAdmin.from('meal_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      if (count >= 1 && !existingTitles.has('Primera comida')) {
        newAchievements.push('first_meal')
      }
    }

    if (trigger === 'workout_completed') {
      const { count } = await supabaseAdmin.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed')
      if (count >= 1 && !existingTitles.has('Primer entreno')) newAchievements.push('first_workout')
      if (count >= 10 && !existingTitles.has('Veterano')) newAchievements.push('10_workouts')
    }

    if (trigger === 'pr_set') {
      if (!existingTitles.has('Nuevo récord')) newAchievements.push('first_pr')
    }

    if (trigger === 'sleep_logged') {
      const { data: sleep } = await supabaseAdmin.from('sleep_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(1).single()
      if (sleep && !existingTitles.has('Dulces sueños')) newAchievements.push('first_sleep')
      if (sleep?.hours >= 7 && sleep?.quality >= 4 && !existingTitles.has('Descanso perfecto')) newAchievements.push('sleep_goal')
    }

    if (trigger === 'hydration_goal') {
      if (!existingTitles.has('Bien hidratado')) newAchievements.push('hydration_goal')
    }

    if (trigger === 'weight_logged') {
      if (!existingTitles.has('Primer pesaje')) newAchievements.push('first_weight')
    }

    if (trigger === 'lab_uploaded') {
      if (!existingTitles.has('Analítica subida')) newAchievements.push('first_lab')
    }

    if (trigger === 'photo_analyzed') {
      if (!existingTitles.has('Fotógrafo nutricional')) newAchievements.push('photo_analysis')
    }

    if (trigger === 'quit_smoking') {
      const { data: log } = await supabaseAdmin.from('smoking_logs').select('quit_date').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single()
      if (log?.quit_date) {
        const days = Math.floor((new Date() - new Date(log.quit_date)) / 86400000)
        if (days >= 1 && !existingTitles.has('Un día sin fumar')) newAchievements.push('no_smoking_1')
        if (days >= 7 && !existingTitles.has('Una semana libre')) newAchievements.push('no_smoking_7')
        if (days >= 30 && !existingTitles.has('Un mes libre')) newAchievements.push('no_smoking_30')
      }
    }

    // Insertar logros nuevos y sumar XP
    const earned = []
    for (const id of newAchievements) {
      const achievement = ACHIEVEMENTS.find(a => a.id === id)
      if (!achievement) continue
      await supabaseAdmin.from('achievements').insert({
        user_id: userId,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
      })
      // Sumar XP
      const { data: prof } = await supabaseAdmin.from('user_profiles').select('xp').eq('id', userId).single()
      const newXP = (prof?.xp || 0) + achievement.xp
      const newLevel = Math.floor(newXP / 500) + 1
      await supabaseAdmin.from('user_profiles').update({ xp: newXP, level: newLevel }).eq('id', userId)
      earned.push({ ...achievement })
    }

    res.json({ earned, count: earned.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/achievements
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('achievements')
      .select('*').eq('user_id', req.user.id).order('earned_at', { ascending: false })
    if (error) throw error
    res.json({ earned: data, all: ACHIEVEMENTS })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
