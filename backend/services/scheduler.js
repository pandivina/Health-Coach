const cron    = require('node-cron')
const webpush = require('web-push')
const { supabaseAdmin } = require('../middleware/auth')
const Anthropic = require('@anthropic-ai/sdk')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

async function isInCareMode(userId) {
  const days = [0, 1, 2].map(i => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })
  const { data } = await supabaseAdmin
    .from('mood_logs').select('mood, date')
    .eq('user_id', userId).in('date', days)
  if (!data || data.length < 3) return false
  return days.every(day => {
    const log = data.find(l => l.date === day)
    return log && log.mood <= 2
  })
}

// ─── MOTOR DE DECISIÓN DIARIO (importado desde coach.js) ─────────────────────
// Duplicamos las funciones aquí para no crear dependencia circular entre routes

async function evaluarDia(userId) {
  const today = new Date().toISOString().split('T')[0]
  const safe  = async fn => { try { return await fn } catch { return { data: null } } }

  const [profileRes, goalsRes, mealsRes, sleepRes, moodRes, workoutRes, waterRes] = await Promise.all([
    safe(supabaseAdmin.from('user_profiles').select('name,level,streak,xp').eq('id', userId).single()),
    safe(supabaseAdmin.from('nutrition_goals').select('calories,protein_g').eq('user_id', userId).maybeSingle()),
    safe(supabaseAdmin.from('meal_logs').select('calories,protein_g').eq('user_id', userId).eq('date', today)),
    safe(supabaseAdmin.from('sleep_logs').select('hours,quality').eq('user_id', userId).eq('date', today).maybeSingle()),
    safe(supabaseAdmin.from('mood_logs').select('mood').eq('user_id', userId).eq('date', today).maybeSingle()),
    safe(supabaseAdmin.from('workout_sessions').select('id').eq('user_id', userId).eq('status', 'completed').gte('created_at', today + 'T00:00:00').limit(1)),
    safe(supabaseAdmin.from('hydration_logs').select('glasses,goal').eq('user_id', userId).eq('date', today).maybeSingle()),
  ])

  const profile = profileRes.data  || {}
  const goals   = goalsRes.data    || { calories: 2000, protein_g: 150 }
  const meals   = mealsRes.data    || []
  const sleep   = sleepRes.data    || null
  const mood    = moodRes.data     || null
  const workout = workoutRes.data  || []
  const water   = waterRes.data    || null

  const caloriesConsumed = meals.reduce((s, m) => s + (m.calories || 0), 0)
  const proteinConsumed  = meals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const waterGlasses     = water?.glasses || 0
  const waterGoal        = water?.goal    || 8

  const scores = {
    nutricion:   goals.calories   > 0 ? Math.min(caloriesConsumed / goals.calories, 1.2) : 0,
    proteina:    goals.protein_g  > 0 ? Math.min(proteinConsumed / goals.protein_g, 1)   : 0,
    hidratacion: waterGoal        > 0 ? Math.min(waterGlasses / waterGoal, 1)             : 0,
    sueno:       sleep?.hours     ? Math.min(sleep.hours / 7, 1)                          : 0,
    animo:       mood?.mood       ? mood.mood / 5                                          : 0,
    entreno:     workout.length   > 0 ? 1 : 0,
  }

  const media  = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
  const estado = media > 0.7 ? 'GREEN' : media > 0.4 ? 'YELLOW' : 'RED'

  const puntosFuertes     = Object.entries(scores).filter(([, v]) => v >= 0.75).map(([k]) => k)
  const puntosDebiles     = Object.entries(scores).filter(([, v]) => v < 0.4).map(([k]) => k)

  return {
    userId, fecha: today, perfil: profile, scores,
    media: Math.round(media * 100) / 100,
    estado, puntosFuertes, puntosDebiles,
    detalle: { caloriesConsumed, proteinConsumed, waterGlasses, sleepHours: sleep?.hours, mood: mood?.mood, workoutDone: workout.length > 0 },
  }
}

async function generarPlanManana(evaluacion) {
  const { userId, perfil, estado, puntosFuertes, puntosDebiles, detalle } = evaluacion

  const prompt = `Eres Pandi, el coach de salud de ${perfil.name || 'el usuario'}.
Analiza el día de hoy y genera un plan de mañana concreto y motivador.

RESUMEN DEL DÍA:
- Estado general: ${estado} (puntuación: ${Math.round(evaluacion.media * 100)}%)
- Nutrición: ${Math.round(detalle.caloriesConsumed)} kcal
- Hidratación: ${detalle.waterGlasses} vasos
- Sueño: ${detalle.sleepHours ? detalle.sleepHours + 'h' : 'no registrado'}
- Ánimo: ${detalle.mood ? detalle.mood + '/5' : 'no registrado'}
- Entreno: ${detalle.workoutDone ? 'completado ✅' : 'no realizado'}
- Puntos fuertes: ${puntosFuertes.join(', ') || 'ninguno'}
- A mejorar: ${puntosDebiles.join(', ') || 'ninguno'}

Genera SOLO este JSON (sin texto extra):
{
  "mensaje_noche": "Mensaje corto y cálido para esta noche (máx 2 frases)",
  "prioridades": ["tarea concreta 1", "tarea concreta 2", "tarea concreta 3"],
  "foco_principal": "nutricion|hidratacion|sueno|entreno|animo",
  "objetivo_calorico": número,
  "mensaje_manana": "Mensaje motivador para mañana por la mañana (máx 2 frases)"
}`

  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const clean = response.content[0].text.trim().replace(/```json|```/g, '').trim()
    const plan  = JSON.parse(clean)

    await supabaseAdmin.from('coach_memory').upsert({
      user_id:        userId,
      tomorrow_plan:  plan,
      last_plan_date: evaluacion.fecha,
      day_score:      evaluacion.media,
      day_state:      evaluacion.estado,
      last_updated:   new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return plan
  } catch (err) {
    console.error('generarPlanManana error:', err.message)
    return {
      mensaje_noche:    'Descansa bien esta noche. Mañana seguimos.',
      prioridades:      ['Registrar nutrición', 'Beber 8 vasos de agua', '10 minutos de movimiento'],
      foco_principal:   puntosDebiles[0] || 'hidratacion',
      objetivo_calorico: 2000,
      mensaje_manana:   'Buenos días. Un día más, un paso más.',
    }
  }
}

// ─── MODO CUIDADO: 9:00 Madrid (7:00 UTC) ────────────────────────────────────

cron.schedule('0 7 * * *', async () => {
  const subs = await getSubs()
  for (const { user_id, subscription } of subs) {
    const careMode = await isInCareMode(user_id)
    if (careMode) {
      await supabaseAdmin.from('user_profiles').update({ care_mode: true }).eq('id', user_id)
      await push(subscription, {
        title: '🤍 Pandi está aquí contigo',
        body:  'Esta semana no es para batir récords. Es para estar. ¿Bebiste agua hoy?',
        url:   '/mood', tag: 'care',
      })
    } else {
      await supabaseAdmin.from('user_profiles').update({ care_mode: false }).eq('id', user_id)
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
      .from('hydration_logs').select('glasses,goal').eq('user_id', user_id).eq('date', today).single()
    const glasses = data?.glasses || 0
    const goal    = data?.goal    || 8
    if (glasses >= goal) continue

    if (profile?.care_mode) {
      const hour = new Date().getUTCHours()
      if (hour !== 7) continue
      await push(subscription, {
        title: '💧 Un vasito de agua', body: 'Solo eso. Sin presión 🤍',
        url: '/hydration', tag: 'water',
      })
    } else {
      await push(subscription, {
        title: '💧 ¡Hora de hidratarse!',
        body:  `Llevas ${glasses} de ${goal} vasos. Bebe un poco ahora.`,
        url: '/hydration', tag: 'water',
      })
    }
  }
})

// ─── DESAYUNO: 9:00 Madrid (7:00 UTC) ────────────────────────────────────────

cron.schedule('0 7 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  for (const { user_id, subscription } of await getSubs()) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('care_mode').eq('id', user_id).single()
    if (profile?.care_mode) continue

    const { data } = await supabaseAdmin
      .from('meal_logs').select('id').eq('user_id', user_id).eq('date', today).limit(1)
    if (!data || data.length === 0) {
      await push(subscription, {
        title: '🍳 ¡Buenos días!',
        body:  'No olvides registrar tu desayuno. Empieza con proteína.',
        url: '/nutrition', tag: 'breakfast',
      })
    }
  }
})

// ─── MOVIMIENTO: 12:00 y 17:00 Madrid (10:00 y 15:00 UTC) ───────────────────

cron.schedule('0 10,15 * * *', async () => {
  const today  = new Date().toISOString().split('T')[0]
  const utcH   = new Date().getUTCHours()
  const madridH = utcH + 2

  for (const { user_id, subscription } of await getSubs()) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('care_mode').eq('id', user_id).single()
    if (profile?.care_mode) continue

    const { data } = await supabaseAdmin
      .from('workout_sessions').select('id').eq('user_id', user_id).eq('status', 'completed')
      .gte('created_at', today + 'T00:00:00').limit(1)

    if (!data || data.length === 0) {
      await push(subscription, {
        title: madridH <= 12 ? '🏃 Muévete un poco' : '💪 ¿Entrenamos hoy?',
        body:  madridH <= 12
          ? 'Un paseo de 10 minutos mejora la energía y el foco.'
          : 'Aún estás a tiempo de hacer algo de actividad hoy.',
        url: '/workout', tag: 'movement',
      })
    }
  }
})

// ─── SUEÑO: 22:30 Madrid (20:30 UTC) ─────────────────────────────────────────

cron.schedule('30 20 * * *', async () => {
  const today = new Date().toISOString().split('T')[0]
  for (const { user_id, subscription } of await getSubs()) {
    const { data } = await supabaseAdmin
      .from('sleep_logs').select('id').eq('user_id', user_id).eq('date', today).single()
    if (!data) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles').select('care_mode').eq('id', user_id).single()
      await push(subscription, {
        title: profile?.care_mode ? '🌙 Descansa bien esta noche' : '😴 Hora de descansar',
        body:  profile?.care_mode
          ? 'El descanso es lo más importante ahora mismo. Buenas noches 🤍'
          : 'Registra tu sueño de hoy. El descanso es parte del progreso.',
        url: '/sleep', tag: 'sleep',
      })
    }
  }
})

// ─── REVISIÓN DIARIA: 22:00 Madrid (20:00 UTC) ───────────────────────────────
// Evalúa el día de cada usuario, genera el plan de mañana y envía notificación

cron.schedule('0 20 * * *', async () => {
  console.log('⏰ Revisión diaria iniciada —', new Date().toISOString())
  const subs = await getSubs()

  for (const { user_id, subscription } of subs) {
    try {
      // 1. Evaluar el día
      const evaluacion = await evaluarDia(user_id)

      // 2. Generar plan de mañana con Claude
      const plan = await generarPlanManana(evaluacion)

      // 3. Push notification con el mensaje de noche + deep link al plan
      await push(subscription, {
        title: '🌙 Tu resumen de hoy está listo',
        body:  plan.mensaje_noche || 'Pandi ha analizado tu día. Mira tu plan de mañana.',
        url:   '/mood',   // Deep link → abre el módulo de bienestar
        tag:   'daily-review',
        data:  {
          estado:    evaluacion.estado,
          prioridades: plan.prioridades,
        },
      })

      console.log(`✅ Plan generado para ${user_id} — estado: ${evaluacion.estado}`)
    } catch (err) {
      console.error(`❌ Error revisión diaria para ${user_id}:`, err.message)
    }
  }

  console.log('✅ Revisión diaria completada')
})

// ─── PLAN DE MAÑANA: 8:00 Madrid (6:00 UTC) ──────────────────────────────────
// Envía las 3 prioridades del día al despertar

cron.schedule('0 6 * * *', async () => {
  const subs = await getSubs()
  for (const { user_id, subscription } of subs) {
    try {
      const { data } = await supabaseAdmin
        .from('coach_memory')
        .select('tomorrow_plan, day_state')
        .eq('user_id', user_id)
        .maybeSingle()

      if (!data?.tomorrow_plan) continue

      const plan  = data.tomorrow_plan
      const emoji = data.day_state === 'GREEN' ? '🌟' : data.day_state === 'YELLOW' ? '⚡' : '🤍'

      await push(subscription, {
        title: `${emoji} Buenos días — Tu plan de hoy`,
        body:  plan.prioridades?.slice(0, 2).join(' · ') || plan.mensaje_manana,
        url:   '/home',
        tag:   'morning-plan',
      })
    } catch (err) {
      console.error(`❌ Error plan mañana para ${user_id}:`, err.message)
    }
  }
})

// ─── SALIDA DE MODO CUIDADO: 8:00 Madrid (6:00 UTC) ─────────────────────────

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
      .from('mood_logs').select('mood, date').eq('user_id', user_id).in('date', days)

    const recovering = days.every(day => {
      const log = logs?.find(l => l.date === day)
      return log && log.mood >= 3
    })

    if (recovering) {
      await supabaseAdmin.from('user_profiles').update({ care_mode: false }).eq('id', user_id)
      await push(subscription, {
        title: '☀️ Pandi lo nota',
        body:  'Parece que el día está mejor. Me alegra verte así 🐼',
        url: '/mood', tag: 'recovery',
      })
    }
  }
})

console.log('⏰ Scheduler de notificaciones iniciado (UTC+2 Madrid)')
