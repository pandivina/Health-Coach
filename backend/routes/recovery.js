// ─── backend/routes/recovery.js ──────────────────────────────────────────────
const express  = require('express')
const router   = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const { requireAuth, supabaseAdmin } = require('../middleware/auth')
const { calculateRecovery } = require('../lib/recoveryEngine')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST /api/recovery/calculate — calcula y devuelve el score del día
router.post('/calculate', requireAuth, async (req, res) => {
  try {
    const result = await calculateRecovery(req.user.id)
    res.json(result)
  } catch (err) {
    console.error('[recovery/calculate]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/recovery/history — últimos 7 días
router.get('/history', requireAuth, async (req, res) => {
  try {
    const week_ago = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const { data } = await supabaseAdmin
      .from('recovery_logs').select('*')
      .eq('user_id', req.user.id)
      .gte('date', week_ago)
      .order('date', { ascending: true })
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/recovery/rpe — registrar RPE tras un entreno
router.post('/rpe', requireAuth, async (req, res) => {
  try {
    const { rpe, workout_id, notes } = req.body
    if (!rpe || rpe < 1 || rpe > 10) return res.status(400).json({ error: 'RPE entre 1 y 10' })
    await supabaseAdmin.from('rpe_logs').upsert({
      user_id: req.user.id, date: new Date().toISOString().split('T')[0],
      rpe, workout_id, notes,
    }, { onConflict: 'user_id,date' })
    res.json({ ok: true })
    // Recalcular en background
    calculateRecovery(req.user.id).catch(err => console.error('[recovery:rpe]', err.message))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/recovery/ritual — guardar ritual nocturno + generar plan con Coach
router.post('/ritual', requireAuth, async (req, res) => {
  try {
    const { body_feel, mental_state, mental_notes, intentions } = req.body
    const today = new Date().toISOString().split('T')[0]

    // Generar plan con el Coach
    const prompt = `Eres Pandi, coach de salud empático pero firme. El usuario acaba de hacer su ritual nocturno:
- Cuerpo: ${body_feel}/10
- Mente: ${mental_state}/5${mental_notes ? ` — "${mental_notes}"` : ''}
- Intenciones para mañana: ${(intentions || []).join(', ')}

Genera un plan breve para mañana (máx 3 frases) que sea motivador, concreto y basado en lo que acaba de compartir. Sin emojis excesivos.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })
    const coach_plan = response.content[0]?.text || ''

    await supabaseAdmin.from('night_ritual_logs').upsert({
      user_id: req.user.id, date: today,
      body_feel, mental_state, mental_notes, intentions, coach_plan, completed: true,
    }, { onConflict: 'user_id,date' })

    res.json({ ok: true, coach_plan })

    // Recalcular score
    calculateRecovery(req.user.id).catch(err => console.error('[recovery:ritual]', err.message))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
