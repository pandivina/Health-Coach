// ── ANALIZAR TAB ─────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, Check, RefreshCw, Search, Hash, X, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'

const MEAL_TYPES  = ['breakfast','lunch','dinner','snack']
const MEAL_LABELS = { breakfast:'Desayuno', lunch:'Comida', dinner:'Cena', snack:'Snack' }

// ─── OPEN FOOD FACTS: barcode ─────────────────────────────────────────────────

async function fetchByBarcode(code) {
  const res  = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${code}.json` +
    `?fields=product_name,nutriments,serving_size,brands,code,image_front_small_url`
  )
  const data = await res.json()
  if (data.status !== 1 || !data.product) throw new Error('Producto no encontrado')
  const p = data.product
  const n = p.nutriments || {}
  return {
    food_name:         (p.product_name || p.brands || 'Producto').trim(),
    brand:             p.brands || '',
    image:             p.image_front_small_url || null,
    serving_size:      p.serving_size || '100g',
    calories_per_100g: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
    protein_per_100g:  n.proteins_100g        ?? 0,
    carbs_per_100g:    n.carbohydrates_100g   ?? 0,
    fat_per_100g:      n.fat_100g             ?? 0,
    off_id:            p.code                 ?? code,
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

async function saveToHistory(userId, food) {
  if (!userId) return
  const { data } = await supabase.from('food_history')
    .select('id, use_count').eq('user_id', userId).eq('food_name', food.food_name).maybeSingle()
  if (data) {
    await supabase.from('food_history').update({
      use_count:    (data.use_count || 1) + 1,
      last_used_at: new Date().toISOString(),
    }).eq('id', data.id)
  } else {
    await supabase.from('food_history').insert({
      user_id: userId, food_name: food.food_name,
      calories_per_100g: food.calories_per_100g,
      protein_per_100g:  food.protein_per_100g,
      carbs_per_100g:    food.carbs_per_100g,
      fat_per_100g:      food.fat_per_100g,
      off_id:            food.off_id,
      use_count: 1, last_used_at: new Date().toISOString(),
    })
  }
}

// ─── SELECTOR DE PORCIÓN ──────────────────────────────────────────────────────

function PortionPicker({ food, mealType, setMealType, onConfirm, onBack, saving, theme }) {
  const [grams, setGrams] = useState('100')
  const g     = Math.max(parseFloat(grams) || 0, 0)
  const entry = calcEntry(food, g)
  const QUICK = [50, 100, 150, 200, 250]

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {/* Producto */}
      <div className="card flex items-center gap-3">
        {food.image
          ? <img src={food.image} alt={food.food_name}
              className="w-14 h-14 rounded-xl object-contain flex-shrink-0"
              style={{ background: theme.surface2 }} />
          : <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl"
              style={{ background: theme.surface2 }}>📦</div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: theme.text }}>{food.food_name}</p>
          {food.brand && <p className="text-xs" style={{ color: theme.textMuted }}>{food.brand}</p>}
          <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
            {Math.round(food.calories_per_100g)} kcal · P {Math.round(food.protein_per_100g)}g / 100g
          </p>
        </div>
      </div>

      {/* Cantidad */}
      <div className="card space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.textMuted }}>Cantidad</p>
        <div className="flex items-center gap-3">
          <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
            className="input text-center font-bold text-xl" style={{ maxWidth: 110 }} />
          <span className="font-medium" style={{ color: theme.textMuted }}>gramos</span>
        </div>
        <div className="flex gap-2">
          {QUICK.map(q => (
            <button key={q} onClick={() => setGrams(String(q))}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: grams === String(q) ? theme.primary : theme.surface2,
                color:      grams === String(q) ? '#fff' : theme.textMuted,
              }}>
              {q}g
            </button>
          ))}
        </div>
      </div>

      {/* Preview macros */}
      <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl" style={{ background: `${theme.primary}10` }}>
        {[
          { l: 'Kcal',   v: entry.calories  },
          { l: 'Prot',   v: entry.protein_g, u: 'g' },
          { l: 'Carbos', v: entry.carbs_g,   u: 'g' },
          { l: 'Grasa',  v: entry.fat_g,     u: 'g' },
        ].map(({ l, v, u = '' }) => (
          <div key={l} className="text-center">
            <p className="font-extrabold text-sm" style={{ color: theme.primary }}>{v}{u}</p>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Comida */}
      <div className="card space-y-2">
        <p className="text-sm font-medium" style={{ color: theme.text }}>¿En qué comida?</p>
        <div className="flex gap-2">
          {MEAL_TYPES.map(t => (
            <button key={t} onClick={() => setMealType(t)}
              className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: mealType === t ? theme.primary : theme.surface2,
                color:      mealType === t ? '#fff' : theme.textMuted,
              }}>
              {MEAL_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button onClick={onBack}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold"
          style={{ background: theme.surface2, color: theme.textMuted }}>
          ← Volver
        </button>
        <motion.button whileTap={{ scale: 0.96 }}
          onClick={() => onConfirm(entry)} disabled={g === 0 || saving}
          className="flex-2 px-6 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)', flex: 2 }}>
          {saving ? 'Guardando…' : <><Check size={14} className="inline mr-1.5" />Añadir al diario</>}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── ANALIZAR TAB (sin cambios) ───────────────────────────────────────────────

export function AnalizarTab({ onSaved }) {
  const { user, addXP } = useStore()
  const { theme } = useTheme()
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [mealType, setMealType] = useState('lunch')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function handleFile(file) {
    if (!file) return
    setError(''); setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  async function analyze() {
    if (!preview) return
    setAnalyzing(true); setError('')
    try {
      const base64    = preview.split(',')[1]
      const mediaType = preview.split(';')[0].split(':')[1]
      const data      = await api.nutrition.analyzePhoto(base64, mediaType)
      setResult(data)
    } catch { setError('No se pudo analizar la imagen. Asegúrate de que muestra claramente un plato o producto.') }
    finally { setAnalyzing(false) }
  }

  async function save() {
    if (!result || !user) return
    setSaving(true)
    try {
      await supabase.from('meal_logs').insert({
        user_id: user.id, date: new Date().toISOString().split('T')[0], meal_type: mealType,
        food_name: result.food_name, calories: result.calories || 0,
        protein_g: result.protein_g || 0, carbs_g: result.carbs_g || 0, fat_g: result.fat_g || 0,
      })
      addXP(15); onSaved()
    } catch (err) { setError('Error guardando: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="card" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
        <p className="font-semibold text-sm mb-1" style={{ color: theme.text }}>📸 Análisis por foto</p>
        <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
          Haz una foto clara de tu plato. La IA analizará los nutrientes automáticamente.
        </p>
      </div>

      {!preview ? (
        <div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click() }}
              className="card flex flex-col items-center gap-3 py-8 cursor-pointer active:scale-98 transition-all"
              style={{ borderStyle: 'dashed' }}>
              <Upload size={24} style={{ color: theme.textMuted }} />
              <p className="text-sm" style={{ color: theme.textMuted }}>Subir imagen</p>
            </button>
            <button onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click() }}
              className="card flex flex-col items-center gap-3 py-8 cursor-pointer active:scale-98 transition-all"
              style={{ borderStyle: 'dashed' }}>
              <Camera size={24} style={{ color: theme.primary }} />
              <p className="text-sm" style={{ color: theme.textMuted }}>Usar cámara</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={preview} alt="preview" className="w-full h-52 object-cover" />
            <button onClick={() => { setPreview(null); setResult(null); setError('') }}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
              <RefreshCw size={14} color="#fff" />
            </button>
          </div>
          {!result && (
            <button onClick={analyze} disabled={analyzing} className="btn-primary flex items-center justify-center gap-2">
              {analyzing
                ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Analizando con IA…</>
                : <><Camera size={16} /> Analizar plato</>}
            </button>
          )}
          {error && (
            <div className="card" style={{ background: `${theme.error}10`, border: `1px solid ${theme.error}20` }}>
              <p className="text-sm" style={{ color: theme.error }}>{error}</p>
            </div>
          )}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="card" style={{ background: `${theme.success}10`, border: `1px solid ${theme.success}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${theme.success}20` }}>
                      <Check size={12} style={{ color: theme.success }} />
                    </div>
                    <p className="font-semibold" style={{ color: theme.text }}>{result.food_name}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[['🔥',result.calories,'kcal'],['💪',result.protein_g,'g prot'],['🌾',result.carbs_g,'g carbs'],['🫒',result.fat_g,'g grasa']].map(([e,v,u]) => (
                      <div key={u} className="rounded-xl py-2" style={{ background: theme.surface2 }}>
                        <p className="text-lg">{e}</p>
                        <p className="font-bold text-sm" style={{ color: theme.text }}>{Math.round(v)}</p>
                        <p className="text-[9px]" style={{ color: theme.textMuted }}>{u}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card space-y-2">
                  <p className="text-sm font-medium" style={{ color: theme.text }}>¿Cuándo lo comiste?</p>
                  <div className="flex gap-2">
                    {MEAL_TYPES.map(t => (
                      <button key={t} onClick={() => setMealType(t)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{ background: mealType === t ? theme.primary : theme.surface2, color: mealType === t ? '#fff' : theme.textMuted }}>
                        {MEAL_LABELS[t]}
                      </button>
                    ))}
                  </div>
                  <button onClick={save} disabled={saving} className="btn-primary flex items-center justify-center gap-2 mt-2">
                    {saving ? 'Guardando…' : <><Check size={14} /> Guardar (+15 XP)</>}
                  </button>
                  <button onClick={() => { setPreview(null); setResult(null) }} className="btn-secondary text-sm py-2">
                    Analizar otra foto
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ─── BARCODE SCANNER (sin cambios) ───────────────────────────────────────────

function BarcodeScanner({ onDetected, onClose }) {
  const { theme } = useTheme()
  const videoRef = useRef(null)
  const rafRef   = useRef(null)
  const [status,    setStatus]    = useState('Iniciando cámara…')
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    let stream = null; let active = true
    async function start() {
      if (!('BarcodeDetector' in window)) {
        setSupported(false)
        setStatus('Tu navegador no soporta el escáner. Usa Chrome en Android.')
        return
      }
      try {
        const detector = new window.BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStatus('Apunta al código de barras')
        async function scan() {
          if (!active || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan); return
          }
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0 && active) {
              active = false; stream.getTracks().forEach(t => t.stop())
              onDetected(barcodes[0].rawValue); return
            }
          } catch {}
          rafRef.current = requestAnimationFrame(scan)
        }
        rafRef.current = requestAnimationFrame(scan)
      } catch (err) { setStatus('Error: ' + (err.message || 'No se pudo acceder a la cámara')) }
    }
    start()
    return () => {
      active = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      <div className="flex items-center justify-between p-4">
        <p className="text-white font-semibold">Escanear código</p>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} color="#fff" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        {supported ? (
          <>
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-gray-900">
              <video ref={videoRef} className="w-full h-64 object-cover" autoPlay playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-20 rounded-lg relative" style={{ border: `2px solid ${theme.primary}` }}>
                  <motion.div animate={{ top: ['0%','100%','0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-0.5" style={{ background: `${theme.primary}70` }} />
                </div>
              </div>
            </div>
            <p className="text-white/60 text-sm text-center">{status}</p>
          </>
        ) : (
          <div className="text-center px-4">
            <p className="text-white/60 text-sm mb-4">{status}</p>
            <button onClick={onClose} className="bg-white/10 text-white px-6 py-3 rounded-xl">Cerrar</button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── ESCANEAR TAB ─────────────────────────────────────────────────────────────

export function EscanearTab({ onSaved }) {
  const { user, addXP } = useStore()
  const { theme }       = useTheme()
  const [barcode,   setBarcode]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [product,   setProduct]   = useState(null)   // datos OFF per-100g
  const [mealType,  setMealType]  = useState('snack')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [scanning,  setScanning]  = useState(false)
  const nativeSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window

  async function lookup(code) {
    const q = (code || barcode).trim(); if (!q) return
    setLoading(true); setError(''); setProduct(null)
    try {
      const data = await fetchByBarcode(q)
      setProduct(data); setBarcode(q)
    } catch (e) {
      setError(e.message || 'Producto no encontrado. Prueba con otro código.')
    } finally { setLoading(false) }
  }

  async function handleConfirm(entry) {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('meal_logs').insert({
        user_id:   user.id,
        date:      new Date().toISOString().split('T')[0],
        meal_type: mealType,
        food_name: entry.food_name,
        calories:  entry.calories  || 0,
        protein_g: entry.protein_g || 0,
        carbs_g:   entry.carbs_g   || 0,
        fat_g:     entry.fat_g     || 0,
      })
      await saveToHistory(user.id, product)
      await addXP(10)
      onSaved()
    } catch (err) { setError('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      {scanning && (
        <BarcodeScanner
          onDetected={code => { setScanning(false); lookup(code) }}
          onClose={() => setScanning(false)}
        />
      )}

      <div className="space-y-4">
        <div className="card" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
          <p className="font-semibold text-sm mb-1" style={{ color: theme.text }}>📦 Escáner de código de barras</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {nativeSupported
              ? 'Escanea con la cámara o introduce el código manualmente.'
              : 'Introduce el código manualmente (Chrome en Android para escanear).'}
          </p>
        </div>

        {/* Si hay producto → mostrar PortionPicker */}
        <AnimatePresence mode="wait">
          {product ? (
            <PortionPicker
              key="picker"
              food={product}
              mealType={mealType}
              setMealType={setMealType}
              onConfirm={handleConfirm}
              onBack={() => { setProduct(null); setError('') }}
              saving={saving}
              theme={theme}
            />
          ) : (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Botón cámara */}
              {nativeSupported && (
                <button onClick={() => setScanning(true)}
                  className="w-full rounded-2xl py-4 flex items-center justify-center gap-3 active:scale-98 transition-all"
                  style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
                  <Camera size={22} color="#fff" />
                  <span className="text-white font-semibold">Escanear con cámara</span>
                </button>
              )}

              {/* Input manual */}
              <div className="flex gap-2">
                <input className="input flex-1" type="text" inputMode="numeric"
                  placeholder="Ej: 8410188030032"
                  value={barcode} onChange={e => setBarcode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookup()} />
                <button onClick={() => lookup()} disabled={loading || !barcode.trim()}
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all active:scale-90"
                  style={{ background: theme.primary }}>
                  {loading
                    ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    : <Search size={18} color="#fff" />}
                </button>
              </div>

              {error && (
                <div className="card" style={{ background: `${theme.error}10`, border: `1px solid ${theme.error}20` }}>
                  <p className="text-sm" style={{ color: theme.error }}>{error}</p>
                </div>
              )}

              {!error && !loading && (
                <div className="text-center py-8" style={{ color: theme.textMuted }}>
                  <Hash size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Escanea o introduce el código del producto</p>
                  <p className="text-xs mt-1 opacity-60">Base de datos Open Food Facts · 3M+ productos</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
