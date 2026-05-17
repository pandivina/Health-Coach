const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/coach
router.post('/', requireAuth, async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user.id;

    // Obtener contexto del usuario
    const [profileRes, goalsRes, mealsRes, sleepRes, moodRes] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('nutrition_goals').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('meal_logs').select('*').eq('user_id', userId).eq('date', new Date().toISOString().split('T')[0]),
      supabaseAdmin.from('sleep_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(1),
      supabaseAdmin.from('mood_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(1),
    ]);

    const profile = profileRes.data || {};
    const goals = goalsRes.data || {};
    const meals = mealsRes.data || [];
    const sleep = sleepRes.data?.[0] || {};
    const mood = moodRes.data?.[0] || {};

    const caloriesConsumed = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const proteinConsumed = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);

    const systemPrompt = `Eres el Coach IA de Health Coach, un asistente de salud personalizado, empático y motivador.

DATOS REALES DEL USUARIO (solo usa estos, nunca inventes):
- Nombre: ${profile.name || 'Usuario'}
- Edad: ${profile.age || 'No especificada'} años
- Sexo: ${profile.sex || 'No especificado'}
- Peso: ${profile.weight_kg || 'No especificado'} kg | Altura: ${profile.height_cm || 'No especificada'} cm
- Objetivo: ${profile.goal || 'No especificado'}
- Nivel de actividad: ${profile.activity_level || 'No especificado'}
- Hoy ha consumido: ${caloriesConsumed} kcal de ${goals.calories || 2000} kcal objetivo
- Proteína hoy: ${proteinConsumed}g de ${goals.protein_g || 150}g objetivo
- Último sueño registrado: ${sleep.hours || 'No registrado'} h (calidad: ${sleep.quality || '-'}/5)
- Último estado emocional: ${mood.mood || 'No registrado'}/5
- Nivel: ${profile.level || 1} | XP: ${profile.xp || 0} | Racha: ${profile.streak || 0} días

REGLAS ESTRICTAS:
1. Nunca inventes datos ni supongas información no presente aquí.
2. Si falta información relevante, pídela con amabilidad.
3. Sé empático, motivador y directo.
4. Responde en español siempre.
5. Usa emojis con moderación para dar calidez.
6. Máximo 3 párrafos por respuesta.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Coach error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
