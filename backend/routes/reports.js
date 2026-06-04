const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── GET /api/report/today ────────────────────────────────────────────────────

router.get('/today', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today  = new Date().toISOString().split('T')[0];
    const safe   = fn => Promise.resolve(fn).catch(() => ({ data: null }));

    const [mealsRes, workoutsRes, sleepRes, moodRes, hydrationRes, profileRes] = await Promise.all([
      safe(supabaseAdmin.from('meal_logs').select('*').eq('user_id', userId).eq('date', today)),
      safe(supabaseAdmin.from('workout_sessions').select('calories_burned').eq('user_id', userId).eq('status','completed').gte('created_at', today+'T00:00:00')),
      safe(supabaseAdmin.from('sleep_logs').select('*').eq('user_id', userId).eq('date', today).maybeSingle()),
      safe(supabaseAdmin.from('mood_logs').select('*').eq('user_id', userId).eq('date', today).maybeSingle()),
      safe(supabaseAdmin.from('hydration_logs').select('*').eq('user_id', userId).eq('date', today).maybeSingle()),
      safe(supabaseAdmin.from('user_profiles').select('name,goal').eq('id', userId).maybeSingle()),
    ]);

    const meals     = mealsRes.data     || [];
    const workouts  = workoutsRes.data  || [];
    const sleep     = sleepRes.data     || {};
    const mood      = moodRes.data      || {};
    const hydration = hydrationRes.data || {};
    const profile   = profileRes.data   || {};

    const caloriesConsumed = meals.reduce((s, m) => s + (m.calories || 0), 0);
    const caloriesBurned   = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0);

    // Insight IA con fallback
    let insight = '¡Buen trabajo hoy! Cada pequeño paso cuenta.';
    let recommendation = 'Intenta registrar todos tus datos mañana para un análisis completo.';

    try {
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
Devuelve SOLO JSON sin markdown ni explicaciones: {"insight": "...", "recommendation": "..."}`,
        }],
      });

      const raw   = aiRes.content[0].text.trim().replace(/```json|```/g, '').trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.insight)        insight        = parsed.insight;
        if (parsed.recommendation) recommendation = parsed.recommendation;
      }
    } catch (aiErr) {
      console.error('Report today AI error:', aiErr.message);
      // Continúa con fallback
    }

    const report = {
      date:              today,
      calories_consumed: Math.round(caloriesConsumed),
      calories_burned:   Math.round(caloriesBurned),
      balance:           Math.round(caloriesConsumed - caloriesBurned),
      sleep_hours:       sleep.hours   || null,
      sleep_quality:     sleep.quality || null,
      mood:              mood.mood     || null,
      hydration_glasses: hydration.glasses || 0,
      workouts_count:    workouts.length,
      meals_count:       meals.length,
      coach_insight:     insight,
      recommendation,
    };

    // Guardar informe (no bloqueante)
    supabaseAdmin.from('daily_reports').upsert({
      user_id:           userId,
      date:              today,
      calories_consumed: report.calories_consumed,
      calories_burned:   report.calories_burned,
      sleep_hours:       report.sleep_hours,
      mood:              report.mood,
      hydration_glasses: report.hydration_glasses,
      coach_insight:     insight,
      recommendation,
    }, { onConflict: 'user_id,date' }).catch(err => console.error('Report upsert error:', err.message));

    res.json(report);
  } catch (err) {
    console.error('Report today error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/report/weekly ───────────────────────────────────────────────────

router.get('/weekly', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const days   = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const safe = fn => Promise.resolve(fn).catch(() => ({ data: null }));

    const [mealsR, sleepR, moodR, waterR, workoutR, profileR] = await Promise.all([
      safe(supabaseAdmin.from('meal_logs').select('date,calories').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('sleep_logs').select('date,hours,quality').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('mood_logs').select('date,mood').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('hydration_logs').select('date,glasses,goal').eq('user_id', userId).in('date', days)),
      safe(supabaseAdmin.from('workout_sessions').select('id').eq('user_id', userId).eq('status','completed').gte('created_at', days[days.length-1]+'T00:00:00')),
      safe(supabaseAdmin.from('user_profiles').select('name,streak,xp,level,pet_name,motivation_why').eq('id', userId).maybeSingle()),
    ]);

    const meals    = mealsR.data   || [];
    const sleepLog = sleepR.data   || [];
    const moodLogs = moodR.data    || [];
    const waterLog = waterR.data   || [];
    const workouts = workoutR.data || [];
    const profile  = profileR.data || {};

    const activeDays = [...new Set([
      ...meals.map(m => m.date),
      ...sleepLog.map(s => s.date),
      ...moodLogs.map(m => m.date),
      ...waterLog.map(w => w.date),
    ])].length;

    const avgMood   = moodLogs.length
      ? (moodLogs.reduce((s, m) => s + m.mood, 0) / moodLogs.length).toFixed(1)
      : null;
    const bestWater = waterLog.length ? Math.max(...waterLog.map(w => w.glasses || 0)) : 0;
    const bestSleep = sleepLog.length ? Math.max(...sleepLog.map(s => s.hours || 0)) : null;

    // Mensaje Pandi con fallback
    let pandoData = {
      pandi_message: `Llevas ${activeDays} días activos esta semana. ¡Eso cuenta! 🐼`,
      highlight:     activeDays >= 5 ? 'Gran consistencia esta semana' : null,
      suggestion:    'Intenta registrar al menos un hábito cada día',
    };

    try {
      const aiRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
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
{"pandi_message":"mensaje cálido 2 frases max","highlight":"mejor logro en una frase corta","suggestion":"sugerencia concreta para próxima semana"}`,
        }],
      });

      const raw   = aiRes.content[0].text.trim().replace(/```json|```/g, '').trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.pandi_message) pandoData.pandi_message = parsed.pandi_message;
        if (parsed.highlight)     pandoData.highlight     = parsed.highlight;
        if (parsed.suggestion)    pandoData.suggestion    = parsed.suggestion;
      }
    } catch (aiErr) {
      console.error('Weekly AI error:', aiErr.message);
      // Continúa con fallback
    }

    res.json({
      active_days:   activeDays,
      avg_mood:      avgMood,
      best_water:    bestWater,
      best_sleep:    bestSleep,
      workouts:      workouts.length,
      streak:        profile.streak || 0,
      pandi_message: pandoData.pandi_message,
      highlight:     pandoData.highlight,
      suggestion:    pandoData.suggestion,
    });

  } catch (err) {
    console.error('Weekly report error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
