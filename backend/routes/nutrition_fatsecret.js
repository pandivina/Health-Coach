const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')

// ─── HELPER OAUTH 1.0 ─────────────────────────────────────────────────────────
// FatSecret OAuth 1.0 no requiere whitelist de IPs — ideal para Railway
function oauthSign(method, url, params, secret) {
  const encoded = Object.keys(params).sort().map(k =>
    `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`
  ).join('&')
  const base    = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(encoded)}`
  const key     = `${encodeURIComponent(secret)}&`
  return crypto.createHmac('sha1', key).update(base).digest('base64')
}

async function fsCall(method, extraParams = {}) {
  const clientId     = process.env.FATSECRET_CLIENT_ID
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('FatSecret credentials no configuradas en Railway')
  }

  const url    = 'https://platform.fatsecret.com/rest/server.api'
  const nonce  = crypto.randomBytes(8).toString('hex')
  const ts     = Math.floor(Date.now() / 1000).toString()

  const params = {
    method,
    format:                  'json',
    oauth_consumer_key:      clientId,
    oauth_nonce:             nonce,
    oauth_signature_method:  'HMAC-SHA1',
    oauth_timestamp:         ts,
    oauth_version:           '1.0',
    ...extraParams,
  }

  params.oauth_signature = oauthSign('GET', url, params, clientSecret)

  const qs  = Object.keys(params).sort().map(k =>
    `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`
  ).join('&')

  const res  = await fetch(`${url}?${qs}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`FatSecret error ${res.status}: ${text.slice(0,200)}`)
  }
  return res.json()
}

// ─── GET /api/fs/search?q=pollo&page=0&max=20 ────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { q, page = 0, max = 20 } = req.query
    if (!q?.trim()) return res.status(400).json({ error: 'q requerido' })

    console.log('[FatSecret OAuth1] search:', q)

    const data  = await fsCall('foods.search', {
      search_expression: q.trim(),
      page_number:       String(page),
      max_results:       String(Math.min(parseInt(max) || 20, 50)),
    })

    const foods = data.foods?.food || []
    const list  = (Array.isArray(foods) ? foods : [foods]).map(f => ({
      id:       f.food_id,
      name:     f.food_name,
      brand:    f.brand_name || null,
      type:     f.food_type,
      ...parseMacros(f.food_description),
    }))

    console.log('[FatSecret OAuth1] resultados:', list.length)
    res.json({ foods: list, total: parseInt(data.foods?.total_results || 0), page: parseInt(page) })
  } catch (err) {
    console.error('[FatSecret search] ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/fs/barcode/:code ───────────────────────────────────────────────
router.get('/barcode/:code', async (req, res) => {
  try {
    // Intentar FatSecret primero
    try {
      const data = await fsCall('food.find_id_for_barcode', { barcode: req.params.code })
      if (data.food_id?.value) {
        const food = await fsCall('food.get.v4', { food_id: data.food_id.value })
        const f    = food.food
        const s    = Array.isArray(f?.servings?.serving) ? f.servings.serving[0] : f?.servings?.serving
        return res.json({
          source:   'fatsecret',
          id:       f?.food_id,
          name:     f?.food_name,
          brand:    f?.brand_name || null,
          calories: parseFloat(s?.calories || 0),
          protein:  parseFloat(s?.protein  || 0),
          carbs:    parseFloat(s?.carbohydrate || 0),
          fat:      parseFloat(s?.fat || 0),
        })
      }
    } catch (e) {
      console.warn('[FatSecret barcode] fallback a OpenFoodFacts:', e.message)
    }

    // Fallback Open Food Facts
    const off = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${req.params.code}.json`
    ).then(r => r.json())

    if (off.status === 1 && off.product) {
      const p = off.product, n = p.nutriments || {}
      return res.json({
        source:   'openfoodfacts',
        id:       req.params.code,
        name:     p.product_name || 'Desconocido',
        brand:    p.brands || null,
        calories: parseFloat(n['energy-kcal_100g'] || 0),
        protein:  parseFloat(n['proteins_100g']    || 0),
        carbs:    parseFloat(n['carbohydrates_100g'] || 0),
        fat:      parseFloat(n['fat_100g'] || 0),
      })
    }
    res.status(404).json({ error: 'Producto no encontrado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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
