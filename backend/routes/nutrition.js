const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/nutrition/analyze-photo
router.post('/analyze-photo', requireAuth, async (req, res) => {
  try {
    const { imageBase64, mediaType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `Analiza esta foto de comida y devuelve SOLO un JSON válido con este formato exacto:
{
  "food_name": "nombre del plato",
  "calories": número,
  "protein_g": número,
  "carbs_g": número,
  "fat_g": número,
  "confidence": "alta|media|baja"
}
Sin explicaciones adicionales, solo el JSON.`,
          },
        ],
      }],
    });

    const raw = response.content[0].text.trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    const data = JSON.parse(clean);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo analizar la imagen: ' + err.message });
  }
});

// POST /api/nutrition/barcode
router.post('/barcode', requireAuth, async (req, res) => {
  try {
    const { barcode } = req.body;
    if (!barcode) return res.status(400).json({ error: 'No barcode provided' });

    // Open Food Facts API (gratuita, sin clave)
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const fetch = (await import('node-fetch')).default;
    const ofRes = await fetch(url);
    const ofData = await ofRes.json();

    if (ofData.status !== 1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const p = ofData.product;
    const n = p.nutriments || {};
    res.json({
      food_name: p.product_name || 'Producto desconocido',
      calories:  Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
      protein_g: Math.round((n.proteins_100g || 0) * 10) / 10,
      carbs_g:   Math.round((n.carbohydrates_100g || 0) * 10) / 10,
      fat_g:     Math.round((n.fat_100g || 0) * 10) / 10,
      serving_size: p.serving_size || '100g',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
