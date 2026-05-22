const express  = require('express')
const router   = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const { requireAuth, requirePremium } = require('../middleware/auth')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST /api/nutrition/analyze-photo
router.post('/analyze-photo', requireAuth, async (req, res) => {
  try {
    const { imageBase64, mediaType = 'image/jpeg' } = req.body
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',   // ← corregido
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `Eres un nutricionista experto. Analiza la imagen y estima los macronutrientes.
Devuelve ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin backticks:
{"food_name":"nombre del plato en español","calories":número entero,"protein_g":número decimal,"carbs_g":número decimal,"fat_g":número decimal,"confidence":"alta|media|baja"}
Si no puedes identificar comida, devuelve: {"food_name":"No identificado","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"confidence":"baja"}`,
          },
        ],
      }],
    })

    const raw   = response.content[0].text.trim()
    // Extrae el JSON aunque venga envuelto en markdown o texto
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Respuesta no contiene JSON válido')
    const data  = JSON.parse(match[0])
    res.json(data)

  } catch (err) {
    console.error('analyze-photo error:', err.message)
    res.status(500).json({ error: 'No se pudo analizar la imagen: ' + err.message })
  }
})

// POST /api/nutrition/barcode  (mantenido por compatibilidad)
router.post('/barcode', requireAuth, async (req, res) => {
  try {
    const { barcode } = req.body
    if (!barcode) return res.status(400).json({ error: 'No barcode provided' })

    const fetch  = (await import('node-fetch')).default
    const ofRes  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const ofData = await ofRes.json()

    if (ofData.status !== 1) return res.status(404).json({ error: 'Producto no encontrado' })

    const p = ofData.product
    const n = p.nutriments || {}
    res.json({
      food_name:    p.product_name || 'Producto desconocido',
      calories:     Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
      protein_g:    Math.round((n.proteins_100g       || 0) * 10) / 10,
      carbs_g:      Math.round((n.carbohydrates_100g  || 0) * 10) / 10,
      fat_g:        Math.round((n.fat_100g            || 0) * 10) / 10,
      serving_size: p.serving_size || '100g',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
