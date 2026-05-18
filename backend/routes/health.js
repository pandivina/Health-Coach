const express = require('express');
const router = express.Router();
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

// GET /api/health/profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('health_profiles').select('*').eq('user_id', req.user.id).single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/health/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const body = { ...req.body, user_id: userId, updated_at: new Date().toISOString() };

    // Calcular IMC, TDEE y macros automáticamente
    if (body.weight_kg && body.height_cm) {
      const h = body.height_cm / 100;
      body.bmi = Math.round((body.weight_kg / (h * h)) * 10) / 10;
    }
    if (body.weight_kg && body.height_cm && body.birth_date && body.sex) {
      const age = Math.floor((new Date() - new Date(body.birth_date)) / (365.25 * 24 * 3600 * 1000));
      const w = body.weight_kg, h = body.height_cm;
      const bmr = body.sex === 'female'
        ? 10 * w + 6.25 * h - 5 * age - 161
        : 10 * w + 6.25 * h - 5 * age + 5;
      const actMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, intense: 1.725, athlete: 1.9 }[body.activity_level] || 1.375;
      body.bmr = Math.round(bmr);
      body.tdee = Math.round(bmr * actMult);

      const deficits = { slow: 250, moderate: 500, aggressive: 750 };
      const deficit = deficits[body.goal_intensity] || 500;
      body.target_calories = body.goal === 'lose_fat' ? body.tdee - deficit
        : body.goal === 'gain_muscle' ? body.tdee + 300
        : body.tdee;
      body.target_protein_g = Math.round(w * (body.goal === 'gain_muscle' ? 2.2 : 2.0));
      body.target_fat_g = Math.round(body.target_calories * 0.25 / 9);
      body.target_carbs_g = Math.round((body.target_calories - body.target_protein_g * 4 - body.target_fat_g * 9) / 4);
    }

    const { data, error } = await supabaseAdmin.from('health_profiles')
      .upsert(body, { onConflict: 'user_id' }).select().single();
    if (error) throw error;

    // Sync nutrition goals
    if (body.target_calories) {
      await supabaseAdmin.from('nutrition_goals').upsert({
        user_id: userId,
        calories: body.target_calories,
        protein_g: body.target_protein_g,
        carbs_g: body.target_carbs_g,
        fat_g: body.target_fat_g,
      }, { onConflict: 'user_id' });
    }

    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/health/weight
router.post('/weight', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('weight_logs')
      .insert({ ...req.body, user_id: req.user.id }).select().single();
    if (error) throw error;

    // Update current weight in health_profile
    await supabaseAdmin.from('health_profiles')
      .update({ weight_kg: req.body.weight_kg, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id);

    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/health/weight
router.get('/weight', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('weight_logs')
      .select('*').eq('user_id', req.user.id)
      .order('date', { ascending: false }).limit(30);
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/health/measurements
router.post('/measurements', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('body_measurements')
      .insert({ ...req.body, user_id: req.user.id }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/health/measurements
router.get('/measurements', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('body_measurements')
      .select('*').eq('user_id', req.user.id)
      .order('date', { ascending: false }).limit(12);
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/health/treatments
router.get('/treatments', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('medical_treatments')
      .select('*').eq('user_id', req.user.id).eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/health/treatments
router.post('/treatments', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('medical_treatments')
      .insert({ ...req.body, user_id: req.user.id }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/health/treatments/:id
router.delete('/treatments/:id', requireAuth, async (req, res) => {
  try {
    await supabaseAdmin.from('medical_treatments')
      .update({ active: false }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
