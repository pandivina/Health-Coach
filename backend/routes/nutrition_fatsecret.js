const express        = require('express')
const router         = express.Router()
const crypto         = require('crypto')
const { calcNutriScore } = require('../lib/nutriscore')

// ─── SUPABASE LAZY ────────────────────────────────────────────────────────────
let _db = null
function getDB() {
  if (_db) return _db
  const { createClient } = require('@supabase/supabase-js')
  _db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  )
  return _db
}

// ─── OAUTH 1.0 ────────────────────────────────────────────────────────────────
function oauthSign(method, url, params, secret) {
  const encoded = Object.keys(params).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')
  const base = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(encoded)}`
  return crypto.createHmac('sha1', `${encodeURIComponent(secret)}&`).update(base).digest('base64')
}

async function fsCall(method, extra = {}) {
  const id  = process.env.FATSECRET_CLIENT_ID
  const sec = process.env.FATSECRET_CLIENT_SECRET
  if (!id || !sec) throw new Error('FatSecret credentials no configuradas')
  const url    = 'https://platform.fatsecret.com/rest/server.api'
  const nonce  = crypto.randomBytes(8).toString('hex')
  const ts     = Math.floor(Date.now() / 1000).toString()
  const params = { method, format:'json', oauth_consumer_key:id, oauth_nonce:nonce,
    oauth_signature_method:'HMAC-SHA1', oauth_timestamp:ts, oauth_version:'1.0', ...extra }
  params.oauth_signature = oauthSign('GET', url, params, sec)
  const qs  = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')
  const res = await fetch(`${url}?${qs}`)
  if (!res.ok) { const t = await res.text(); throw new Error(`FS ${res.status}: ${t.slice(0,200)}`) }
  return res.json()
}

function parseMacros(desc) {
  if (!desc) return {}
  const m = (re) => { const r = desc.match(re); return r ? parseFloat(r[1]) : null }
  return {
    calories: m(/Calories:\s*([\d.]+)/i),
    fat:      m(/Fat:\s*([\d.]+)/i),
    carbs:    m(/Carbs:\s*([\d.]+)/i),
    protein:  m(/Protein:\s*([\d.]+)/i),
  }
}

// ─── BASE LOCAL ESPAÑOLA ─────────────────────────────────────────────────────
const LOCAL_ES = [
  { name:'Tortilla española',      calories:185, protein:10, carbs:10, fat:11, fiber:0.5 },
  { name:'Gazpacho',               calories:45,  protein:1,  carbs:5,  fat:2,  fiber:1   },
  { name:'Paella valenciana',      calories:180, protein:12, carbs:28, fat:3,  fiber:1   },
  { name:'Jamón serrano',          calories:241, protein:30, carbs:0,  fat:14, fiber:0   },
  { name:'Pollo a la plancha',     calories:165, protein:31, carbs:0,  fat:4,  fiber:0   },
  { name:'Pechuga de pollo',       calories:158, protein:32, carbs:0,  fat:3,  fiber:0   },
  { name:'Muslo de pollo asado',   calories:209, protein:25, carbs:0,  fat:11, fiber:0   },
  { name:'Merluza al horno',       calories:90,  protein:18, carbs:0,  fat:2,  fiber:0   },
  { name:'Salmón a la plancha',    calories:208, protein:22, carbs:0,  fat:13, fiber:0   },
  { name:'Lentejas guisadas',      calories:116, protein:9,  carbs:20, fat:1,  fiber:8   },
  { name:'Garbanzos cocidos',      calories:164, protein:9,  carbs:27, fat:3,  fiber:8   },
  { name:'Arroz blanco cocido',    calories:130, protein:3,  carbs:28, fat:0,  fiber:0.3 },
  { name:'Pan de trigo',           calories:265, protein:9,  carbs:50, fat:3,  fiber:2.3 },
  { name:'Huevo entero',           calories:155, protein:13, carbs:1,  fat:11, fiber:0   },
  { name:'Leche entera',           calories:61,  protein:3,  carbs:5,  fat:3,  fiber:0   },
  { name:'Yogur natural',          calories:59,  protein:4,  carbs:4,  fat:3,  fiber:0   },
  { name:'Queso manchego',         calories:392, protein:27, carbs:0,  fat:32, fiber:0   },
  { name:'Aceite de oliva',        calories:884, protein:0,  carbs:0,  fat:100,fiber:0   },
  { name:'Tomate fresco',          calories:18,  protein:1,  carbs:4,  fat:0,  fiber:1.2 },
  { name:'Lechuga',                calories:15,  protein:1,  carbs:3,  fat:0,  fiber:1.3 },
  { name:'Cebolla',                calories:40,  protein:1,  carbs:9,  fat:0,  fiber:1.7 },
  { name:'Pimiento rojo',          calories:31,  protein:1,  carbs:6,  fat:0,  fiber:2.1 },
  { name:'Patata cocida',          calories:86,  protein:2,  carbs:20, fat:0,  fiber:1.8 },
  { name:'Zanahoria',              calories:41,  protein:1,  carbs:10, fat:0,  fiber:2.8 },
  { name:'Plátano',                calories:89,  protein:1,  carbs:23, fat:0,  fiber:2.6 },
  { name:'Manzana',                calories:52,  protein:0,  carbs:14, fat:0,  fiber:2.4 },
  { name:'Naranja',                calories:47,  protein:1,  carbs:12, fat:0,  fiber:2.4 },
  { name:'Almendras',              calories:579, protein:21, carbs:22, fat:50, fiber:12.5},
  { name:'Nueces',                 calories:654, protein:15, carbs:14, fat:65, fiber:6.7 },
  { name:'Atún en lata',           calories:116, protein:26, carbs:0,  fat:1,  fiber:0   },
  { name:'Sardinas en conserva',   calories:208, protein:25, carbs:0,  fat:11, fiber:0   },
  { name:'Macarrones cocidos',     calories:158, protein:6,  carbs:31, fat:1,  fiber:1.8 },
  { name:'Pan integral',           calories:247, protein:13, carbs:41, fat:4,  fiber:7   },
  { name:'Chorizo',                calories:455, protein:25, carbs:2,  fat:38, fiber:0   },
  { name:'Morcilla',               calories:376, protein:16, carbs:7,  fat:32, fiber:0   },
  { name:'Bacalao salado',         calories:82,  protein:19, carbs:0,  fat:0,  fiber:0   },
  { name:'Espinacas cocidas',      calories:23,  protein:3,  carbs:4,  fat:0,  fiber:2.2 },
  { name:'Judías verdes cocidas',  calories:35,  protein:2,  carbs:8,  fat:0,  fiber:3.4 },
  { name:'Gambas cocidas',         calories:99,  protein:21, carbs:0,  fat:1,  fiber:0   },
  { name:'Mejillones cocidos',     calories:86,  protein:12, carbs:4,  fat:2,  fiber:0   },
  { name:'Aceitunas',              calories:145, protein:1,  carbs:4,  fat:15, fiber:3.3 },
  { name:'Avena',                  calories:389, protein:17, carbs:66, fat:7,  fiber:10.6},
  { name:'Quinoa cocida',          calories:120, protein:4,  carbs:21, fat:2,  fiber:2.8 },
  { name:'Pavo a la plancha',      calories:135, protein:29, carbs:0,  fat:1,  fiber:0   },
  { name:'Cerdo a la plancha',     calories:242, protein:27, carbs:0,  fat:14, fiber:0   },
  { name:'Berberechos al vapor',   calories:74,  protein:13, carbs:3,  fat:1,  fiber:0   },
  { name:'Caldo de pollo',         calories:15,  protein:2,  carbs:1,  fat:0,  fiber:0   },
  { name:'Pan tostado',            calories:334, protein:11, carbs:64, fat:3,  fiber:2.8 },
  { name:'Zumo de naranja',        calories:45,  protein:1,  carbs:10, fat:0,  fiber:0.2 },
  { name:'Café con leche',         calories:30,  protein:2,  carbs:3,  fat:1,  fiber:0   },
].map((f, i) => ({
  ...f, id:`local_${i}`, brand:null, source:'local',
  nutriScore: calcNutriScore(f),
}))

function searchLocal(q) {
  return LOCAL_ES.filter(f => f.name.toLowerCase().includes(q.toLowerCase())).slice(0,15)
}

// ─── GET /api/fs/search ───────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { q, page=0, max=20, brand } = req.query
    if (!q?.trim()) return res.status(400).json({ error:'q requerido' })
    console.log('[FS] search:', q, brand ? `(marca: ${brand})` : '')

    const [localR, fsR, communityR] = await Promise.allSettled([

      // 1. Local ES
      Promise.resolve(searchLocal(q)),

      // 2. FatSecret
      fsCall('foods.search', {
        search_expression: q.trim(),
        page_number: String(page),
        max_results:  String(Math.min(parseInt(max)||20, 50)),
        language:'es', region:'ES',
      }).then(data => {
        const foods = data.foods?.food || []
        return (Array.isArray(foods) ? foods : [foods]).map(f => {
          const macros = parseMacros(f.food_description)
          return {
            id: `fs_${f.food_id}`, name: f.food_name,
            brand: f.brand_name || null, source:'fatsecret',
            ...macros,
            nutriScore: macros.calories !== null
              ? calcNutriScore({ calories:macros.calories||0, protein:macros.protein||0, carbs:macros.carbs||0, fat:macros.fat||0 })
              : null,
          }
        })
      }).catch(() => []),

      // 3. Comunidad
      (async () => {
        try {
          const db    = getDB()
          let query = db.from('community_foods')
            .select('id,name,brand,calories,protein_g,carbs_g,fat_g,fiber_g,uses_count,verified')
            .ilike('name', `%${q}%`)
            .order('uses_count', { ascending:false })
            .limit(10)
          if (brand) query = query.ilike('brand', `%${brand}%`)
          const { data } = await query
          return (data||[]).map(f => ({
            id:`community_${f.id}`, name:f.name, brand:f.brand, source:'community',
            calories:f.calories, protein:f.protein_g, carbs:f.carbs_g, fat:f.fat_g, fiber:f.fiber_g,
            verified:f.verified, uses:f.uses_count,
            nutriScore: calcNutriScore({ calories:f.calories||0, protein:f.protein_g||0, carbs:f.carbs_g||0, fat:f.fat_g||0, fiber:f.fiber_g||0 }),
          }))
        } catch { return [] }
      })(),
    ])

    let local     = localR.status==='fulfilled'     ? localR.value     : []
    let fatsecret = fsR.status==='fulfilled'         ? fsR.value        : []
    let community = communityR.status==='fulfilled'  ? communityR.value : []

    // Filtrar por marca si se especifica
    if (brand) {
      const b = brand.toLowerCase()
      fatsecret = fatsecret.filter(f => f.brand?.toLowerCase().includes(b))
      local     = local.filter(f => f.brand?.toLowerCase().includes(b))
    }

    // Extraer marcas únicas para el filtro del frontend
    const allFoods = [...community, ...local, ...fatsecret]
    const brands   = [...new Set(allFoods.map(f => f.brand).filter(Boolean))].sort()

    console.log(`[FS] ${community.length} comunidad + ${local.length} local + ${fatsecret.length} fatsecret`)

    res.json({
      foods:   allFoods,
      brands,
      sources: { community:community.length, local:local.length, fatsecret:fatsecret.length },
      total:   allFoods.length,
      page:    parseInt(page),
    })
  } catch (err) {
    console.error('[FS search]', err.message)
    res.status(500).json({ error:err.message })
  }
})

// ─── POST /api/fs/community ───────────────────────────────────────────────────
router.post('/community', async (req, res) => {
  try {
    const { name, brand, calories, protein_g, carbs_g, fat_g, fiber_g, serving_size, serving_unit, category } = req.body
    if (!name?.trim()) return res.status(400).json({ error:'name requerido' })
    const token = req.headers.authorization?.replace('Bearer ','')
    let userId = null
    if (token) {
      try { const { data:{ user } } = await getDB().auth.getUser(token); userId = user?.id } catch {}
    }
    const { data, error } = await getDB().from('community_foods').insert({
      name:name.trim(), brand:brand||null,
      calories:parseFloat(calories)||0, protein_g:parseFloat(protein_g)||0,
      carbs_g:parseFloat(carbs_g)||0, fat_g:parseFloat(fat_g)||0,
      fiber_g:parseFloat(fiber_g)||0, serving_size:parseFloat(serving_size)||100,
      serving_unit:serving_unit||'g', category:category||null, created_by:userId,
    }).select().single()
    if (error) throw error
    res.json({ success:true, food:data })
  } catch (err) { res.status(500).json({ error:err.message }) }
})

// ─── POST /api/fs/community/:id/use ──────────────────────────────────────────
router.post('/community/:id/use', async (req, res) => {
  try {
    await getDB().rpc('increment_food_uses', { food_id:req.params.id })
    res.json({ success:true })
  } catch { res.json({ success:false }) }
})

// ─── GET /api/fs/barcode/:code ────────────────────────────────────────────────
router.get('/barcode/:code', async (req, res) => {
  try {
    try {
      const data = await fsCall('food.find_id_for_barcode', { barcode:req.params.code })
      if (data.food_id?.value) {
        const food = await fsCall('food.get.v4', { food_id:data.food_id.value })
        const f    = food.food
        const s    = Array.isArray(f?.servings?.serving) ? f.servings.serving[0] : f?.servings?.serving
        const macros = { calories:parseFloat(s?.calories||0), protein:parseFloat(s?.protein||0), carbs:parseFloat(s?.carbohydrate||0), fat:parseFloat(s?.fat||0) }
        return res.json({ source:'fatsecret', id:`fs_${f?.food_id}`, name:f?.food_name, brand:f?.brand_name||null,
          ...macros, nutriScore: calcNutriScore(macros) })
      }
    } catch {}
    const off = await fetch(`https://world.openfoodfacts.org/api/v0/product/${req.params.code}.json`).then(r=>r.json())
    if (off.status===1 && off.product) {
      const p = off.product, n = p.nutriments||{}
      const macros = { calories:parseFloat(n['energy-kcal_100g']||0), protein:parseFloat(n['proteins_100g']||0), carbs:parseFloat(n['carbohydrates_100g']||0), fat:parseFloat(n['fat_100g']||0), fiber:parseFloat(n['fiber_100g']||0), sugar:parseFloat(n['sugars_100g']||0) }
      return res.json({ source:'openfoodfacts', id:req.params.code, name:p.product_name||'Desconocido', brand:p.brands||null,
        ...macros, nutriScoreGrade: p.nutriscore_grade?.toUpperCase() || null,
        nutriScore: p.nutriscore_grade ? { grade:p.nutriscore_grade.toUpperCase(), estimated:false } : calcNutriScore(macros) })
    }
    res.status(404).json({ error:'Producto no encontrado' })
  } catch (err) { res.status(500).json({ error:err.message }) }
})

module.exports = router
