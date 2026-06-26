const express = require('express')
const router  = express.Router()

// ─── TOKEN CACHE ──────────────────────────────────────────────────────────────
let _token    = null
let _tokenExp = 0

async function getToken() {
  if (_token && Date.now() < _tokenExp) return _token

  const creds  = Buffer.from(
    `${process.env.FATSECRET_CLIENT_ID}:${process.env.FATSECRET_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  })

  if (!res.ok) throw new Error(`FatSecret token error: ${res.status}`)
  const data = await res.json()

  _token    = data.access_token
  _tokenExp = Date.now() + (data.expires_in - 60) * 1000
  return _token
}

async function fsApi(params) {
  const token = await getToken()
  const url   = new URL('https://platform.fatsecret.com/rest/server.api')
  Object.entries({ ...params, format: 'json' }).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  )
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`FatSecret API error: ${res.status}`)
  return res.json()
}

// ─── GET /api/nutrition/search?q=pollo&page=0 ─────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { q, page = 0, max = 20 } = req.query
    console.log('[FatSecret] search:', q)
    if (!q?.trim()) return res.status(400).json({ error: 'q requerido' })

    const data = await fsApi({
      method:              'foods.search',
      search_expression:   q.trim(),
      page_number:         page,
      max_results:         Math.min(parseInt(max) || 20, 50),
    })

    const foods = data.foods?.food || []
    const list  = (Array.isArray(foods) ? foods : [foods]).map(f => ({
      id:          f.food_id,
      name:        f.food_name,
      brand:       f.brand_name || null,
      type:        f.food_type,
      description: f.food_description,
      // Parsear macros de la descripción (formato FatSecret)
      ...parseMacros(f.food_description),
    }))

    console.log('[FatSecret] resultados:', list.length)
    res.json({
      foods:       list,
      total:       parseInt(data.foods?.total_results || 0),
      page:        parseInt(page),
      hasMore:     (parseInt(page) + 1) * 20 < parseInt(data.foods?.total_results || 0),
    })
  } catch (err) {
    console.error('[FatSecret search] ERROR:', err.message, err.stack?.split('\n')[1])
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/nutrition/food/:id ──────────────────────────────────────────────
router.get('/food/:id', async (req, res) => {
  try {
    const data = await fsApi({ method: 'food.get.v4', food_id: req.params.id })
    const food = data.food
    if (!food) return res.status(404).json({ error: 'Alimento no encontrado' })

    // Extraer serving por defecto (100g o primera)
    const servings = food.servings?.serving
    const list     = Array.isArray(servings) ? servings : [servings].filter(Boolean)
    const serving  = list.find(s => s.serving_description?.includes('100g')) || list[0]

    res.json({
      id:       food.food_id,
      name:     food.food_name,
      brand:    food.brand_name || null,
      servings: list.map(s => ({
        id:          s.serving_id,
        description: s.serving_description,
        grams:       parseFloat(s.metric_serving_amount || 100),
        calories:    parseFloat(s.calories || 0),
        protein:     parseFloat(s.protein || 0),
        carbs:       parseFloat(s.carbohydrate || 0),
        fat:         parseFloat(s.fat || 0),
        fiber:       parseFloat(s.fiber || 0),
        sugar:       parseFloat(s.sugar || 0),
        sodium:      parseFloat(s.sodium || 0),
      })),
      default: serving ? {
        calories: parseFloat(serving.calories || 0),
        protein:  parseFloat(serving.protein || 0),
        carbs:    parseFloat(serving.carbohydrate || 0),
        fat:      parseFloat(serving.fat || 0),
      } : null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/nutrition/barcode/:code ─────────────────────────────────────────
router.get('/barcode/:code', async (req, res) => {
  try {
    // FatSecret primero
    try {
      const data = await fsApi({ method: 'food.find_id_for_barcode', barcode: req.params.code })
      if (data.food_id?.value) {
        const food = await fsApi({ method: 'food.get.v4', food_id: data.food_id.value })
        const f    = food.food
        const s    = food.food?.servings?.serving
        const srv  = Array.isArray(s) ? s[0] : s
        return res.json({
          source:   'fatsecret',
          id:       f?.food_id,
          name:     f?.food_name,
          brand:    f?.brand_name || null,
          calories: parseFloat(srv?.calories || 0),
          protein:  parseFloat(srv?.protein || 0),
          carbs:    parseFloat(srv?.carbohydrate || 0),
          fat:      parseFloat(srv?.fat || 0),
        })
      }
    } catch {}

    // Fallback: Open Food Facts (sin key, gratis)
    const off = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${req.params.code}.json`
    ).then(r => r.json())

    if (off.status === 1 && off.product) {
      const p = off.product
      const n = p.nutriments || {}
      return res.json({
        source:   'openfoodfacts',
        id:       req.params.code,
        name:     p.product_name || p.product_name_es || 'Desconocido',
        brand:    p.brands || null,
        calories: parseFloat(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
        protein:  parseFloat(n['proteins_100g'] || 0),
        carbs:    parseFloat(n['carbohydrates_100g'] || 0),
        fat:      parseFloat(n['fat_100g'] || 0),
      })
    }

    res.status(404).json({ error: 'Producto no encontrado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── HELPER: parsear macros del string de descripción FatSecret ───────────────
function parseMacros(desc) {
  if (!desc) return {}
  const cal  = desc.match(/Calories:\s*([\d.]+)/i)
  const fat  = desc.match(/Fat:\s*([\d.]+)/i)
  const carb = desc.match(/Carbs:\s*([\d.]+)/i)
  const prot = desc.match(/Protein:\s*([\d.]+)/i)
  return {
    calories: cal  ? parseFloat(cal[1])  : null,
    fat:      fat  ? parseFloat(fat[1])  : null,
    carbs:    carb ? parseFloat(carb[1]) : null,
    protein:  prot ? parseFloat(prot[1]) : null,
  }
}

module.exports = router
