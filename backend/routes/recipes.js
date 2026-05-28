const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, requirePremium, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/recipes/generate
router.post('/generate', requireAuth, requirePremium, async (req, res) => {
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
      model: 'claude-opus-4-6',
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
      "carbs_g": número,
      "fat_g": número,
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
    const userId = req.user.id

    // Obtener la receta con sus ingredientes
    const { data: recipe, error: recipeErr } = await supabaseAdmin
      .from('generated_recipes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single()
    if (recipeErr) throw recipeErr

    // Marcar como cocinada
    const { data, error } = await supabaseAdmin
      .from('generated_recipes')
      .update({ cooked: true })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error

    // Descontar ingredientes de la despensa
    if (recipe?.ingredients?.length > 0) {
      const { data: pantry } = await supabaseAdmin
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)

      for (const ingredient of recipe.ingredients) {
        const ingName = typeof ingredient === 'string'
          ? ingredient.toLowerCase()
          : (ingredient.name || '').toLowerCase()

        // Buscar coincidencia aproximada en despensa
        const match = (pantry || []).find(p =>
          p.ingredient.toLowerCase().includes(ingName) ||
          ingName.includes(p.ingredient.toLowerCase())
        )

        if (match) {
          const newQty = (parseFloat(match.quantity) || 1) - 1
          if (newQty <= 0) {
            await supabaseAdmin.from('pantry_items')
              .delete().eq('id', match.id)
          } else {
            await supabaseAdmin.from('pantry_items')
              .update({ quantity: newQty }).eq('id', match.id)
          }
        }
      }
    }

    // Sumar XP
    const { data: prof } = await supabaseAdmin
      .from('user_profiles').select('xp').eq('id', userId).single()
    const newXP = (prof?.xp || 0) + 30
    const newLevel = Math.floor(newXP / 500) + 1
    await supabaseAdmin.from('user_profiles')
      .update({ xp: newXP, level: newLevel }).eq('id', userId)

    res.json({ ...data, xp_gained: 30 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router;
