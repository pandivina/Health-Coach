// ─── routes/coach.js ──────────────────────────────────────────────────────────
// Coach IA con consciencia de pantalla y memoria persistente

const express   = require('express')
const router    = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const { requireAuth, supabaseAdmin } = require('../middleware/auth')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL     = 'claude-sonnet-4-6'
const MAX_TOKENS = 600

// ─── LÍMITE DIARIO ────────────────────────────────────────────────────────────
const DAILY_LIMIT_FREE = 10

async function checkLimit(userId) {
  const today = new Date().toISOString().split('T')[0]
  const { data: sub } = await supabaseAdmin
    .from('subscriptions').select('status').eq('user_id', userId).maybeSingle()
  if (sub?.status === 'active') return { allowed: true }

  const { count } = await supabaseAdmin
    .from('coach_messages_log')
    .select('id', { count: 'exact' })
    .eq('user_id', userId).eq('date', today)
  return { allowed: (count || 0) < DAILY_LIMIT_FREE, count: count || 0 }
}

// ─── CONSTRUIR SYSTEM PROMPT CON CONTEXTO ────────────────────────────────────
function buildSystemPrompt(ctx, memory) {
  const name = ctx.userName || 'amigo/a'

  // Datos del día
  const calStr  = ctx.caloriesConsumed != null
    ? `${ctx.caloriesConsumed}/${ctx.caloriesGoal || 2000} kcal`
    : 'sin registrar'
  const protStr = ctx.proteinConsumed != null
    ? `${ctx.proteinConsumed}g/${ctx.proteinGoal || 150}g`
    : 'sin registrar'
  const waterStr = `${ctx.waterGlasses || 0}/${ctx.waterGoal || 8} vasos`
  const sleepStr = ctx.sleepHours
    ? `${ctx.sleepHours}h (calidad ${ctx.sleepQuality || '?'}/5)`
    : 'no registrado'
  const moodStr  = ctx.moodToday != null
    ? `${ctx.moodToday}/5`
    : 'no registrado'
  const workoutStr = ctx.workedOutToday
    ? `Sí — ${ctx.workoutName || 'sesión completada'}`
    : 'No'

  // Tono según módulo activo
  const TONE_BY_MODULE = {
    nutrition:  'Enfócate en nutrición. Sé específico con macros, comidas y hábitos alimentarios.',
    workout:    'Enfócate en entrenamiento. Motiva, da consejos técnicos y celebra los logros.',
    sleep:      'Enfócate en el descanso. Sé tranquilo, relajante y empático.',
    mood:       'Enfócate en bienestar emocional. Sé empático, cálido y usa técnicas CBT sutiles.',
    hydration:  'Enfócate en hidratación. Sé ligero y animado.',
    home:       'Visión general del día. Da una perspectiva holística.',
    coach:      'Conversación libre de salud. Adapta el tono al contenido del mensaje.',
  }
  const tone = TONE_BY_MODULE[ctx.activeModule] || TONE_BY_MODULE.coach

  // Semáforo de recuperación
  const RECOVERY_LABEL = { GREEN:'Verde (bueno)', YELLOW:'Amarillo (moderado)', RED:'Rojo (bajo)' }

  // Memoria persistente relevante
  const memorySection = memory.length > 0
    ? `\n## Lo que recuerdo de ${name}:\n${memory.map(m => `- ${m.content}`).join('\n')}`
    : ''

  return `Eres Pandi, el coach personal de salud de ${name}. Eres cercano, empático, directo y basas tus respuestas en datos reales.

## Datos de hoy (${new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}):
- Calorías: ${calStr}
- Proteína: ${protStr}
- Agua: ${waterStr}
- Sueño: ${sleepStr}
- Estado de ánimo: ${moodStr}
- Entrenamiento: ${workoutStr}
- Estado de recuperación: ${RECOVERY_LABEL[ctx.recoveryLight] || 'Verde'}

## Pantalla activa: ${ctx.activeModule || 'inicio'}
${ctx.activeModule === 'nutrition' && ctx.mealType ? `Tipo de comida: ${ctx.mealType}` : ''}
${ctx.activeModule === 'workout'   && ctx.workoutPath ? `Senda de entreno: ${ctx.workoutPath}` : ''}
${tone}
${memorySection}

## Instrucciones:
- Respuestas CORTAS: máximo 3 párrafos o 150 palabras
- Si el usuario menciona un problema de salud grave, recomienda un profesional
- Nunca inventes datos que no tienes
- Usa emojis con moderación (1-2 máximo)
- Si detectas un patrón importante (ej: 3 días con sueño malo), menciónalo`
}

// ─── POST /api/coach/chat ─────────────────────────────────────────────────────
router.post('/chat', requireAuth, async (req, res) => {
  const { messages, context } = req.body
  const userId = req.user.id

  try {
    // Comprobar límite
    const { allowed, count } = await checkLimit(userId)
    if (!allowed) {
      return res.status(429).json({ error: 'limit_reached', count })
    }

    // Cargar memoria persistente relevante (máx 5 recuerdos)
    const { data: memory } = await supabaseAdmin
      .from('coach_memory').select('content, memory_type')
      .eq('user_id', userId)
      .order('relevance', { ascending: false })
      .limit(5)

    // Cargar nombre del usuario si no viene en el contexto
    let ctx = context || {}
    if (!ctx.userName) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles').select('name').eq('id', userId).single()
      ctx.userName = profile?.name
    }

    const systemPrompt = buildSystemPrompt(ctx, memory || [])

    const response = await anthropic.messages.create({
      model: MODEL, max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const reply = response.content[0]?.text || 'No pude generar una respuesta.'

    // Log del mensaje (para límite diario)
    await supabaseAdmin.from('coach_messages_log').insert({
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      module: ctx.activeModule || 'coach',
    }).catch(() => {}) // no bloquear si falla

    res.json({ reply, context: ctx })
  } catch (err) {
    console.error('coach/chat error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/coach/memory/log ───────────────────────────────────────────────
// Guarda un recuerdo relevante detectado en la conversación
router.post('/memory/log', requireAuth, async (req, res) => {
  const { memory_type, content, context } = req.body
  const userId = req.user.id
  if (!content || !memory_type) return res.status(400).json({ error: 'content y memory_type requeridos' })

  try {
    // Upsert — si ya existe uno similar, actualiza en vez de duplicar
    const { data: existing } = await supabaseAdmin
      .from('coach_memory').select('id')
      .eq('user_id', userId).eq('memory_type', memory_type)
      .ilike('content', `%${content.slice(0, 30)}%`)
      .maybeSingle()

    if (existing) {
      await supabaseAdmin.from('coach_memory').update({
        content, context, relevance: 1.0, updated_at: new Date().toISOString()
      }).eq('id', existing.id)
    } else {
      await supabaseAdmin.from('coach_memory').insert({
        user_id: userId, memory_type, content, context: context || null,
      })
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/coach/context/:userId ───────────────────────────────────────────
// Snapshot del usuario para que el frontend pueda mostrar estado actual
router.get('/context/:userId', requireAuth, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('user_snapshot').select('*').eq('id', req.params.userId).single()
    res.json(data || {})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
