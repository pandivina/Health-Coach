// web/src/components/nutrition/FoodSearch.jsx
// Búsqueda multi-fuente: 🇪🇸 Local · 🌍 FatSecret · 👥 Comunidad

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Plus, Users, Globe, ChevronRight } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'
import { useStore } from '../../store/useStore'
import { supabase } from '../../lib/supabase'

// ─── BADGE DE FUENTE ─────────────────────────────────────────────────────────
const SOURCE_CONFIG = {
  local:       { label:'🇪🇸 Local',     color:'#10B981', bg:'#D1FAE5' },
  fatsecret:   { label:'🌍 FatSecret',  color:'#6366F1', bg:'#EEF2FF' },
  community:   { label:'👥 Comunidad',  color:'#F59E0B', bg:'#FEF3C7' },
  openfoodfacts:{ label:'🌐 OpenFood',  color:'#3B82F6', bg:'#EFF6FF' },
}

function SourceBadge({ source, verified }) {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.fatsecret
  return (
    <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:6,
      background:cfg.bg, color:cfg.color, whiteSpace:'nowrap' }}>
      {cfg.label}{verified ? ' ✓' : ''}
    </span>
  )
}

// ─── MODAL AÑADIR A COMUNIDAD ─────────────────────────────────────────────────
function AddCommunityModal({ onClose, onSaved, prefill }) {
  const { theme } = useTheme()
  const { user }  = useStore()
  const [form,    setForm]    = useState({
    name:     prefill?.name || '',
    brand:    prefill?.brand || '',
    calories: prefill?.calories || '',
    protein_g:prefill?.protein || '',
    carbs_g:  prefill?.carbs || '',
    fat_g:    prefill?.fat || '',
    fiber_g:  '',
    serving_size: '100',
    serving_unit: 'g',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/fs/community`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved?.(data.food)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally { setSaving(false) }
  }

  const Field = ({ label, field, type='number', placeholder='' }) => (
    <div>
      <p style={{ fontSize:11, fontWeight:600, color:theme.textMuted, margin:'0 0 4px' }}>{label}</p>
      <input type={type} placeholder={placeholder} value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width:'100%', padding:'10px 12px', borderRadius:12, border:`1px solid ${theme.border}`,
          fontSize:14, background:'white', color:theme.text, boxSizing:'border-box' }} />
    </div>
  )

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.5)',
        display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
        style={{ width:'100%', maxWidth:480, background:'white', borderRadius:'24px 24px 0 0',
          padding:'24px 20px 40px', maxHeight:'85vh', overflowY:'auto' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <p style={{ fontSize:16, fontWeight:800, color:theme.text, margin:0 }}>
              👥 Añadir a la Comunidad
            </p>
            <p style={{ fontSize:12, color:theme.textMuted, margin:'2px 0 0' }}>
              Todos los usuarios podrán encontrarlo
            </p>
          </div>
          <button onClick={onClose} style={{ padding:8, border:'none', background:'none', cursor:'pointer' }}>
            <X size={20} style={{ color:theme.textMuted }} />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Field label="Nombre del alimento *" field="name" type="text" placeholder="Ej: Tortilla casera" />
          <Field label="Marca (opcional)" field="brand" type="text" placeholder="Ej: Hacendado" />

          <p style={{ fontSize:11, fontWeight:700, color:theme.textMuted,
            textTransform:'uppercase', letterSpacing:'.06em', margin:'4px 0 0' }}>
            Valores por 100g
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Calorías (kcal)" field="calories" />
            <Field label="Proteína (g)"    field="protein_g" />
            <Field label="Carbohidratos (g)" field="carbs_g" />
            <Field label="Grasa (g)"       field="fat_g" />
            <Field label="Fibra (g)"       field="fiber_g" />
          </div>
        </div>

        {error && (
          <p style={{ fontSize:12, color:'#EF4444', margin:'12px 0 0', textAlign:'center' }}>{error}</p>
        )}

        <motion.button whileTap={{ scale:0.97 }} onClick={handleSave} disabled={saving}
          style={{ width:'100%', marginTop:20, padding:'14px', borderRadius:16, border:'none',
            cursor:'pointer', background: saving ? theme.surface2 : `linear-gradient(135deg,#F59E0B,#F97316)`,
            color: saving ? theme.textMuted : 'white', fontSize:15, fontWeight:800 }}>
          {saving ? 'Guardando...' : '👥 Publicar alimento'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─── FOOD SEARCH PRINCIPAL ────────────────────────────────────────────────────
export default function FoodSearch({ onSelect, mealType, placeholder = 'Buscar alimento...' }) {
  const { theme } = useTheme()
  const { user }  = useStore()

  const [query,        setQuery]        = useState('')
  const [results,      setResults]      = useState([])
  const [loading,      setLoading]      = useState(false)
  const [sources,      setSources]      = useState({ community:0, local:0, fatsecret:0 })
  const [activeFilter, setActiveFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addPrefill,   setAddPrefill]   = useState(null)
  const [toast,        setToast]        = useState(null)

  const debounceRef = useRef(null)

  const search = useCallback(async (q) => {
    if (!q?.trim()) { setResults([]); setSources({ community:0, local:0, fatsecret:0 }); return }
    setLoading(true)
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/fs/search?q=${encodeURIComponent(q)}&max=50`)
      const data = await res.json()
      setResults(data.foods || [])
      setSources(data.sources || { community:0, local:0, fatsecret:0 })
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(() => search(query), 500)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  // Filtrar por fuente
  const filtered = activeFilter === 'all'
    ? results
    : results.filter(f => f.source === activeFilter)

  function handleSelect(food) {
    // Incrementar contador si es de comunidad
    if (food.source === 'community' && food.id.startsWith('community_')) {
      const realId = food.id.replace('community_', '')
      fetch(`${import.meta.env.VITE_API_URL}/api/fs/community/${realId}/use`, { method:'POST' }).catch(() => {})
    }
    onSelect?.(food)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const FILTERS = [
    { id:'all',       label:`Todo (${results.length})` },
    { id:'community', label:`👥 ${sources.community}` },
    { id:'local',     label:`🇪🇸 ${sources.local}` },
    { id:'fatsecret', label:`🌍 ${sources.fatsecret}` },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* Buscador */}
      <div style={{ position:'relative' }}>
        <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
          color:theme.textMuted, pointerEvents:'none' }} />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder={placeholder} autoFocus
          style={{ width:'100%', padding:'12px 40px 12px 38px', borderRadius:16,
            border:`1.5px solid ${theme.primary}`, fontSize:14, background:'white',
            color:theme.text, boxSizing:'border-box', outline:'none' }} />
        {query && (
          <button onClick={() => setQuery('')}
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
              border:'none', background:'none', cursor:'pointer', padding:4 }}>
            <X size={14} style={{ color:theme.textMuted }} />
          </button>
        )}
      </div>

      {/* Filtros de fuente */}
      {results.length > 0 && (
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              style={{ flexShrink:0, padding:'5px 10px', borderRadius:10, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:700, whiteSpace:'nowrap',
                background: activeFilter===f.id ? theme.primary : theme.surface2,
                color: activeFilter===f.id ? 'white' : theme.textMuted }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ width:24, height:24, borderRadius:'50%', margin:'0 auto',
            border:`3px solid ${theme.primary}30`, borderTopColor:theme.primary,
            animation:'spin 0.8s linear infinite' }} />
          <p style={{ fontSize:12, color:theme.textMuted, marginTop:8 }}>Buscando en todas las bases...</p>
        </div>
      )}

      {/* Resultados */}
      {!loading && filtered.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:380, overflowY:'auto' }}>
          {filtered.map(food => (
            <motion.div key={food.id} whileTap={{ scale:0.98 }}
              onClick={() => handleSelect(food)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                borderRadius:14, background:'white', border:`1px solid ${theme.border}`,
                cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:theme.text, margin:0,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {food.name}
                  </p>
                  <SourceBadge source={food.source} verified={food.verified} />
                </div>
                {food.brand && (
                  <p style={{ fontSize:10, color:theme.textMuted, margin:0 }}>{food.brand}</p>
                )}
                <p style={{ fontSize:11, color:theme.primary, fontWeight:600, margin:'2px 0 0' }}>
                  {food.calories != null ? `${Math.round(food.calories)} kcal` : '—'} ·{' '}
                  P:{food.protein != null ? `${food.protein}g` : '?'} ·{' '}
                  C:{food.carbs != null ? `${food.carbs}g` : '?'} ·{' '}
                  G:{food.fat != null ? `${food.fat}g` : '?'}
                </p>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                {/* Botón añadir a comunidad si no es ya de comunidad */}
                {food.source !== 'community' && (
                  <button onClick={e => {
                    e.stopPropagation()
                    setAddPrefill(food)
                    setShowAddModal(true)
                  }}
                  title="Añadir a la comunidad"
                  style={{ padding:'5px 8px', borderRadius:8, border:`1px solid ${theme.border}`,
                    background:'white', cursor:'pointer', fontSize:11, color:'#F59E0B', fontWeight:700 }}>
                    👥
                  </button>
                )}
                <ChevronRight size={16} style={{ color:theme.textMuted }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!loading && query.trim() && results.length === 0 && (
        <div style={{ textAlign:'center', padding:'24px 0' }}>
          <p style={{ fontSize:28, marginBottom:8 }}>🔍</p>
          <p style={{ fontSize:14, fontWeight:700, color:theme.text, margin:0 }}>
            Sin resultados para "{query}"
          </p>
          <p style={{ fontSize:12, color:theme.textMuted, margin:'4px 0 16px' }}>
            ¿Tienes los datos nutricionales? Añádelo a la comunidad
          </p>
          <motion.button whileTap={{ scale:0.97 }}
            onClick={() => { setAddPrefill({ name: query }); setShowAddModal(true) }}
            style={{ padding:'10px 20px', borderRadius:14, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#F59E0B,#F97316)',
              color:'white', fontSize:13, fontWeight:700, display:'inline-flex',
              alignItems:'center', gap:6 }}>
            <Users size={14} /> Añadir "{query}" a la comunidad
          </motion.button>
        </div>
      )}

      {/* Estado vacío inicial */}
      {!loading && !query && (
        <div style={{ textAlign:'center', padding:'16px 0', color:theme.textMuted }}>
          <p style={{ fontSize:13 }}>Busca en 🇪🇸 Base española · 🌍 FatSecret · 👥 Comunidad</p>
        </div>
      )}

      {/* Modal añadir a comunidad */}
      <AnimatePresence>
        {showAddModal && (
          <AddCommunityModal
            prefill={addPrefill}
            onClose={() => { setShowAddModal(false); setAddPrefill(null) }}
            onSaved={(food) => showToast(`✅ "${food.name}" añadido a la comunidad`)} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', bottom:100, left:'50%', transform:'translateX(-50%)',
              zIndex:200, background:'white', borderRadius:18, padding:'12px 18px',
              boxShadow:'0 8px 24px rgba(0,0,0,0.15)', border:'1.5px solid #22C55E40',
              display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
            <span style={{ fontSize:20 }}>✅</span>
            <p style={{ fontSize:13, fontWeight:700, color:'#1A2332', margin:0 }}>{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
