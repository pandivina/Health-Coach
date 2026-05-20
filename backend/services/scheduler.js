const cron    = require('node-cron')
const webpush = require('web-push')
const { supabaseAdmin } = require('../middleware/auth')

webpush.setVapidDetails(
  'mailto:hola@pandihealthcoach.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

async function push(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (err) {
    // Suscripción caducada → eliminar
    if (err.statusCode === 410 || err.statusCode === 404) {
      await supabaseAdmin.from('push_subscriptions')
        .delete().eq('subscription', subscription)
    }
  }
}

async function getSubs() {
  const { data } = await supabaseAdmin.from('push_subscriptions').select('user_id, subscription')
  return data || []
}

// ─── AGUA: cada 2h de 9:00 a 21:00 ──────────────────────────────────────────
cron.schedule('0 9,11,13,15,17,19,21 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  for (const { user_id, subscription } of await getSubs()) {
    const { data } = await supabaseAdmin.from('hydration_logs')
      .select('glasses,goal').eq('user_id', user_id).eq('date', today).single()
    const glasses = data?.glasses || 0
    const goal    = data?.goal    || 8
    if (glasses < goal) {
      await push(subscription, {
        title: '💧 ¡Hora de hidratarse!',
        body:  `Llevas ${glasses} de ${goal} vasos hoy. Bebe un poco ahora.`,
        url:   '/hydration',
        tag:   'water',
      })
    }
  }
})

// ─── DESAYUNO: 9:00 si no hay comidas ────────────────────────────────────────
cron.schedule('0 9 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  for (const { user_id, subscription } of await getSubs()) {
    const { data } = await supabaseAdmin.from('meal_logs')
      .select('id').eq('user_id', user_id).eq('date', today).limit(1)
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

// ─── MOVIMIENTO: 12:00 y 17:00 si no hay entreno ─────────────────────────────
cron.schedule('0 12,17 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  const hour  = new Date().getHours()
  for (const { user_id, subscription } of await getSubs()) {
    const { data } = await supabaseAdmin.from('workout_sessions')
      .select('id').eq('user_id', user_id).eq('status', 'completed')
      .gte('created_at', today + 'T00:00:00').limit(1)
    if (!data || data.length === 0) {
      await push(subscription, {
        title: hour === 12 ? '🏃 Muévete un poco' : '💪 ¿Entrenamos hoy?',
        body:  hour === 12
          ? 'Un paseo de 10 minutos mejora la energía y el foco.'
          : 'Aún estás a tiempo de hacer algo de actividad hoy.',
        url:   '/workout',
        tag:   'movement',
      })
    }
  }
})

// ─── SUEÑO: 22:30 si no ha registrado sueño ──────────────────────────────────
cron.schedule('30 22 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  for (const { user_id, subscription } of await getSubs()) {
    const { data } = await supabaseAdmin.from('sleep_logs')
      .select('id').eq('user_id', user_id).eq('date', today).single()
    if (!data) {
      await push(subscription, {
        title: '😴 Hora de descansar',
        body:  'Registra tu sueño de hoy. El descanso es parte del progreso.',
        url:   '/sleep',
        tag:   'sleep',
      })
    }
  }
})

console.log('⏰ Scheduler de notificaciones iniciado')
