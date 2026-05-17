const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, supabaseAdmin } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/pantry/upload-receipt — analizar ticket de compra con IA
router.post('/upload-receipt', requireAuth, async (req, res) => {
  try {
    const { imageBase64, mediaType = 'image/jpeg' } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          {
            type: 'text',
            text: `Analiza este ticket de compra y extrae los ingredientes/alimentos. Devuelve SOLO un JSON válido:
{
  "items": [
    { "ingredient": "nombre", "quantity": número, "unit": "kg|g|l|ml|unidad", "category": "lácteos|carnes|verduras|frutas|cereales|bebidas|otros" }
  ]
}
Solo alimentos/ingredientes, ignora productos de limpieza, etc. Sin texto adicional.`,
          },
        ],
      }],
    });

    const raw = response.content[0].text.trim().replace(/```json|```/g, '').trim();
    const { items } = JSON.parse(raw);

    // Insertar en BD
    const rows = items.map(item => ({ ...item, user_id: req.user.id }));
    const { data, error } = await supabaseAdmin.from('pantry_items').insert(rows).select();
    if (error) throw error;

    res.json({ inserted: data.length, items: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pantry/items
router.get('/items', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pantry_items')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
