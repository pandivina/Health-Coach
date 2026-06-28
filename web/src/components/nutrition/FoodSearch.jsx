// web/src/components/nutrition/FoodSearch.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Users, ChevronRight, ChevronDown, Filter } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'
import { useStore } from '../../store/useStore'
import { supabase } from '../../lib/supabase'

// ─── NUTRI-SCORE BADGE ────────────────────────────────────────────────────────
function NutriScoreBadge({ nutriScore }) {
  if (!nutriScore?.grade) return null
  const grades = ['A','B','C','D','E']
  const colors = {
    A:{ active:'#1A7A4A', bg:'#1A7A4A', text:'white' },
    B:{ active:'#4CAF50', bg:'#4CAF50', text:'white' },
    C:{ active:'#F5C842', bg:'#F5C842', text:'#1A2332' },
    D:{ active:'#F97316', bg:'#F97316', text:'white' },
    E:{ active:'#EF4444', bg:'#EF4444', text:'white' },
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:1, flexShrink:0 }}>
      {grades.map(g => {
        const isActive = g === nutriScore.grade
        const c = colors[g]
        return (
          <div key={g} style={{
            width: isActive ? 18 : 13,
            height: isActive ? 18 : 13,
            borderRadius: isActive ? 4 : 3,
            background: isActive ? c.bg : `${c.bg}40`,
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.2s',
          }}>
            {isActive && (
              <span style={{ fontSize:9, fontWeight:900, color:c.text, lineHeight:1 }}>{g}</span>
            )}
          </div>
        )
      })}
      {nutriScore.estimated && (
        <span style={{ fontSize:8, color:'#9CA3AF', marginLeft:2 }}>~</span>
      )}
    </div>
  )
}

// ─── SOURCE BADGE ─────────────────────────────────────────────────────────────
const SOURCE_CFG = {
  local:        { label:'🇪🇸', title:'Base española'  },
  fatsecret:    { label:'🌍', title:'FatSecret'       },
  community:    { label:'👥', title:'Comunidad Pandi'  },
  openfoodfacts:{ label:'🌐', title:'Open Food Facts'  },
}
function SourceBadge({ source }) {
  const cfg = SOURCE_CFG[source] || SOURCE_CFG.fatsecret
  return (
    <span title={cfg.title} style={{ fontSize:13, lineHeight:1 }}>{cfg.label}</span>
  )
}

// ─── MODAL AÑADIR A COMUNIDAD ─────────────────────────────────────────────────
function AddCommunityModal({ onClose, onSaved, prefill }) {
  const { theme } = useTheme()
  const [form, setForm] = useState({
    name:     prefill?.name || '', brand: prefill?.brand || '',
    calories: prefill?.calories ?? '', protein_g: prefill?.protein ?? '',
    carbs_g:  prefill?.carbs ?? '',   fat_g: prefill?.fat ?? '',
    fiber_g:  prefill?.fiber ?? '',   serving_size:'100', serving_unit:'g',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError(null)
    try {
      const { data:{ session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/fs/community`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token}` },
        body:JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved?.(data.food); onClose()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const F = ({ label, field, type='number', placeholder='' }) => (
    <div>
      <p style={{ fontSize:11, fontWeight:600, color:theme.textMuted, margin:'0 0 3px' }}>{label}</p>
      <input type={type} placeholder={placeholder} value={form[field]}
        onChange={e => setForm(f=>({...f,[field]:e.target.value}))}
        style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:`1px solid ${theme.border}`,
          fontSize:13, background:'white', color:theme.text, boxSizing:'border-box' }} />
    </div>
  )

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.5)',
        display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
        style={{ width:'100%', background:'white', borderRadius:'24px 24px 0 0',
          padding:'24px 20px 40px', maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div>
            <p style={{ fontSize:16, fontWeight:800, color:theme.text, margin:0 }}>👥 Añadir a la Comunidad</p>
            <p style={{ fontSize:12, color:theme.textMuted, margin:'3px 0 0' }}>Todos los usuarios podrán encontrarlo</p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'none', cursor:'pointer', padding:4 }}>
            <X size={20} style={{ color:theme.textMuted }} />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <F label="Nombre *" field="name" type="text" placeholder="Ej: Tortilla casera" />
          <F label="Marca (opcional)" field="brand" type="text" />
          <p style={{ fontSize:10, fontWeight:700, color:theme.textMuted, textTransform:'uppercase',
            letterSpacing:'.06em', margin:'4px 0 0' }}>Valores por 100g</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <F label="Calorías (kcal)" field="calories" />
            <F label="Proteína (g)"    field="protein_g" />
            <F label="Carbohidratos (g)" field="carbs_g" />
            <F label="Grasa (g)"       field="fat_g" />
            <F label="Fibra (g)"       field="fiber_g" />
          </div>
        </div>

        {error && <p style={{ fontSize:12, color:'#EF4444', margin:'10px 0 0', textAlign:'center' }}>{error}</p>}

        <motion.button whileTap={{ scale:0.97 }} onClick={handleSave} disabled={saving}
          style={{ width:'100%', marginTop:18, padding:'14px', borderRadius:16, border:'none', cursor:'pointer',
            background: saving ? '#F3F4F6' : 'linear-gradient(135deg,#F59E0B,#F97316)',
            color: saving ? '#9CA3AF' : 'white', fontSize:15, fontWeight:800 }}>
          {saving ? 'Publicando...' : '👥 Publicar alimento'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─── FOOD SEARCH PRINCIPAL ────────────────────────────────────────────────────
export default function FoodSearch({ onSelect, placeholder='Buscar alimento...' }) {
  const { theme } = useTheme()

  const [query,        setQuery]        = useState('')
  const [results,      setResults]      = useState([])
  const [brands,       setBrands]       = useState([])
  const [sources,      setSources]      = useState({ community:0, local:0, fatsecret:0 })
  const [loading,      setLoading]      = useState(false)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [brandFilter,  setBrandFilter]  = useState('')
  const [showBrands,   setShowBrands]   = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addPrefill,   setAddPrefill]   = useState(null)
  const [toast,        setToast]        = useState(null)
  const debounceRef = useRef(null)

  const search = useCallback(async (q, brand='') => {
    if (!q?.trim()) { setResults([]); setBrands([]); return }
    setLoading(true)
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/fs/search?q=${encodeURIComponent(q)}&max=50${brand ? `&brand=${encodeURIComponent(brand)}` : ''}`
      const data = await fetch(url).then(r => r.json())
      setResults(data.foods || [])
      setBrands(data.brands || [])
      setSources(data.sources || { community:0, local:0, fatsecret:0 })
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setBrands([]); return }
    debounceRef.current = setTimeout(() => search(query, brandFilter), 500)
    return () => clearTimeout(debounceRef.current)
  }, [query, brandFilter, search])

  const filtered = sourceFilter === 'all'
    ? results
    : results.filter(f => f.source === sourceFilter)

  function handleSelect(food) {
    if (food.source === 'community') {
      const id = food.id.replace('community_','')
      fetch(`${import.meta.env.VITE_API_URL}/api/fs/community/${id}/use`, { method:'POST' }).catch(()=>{})
    }
    onSelect?.(food)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const SOURCE_FILTERS = [
    { id:'all',       label:`Todos (${results.length})` },
    { id:'community', label:`👥 ${sources.community}` },
    { id:'local',     label:`🇪🇸 ${sources.local}` },
    { id:'fatsecret', label:`🌍 ${sources.fatsecret}` },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* Buscador */}
      <div style={{ position:'relative' }}>
        <Search size={16} style={{ position:'absolute', left:12, top:'50%',
          transform:'translateY(-50%)', color:theme.textMuted, pointerEvents:'none' }} />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder={placeholder} autoFocus
          style={{ width:'100%', padding:'12px 40px 12px 38px', borderRadius:16,
            border:`1.5px solid ${theme.primary}`, fontSize:14, background:'white',
            color:theme.text, boxSizing:'border-box', outline:'none' }} />
        {query && (
          <button onClick={() => { setQuery(''); setBrandFilter('') }}
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
              border:'none', background:'none', cursor:'pointer', padding:4 }}>
            <X size={14} style={{ color:theme.textMuted }} />
          </button>
        )}
      </div>

      {/* Filtros — solo si hay resultados */}
      {results.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>

          {/* Filtro por fuente */}
          <div style={{ display:'flex', gap:5, overflowX:'auto' }}>
            {SOURCE_FILTERS.map(f => (
              <button key={f.id} onClick={() => setSourceFilter(f.id)}
                style={{ flexShrink:0, padding:'5px 10px', borderRadius:10, border:'none',
                  cursor:'pointer', fontSize:11, fontWeight:700, whiteSpace:'nowrap',
                  background: sourceFilter===f.id ? theme.primary : theme.surface2,
                  color: sourceFilter===f.id ? 'white' : theme.textMuted }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Filtro por marca */}
          {brands.length > 0 && (
            <div>
              <button onClick={() => setShowBrands(b => !b)}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px',
                  borderRadius:10, border:`1px solid ${brandFilter ? theme.primary : theme.border}`,
                  background: brandFilter ? theme.primary+'15' : 'white',
                  cursor:'pointer', fontSize:11, fontWeight:700,
                  color: brandFilter ? theme.primary : theme.textMuted }}>
                <Filter size={11} />
                {brandFilter ? `Marca: ${brandFilter}` : `Marcas (${brands.length})`}
                <ChevronDown size={11} style={{ transform: showBrands ? 'rotate(180deg)':'rotate(0)', transition:'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {showBrands && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:5, maxHeight:120, overflowY:'auto' }}>
                    {brandFilter && (
                      <button onClick={() => { setBrandFilter(''); setShowBrands(false) }}
                        style={{ padding:'4px 10px', borderRadius:8, border:'none', cursor:'pointer',
                          fontSize:11, fontWeight:700, background:'#FEE2E2', color:'#EF4444' }}>
                        ✕ Quitar filtro
                      </button>
                    )}
                    {brands.map(b => (
                      <button key={b} onClick={() => { setBrandFilter(b); setShowBrands(false) }}
                        style={{ padding:'4px 10px', borderRadius:8, border:'none', cursor:'pointer',
                          fontSize:11, fontWeight:600, whiteSpace:'nowrap',
                          background: brandFilter===b ? theme.primary : theme.surface2,
                          color: brandFilter===b ? 'white' : theme.text }}>
                        {b}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ width:22, height:22, borderRadius:'50%', margin:'0 auto',
            border:`3px solid ${theme.primary}30`, borderTopColor:theme.primary,
            animation:'spin 0.8s linear infinite' }} />
          <p style={{ fontSize:12, color:theme.textMuted, marginTop:8 }}>Buscando en todas las bases...</p>
        </div>
      )}

      {/* Resultados */}
      {!loading && filtered.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:400, overflowY:'auto' }}>
          {filtered.map(food => (
            <motion.div key={food.id} whileTap={{ scale:0.98 }}
              onClick={() => handleSelect(food)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                borderRadius:14, background:'white', border:`1px solid ${theme.border}`,
                cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>

              {/* Fuente emoji */}
              <SourceBadge source={food.source} />

              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:700, color:theme.text, margin:0,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {food.name}
                </p>
                {food.brand && (
                  <p style={{ fontSize:10, color:theme.textMuted, margin:'1px 0 0' }}>{food.brand}</p>
                )}
                <p style={{ fontSize:11, color:theme.primary, fontWeight:600, margin:'2px 0 0' }}>
                  {food.calories != null ? `${Math.round(food.calories)} kcal` : '—'} ·{' '}
                  P:{food.protein != null ? `${food.protein}g` : '?'} ·{' '}
                  C:{food.carbs != null ? `${food.carbs}g` : '?'} ·{' '}
                  G:{food.fat != null ? `${food.fat}g` : '?'}
                </p>
              </div>

              {/* Nutri-Score + botón comunidad */}
              <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                <NutriScoreBadge nutriScore={food.nutriScore} />
                {food.source !== 'community' && (
                  <button onClick={e => { e.stopPropagation(); setAddPrefill(food); setShowAddModal(true) }}
                    title="Añadir a la comunidad"
                    style={{ padding:'4px 7px', borderRadius:7, border:`1px solid ${theme.border}`,
                      background:'white', cursor:'pointer', fontSize:11, color:'#F59E0B', fontWeight:700 }}>
                    👥
                  </button>
                )}
                <ChevronRight size={14} style={{ color:theme.textMuted }} />
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
            ¿Tienes los datos nutricionales?
          </p>
          <motion.button whileTap={{ scale:0.97 }}
            onClick={() => { setAddPrefill({ name:query }); setShowAddModal(true) }}
            style={{ padding:'10px 20px', borderRadius:14, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#F59E0B,#F97316)',
              color:'white', fontSize:13, fontWeight:700 }}>
            👥 Añadir "{query}" a la comunidad
          </motion.button>
        </div>
      )}

      {/* Estado vacío */}
      {!query && (
        <p style={{ textAlign:'center', fontSize:13, color:theme.textMuted, margin:'8px 0' }}>
          Busca en 🇪🇸 España · 🌍 FatSecret · 👥 Comunidad
        </p>
      )}

      {/* Modal añadir a comunidad */}
      <AnimatePresence>
        {showAddModal && (
          <AddCommunityModal prefill={addPrefill}
            onClose={() => { setShowAddModal(false); setAddPrefill(null) }}
            onSaved={f => showToast(`✅ "${f.name}" añadido a la comunidad`)} />
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
            <span style={{ fontSize:18 }}>✅</span>
            <p style={{ fontSize:13, fontWeight:700, color:'#1A2332', margin:0 }}>{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
