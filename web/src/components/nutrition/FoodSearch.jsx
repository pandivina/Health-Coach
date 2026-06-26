// web/src/components/nutrition/FoodSearch.jsx
// Buscador FatSecret con escáner de código de barras
// Uso: <FoodSearch onSelect={(food) => addMeal(food)} />

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Barcode, Loader } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'
import { supabase } from '../../lib/supabase'

const API = import.meta.env.VITE_API_URL

async function authFetch(path) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ─── RESULTADO DE BÚSQUEDA ────────────────────────────────────────────────────
function FoodResult({ food, onSelect, theme }) {
  return (
    <motion.button whileTap={{ scale:0.98 }} onClick={() => onSelect(food)}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:12,
        padding:'12px 14px', borderRadius:16, border:'none', cursor:'pointer',
        textAlign:'left', background: theme.surface || '#F9FAFB',
        borderBottom:`1px solid ${theme.border || 'rgba(0,0,0,0.06)'}` }}>
      <div style={{ width:40, height:40, borderRadius:12, flexShrink:0,
        background: theme.primary + '18',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
        🍽️
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:700, color: theme.text,
          margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {food.name}
        </p>
        <p style={{ fontSize:11, color: theme.textMuted, margin:'2px 0 0' }}>
          {food.brand ? `${food.brand} · ` : ''}
          {food.calories != null ? `${Math.round(food.calories)} kcal` : ''}
          {food.protein  != null ? ` · ${food.protein}g prot` : ''}
        </p>
      </div>
      <span style={{ fontSize:11, color: theme.primary, fontWeight:700,
        flexShrink:0 }}>+</span>
    </motion.button>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function FoodSearch({ onSelect, onClose, placeholder }) {
  const { theme }             = useTheme()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [page,    setPage]    = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const inputRef = useRef(null)
  const debounce = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleChange(val) {
    setQuery(val)
    clearTimeout(debounce.current)
    if (!val.trim()) { setResults([]); return }
    debounce.current = setTimeout(() => search(val, 0), 500)
  }

  async function search(q, p = 0) {
    setLoading(true); setError(null)
    if (p === 0) setResults([])
    try {
      const data = await authFetch(
        `/api/nutrition/search?q=${encodeURIComponent(q)}&page=${p}`
      )
      setResults(prev => p === 0 ? data.foods : [...prev, ...data.foods])
      setHasMore(data.hasMore)
      setPage(p)
    } catch (err) {
      setError('Error buscando. Inténtalo de nuevo.')
    } finally { setLoading(false) }
  }

  async function scanBarcode() {
    // Usar la cámara del navegador via BarcodeDetector API o input file
    try {
      if ('BarcodeDetector' in window) {
        const bd      = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] })
        const stream  = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        const video   = document.createElement('video')
        video.srcObject = stream; await video.play()

        const scan = setInterval(async () => {
          try {
            const codes = await bd.detect(video)
            if (codes.length > 0) {
              clearInterval(scan); stream.getTracks().forEach(t => t.stop())
              await lookupBarcode(codes[0].rawValue)
            }
          } catch {}
        }, 500)
        setTimeout(() => { clearInterval(scan); stream.getTracks().forEach(t => t.stop()) }, 15000)
      } else {
        // Fallback: input de texto para código manual
        const code = prompt('Introduce el código de barras:')
        if (code) await lookupBarcode(code.trim())
      }
    } catch {
      alert('No se pudo acceder a la cámara')
    }
  }

  async function lookupBarcode(code) {
    setLoading(true); setError(null)
    try {
      const food = await authFetch(`/api/nutrition/barcode/${code}`)
      setResults([food])
      setQuery(food.name)
    } catch {
      setError('Producto no encontrado en la base de datos')
    } finally { setLoading(false) }
  }

  function handleSelect(food) {
    onSelect({
      food_name: food.name,
      calories:  food.calories  || 0,
      protein_g: food.protein   || 0,
      carbs_g:   food.carbs     || 0,
      fat_g:     food.fat       || 0,
      source:    food.source    || 'fatsecret',
      food_id:   food.id,
    })
    onClose?.()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Barra de búsqueda */}
      <div style={{ display:'flex', gap:8, padding:'0 0 12px' }}>
        <div style={{ flex:1, position:'relative' }}>
          <Search size={16} style={{ position:'absolute', left:12, top:'50%',
            transform:'translateY(-50%)', color: theme.textMuted }} />
          <input ref={inputRef} value={query} onChange={e => handleChange(e.target.value)}
            placeholder={placeholder || 'Buscar alimento…'}
            style={{ width:'100%', padding:'11px 12px 11px 38px', borderRadius:14,
              border:`1.5px solid ${theme.border || 'rgba(0,0,0,0.1)'}`,
              fontSize:14, outline:'none', background: theme.surface || 'white',
              color: theme.text, boxSizing:'border-box' }} />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer' }}>
              <X size={14} color={theme.textMuted} />
            </button>
          )}
        </div>

        {/* Botón escáner */}
        <motion.button whileTap={{ scale:0.93 }} onClick={scanBarcode}
          style={{ width:44, height:44, borderRadius:14, border:'none', cursor:'pointer',
            background: theme.primary + '18', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Barcode size={20} color={theme.primary} />
        </motion.button>
      </div>

      {/* Estado */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'20px 0' }}>
          <Loader size={20} color={theme.primary} style={{ animation:'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {error && (
        <p style={{ fontSize:13, color:'#EF4444', textAlign:'center',
          padding:'12px 0', margin:0 }}>{error}</p>
      )}

      {/* Resultados */}
      <div style={{ flex:1, overflowY:'auto' }}>
        <AnimatePresence>
          {results.map((food, i) => (
            <motion.div key={food.id || i}
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay: i * 0.03 }}>
              <FoodResult food={food} onSelect={handleSelect} theme={theme} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Cargar más */}
        {hasMore && !loading && (
          <button onClick={() => search(query, page + 1)}
            style={{ width:'100%', padding:'12px', background:'none', border:'none',
              cursor:'pointer', fontSize:13, color: theme.primary, fontWeight:700 }}>
            Cargar más resultados
          </button>
        )}

        {/* Vacío */}
        {!loading && !error && query && results.length === 0 && (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <p style={{ fontSize:32, margin:'0 0 8px' }}>🔍</p>
            <p style={{ fontSize:14, fontWeight:700, color: theme.text, margin:'0 0 4px' }}>
              Sin resultados para "{query}"
            </p>
            <p style={{ fontSize:12, color: theme.textMuted, margin:0 }}>
              Prueba con otro nombre o escanea el código de barras
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
