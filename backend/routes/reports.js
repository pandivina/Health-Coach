const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/report/today
router.get('/today', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [mealsRes, workoutsRes, sleepRes, moodRes, hydrationRes, profileRes] = await Promise.all([
      supabaseAdmin.from('meal_logs').select('*').eq('user_id', userId).eq('date', today),
      supabaseAdmin.from('workouts').select('*').eq('user_id', userId).eq('date', today),
      supabaseAdmin.from('sleep_logs').select('*').eq('user_id', userId).eq('date', today).single(),
      supabaseAdmin.from('mood_logs').select('*').eq('user_id', userId).eq('date', today).single(),
      supabaseAdmin.from('hydration_logs').select('*').eq('user_id', userId).eq('date', today).single(),
      supabaseAdmin.from('user_profiles').select('name,goal').eq('id', userId).single(),
    ]);

    const meals = mealsRes.data || [];
    const workouts = workoutsRes.data || [];
    const sleep = sleepRes.data || {};
    const mood = moodRes.data || {};
    const hydration = hydrationRes.data || {};
    const profile = profileRes.data || {};

    const caloriesConsumed = meals.reduce((s, m) => s + m.calories, 0);
    const caloriesBurned = workouts.reduce((s, w) => s + w.calories_burned, 0);

    // Insight IA
    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Genera un insight motivador breve (2 frases máx) y una recomendación concreta (1 frase) para mañana.
Datos de hoy de ${profile.name || 'el usuario'}:
- Calorías: ${Math.round(caloriesConsumed)} consumidas, ${Math.round(caloriesBurned)} quemadas
- Sueño: ${sleep.hours || 'no registrado'} h
- Ánimo: ${mood.mood || 'no registrado'}/5
- Hidratación: ${hydration.glasses || 0} vasos
- Objetivo: ${profile.goal || 'salud'}
Devuelve JSON: {"insight": "...", "recommendation": "..."}`,
      }],
    });

    const raw = aiRes.content[0].text.trim().replace(/```json|```/g, '').trim();
    const { insight, recommendation } = JSON.parse(raw);

    const report = {
      date: today,
      calories_consumed: Math.round(caloriesConsumed),
      calories_burned: Math.round(caloriesBurned),
      balance: Math.round(caloriesConsumed - caloriesBurned),
      sleep_hours: sleep.hours || null,
      sleep_quality: sleep.quality || null,
      mood: mood.mood || null,
      hydration_glasses: hydration.glasses || 0,
      workouts_count: workouts.length,
      meals_count: meals.length,
      coach_insight: insight,
      recommendation,
    };

    // Guardar/actualizar informe
    await supabaseAdmin.from('daily_reports').upsert({
      user_id: userId,
      date: today,
      calories_consumed: report.calories_consumed,
      calories_burned: report.calories_burned,
      sleep_hours: report.sleep_hours,
      mood: report.mood,
      hydration_glasses: report.hydration_glasses,
      coach_insight: insight,
      recommendation,
    }, { onConflict: 'user_id,date' });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ─── Añadir al final de routes/reports.js, antes de module.exports ────────────
// También corrige el modelo en /today: cambia 'claude-opus-4-5' → 'claude-sonnet-4-6'

// GET /api/report/weekly
router.get('/weekly', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const days   = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    })
    const safe = fn => fn.catch(() => ({ data: null }))

    const [mealsR, sleepR, moodR, waterR, workoutR, profileR] = await Promise.all([
      safe(supabaseAdmin.from('meal_logs').select('date,calories').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('sleep_logs').select('date,hours,quality').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('mood_logs').select('date,mood').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('hydration_logs').select('date,glasses,goal').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('workout_sessions').select('id').eq('user_id', userId).eq('status','completed').gte('created_at', days[days.length-1]+'T00:00:00')),
      safe(supabaseAdmin.from('user_profiles').select('name,streak,xp,level,pet_name,motivation_why').eq('id', userId).single()),
    ])

    const meals    = mealsR.data    || []
    const sleepLog = sleepR.data    || []
    const moodLogs = moodR.data     || []
    const waterLog = waterR.data    || []
    const workouts = workoutR.data  || []
    const profile  = profileR.data  || {}

    // Calcular stats
    const activeDays = [...new Set([
      ...meals.map(m => m.date),
      ...sleepLog.map(s => s.date),
      ...moodLogs.map(m => m.date),
      ...waterLog.map(w => w.date),
    ])].length

    const avgMood   = moodLogs.length
      ? (moodLogs.reduce((s, m) => s + m.mood, 0) / moodLogs.length).toFixed(1)
      : null
    const bestWater = waterLog.length
      ? Math.max(...waterLog.map(w => w.glasses || 0))
      : 0
    const bestSleep = sleepLog.length
      ? Math.max(...sleepLog.map(s => s.hours || 0))
      : null

    // Generar mensaje de Pandi con IA
    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Eres Pandi, la mascota de una app de salud. Genera un resumen semanal cálido y personal.
Datos de ${profile.name || 'el usuario'} esta semana:
- Días activos: ${activeDays}/7
- Ánimo medio: ${avgMood || 'no registrado'}/5
- Mejor día de agua: ${bestWater} vasos
- Mejor noche de sueño: ${bestSleep || 'no registrado'} h
- Entrenamientos: ${workouts.length}
- Racha actual: ${profile.streak || 0} días
- Su motivación: ${profile.motivation_why || 'mejorar su salud'}
Devuelve SOLO JSON sin markdown:
{"pandi_message":"mensaje cálido de 2 frases max, menciona algo específico de sus datos","highlight":"el mejor logro de la semana en una frase corta","suggestion":"una sugerencia concreta para la próxima semana"}`,
      }],
    })

    const raw  = aiRes.content[0].text.trim().replace(/```json|```/g, '').trim()
    const match = raw.match(/\{[\s\S]*\}/)
    const aiData = match ? JSON.parse(match[0]) : {
      pandi_message: `Llevas ${activeDays} días activos esta semana. ¡Eso cuenta! 🐼`,
      highlight:     activeDays >= 5 ? 'Gran consistencia esta semana' : null,
      suggestion:    'Intenta registrar al menos un hábito cada día',
    }

    res.json({
      active_days:   activeDays,
      avg_mood:      avgMood,
      best_water:    bestWater,
      best_sleep:    bestSleep,
      workouts:      workouts.length,
      streak:        profile.streak || 0,
      pandi_message: aiData.pandi_message,
      highlight:     aiData.highlight,
      suggestion:    aiData.suggestion,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
module.exports = router;
