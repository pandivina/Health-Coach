const express = require('express')
const router  = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const { requireAuth, supabaseAdmin } = require('../middleware/auth')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── GET /api/insights — devuelve insights existentes del usuario ─────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('user_insights')
      .select('*')
      .eq('user_id', req.user.id)
      .order('generated_at', { ascending: false })
      .limit(5)
    res.json(data || [])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── POST /api/insights/generate — analiza datos y genera nuevos insights ─────
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    // Recoger últimos 30 días de datos
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    })

    const safe = fn => fn.catch(() => ({ data: null }))
    const [moodR, sleepR, waterR, workoutR, profileR] = await Promise.all([
      safe(supabaseAdmin.from('mood_logs').select('date,mood').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('sleep_logs').select('date,hours,quality').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('hydration_logs').select('date,glasses,goal').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('workout_sessions').select('created_at').eq('user_id', userId).eq('status','completed').gte('created_at', days[days.length-1]+'T00:00:00')),
      safe(supabaseAdmin.from('user_profiles').select('name,pet_name,motivation_why').eq('id', userId).single()),
    ])

    const moodLogs  = moodR.data    || []
    const sleepLogs = sleepR.data   || []
    const waterLogs = waterR.data   || []
    const workouts  = workoutR.data || []
    const profile   = profileR.data || {}

    // Con menos de 5 días de mood no hay suficientes datos
    if (moodLogs.length < 5) {
      return res.json({
        insights: [],
        message: `Aún estoy aprendiendo tus patrones 🐼 Necesito al menos 5 días de check-in para detectar tendencias. Llevas ${moodLogs.length}.`,
        days_needed: 5 - moodLogs.length,
      })
    }

    // ─── Análisis local de patrones ──────────────────────────────────────────

    const patterns = []

    // 1. Mood por día de la semana
    const moodByDay = {}
    moodLogs.forEach(l => {
      const dow = new Date(l.date + 'T12:00:00').getDay() // 0=Dom, 1=Lun...
      if (!moodByDay[dow]) moodByDay[dow] = []
      moodByDay[dow].push(l.mood)
    })
    const dayNames = ['Domingos','Lunes','Martes','Miércoles','Jueves','Viernes','Sábados']
    let worstDay = null, bestDay = null, worstAvg = 5, bestAvg = 1
    Object.entries(moodByDay).forEach(([dow, moods]) => {
      if (moods.length < 2) return
      const avg = moods.reduce((s,m)=>s+m,0) / moods.length
      if (avg < worstAvg) { worstAvg = avg; worstDay = parseInt(dow) }
      if (avg > bestAvg)  { bestAvg  = avg; bestDay  = parseInt(dow) }
    })
    if (worstDay !== null && worstAvg < 3) {
      patterns.push({
        type: 'mood_weekday',
        title: `Los ${dayNames[worstDay]} son difíciles`,
        body: `Tu ánimo medio los ${dayNames[worstDay].toLowerCase()} es ${worstAvg.toFixed(1)}/5. Normal — Pandi lo tendrá en cuenta.`,
        data: { day: worstDay, avg: worstAvg },
      })
    }
    if (bestDay !== null && bestAvg > 3.5) {
      patterns.push({
        type: 'mood_best_day',
        title: `Los ${dayNames[bestDay]} brillas`,
        body: `Tu mejor ánimo es los ${dayNames[bestDay].toLowerCase()} con una media de ${bestAvg.toFixed(1)}/5. ¿Qué los hace especiales?`,
        data: { day: bestDay, avg: bestAvg },
      })
    }

    // 2. Correlación sueño → mood
    if (sleepLogs.length >= 5 && moodLogs.length >= 5) {
      const goodSleepDays = new Set(sleepLogs.filter(s => s.hours >= 7).map(s => s.date))
      const moodGoodSleep = moodLogs.filter(m => goodSleepDays.has(m.date))
      const moodBadSleep  = moodLogs.filter(m => !goodSleepDays.has(m.date))
      if (moodGoodSleep.length >= 3 && moodBadSleep.length >= 3) {
        const avgGood = moodGoodSleep.reduce((s,m)=>s+m.mood,0) / moodGoodSleep.length
        const avgBad  = moodBadSleep.reduce((s,m)=>s+m.mood,0)  / moodBadSleep.length
        const diff = (avgGood - avgBad).toFixed(1)
        if (parseFloat(diff) >= 0.5) {
          patterns.push({
            type: 'sleep_mood',
            title: 'El sueño cambia tu ánimo',
            body: `Los días que duermes 7h+ tu ánimo es ${diff} puntos más alto. No es casualidad 🌙`,
            data: { good_sleep_mood: avgGood.toFixed(1), bad_sleep_mood: avgBad.toFixed(1), diff },
          })
        }
      }
    }

    // 3. Hidratación
    if (waterLogs.length >= 7) {
      const metaDays   = waterLogs.filter(w => w.glasses >= (w.goal || 8)).length
      const metaPct    = Math.round((metaDays / waterLogs.length) * 100)
      if (metaPct < 40) {
        patterns.push({
          type: 'hydration_low',
          title: 'El agua es tu punto débil',
          body: `Solo alcanzas tu meta de agua el ${metaPct}% de los días. Un vaso más al levantarte puede cambiarlo.`,
          data: { pct: metaPct },
        })
      } else if (metaPct >= 80) {
        patterns.push({
          type: 'hydration_strong',
          title: 'Eres un campeón de la hidratación',
          body: `Alcanzas tu meta de agua el ${metaPct}% de los días. Eso es constancia real 💧`,
          data: { pct: metaPct },
        })
      }
    }

    // 4. Consistencia general
    const activeDays = [...new Set([
      ...moodLogs.map(m => m.date),
      ...sleepLogs.map(s => s.date),
      ...waterLogs.map(w => w.date),
    ])].length
    const consistencyPct = Math.round((activeDays / 30) * 100)
    if (consistencyPct >= 70) {
      patterns.push({
        type: 'consistency',
        title: 'Tu constancia es tu superpoder',
        body: `Has estado activo el ${consistencyPct}% de los últimos 30 días. Eso es lo que marca la diferencia a largo plazo.`,
        data: { pct: consistencyPct },
      })
    }

    // ─── Generar mensaje personalizado con IA ────────────────────────────────
    let pandiBrief = ''
    if (patterns.length > 0) {
      const aiRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Eres Pandi, mascota de una app de salud. El usuario ${profile.name || ''} tiene estos patrones detectados: ${patterns.map(p=>p.title).join(', ')}. 
Escribe UN mensaje muy corto (1 frase, máx 20 palabras) como si acabaras de descubrir algo sobre él. Tono: cálido, cercano, específico. Solo el texto, sin comillas.`,
        }],
      })
      pandiBrief = aiRes.content[0].text.trim()
    }

    // ─── Guardar insights en Supabase ────────────────────────────────────────
    if (patterns.length > 0) {
      // Borrar insights anteriores del mismo tipo para no duplicar
      await supabaseAdmin.from('user_insights')
        .delete().eq('user_id', userId)
      await supabaseAdmin.from('user_insights').insert(
        patterns.map(p => ({
          user_id:      userId,
          insight_type: p.type,
          title:        p.title,
          body:         p.body,
          data:         p.data,
        }))
      )
    }

    res.json({
      insights:    patterns,
      pandi_brief: pandiBrief,
      data_days:   moodLogs.length,
      message:     patterns.length === 0
        ? 'Aún no tengo suficientes patrones claros. Sigue registrando 🐼'
        : null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PATCH /api/insights/:id/seen ────────────────────────────────────────────
router.patch('/:id/seen', requireAuth, async (req, res) => {
  try {
    await supabaseAdmin.from('user_insights')
      .update({ seen: true }).eq('id', req.params.id).eq('user_id', req.user.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
