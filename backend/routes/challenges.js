const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // lunes
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

// GET /api/challenges/weekly — obtiene o genera los retos de la semana actual
router.get('/weekly', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const weekStart = getWeekStart();

    const { data: existing } = await supabaseAdmin
      .from('weekly_challenges').select('*')
      .eq('user_id', userId).eq('week_start', weekStart).maybeSingle();

    if (existing) return res.json(existing);

    // Generar 3 retos nuevos adaptados al nivel
    const { data: profile } = await supabaseAdmin
      .from('user_profiles').select('level,streak').eq('id', userId).single();

    const level = profile?.level || 1;

    const prompt = `Genera 3 retos semanales de salud para un usuario de nivel ${level} (1=principiante, 10+=avanzado).
Devuelve SOLO JSON:
{
  "challenges": [
    {"id":"c1","text":"texto del reto","target":número,"metric":"water_glasses|meals_logged|workouts|meditation_sessions|sleep_logged"},
    {"id":"c2","text":"...","target":número,"metric":"..."},
    {"id":"c3","text":"...","target":número,"metric":"..."}
  ]
}
Retos concretos y alcanzables en 7 días, variados entre nutrición/entreno/bienestar. Sin texto extra.`;

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].text.trim().replace(/```json|```/g, '').trim();
    const { challenges } = JSON.parse(raw);

    const challengesWithProgress = challenges.map(c => ({ ...c, progress: 0, done: false }));

    const { data, error } = await supabaseAdmin.from('weekly_challenges').insert({
      user_id: userId, week_start: weekStart,
      challenges: challengesWithProgress, reward_xp: 100,
      reward_accessory: 'weekly_badge',
    }).select().single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges/check — recalcula progreso de los retos activos
router.post('/check', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const weekStart = getWeekStart();

    const { data: current } = await supabaseAdmin
      .from('weekly_challenges').select('*')
      .eq('user_id', userId).eq('week_start', weekStart).maybeSingle();

    if (!current) return res.json({ challenges: [] });

    const from = weekStart;
    const to = new Date().toISOString().split('T')[0];

    const [waterR, mealsR, workoutsR, medR, sleepR] = await Promise.all([
      supabaseAdmin.from('hydration_logs').select('date').eq('user_id', userId).gte('date', from).lte('date', to),
      supabaseAdmin.from('meal_logs').select('date').eq('user_id', userId).gte('date', from).lte('date', to),
      supabaseAdmin.from('workout_sessions').select('id').eq('user_id', userId).eq('status','completed').gte('created_at', from+'T00:00:00'),
      supabaseAdmin.from('user_profiles').select('meditation_streak').eq('id', userId).single(),
      supabaseAdmin.from('sleep_logs').select('date').eq('user_id', userId).gte('date', from).lte('date', to),
    ]);

    const metrics = {
      water_glasses:       new Set((waterR.data||[]).map(w=>w.date)).size,
      meals_logged:        new Set((mealsR.data||[]).map(m=>m.date)).size,
      workouts:            (workoutsR.data||[]).length,
      meditation_sessions: medR.data?.meditation_streak || 0,
      sleep_logged:         new Set((sleepR.data||[]).map(s=>s.date)).size,
    };

    let allDone = true;
    const updated = current.challenges.map(c => {
      const progress = metrics[c.metric] || 0;
      const done = progress >= c.target;
      if (!done) allDone = false;
      return { ...c, progress, done };
    });

    const wasCompleted = !!current.completed_at;
    const updates = { challenges: updated };
    if (allDone && !wasCompleted) {
      updates.completed_at = new Date().toISOString();
      await supabaseAdmin.from('user_profiles').update({
        xp: supabaseAdmin.rpc('increment_xp', { user_id: userId, amount: current.reward_xp }),
      }).eq('id', userId);
    }

    const { data } = await supabaseAdmin.from('weekly_challenges')
      .update(updates).eq('id', current.id).select().single();

    res.json({ ...data, justCompleted: allDone && !wasCompleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
