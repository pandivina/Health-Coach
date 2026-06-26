// backend/routes/recipes_weekly.js
const express  = require('express')
const router   = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const { createClient } = require('@supabase/supabase-js')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Token inválido' })
  req.user = user
  next()
}

const GOAL_LABELS = {
  lose_weight:    'perder peso (déficit calórico, alta proteína)',
  gain_muscle:    'ganar músculo (superávit calórico, muy alta proteína)',
  maintain:       'mantener peso (dieta equilibrada)',
  improve_health: 'mejorar salud general (dieta mediterránea)',
}

// POST /api/recipes/weekly
router.post('/weekly', requireAuth, async (req, res) => {
  try {
    // Obtener perfil del usuario
    const { data: hp } = await supabase
      .from('health_profiles')
      .select('goal, diet_type, calories_goal, protein_goal, weight_kg, height_cm, activity_level')
      .eq('user_id', req.user.id)
      .maybeSingle()

    const { data: up } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('id', req.user.id)
      .maybeSingle()

    const goalStr    = GOAL_LABELS[hp?.goal] || GOAL_LABELS.improve_health
    const kcalTarget = hp?.calories_goal || 2000
    const protTarget = hp?.protein_goal  || 150
    const dietType   = hp?.diet_type     || 'omnívora'
    const name       = up?.name?.split(' ')[0] || 'Usuario'

    const prompt = `Eres el coach nutricional Pandi. Crea planes de alimentación saludables para ${name}.

OBJETIVO: ${goalStr}
CALORÍAS OBJETIVO: ~${kcalTarget} kcal/día
PROTEÍNA OBJETIVO: ~${protTarget}g/día
TIPO DE DIETA: ${dietType}

Genera planes para LUNES, MIÉRCOLES y VIERNES. Cada día debe incluir desayuno, comida, merienda y cena. Las recetas deben ser simples, económicas y fáciles de preparar en España. Usa ingredientes comunes del mercado español.

Responde ÚNICAMENTE con JSON válido, sin markdown ni explicaciones:
{
  "lunes": {
    "resumen": "descripción del día en 8 palabras máximo",
    "kcal_total": 1900,
    "macros": { "protein": 145, "carbs": 210, "fat": 60 },
    "desayuno": { "nombre": "Nombre", "descripcion": "Ingredientes y preparación en 2 frases", "kcal": 420 },
    "comida":   { "nombre": "Nombre", "descripcion": "Ingredientes y preparación en 2 frases", "kcal": 650 },
    "merienda": { "nombre": "Nombre", "descripcion": "Ingredientes y preparación en 1 frase",  "kcal": 180 },
    "cena":     { "nombre": "Nombre", "descripcion": "Ingredientes y preparación en 2 frases", "kcal": 520 },
    "consejo_pandi": "Consejo motivacional breve relacionado con el objetivo"
  },
  "miercoles": { "resumen": "...", "kcal_total": ..., "macros": {...}, "desayuno": {...}, "comida": {...}, "merienda": {...}, "cena": {...}, "consejo_pandi": "..." },
  "viernes":   { "resumen": "...", "kcal_total": ..., "macros": {...}, "desayuno": {...}, "comida": {...}, "merienda": {...}, "cena": {...}, "consejo_pandi": "..." }
}`

    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw     = message.content[0]?.text || ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const plans   = JSON.parse(cleaned)

    res.json(plans)
  } catch (err) {
    console.error('[recipes/weekly]', err.message)
    res.status(500).json({ error: 'No se pudo generar el plan semanal' })
  }
})

module.exports = router
