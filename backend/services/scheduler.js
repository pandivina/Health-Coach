const cron    = require('node-cron')
const webpush = require('web-push')
const { supabaseAdmin } = require('../middleware/auth')

webpush.setVapidDetails(
  'mailto:hola@pandihealthcoach.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function push(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await supabaseAdmin.from('push_subscriptions')
        .delete().eq('subscription', subscription)
    }
  }
}

async function getSubs() {
  const { data } = await supabaseAdmin
    .from('push_subscriptions').select('user_id, subscription')
  return data || []
}

// Comprueba si el usuario está en Modo Cuidado
// (3+ días consecutivos con mood ≤ 2)
async function isInCareMode(userId) {
  const days = [0, 1, 2].map(i => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })
  const { data } = await supabaseAdmin
    .from('mood_logs')
    .select('mood, date')
    .eq('user_id', userId)
    .in('date', days)
  if (!data || data.length < 3) return false
  return days.every(day => {
    const log = data.find(l => l.date === day)
    return log && log.mood <= 2
  })
}

// ─── MODO CUIDADO: detección diaria 9:00 Madrid (7:00 UTC) ───────────────────
// Detecta usuarios en Modo Cuidado y les envía un mensaje de apoyo

cron.schedule('0 7 * * *', async () => {
  const subs = await getSubs()
  for (const { user_id, subscription } of subs) {
    const careMode = await isInCareMode(user_id)
    if (careMode) {
      // Actualizar flag en user_profiles
      await supabaseAdmin
        .from('user_profiles')
        .update({ care_mode: true })
        .eq('id', user_id)

      await push(subscription, {
        title: '🤍 Pandi está aquí contigo',
        body:  'Esta semana no es para batir récords. Es para estar. ¿Bebiste agua hoy?',
        url:   '/mood',
        tag:   'care',
      })
    } else {
      // Salir del Modo Cuidado si mejora
      await supabaseAdmin
        .from('user_profiles')
        .update({ care_mode: false })
        .eq('id', user_id)
    }
  }
})

// ─── AGUA: cada 2h de 9:00 a 21:00 Madrid (7:00-19:00 UTC) ──────────────────

cron.schedule('0 7,9,11,13,15,17,19 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  for (const { user_id, subscription } of await getSubs()) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('care_mode').eq('id', user_id).single()

    const { data } = await supabaseAdmin
      .from('hydration_logs')
      .select('glasses,goal').eq('user_id', user_id).eq('date', today).single()

    const glasses = data?.glasses || 0
    const goal    = data?.goal    || 8
    if (glasses >= goal) continue

    // En Modo Cuidado: mensaje más suave, solo 1 vez al día (primera hora)
    if (profile?.care_mode) {
      const hour = new Date().getUTCHours()
      if (hour !== 7) continue // Solo la notificación de las 9:00 Madrid
      await push(subscription, {
        title: '💧 Un vasito de agua',
        body:  'Solo eso. Sin presión 🤍',
        url:   '/hydration',
        tag:   'water',
      })
    } else {
      await push(subscription, {
        title: '💧 ¡Hora de hidratarse!',
        body:  `Llevas ${glasses} de ${goal} vasos. Bebe un poco ahora.`,
        url:   '/hydration',
        tag:   'water',
      })
    }
  }
})

// ─── DESAYUNO: 9:00 Madrid (7:00 UTC) ────────────────────────────────────────
// Skip en Modo Cuidado

cron.schedule('0 7 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  for (const { user_id, subscription } of await getSubs()) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('care_mode').eq('id', user_id).single()
    if (profile?.care_mode) continue // En Modo Cuidado no presionamos

    const { data } = await supabaseAdmin
      .from('meal_logs').select('id')
      .eq('user_id', user_id).eq('date', today).limit(1)
    if (!data || data.length === 0) {
      await push(subscription, {
        title: '🍳 ¡Buenos días!',
        body:  'No olvides registrar tu desayuno. Empieza con proteína.',
        url:   '/nutrition',
        tag:   'breakfast',
      })
    }
  }
})

// ─── MOVIMIENTO: 12:00 y 17:00 Madrid (10:00 y 15:00 UTC) ───────────────────
// Skip en Modo Cuidado

cron.schedule('0 10,15 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  const utcH  = new Date().getUTCHours()
  const madridH = utcH + 2 // Aproximación España — ajustar en horario de invierno

  for (const { user_id, subscription } of await getSubs()) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('care_mode').eq('id', user_id).single()
    if (profile?.care_mode) continue // En Modo Cuidado no presionamos

    const { data } = await supabaseAdmin
      .from('workout_sessions').select('id')
      .eq('user_id', user_id).eq('status', 'completed')
      .gte('created_at', today + 'T00:00:00').limit(1)

    if (!data || data.length === 0) {
      await push(subscription, {
        title: madridH <= 12 ? '🏃 Muévete un poco' : '💪 ¿Entrenamos hoy?',
        body:  madridH <= 12
          ? 'Un paseo de 10 minutos mejora la energía y el foco.'
          : 'Aún estás a tiempo de hacer algo de actividad hoy.',
        url:   '/workout',
        tag:   'movement',
      })
    }
  }
})

// ─── SUEÑO: 22:30 Madrid (20:30 UTC) ────────────────────────────────────────

cron.schedule('30 20 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  for (const { user_id, subscription } of await getSubs()) {
    const { data } = await supabaseAdmin
      .from('sleep_logs').select('id')
      .eq('user_id', user_id).eq('date', today).single()

    if (!data) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles').select('care_mode').eq('id', user_id).single()

      await push(subscription, {
        title: profile?.care_mode ? '🌙 Descansa bien esta noche' : '😴 Hora de descansar',
        body:  profile?.care_mode
          ? 'El descanso es lo más importante ahora mismo. Buenas noches 🤍'
          : 'Registra tu sueño de hoy. El descanso es parte del progreso.',
        url:   '/sleep',
        tag:   'sleep',
      })
    }
  }
})

// ─── SALIDA DE MODO CUIDADO ───────────────────────────────────────────────────
// Si el usuario lleva 2 días con mood ≥ 3, sale del Modo Cuidado con mensaje

cron.schedule('0 8 * * *', async () => {
  const subs = await getSubs()
  for (const { user_id, subscription } of subs) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('care_mode').eq('id', user_id).single()
    if (!profile?.care_mode) continue

    const days = [0, 1].map(i => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    })
    const { data: logs } = await supabaseAdmin
      .from('mood_logs').select('mood, date')
      .eq('user_id', user_id).in('date', days)

    const recovering = days.every(day => {
      const log = logs?.find(l => l.date === day)
      return log && log.mood >= 3
    })

    if (recovering) {
      await supabaseAdmin
        .from('user_profiles').update({ care_mode: false }).eq('id', user_id)
      await push(subscription, {
        title: '☀️ Pandi lo nota',
        body:  'Parece que el día está mejor. Me alegra verte así 🐼',
        url:   '/mood',
        tag:   'recovery',
      })
    }
  }
})

console.log('⏰ Scheduler de notificaciones iniciado (UTC+2 Madrid)')
