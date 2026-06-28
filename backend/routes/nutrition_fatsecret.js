const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')

// ─── OAUTH 1.0 HELPER ────────────────────────────────────────────────────────
function oauthSign(method, url, params, secret) {
  const encoded = Object.keys(params).sort().map(k =>
    `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`
  ).join('&')
  const base = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(encoded)}`
  const key  = `${encodeURIComponent(secret)}&`
  return crypto.createHmac('sha1', key).update(base).digest('base64')
}

async function fsCall(method, extraParams = {}) {
  const clientId     = process.env.FATSECRET_CLIENT_ID
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('FatSecret credentials no configuradas')

  const url    = 'https://platform.fatsecret.com/rest/server.api'
  const nonce  = crypto.randomBytes(8).toString('hex')
  const ts     = Math.floor(Date.now() / 1000).toString()
  const params = {
    method, format:'json',
    oauth_consumer_key: clientId, oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: ts,
    oauth_version: '1.0', ...extraParams,
  }
  params.oauth_signature = oauthSign('GET', url, params, clientSecret)
  const qs  = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')
  const res = await fetch(`${url}?${qs}`)
  if (!res.ok) { const t = await res.text(); throw new Error(`FS ${res.status}: ${t.slice(0,200)}`) }
  return res.json()
}

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

// ─── BASE LOCAL ESPAÑOLA ─────────────────────────────────────────────────────
const LOCAL_ES = [
  { name:'Tortilla española',      calories:185, protein:10, carbs:10, fat:11, source:'local' },
  { name:'Gazpacho',               calories:45,  protein:1,  carbs:5,  fat:2,  source:'local' },
  { name:'Paella valenciana',      calories:180, protein:12, carbs:28, fat:3,  source:'local' },
  { name:'Jamón serrano',          calories:241, protein:30, carbs:0,  fat:14, source:'local' },
  { name:'Pollo a la plancha',     calories:165, protein:31, carbs:0,  fat:4,  source:'local' },
  { name:'Pechuga de pollo',       calories:158, protein:32, carbs:0,  fat:3,  source:'local' },
  { name:'Muslo de pollo asado',   calories:209, protein:25, carbs:0,  fat:11, source:'local' },
  { name:'Merluza al horno',       calories:90,  protein:18, carbs:0,  fat:2,  source:'local' },
  { name:'Salmón a la plancha',    calories:208, protein:22, carbs:0,  fat:13, source:'local' },
  { name:'Lentejas guisadas',      calories:116, protein:9,  carbs:20, fat:1,  source:'local' },
  { name:'Garbanzos cocidos',      calories:164, protein:9,  carbs:27, fat:3,  source:'local' },
  { name:'Arroz blanco cocido',    calories:130, protein:3,  carbs:28, fat:0,  source:'local' },
  { name:'Pan de trigo',           calories:265, protein:9,  carbs:50, fat:3,  source:'local' },
  { name:'Huevo entero',           calories:155, protein:13, carbs:1,  fat:11, source:'local' },
  { name:'Leche entera',           calories:61,  protein:3,  carbs:5,  fat:3,  source:'local' },
  { name:'Yogur natural',          calories:59,  protein:4,  carbs:4,  fat:3,  source:'local' },
  { name:'Queso manchego',         calories:392, protein:27, carbs:0,  fat:32, source:'local' },
  { name:'Aceite de oliva',        calories:884, protein:0,  carbs:0,  fat:100,source:'local' },
  { name:'Tomate fresco',          calories:18,  protein:1,  carbs:4,  fat:0,  source:'local' },
  { name:'Lechuga',                calories:15,  protein:1,  carbs:3,  fat:0,  source:'local' },
  { name:'Cebolla',                calories:40,  protein:1,  carbs:9,  fat:0,  source:'local' },
  { name:'Pimiento rojo',          calories:31,  protein:1,  carbs:6,  fat:0,  source:'local' },
  { name:'Patata cocida',          calories:86,  protein:2,  carbs:20, fat:0,  source:'local' },
  { name:'Zanahoria',              calories:41,  protein:1,  carbs:10, fat:0,  source:'local' },
  { name:'Plátano',                calories:89,  protein:1,  carbs:23, fat:0,  source:'local' },
  { name:'Manzana',                calories:52,  protein:0,  carbs:14, fat:0,  source:'local' },
  { name:'Naranja',                calories:47,  protein:1,  carbs:12, fat:0,  source:'local' },
  { name:'Almendras',              calories:579, protein:21, carbs:22, fat:50, source:'local' },
  { name:'Nueces',                 calories:654, protein:15, carbs:14, fat:65, source:'local' },
  { name:'Atún en lata',           calories:116, protein:26, carbs:0,  fat:1,  source:'local' },
  { name:'Sardinas en conserva',   calories:208, protein:25, carbs:0,  fat:11, source:'local' },
  { name:'Macarrones cocidos',     calories:158, protein:6,  carbs:31, fat:1,  source:'local' },
  { name:'Pan integral',           calories:247, protein:13, carbs:41, fat:4,  source:'local' },
  { name:'Chorizo',                calories:455, protein:25, carbs:2,  fat:38, source:'local' },
  { name:'Morcilla',               calories:376, protein:16, carbs:7,  fat:32, source:'local' },
  { name:'Bacalao salado',         calories:82,  protein:19, carbs:0,  fat:0,  source:'local' },
  { name:'Espinacas cocidas',      calories:23,  protein:3,  carbs:4,  fat:0,  source:'local' },
  { name:'Judías verdes cocidas',  calories:35,  protein:2,  carbs:8,  fat:0,  source:'local' },
  { name:'Berberechos al vapor',   calories:74,  protein:13, carbs:3,  fat:1,  source:'local' },
  { name:'Gambas cocidas',         calories:99,  protein:21, carbs:0,  fat:1,  source:'local' },
  { name:'Mejillones cocidos',     calories:86,  protein:12, carbs:4,  fat:2,  source:'local' },
  { name:'Caldo de pollo',         calories:15,  protein:2,  carbs:1,  fat:0,  source:'local' },
  { name:'Aceitunas',              calories:145, protein:1,  carbs:4,  fat:15, source:'local' },
  { name:'Pan tostado',            calories:334, protein:11, carbs:64, fat:3,  source:'local' },
  { name:'Café con leche',         calories:30,  protein:2,  carbs:3,  fat:1,  source:'local' },
  { name:'Zumo de naranja',        calories:45,  protein:1,  carbs:10, fat:0,  source:'local' },
  { name:'Avena',                  calories:389, protein:17, carbs:66, fat:7,  source:'local' },
  { name:'Quinoa cocida',          calories:120, protein:4,  carbs:21, fat:2,  source:'local' },
  { name:'Pavo a la plancha',      calories:135, protein:29, carbs:0,  fat:1,  source:'local' },
  { name:'Cerdo a la plancha',     calories:242, protein:27, carbs:0,  fat:14, source:'local' },
].map((f, i) => ({ ...f, id:`local_${i}`, brand:null, fiber:null }))

function searchLocal(q) {
  const lower = q.toLowerCase()
  return LOCAL_ES.filter(f => f.name.toLowerCase().includes(lower)).slice(0, 15)
}

// ─── GET /api/fs/search ───────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { q, page = 0, max = 20 } = req.query
    if (!q?.trim()) return res.status(400).json({ error: 'q requerido' })
    console.log('[FatSecret] search:', q)

    // Buscar en paralelo: local ES + FatSecret + comunidad (Supabase)
    const [localResults, fsResults, communityResults] = await Promise.allSettled([
      // 1. Local España — instantáneo
      Promise.resolve(searchLocal(q)),

      // 2. FatSecret
      fsCall('foods.search', {
        search_expression: q.trim(),
        page_number: String(page),
        max_results: String(Math.min(parseInt(max) || 20, 50)),
        language: 'es', region: 'ES',
      }).then(data => {
        const foods = data.foods?.food || []
        return (Array.isArray(foods) ? foods : [foods]).map(f => ({
          id:      `fs_${f.food_id}`,
          name:    f.food_name,
          brand:   f.brand_name || null,
          source:  'fatsecret',
          ...parseMacros(f.food_description),
        }))
      }).catch(() => []),

      // 3. Comunidad Supabase — si está configurado
      (async () => {
        try {
          const { createClient } = require('@supabase/supabase-js')
          const db = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
          )
          const { data } = await db.from('community_foods')
            .select('id,name,brand,calories,protein_g,carbs_g,fat_g,fiber_g,uses_count,verified')
            .ilike('name', `%${q}%`)
            .order('uses_count', { ascending: false })
            .limit(10)
          return (data || []).map(f => ({
            id:       `community_${f.id}`,
            name:     f.name,
            brand:    f.brand,
            source:   'community',
            calories: f.calories,
            protein:  f.protein_g,
            carbs:    f.carbs_g,
            fat:      f.fat_g,
            fiber:    f.fiber_g,
            verified: f.verified,
            uses:     f.uses_count,
          }))
        } catch { return [] }
      })(),
    ])

    const local     = localResults.status     === 'fulfilled' ? localResults.value     : []
    const fatsecret = fsResults.status        === 'fulfilled' ? fsResults.value        : []
    const community = communityResults.status === 'fulfilled' ? communityResults.value : []

    // Combinar: comunidad primero (verificado por usuarios), luego local ES, luego FatSecret
    const combined = [
      ...community,
      ...local,
      ...fatsecret,
    ]

    console.log(`[FatSecret] resultados: ${community.length} comunidad + ${local.length} local + ${fatsecret.length} fatsecret`)

    res.json({
      foods:   combined,
      sources: { community: community.length, local: local.length, fatsecret: fatsecret.length },
      total:   combined.length,
      page:    parseInt(page),
    })
  } catch (err) {
    console.error('[FatSecret search] ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/fs/community — añadir alimento a la comunidad ─────────────────
router.post('/community', async (req, res) => {
  try {
    const { name, brand, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, category } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name requerido' })

    // Obtener user_id del token
    const token = req.headers.authorization?.replace('Bearer ', '')
    let userId  = null
    if (token) {
      try {
        const { createClient } = require('@supabase/supabase-js')
        const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
        const { data: { user } } = await db.auth.getUser(token)
        userId = user?.id || null
      } catch {}
    }

    const { createClient } = require('@supabase/supabase-js')
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)

    const { data, error } = await db.from('community_foods').insert({
      name:        name.trim(),
      brand:       brand || null,
      calories:    parseFloat(calories) || 0,
      protein_g:   parseFloat(protein_g) || 0,
      carbs_g:     parseFloat(carbs_g) || 0,
      fat_g:       parseFloat(fat_g) || 0,
      fiber_g:     parseFloat(fiber_g) || 0,
      serving_size: parseFloat(serving_size) || 100,
      serving_unit: serving_unit || 'g',
      category:    category || null,
      created_by:  userId,
    }).select().single()

    if (error) throw error
    console.log('[Community] nuevo alimento:', name)
    res.json({ success: true, food: data })
  } catch (err) {
    console.error('[Community] ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/fs/community/:id/use — incrementar contador de uso ─────────────
router.post('/community/:id/use', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js')
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
    await db.rpc('increment_food_uses', { food_id: req.params.id })
    res.json({ success: true })
  } catch { res.json({ success: false }) }
})

// ─── GET /api/fs/barcode/:code ───────────────────────────────────────────────
router.get('/barcode/:code', async (req, res) => {
  try {
    try {
      const data = await fsCall('food.find_id_for_barcode', { barcode: req.params.code })
      if (data.food_id?.value) {
        const food = await fsCall('food.get.v4', { food_id: data.food_id.value })
        const f    = food.food
        const s    = Array.isArray(f?.servings?.serving) ? f.servings.serving[0] : f?.servings?.serving
        return res.json({
          source:'fatsecret', id:`fs_${f?.food_id}`, name:f?.food_name, brand:f?.brand_name||null,
          calories:parseFloat(s?.calories||0), protein:parseFloat(s?.protein||0),
          carbs:parseFloat(s?.carbohydrate||0), fat:parseFloat(s?.fat||0),
        })
      }
    } catch (e) { console.warn('[barcode] fallback OFF:', e.message) }

    const off = await fetch(`https://world.openfoodfacts.org/api/v0/product/${req.params.code}.json`).then(r => r.json())
    if (off.status === 1 && off.product) {
      const p = off.product, n = p.nutriments || {}
      return res.json({
        source:'openfoodfacts', id:req.params.code, name:p.product_name||'Desconocido', brand:p.brands||null,
        calories:parseFloat(n['energy-kcal_100g']||0), protein:parseFloat(n['proteins_100g']||0),
        carbs:parseFloat(n['carbohydrates_100g']||0), fat:parseFloat(n['fat_100g']||0),
      })
    }
    res.status(404).json({ error: 'Producto no encontrado' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
