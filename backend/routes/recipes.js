const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/recipes/generate
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [profileRes, goalsRes, mealsRes, pantryRes] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('goal,allergies,weight_kg').eq('id', userId).single(),
      supabaseAdmin.from('nutrition_goals').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('meal_logs').select('calories,protein_g').eq('user_id', userId).eq('date', new Date().toISOString().split('T')[0]),
      supabaseAdmin.from('pantry_items').select('ingredient,quantity,unit').eq('user_id', userId).limit(20),
    ]);

    const profile = profileRes.data || {};
    const goals = goalsRes.data || { calories: 2000, protein_g: 150 };
    const meals = mealsRes.data || [];
    const pantry = pantryRes.data || [];

    const caloriesLeft = (goals.calories || 2000) - meals.reduce((s, m) => s + m.calories, 0);
    const proteinLeft = (goals.protein_g || 150) - meals.reduce((s, m) => s + m.protein_g, 0);
    const pantryList = pantry.map(p => `${p.ingredient} (${p.quantity} ${p.unit})`).join(', ') || 'ingredientes básicos';
    const allergies = (profile.allergies || []).join(', ') || 'ninguna';

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Genera 3 recetas saludables usando estos datos. SOLO JSON válido:
{
  "recipes": [
    {
      "title": "nombre",
      "ingredients": ["ingrediente 1", "ingrediente 2"],
      "instructions": "instrucciones cortas paso a paso",
      "calories": número,
      "protein_g": número,
      "prep_time": minutos
    }
  ]
}
Datos:
- Ingredientes disponibles: ${pantryList}
- Calorías restantes del día: ${Math.max(0, caloriesLeft)} kcal
- Proteína restante: ${Math.max(0, proteinLeft)}g
- Objetivo: ${profile.goal || 'salud general'}
- Alergias/restricciones: ${allergies}
Sin texto extra, solo JSON.`,
      }],
    });

    const raw = response.content[0].text.trim().replace(/```json|```/g, '').trim();
    const { recipes } = JSON.parse(raw);

    // Guardar en BD
    const rows = recipes.map(r => ({ ...r, user_id: userId }));
    const { data, error } = await supabaseAdmin.from('generated_recipes').insert(rows).select();
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recipes/cook/:id — marcar como cocinada
router.post('/cook/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('generated_recipes')
      .update({ cooked: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
