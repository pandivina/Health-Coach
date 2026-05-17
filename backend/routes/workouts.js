const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/workouts/exercises — biblioteca
router.get('/exercises', requireAuth, async (req, res) => {
  try {
    const { muscle_group, search } = req.query;
    let query = supabaseAdmin.from('exercises').select('*')
      .or(`is_custom.eq.false,user_id.eq.${req.user.id}`)
      .order('muscle_group').order('name');
    if (muscle_group) query = query.eq('muscle_group', muscle_group);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/workouts/templates
router.get('/templates', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('workout_templates')
      .select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/workouts/generate — generar rutina con IA
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { goal, days, duration, equipment, level } = req.body;
    const userId = req.user.id;

    const [profileRes, statsRes, historyRes] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('goal,weight_kg,age,sex').eq('id', userId).single(),
      supabaseAdmin.from('exercise_stats').select('*').eq('user_id', userId).order('total_sessions', { ascending: false }).limit(10),
      supabaseAdmin.from('workout_sessions').select('name,total_volume_kg,duration_seconds').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    ]);

    const profile = profileRes.data || {};
    const stats = statsRes.data || [];
    const history = historyRes.data || [];
    const topExercises = stats.map(s => s.exercise_name).join(', ') || 'ninguno registrado';
    const recentWorkouts = history.map(h => h.name).join(', ') || 'ninguno';

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Genera una rutina de entrenamiento personalizada. Devuelve SOLO JSON válido:
{
  "name": "nombre de la rutina",
  "description": "descripción breve",
  "difficulty": "principiante|intermedio|avanzado",
  "estimated_duration": minutos,
  "exercises": [
    {
      "exercise_name": "nombre",
      "muscle_group": "grupo muscular",
      "sets": número,
      "reps": "8-12 o 30s para tiempo",
      "rest_seconds": número,
      "notes": "consejo técnico"
    }
  ]
}
Datos del usuario:
- Objetivo: ${goal || profile.goal || 'fuerza general'}
- Días por semana: ${days || 3}
- Duración: ${duration || 45} min
- Equipamiento: ${equipment || 'gimnasio completo'}
- Nivel: ${level || 'intermedio'}
- Ejercicios más usados: ${topExercises}
- Últimos entrenos: ${recentWorkouts}
Sin texto extra, solo JSON.`
      }]
    });

    const raw = response.content[0].text.trim().replace(/```json|```/g, '').trim();
    const routine = JSON.parse(raw);

    const { data, error } = await supabaseAdmin.from('workout_templates').insert({
      user_id: userId,
      name: routine.name,
      description: routine.description,
      exercises: routine.exercises,
      estimated_duration: routine.estimated_duration,
      difficulty: routine.difficulty,
      goal: goal || profile.goal || 'fuerza',
      is_ai_generated: true,
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/workouts/start — iniciar sesión
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { name, template_id, exercises } = req.body;
    const { data: session, error: sErr } = await supabaseAdmin.from('workout_sessions').insert({
      user_id: req.user.id, name, template_id, status: 'active',
    }).select().single();
    if (sErr) throw sErr;

    // Crear ejercicios en la sesión
    if (exercises?.length) {
      const rows = exercises.map((ex, i) => ({
        session_id: session.id,
        exercise_name: ex.exercise_name || ex.name,
        exercise_id: ex.id || null,
        order_index: i,
        notes: ex.notes || '',
      }));
      const { data: wExercises, error: eErr } = await supabaseAdmin
        .from('workout_exercises').insert(rows).select();
      if (eErr) throw eErr;
      return res.json({ session, exercises: wExercises });
    }
    res.json({ session, exercises: [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/workouts/complete-set — registrar serie
router.post('/complete-set', requireAuth, async (req, res) => {
  try {
    const { workout_exercise_id, set_number, weight_kg, reps, is_warmup, rpe } = req.body;
    const userId = req.user.id;

    // Calcular 1RM (Epley)
    const oneRepMax = reps > 1 ? Math.round(weight_kg * (1 + reps / 30)) : weight_kg;

    // Ver si es PR
    const { data: currentPR } = await supabaseAdmin.from('personal_records')
      .select('one_rep_max, exercise_name')
      .eq('user_id', userId)
      .eq('workout_exercise_id', workout_exercise_id)
      .order('one_rep_max', { ascending: false }).limit(1).single();

    const isPR = !is_warmup && (!currentPR || oneRepMax > (currentPR.one_rep_max || 0));

    // Guardar serie
    const { data: set, error } = await supabaseAdmin.from('workout_sets').insert({
      workout_exercise_id, set_number, weight_kg, reps, is_warmup, rpe,
      is_pr: isPR,
    }).select().single();
    if (error) throw error;

    // Si es PR, guardarlo
    if (isPR && !is_warmup) {
      const { data: we } = await supabaseAdmin.from('workout_exercises')
        .select('exercise_name, session_id').eq('id', workout_exercise_id).single();
      if (we) {
        await supabaseAdmin.from('personal_records').upsert({
          user_id: userId,
          exercise_name: we.exercise_name,
          weight_kg, reps,
          one_rep_max: oneRepMax,
          session_id: we.session_id,
        }, { onConflict: 'user_id,exercise_name' });
      }
    }

    res.json({ set, is_pr: isPR, one_rep_max: oneRepMax });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/workouts/finish — finalizar sesión
router.post('/finish', requireAuth, async (req, res) => {
  try {
    const { session_id, duration_seconds, notes } = req.body;
    const userId = req.user.id;

    // Calcular volumen total
    const { data: sets } = await supabaseAdmin.from('workout_sets').select('weight_kg, reps, is_warmup')
      .in('workout_exercise_id', supabaseAdmin.from('workout_exercises').select('id').eq('session_id', session_id));

    const totalVolume = (sets || []).filter(s => !s.is_warmup).reduce((sum, s) => sum + (s.weight_kg * s.reps), 0);
    const totalSets = (sets || []).filter(s => !s.is_warmup).length;
    const caloriesBurned = Math.round(duration_seconds / 60 * 8);

    const { data, error } = await supabaseAdmin.from('workout_sessions').update({
      finished_at: new Date().toISOString(),
      duration_seconds, notes,
      total_volume_kg: Math.round(totalVolume),
      total_sets: totalSets,
      calories_burned: caloriesBurned,
      status: 'completed',
    }).eq('id', session_id).eq('user_id', userId).select().single();
    if (error) throw error;

    // Actualizar XP en perfil
    await supabaseAdmin.from('user_profiles').update({
      xp: supabaseAdmin.rpc('increment_xp', { user_id: userId, amount: 50 }),
    }).eq('id', userId);

    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/workouts/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('workout_sessions').select(`
      *, workout_exercises(*, workout_sets(*))
    `).eq('user_id', req.user.id).eq('status', 'completed')
      .order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/workouts/stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [sessionsRes, prsRes, statsRes] = await Promise.all([
      supabaseAdmin.from('workout_sessions').select('total_volume_kg,duration_seconds,created_at,calories_burned')
        .eq('user_id', userId).eq('status', 'completed').order('created_at', { ascending: false }).limit(30),
      supabaseAdmin.from('personal_records').select('*').eq('user_id', userId).order('achieved_at', { ascending: false }).limit(10),
      supabaseAdmin.from('exercise_stats').select('*').eq('user_id', userId).order('total_sessions', { ascending: false }).limit(5),
    ]);
    const sessions = sessionsRes.data || [];
    res.json({
      total_sessions: sessions.length,
      total_volume_kg: Math.round(sessions.reduce((s, w) => s + (w.total_volume_kg || 0), 0)),
      total_time_minutes: Math.round(sessions.reduce((s, w) => s + (w.duration_seconds || 0), 0) / 60),
      total_calories: Math.round(sessions.reduce((s, w) => s + (w.calories_burned || 0), 0)),
      personal_records: prsRes.data || [],
      top_exercises: statsRes.data || [],
      recent_sessions: sessions.slice(0, 7),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
