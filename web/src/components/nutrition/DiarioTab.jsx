import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CalorieTrendWidget from './CalorieTrendWidget'
import {
  Trash2, Flame,
  Search, X, Clock, ChevronRight, Loader2, Barcode
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'
import { searchLocal, FOOD_CATEGORIES, getFoodsByCategory, SPANISH_FOODS } from '../../lib/spanishFoods'
import { computeMealQuality, REACTION_CONFIG } from '../../lib/foodQuality'

const MEAL_TYPES  = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = { breakfast: '🌅 Desayuno', lunch: '☀️ Comida', dinner: '🌙 Cena', snack: '🍎 Snack' }

// ─── HELPERS DE AUTENTICACIÓN ─────────────────────────────────────────────────

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token}` }
}

// ─── FIX 2: searchOFF ahora usa backend FatSecret ────────────────────────────

async function searchOFF(query) {
  try {
    const headers = await authHeaders()
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/nutrition/search?q=${encodeURIComponent(query)}&page=0&max=50`,
      { headers, signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    // Convertir formato FatSecret al formato interno de DiarioTab
    return (data.foods || []).map(f => ({
      product_name: f.name,
      brands:       f.brand || '',
      code:         f.id,
      nutriments: {
        'energy-kcal_100g': f.calories || 0,
        proteins_100g:      f.protein  || 0,
        carbohydrates_100g: f.carbs    || 0,
        fat_100g:           f.fat      || 0,
      }
    }))
  } catch { return [] }
}

// ─── FIX 3: searchOFFByBarcode ahora usa backend (FatSecret + OFF fallback) ───

async function searchOFFByBarcode(barcode) {
  try {
    const headers = await authHeaders()
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/nutrition/barcode/${barcode}`,
      { headers }
    )
    if (!res.ok) return null
    const food = await res.json()
    // Convertir al formato que espera parseOFF
    return {
      product_name: food.name,
      brands:       food.brand || '',
      code:         barcode,
      nutriments: {
        'energy-kcal_100g': food.calories || 0,
        proteins_100g:      food.protein  || 0,
        carbohydrates_100g: food.carbs    || 0,
        fat_100g:           food.fat      || 0,
      }
    }
  } catch { return null }
}

function parseOFF(product) {
  const n = product.nutriments || {}
  return {
    food_name:         (product.product_name || product.brands || 'Producto').trim(),
    calories_per_100g: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
    protein_per_100g:  Math.round((n.proteins_100g      ?? 0) * 10) / 10,
    carbs_per_100g:    Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    fat_per_100g:      Math.round((n.fat_100g           ?? 0) * 10) / 10,
    off_id:            product.code            ?? null,
    image:             product.image_small_url ?? null,
    quantity:          product.quantity        ?? null,
    emoji:             '📦',
  }
}

function calcEntry(food, grams) {
  const r = grams / 100
  return {
    food_name: food.food_name,
    calories:  Math.round((food.calories_per_100g || 0) * r),
    protein_g: Math.round((food.protein_per_100g  || 0) * r * 10) / 10,
    carbs_g:   Math.round((food.carbs_per_100g    || 0) * r * 10) / 10,
    fat_g:     Math.round((food.fat_per_100g      || 0) * r * 10) / 10,
  }
}

// ─── MACROBAR ─────────────────────────────────────────────────────────────────

function MacroBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
        <span>{label}</span><span>{Math.round(value)}g / {max}g</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-3)' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  )
}

// ─── ESCÁNER DE CÓDIGO DE BARRAS ──────────────────────────────────────────────

function BarcodeScanner({ onResult, onClose, theme }) {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const [error,    setError]    = useState(null)
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')

  useEffect(() => { startCamera(); return () => stopCamera() }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      if ('BarcodeDetector' in window) startBarcodeDetection()
      else setScanning(true)
    } catch {
      setError('No se pudo acceder a la cámara. Introduce el código manualmente.')
    }
  }

  function stopCamera() { streamRef.current?.getTracks().forEach(t => t.stop()) }

  async function startBarcodeDetection() {
    const detector = new window.BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e'] })
    setScanning(true)
    const scan = async () => {
      if (!videoRef.current || !streamRef.current) return
      try {
        const barcodes = await detector.detect(videoRef.current)
        if (barcodes.length > 0) {
          stopCamera(); await handleBarcode(barcodes[0].rawValue); return
        }
      } catch {}
      requestAnimationFrame(scan)
    }
    requestAnimationFrame(scan)
  }

  async function handleBarcode(code) {
    setScanning(false)
    const product = await searchOFFByBarcode(code)
    if (product) { onResult(parseOFF(product)) }
    else { setError(`Código ${code} no encontrado en la base de datos.`) }
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-[60] flex flex-col" style={{ background:'#000' }}>

      <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
        background:'rgba(0,0,0,0.8)' }}>
        <button onClick={() => { stopCamera(); onClose() }}
          style={{ width:36, height:36, borderRadius:12, background:'rgba(255,255,255,0.15)',
            border:'none', cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', color:'white', fontSize:18 }}>←</button>
        <p style={{ color:'white', fontWeight:700, fontSize:16, margin:0 }}>
          Escanear código de barras
        </p>
      </div>

      <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center',
        justifyContent:'center' }}>
        {error ? (
          <div style={{ padding:24, textAlign:'center' }}>
            <p style={{ color:'#FF8FA3', marginBottom:16, fontSize:14 }}>{error}</p>
            <div style={{ display:'flex', gap:8, maxWidth:300, margin:'0 auto' }}>
              <input value={manualCode} onChange={e => setManualCode(e.target.value)}
                placeholder="Introduce el código EAN"
                onKeyDown={e => e.key==='Enter' && manualCode && handleBarcode(manualCode.trim())}
                style={{ flex:1, padding:'10px 14px', borderRadius:12,
                  border:'1px solid rgba(255,255,255,0.2)',
                  background:'rgba(255,255,255,0.1)', color:'white',
                  fontSize:14, outline:'none' }} />
              <button onClick={() => manualCode && handleBarcode(manualCode.trim())}
                style={{ padding:'10px 16px', borderRadius:12, background:'#2EC4B6',
                  border:'none', cursor:'pointer', color:'white', fontWeight:700 }}>
                Buscar
              </button>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted
              style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <div style={{ position:'absolute', inset:0, display:'flex',
              alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:280, height:160, border:'2px solid #2EC4B6',
                borderRadius:16, boxShadow:'0 0 0 2000px rgba(0,0,0,0.5)',
                position:'relative' }}>
                <motion.div
                  animate={{ y:[0, 140, 0] }}
                  transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
                  style={{ position:'absolute', left:0, right:0, height:2,
                    background:'linear-gradient(90deg, transparent, #2EC4B6, transparent)',
                    boxShadow:'0 0 8px #2EC4B6' }} />
              </div>
            </div>
            {scanning && !('BarcodeDetector' in window) && (
              <div style={{ position:'absolute', bottom:40, left:0, right:0, padding:'0 24px' }}>
                <div style={{ display:'flex', gap:8, maxWidth:300, margin:'0 auto' }}>
                  <input value={manualCode} onChange={e => setManualCode(e.target.value)}
                    placeholder="Introduce el código EAN"
                    onKeyDown={e => e.key==='Enter' && manualCode && handleBarcode(manualCode.trim())}
                    style={{ flex:1, padding:'10px 14px', borderRadius:12,
                      border:'1px solid rgba(255,255,255,0.2)',
                      background:'rgba(255,255,255,0.1)', color:'white',
                      fontSize:14, outline:'none' }} />
                  <button onClick={() => manualCode && handleBarcode(manualCode.trim())}
                    style={{ padding:'10px 16px', borderRadius:12, background:'#2EC4B6',
                      border:'none', cursor:'pointer', color:'white', fontWeight:700 }}>
                    OK
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}

// ─── SELECTOR DE CANTIDAD ─────────────────────────────────────────────────────

function PortionPicker({ food, onConfirm, onBack, theme }) {
  const [grams, setGrams] = useState('100')
  const g     = Math.max(parseFloat(grams) || 0, 0)
  const entry = calcEntry(food, g)
  const QUICK = [30, 50, 100, 150, 200]

  return (
    <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: theme.surface2 }}>
        {food.image
          ? <img src={food.image} alt={food.food_name}
              style={{ width:48, height:48, borderRadius:12, objectFit:'cover', flexShrink:0 }}
              onError={e => { e.target.style.display='none' }} />
          : <span style={{ fontSize:32, flexShrink:0 }}>{food.emoji || '🍽️'}</span>
        }
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>
            {food.food_name}
          </p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {food.calories_per_100g} kcal · P {food.protein_per_100g}g
            · C {food.carbs_per_100g}g · G {food.fat_per_100g}g / 100g
          </p>
          {food.quantity && (
            <p className="text-xs" style={{ color: theme.textMuted }}>📦 {food.quantity}</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: theme.textMuted }}>
          CANTIDAD (gramos)
        </p>
        <div className="flex items-center gap-3 mb-3">
          <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
            className="input text-center font-bold text-lg flex-1" style={{ maxWidth:110 }} />
          <span className="text-sm font-medium" style={{ color: theme.textMuted }}>g</span>
        </div>
        <div className="flex gap-2">
          {QUICK.map(q => (
            <button key={q} onClick={() => setGrams(String(q))}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: grams === String(q) ? theme.primary : theme.surface2,
                color:      grams === String(q) ? '#fff' : theme.textMuted,
              }}>{q}g</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl"
        style={{ background:`${theme.primary}10` }}>
        {[
          { l:'Kcal',   v:entry.calories,  unit:'' },
          { l:'Prot',   v:entry.protein_g, unit:'g' },
          { l:'Carbos', v:entry.carbs_g,   unit:'g' },
          { l:'Grasa',  v:entry.fat_g,     unit:'g' },
        ].map(({ l, v, unit }) => (
          <div key={l} className="text-center">
            <p className="font-extrabold text-sm" style={{ color: theme.primary }}>{v}{unit}</p>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-2xl text-sm font-semibold"
          style={{ background: theme.surface2, color: theme.textMuted }}>← Volver</button>
        <motion.button whileTap={{ scale:0.96 }} onClick={() => onConfirm(entry)}
          disabled={g === 0}
          className="flex-2 px-8 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)', flex:2 }}>
          Añadir ✓
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── ENTRADA MANUAL ───────────────────────────────────────────────────────────

function ManualForm({ onAdd, theme }) {
  const [form, setForm] = useState({
    food_name:'', calories:'', protein_g:'', carbs_g:'', fat_g:''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-3">
      <input className="input text-sm" placeholder="Nombre del alimento"
        value={form.food_name} onChange={e => set('food_name', e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-2">
        {[
          ['calories','Calorías (kcal)'],
          ['protein_g','Proteína (g)'],
          ['carbs_g','Carbos (g)'],
          ['fat_g','Grasa (g)'],
        ].map(([k, p]) => (
          <input key={k} className="input text-sm" type="number" placeholder={p}
            value={form[k]} onChange={e => set(k, e.target.value)} />
        ))}
      </div>
      <motion.button whileTap={{ scale:0.96 }}
        onClick={() => { if (form.food_name) onAdd(form) }}
        disabled={!form.food_name}
        className="w-full py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
        style={{ background:'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
        Añadir al diario
      </motion.button>
    </motion.div>
  )
}

// ─── FILA DE ALIMENTO ─────────────────────────────────────────────────────────

function FoodRow({ food, theme, onSelect, source }) {
  return (
    <motion.button whileTap={{ scale:0.98 }} onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
      style={{ background: theme.surface, border:`1px solid ${theme.border}` }}>
      {food.image
        ? <img src={food.image} alt={food.food_name}
            style={{ width:40, height:40, borderRadius:10, objectFit:'cover', flexShrink:0 }}
            onError={e => { e.target.style.display='none' }} />
        : null
      }
      <div style={{ width:40, height:40, borderRadius:10, background:theme.surface2,
        display: food.image ? 'none' : 'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, flexShrink:0 }}>
        {food.emoji || '🍽️'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>
            {food.food_name}
          </p>
          {source === 'local' && (
            <span style={{ fontSize:9, background:`${theme.primary}20`, color:theme.primary,
              padding:'1px 5px', borderRadius:6, fontWeight:700, flexShrink:0 }}>ES</span>
          )}
        </div>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          {Math.round(food.calories_per_100g||0)} kcal · P {Math.round(food.protein_per_100g||0)}g
          · C {Math.round(food.carbs_per_100g||0)}g · G {Math.round(food.fat_per_100g||0)}g
          <span style={{ color: theme.textLight }}> /100g</span>
        </p>
      </div>
      <ChevronRight size={14} style={{ color: theme.textLight, flexShrink:0 }} />
    </motion.button>
  )
}

// ─── MODAL BIBLIOTECA ─────────────────────────────────────────────────────────

function FoodModal({ mealType, userId, theme, onAdd, onClose }) {
  const [tab,          setTab]          = useState('search')
  const [query,        setQuery]        = useState('')
  const [offResults,   setOffResults]   = useState([])
  const [localResults, setLocalResults] = useState([])
  const [recent,       setRecent]       = useState([])
  const [loadingOFF,   setLoadingOFF]   = useState(false)
  const [selected,     setSelected]     = useState(null)
  const [showScanner,  setShowScanner]  = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const debounceRef = useRef(null)
  const inputRef    = useRef(null)

  useEffect(() => {
    if (!userId) return
    supabase.from('food_history').select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setRecent(data || []))
  }, [userId])

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200) }, [])

  useEffect(() => {
    if (query.length < 2) { setLocalResults([]); setOffResults([]); return }

    // Búsqueda local instantánea
    setLocalResults(searchLocal(query))

    // FatSecret con debounce
    clearTimeout(debounceRef.current)
    setLoadingOFF(true)
    debounceRef.current = setTimeout(async () => {
      const res = await searchOFF(query)
      setOffResults(res)
      setLoadingOFF(false)
    }, 600)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function saveToHistory(food) {
    if (!userId) return
    try {
      const { data } = await supabase.from('food_history').select('id, use_count')
        .eq('user_id', userId).eq('food_name', food.food_name).maybeSingle()
      if (data) {
        await supabase.from('food_history').update({
          use_count: (data.use_count||1) + 1,
          last_used_at: new Date().toISOString(),
        }).eq('id', data.id)
      } else {
        await supabase.from('food_history').insert({
          user_id: userId, ...food,
          use_count: 1, last_used_at: new Date().toISOString(),
        })
      }
    } catch {}
  }

  async function handleConfirm(entry) {
    if (selected) await saveToHistory(selected)
    onAdd(entry)
  }

  function handleManualAdd(form) {
    onAdd({
      food_name: form.food_name,
      calories:  parseFloat(form.calories)  || 0,
      protein_g: parseFloat(form.protein_g) || 0,
      carbs_g:   parseFloat(form.carbs_g)   || 0,
      fat_g:     parseFloat(form.fat_g)     || 0,
    })
  }

  function handleBarcodeResult(food) {
    setShowScanner(false)
    setSelected({ ...food, _mealType: mealType })
  }

  function selectFood(food, source) {
    setSelected({ ...food, _mealType: mealType, _source: source })
  }

  // Combinar: locales primero, OFF sin duplicados
  const combined = [
    ...localResults.map(f => ({ ...f, _source:'local' })),
    ...offResults
      .map(p => ({ ...parseOFF(p), _source:'off' }))
      .filter(f => !localResults.some(l =>
        l.food_name.toLowerCase() === f.food_name.toLowerCase()
      )),
  ]

  const categoryFoods = activeCategory ? getFoodsByCategory(activeCategory) : []

  if (showScanner) {
    return (
      <BarcodeScanner
        onResult={handleBarcodeResult}
        onClose={() => setShowScanner(false)}
        theme={theme} />
    )
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex flex-col" style={{ background: theme.bg }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom:`1px solid ${theme.border}` }}>
        <button
          onClick={
            selected        ? () => setSelected(null) :
            activeCategory  ? () => setActiveCategory(null) :
            onClose
          }
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: theme.surface2 }}>
          {selected || activeCategory
            ? <span style={{ fontSize:16 }}>←</span>
            : <X size={16} color={theme.textMuted} />
          }
        </button>
        <div className="flex-1">
          <p className="font-extrabold text-base" style={{ color: theme.text }}>
            {selected
              ? 'Cantidad'
              : activeCategory
                ? FOOD_CATEGORIES.find(c => c.id === activeCategory)?.label
                : `Añadir a ${MEAL_LABELS[mealType]}`
            }
          </p>
          {!selected && !activeCategory && (
            <p className="text-xs" style={{ color: theme.textMuted }}>
              Base española + millones de productos
            </p>
          )}
        </div>
        {!selected && (
          <button onClick={() => setShowScanner(true)}
            style={{ width:38, height:38, borderRadius:12,
              background:`${theme.primary}15`, border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Barcode size={18} style={{ color: theme.primary }} />
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {selected ? (
          <PortionPicker food={selected} onConfirm={handleConfirm}
            onBack={() => setSelected(null)} theme={theme} />

        ) : activeCategory ? (
          <div className="space-y-2">
            {categoryFoods.map(food => (
              <FoodRow key={`local-${food.food_name}`} food={food} theme={theme}
                source="local" onSelect={() => selectFood(food, 'local')} />
            ))}
          </div>

        ) : (
          <div className="space-y-4">
            {/* Tabs búsqueda / manual */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: theme.surface2 }}>
              {[['search','🔍 Buscar'],['manual','✏️ Manual']].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: tab === id ? theme.surface : 'transparent',
                    color:      tab === id ? theme.primary : theme.textMuted,
                    boxShadow:  tab === id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'manual' ? (
              <ManualForm onAdd={handleManualAdd} theme={theme} />
            ) : (
              <>
                {/* Barra búsqueda */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: theme.textMuted }} />
                  <input ref={inputRef} className="input pl-9 pr-9"
                    placeholder="Pollo, arroz, manzana…"
                    value={query} onChange={e => setQuery(e.target.value)} />
                  {query && (
                    <button onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X size={14} style={{ color: theme.textMuted }} />
                    </button>
                  )}
                </div>

                {/* Cargando */}
                {loadingOFF && localResults.length === 0 && (
                  <div className="flex items-center justify-center py-6 gap-2">
                    <Loader2 size={16} className="animate-spin" style={{ color: theme.primary }} />
                    <span className="text-sm" style={{ color: theme.textMuted }}>Buscando…</span>
                  </div>
                )}

                {/* Resultados */}
                {query.length >= 2 && combined.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: theme.textMuted }}>
                        Resultados ({combined.length})
                      </p>
                      {loadingOFF && (
                        <div className="flex items-center gap-1">
                          <Loader2 size={11} className="animate-spin"
                            style={{ color: theme.primary }} />
                          <span style={{ fontSize:10, color: theme.textMuted }}>
                            Buscando más…
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {combined.map(food => (
                        <FoodRow
                          key={`${food.food_name}-${food._source}`}
                          food={food} theme={theme} source={food._source}
                          onSelect={() => selectFood(food, food._source)} />
                      ))}
                    </div>
                    {combined.length === 0 && !loadingOFF && (
                      <div className="text-center py-6">
                        <p className="text-sm" style={{ color: theme.textMuted }}>
                          Sin resultados para «{query}»
                        </p>
                        <button onClick={() => setTab('manual')}
                          className="mt-2 text-sm font-semibold"
                          style={{ color: theme.primary }}>
                          Añadir manualmente →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Recientes */}
                {query.length < 2 && recent.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={13} style={{ color: theme.textMuted }} />
                      <p className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: theme.textMuted }}>Recientes</p>
                    </div>
                    <div className="space-y-1.5">
                      {recent.map(food => (
                        <FoodRow key={`history-${food.food_name}`} food={food} theme={theme}
                          source="history" onSelect={() => selectFood(food, 'history')} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorías */}
                {query.length < 2 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3"
                      style={{ color: theme.textMuted }}>
                      Explorar por categoría
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {FOOD_CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                          className="flex items-center gap-3 p-3 rounded-2xl text-left
                            transition-all active:scale-95"
                          style={{ background: theme.surface, border:`1px solid ${theme.border}` }}>
                          <span style={{ fontSize:24 }}>{cat.emoji}</span>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: theme.text }}>
                              {cat.label}
                            </p>
                            <p className="text-xs" style={{ color: theme.textMuted }}>
                              {SPANISH_FOODS.filter(f => f.category === cat.id).length} alimentos
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── DIARIO TAB ───────────────────────────────────────────────────────────────

export default function DiarioTab({ showAddModal, onCloseAddModal, onAnalyze, onScan, onSummaryChange }) {
  const { user, addXP } = useStore()
  const { theme }       = useTheme()
  const [meals, setMeals] = useState([])
  const [goals, setGoals] = useState({
    calories:2000, protein_g:150, carbs_g:200, fat_g:65
  })
  const [modal,        setModal]        = useState(null)
  const [lastReaction, setLastReaction] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    if (!user) return
    const [mealsRes, goalsRes] = await Promise.all([
      supabase.from('meal_logs').select('*')
        .eq('user_id', user.id).eq('date', today).order('created_at'),
      supabase.from('nutrition_goals').select('*')
        .eq('user_id', user.id).maybeSingle(),
    ])
    const loadedMeals = mealsRes.data || []
    const loadedGoals = goalsRes.data || goals
    setMeals(loadedMeals)
    if (goalsRes.data) setGoals(loadedGoals)
    onSummaryChange?.({
      caloriesConsumed: loadedMeals.reduce((s, m) => s + (m.calories  || 0), 0),
      caloriesTarget:   loadedGoals.calories  || 2000,
      proteinConsumed:  loadedMeals.reduce((s, m) => s + (m.protein_g || 0), 0),
      proteinTarget:    loadedGoals.protein_g || 150,
      carbsConsumed:    loadedMeals.reduce((s, m) => s + (m.carbs_g   || 0), 0),
      carbsTarget:      loadedGoals.carbs_g   || 200,
      fatConsumed:      loadedMeals.reduce((s, m) => s + (m.fat_g     || 0), 0),
      fatTarget:        loadedGoals.fat_g     || 65,
      lastMeal:         loadedMeals[loadedMeals.length - 1]?.food_name || null,
      mealsCount:       loadedMeals.length,
    })
  }

  useEffect(() => { load() }, [user])

  // Abrir modal Añadir desde Nutrition.jsx
  useEffect(() => {
    if (showAddModal) {
      setModal({ type: 'snack' })
      onCloseAddModal?.()
    }
  }, [showAddModal])

  async function addMeal(mealType, entry) {
    const quality = computeMealQuality(entry, meals, goals)

    // Optimistic update
    const optimisticMeal = {
      id:        `temp-${Date.now()}`,
      user_id:   user.id,
      date:      today,
      meal_type: mealType,
      food_name: entry.food_name,
      calories:  entry.calories  || 0,
      protein_g: entry.protein_g || 0,
      carbs_g:   entry.carbs_g   || 0,
      fat_g:     entry.fat_g     || 0,
      quality_score: quality.score,
      reaction:      quality.reaction,
    }
    setMeals(prev => [...prev, optimisticMeal])
    setModal(null)
    setLastReaction(quality)
    setTimeout(() => setLastReaction(null), 4000)

    // Guardar en BD
    await supabase.from('meal_logs').insert({
      user_id:   user.id,
      date:      today,
      meal_type: mealType,
      food_name: entry.food_name,
      calories:  entry.calories  || 0,
      protein_g: entry.protein_g || 0,
      carbs_g:   entry.carbs_g   || 0,
      fat_g:     entry.fat_g     || 0,
      quality_score: quality.score,
      reaction:      quality.reaction,
    })

    // Actualizar tummy_state
    const allQuality = [...meals.map(m => m.quality_score ?? 0.6), quality.score]
    const avg        = allQuality.reduce((s, q) => s + q, 0) / allQuality.length
    const tummyState = avg >= 0.75 ? 'great' : avg >= 0.5 ? 'good'
                     : avg >= 0.3 ? 'neutral' : avg >= 0.15 ? 'bad' : 'terrible'
    await supabase.from('user_profiles')
      .update({ tummy_state: tummyState }).eq('id', user.id)

    await addXP(10)
    load()
  }

  async function deleteMeal(id) {
    setMeals(prev => prev.filter(m => m.id !== id))
    await supabase.from('meal_logs').delete().eq('id', id)
    load()
  }

  async function quickAddFrequent(food) {
    await addMeal('snack', {
      food_name: food.food_name,
      calories:  Math.round(food.calories_per_100g || 0),
      protein_g: Math.round((food.protein_per_100g  || 0) * 10) / 10,
      carbs_g:   Math.round((food.carbs_per_100g    || 0) * 10) / 10,
      fat_g:     Math.round((food.fat_per_100g      || 0) * 10) / 10,
    })
  }

  const totalCals    = meals.reduce((s, m) => s + (m.calories  || 0), 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const totalCarbs   = meals.reduce((s, m) => s + (m.carbs_g   || 0), 0)
  const totalFat     = meals.reduce((s, m) => s + (m.fat_g     || 0), 0)
  const remaining    = Math.max(goals.calories - totalCals, 0)
  const calPct       = Math.min((totalCals / goals.calories) * 100, 100)

  return (
    <>
      <div className="space-y-4">

        <CalorieTrendWidget userId={user?.id} theme={theme} calorieGoal={goals.calories} />

        {/* Hero calorías */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          className="rounded-3xl p-5"
          style={{ background: theme.surface, border:`1px solid ${theme.border}` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider"
                style={{ color: theme.textMuted }}>Calorías hoy</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold" style={{ color: theme.text }}>
                  {Math.round(totalCals)}
                </span>
                <span className="text-sm" style={{ color: theme.textMuted }}>
                  / {goals.calories} kcal
                </span>
              </div>
              <p className="text-sm mt-1 font-medium"
                style={{ color: remaining > 0 ? theme.success : theme.error }}>
                {remaining > 0
                  ? `${remaining} kcal restantes`
                  : `${Math.abs(Math.round(totalCals - goals.calories))} kcal superadas`}
              </p>
            </div>
            <div className="w-14 h-14 relative">
              <svg viewBox="0 0 56 56" className="-rotate-90 w-full h-full">
                <circle cx="28" cy="28" r="22" fill="none"
                  stroke={`${theme.primary}20`} strokeWidth="5" />
                <motion.circle cx="28" cy="28" r="22" fill="none"
                  stroke={theme.primary} strokeWidth="5"
                  strokeDasharray={2*Math.PI*22} strokeLinecap="round"
                  initial={{ strokeDashoffset:2*Math.PI*22 }}
                  animate={{ strokeDashoffset:2*Math.PI*22*(1 - calPct/100) }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame size={14} style={{ color: theme.primary }} />
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-3" style={{ borderTop:`1px solid ${theme.border}` }}>
            <MacroBar label="Proteína" value={totalProtein} max={goals.protein_g} color={theme.primary} />
            <MacroBar label="Carbos"   value={totalCarbs}   max={goals.carbs_g}   color={theme.warning} />
            <MacroBar label="Grasa"    value={totalFat}     max={goals.fat_g}     color={theme.success} />
          </div>
        </motion.div>



        {/* Comidas por tipo */}
        {MEAL_TYPES.map(type => {
          const typeMeals = meals.filter(m => m.meal_type === type)
          const typeCals  = typeMeals.reduce((s, m) => s + m.calories, 0)
          return (
            <div key={type} className="card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm" style={{ color: theme.text }}>
                    {MEAL_LABELS[type]}
                  </p>
                  {typeCals > 0 && (
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      {Math.round(typeCals)} kcal
                    </p>
                  )}
                </div>
                <button onClick={() => setModal({ type })}
                  className="w-7 h-7 rounded-lg flex items-center justify-center
                    active:scale-90 transition-all"
                  style={{ background:`${theme.primary}20` }}>
                  <Plus size={14} style={{ color: theme.primary }} />
                </button>
              </div>
              {typeMeals.map(m => (
                <div key={m.id} className="flex items-center justify-between py-1.5"
                  style={{ borderTop:`1px solid ${theme.border}` }}>
                  <div>
                    <p className="text-sm" style={{ color: theme.text }}>{m.food_name}</p>
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      {m.calories} kcal · P:{m.protein_g}g · C:{m.carbs_g}g · G:{m.fat_g}g
                    </p>
                  </div>
                  <button onClick={() => deleteMeal(m.id)} className="p-1"
                    style={{ color: theme.textLight }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {typeMeals.length === 0 && (
                <p className="text-xs py-1" style={{ color: theme.textLight }}>
                  Sin registros
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal biblioteca */}
      <AnimatePresence>
        {modal && (
          <FoodModal
            mealType={modal.type}
            userId={user?.id}
            theme={theme}
            onAdd={(entry) => addMeal(modal.type, entry)}
            onClose={() => setModal(null)} />
        )}
      </AnimatePresence>

      {/* Toast reacción nutricional */}
      <AnimatePresence>
        {lastReaction && (
          <motion.div
            initial={{ opacity:0, y:20, x:'-50%' }}
            animate={{ opacity:1, y:0,  x:'-50%' }}
            exit={{   opacity:0, y:20 }}
            style={{ position:'fixed', bottom:100, left:'50%', zIndex:60,
              background:'white', borderRadius:18, padding:'12px 18px',
              boxShadow:'0 8px 24px rgba(0,0,0,0.15)',
              display:'flex', alignItems:'center', gap:10,
              border:`1.5px solid ${REACTION_CONFIG[lastReaction.reaction]?.color}40` }}>
            <span style={{ fontSize:24 }}>
              {REACTION_CONFIG[lastReaction.reaction]?.emoji}
            </span>
            <p style={{ fontSize:13, fontWeight:700, color:'#1A2332', margin:0 }}>
              {REACTION_CONFIG[lastReaction.reaction]?.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
