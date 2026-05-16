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
      model: 'claude-sonnet-4-20250514',
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

module.exports = router;
