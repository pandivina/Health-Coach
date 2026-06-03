// server/routes/tip.js
// ─────────────────────────────────────────────────────────────────────────────
// Genera un tip personalizado con IA para el santuario del Home
// GET /api/tip/daily
// ─────────────────────────────────────────────────────────────────────────────

const express   = require('express')
const router    = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const { requireAuth, supabaseAdmin } = require('../middleware/auth')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

router.get('/daily', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const hour   = new Date().getHours()
    const today  = new Date().toISOString().split('T')[0]

    // Caché: solo 1 tip por sesión de 4h (no llamar IA en cada reload)
    // El frontend maneja la caché en localStorage

    // Recopilar contexto del usuario
    const safe = async fn => { try { return await fn } catch { return { data: null } } }

    const [profileR, healthR, sleepR, moodR, mealsR, streakR] = await Promise.all([
      safe(supabaseAdmin.from('user_profiles').select('name,level,xp,streak,goal,activity_level,pet_name').eq('id', userId).single()),
      safe(supabaseAdmin.from('health_profiles').select('target_calories,target_protein_g,weight_kg,goal,activity_level,is_smoker,work_schedule,diet_type').eq('user_id', userId).maybeSingle()),
      safe(supabaseAdmin.from('sleep_logs').select('hours,quality').eq('user_id', userId).eq('date', today).maybeSingle()),
      safe(supabaseAdmin.from('mood_logs').select('mood').eq('user_id', userId).eq('date', today).maybeSingle()),
      safe(supabaseAdmin.from('meal_logs').select('calories,protein_g').eq('user_id', userId).eq('date', today)),
      safe(supabaseAdmin.from('user_profiles').select('streak').eq('id', userId).single()),
    ])

    const profile = profileR.data || {}
    const health  = healthR.data  || {}
    const sleep   = sleepR.data
    const mood    = moodR.data
    const meals   = mealsR.data   || []
    const cals    = meals.reduce((s, m) => s + (m.calories || 0), 0)
    const protein = meals.reduce((s, m) => s + (m.protein_g || 0), 0)

    const timeOfDay = hour < 12 ? 'mañana' : hour < 17 ? 'tarde' : 'noche'

    const prompt = `Eres Pandi, el coach de salud personal de ${profile.name || 'este usuario'}.

CONTEXTO DEL USUARIO HOY:
- Hora: ${hour}h (${timeOfDay})
- Objetivo: ${health.goal || profile.goal || 'mejorar salud'}
- Nivel de actividad: ${health.activity_level || 'moderado'}
- Racha actual: ${profile.streak || 0} días
- Nivel en la app: ${profile.level || 1}
- Calorías hoy: ${Math.round(cals)} / ${health.target_calories || 2000} kcal
- Proteína hoy: ${Math.round(protein)} / ${health.target_protein_g || 150}g
- Sueño anoche: ${sleep ? `${sleep.hours}h, calidad ${sleep.quality}/5` : 'no registrado'}
- Ánimo hoy: ${mood ? `${mood.mood}/5` : 'no registrado'}
- Horario laboral: ${health.work_schedule || 'día'}
- Dieta: ${health.diet_type || 'omnívora'}

INSTRUCCIÓN:
Genera UN SOLO tip de salud personalizado para este momento del día.
El tip debe:
- Ser específico para su situación actual (no genérico)
- Tener entre 1 y 2 frases máximo
- Incluir 1 emoji al final
- Ser curioso, motivador o sorprendente — algo que el usuario no sepa o no espere
- Variar entre: nutrición, rendimiento, bienestar, sueño, curiosidad científica, hábito quick win
- NO mencionar que eres una IA
- Hablar en segunda persona, tono cercano y directo

Responde ÚNICAMENTE con el tip, sin comillas, sin explicaciones.`

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages:   [{ role: 'user', content: prompt }],
    })

    const tip = response.content[0]?.text?.trim() || 'Pequeños pasos constantes construyen grandes resultados. 🐾'

    res.json({ tip, cached: false })

  } catch (err) {
    console.error('Tip generation error:', err.message)
    // Fallback si falla la IA
    const fallbacks = [
      'Beber agua antes de comer reduce la ingesta calórica hasta un 13%. 💧',
      'Una caminata de 10 min después de comer mejora la glucemia postprandial. 🚶',
      'Dormir menos de 7h aumenta el hambre hasta un 24% al día siguiente. 😴',
      'La cafeína bloquea el sueño hasta 6-8h después de tomarla. ☕',
      'El 90% del serotonina se produce en el intestino, no en el cerebro. 🧠',
    ]
    const tip = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    res.json({ tip, cached: false, fallback: true })
  }
})

module.exports = router
