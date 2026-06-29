import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Plus, X, ChefHat, Clock, Flame, Lock } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

// ─── MODAL DETALLE RECETA ─────────────────────────────────────────────────────
function RecetaModal({ receta, onClose, onCooked }) {
  const { theme } = useTheme()
  const [tab, setTab] = useState('ingredientes')

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:80,
        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'flex-end' }}>
      <motion.div
        initial={{ translateY:'100%' }} animate={{ translateY:0 }} exit={{ translateY:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        onClick={e => e.stopPropagation()}
        style={{ width:'100%', maxHeight:'88vh', overflowY:'auto',
          background:'white', borderRadius:'24px 24px 0 0',
          padding:'0 0 40px' }}>

        {/* Header */}
        <div style={{ padding:'20px 20px 16px',
          background:`linear-gradient(135deg, ${theme.primary}15, ${theme.primary}05)`,
          borderBottom:`1px solid ${theme.border}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:40 }}>{receta.emoji || '🍽️'}</div>
            <button onClick={onClose}
              style={{ border:'none', background:`${theme.border}`, borderRadius:10,
                width:32, height:32, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={16} color={theme.textMuted} />
            </button>
          </div>
          <h2 style={{ fontSize:20, fontWeight:900, color:theme.text, margin:'0 0 6px' }}>
            {receta.name}
          </h2>
          <p style={{ fontSize:13, color:theme.textMuted, margin:'0 0 12px', lineHeight:1.5 }}>
            {receta.description}
          </p>
          {/* Macros */}
          <div style={{ display:'flex', gap:10 }}>
            {[
              { label:'kcal',    value: Math.round(receta.calories || 0), color:'#F97316' },
              { label:'prot',    value: `${receta.protein_g || 0}g`,      color:'#3B82F6' },
              { label:'carbs',   value: `${receta.carbs_g || 0}g`,        color:'#F59E0B' },
              { label:'grasa',   value: `${receta.fat_g || 0}g`,          color:'#8B5CF6' },
            ].map(m => (
              <div key={m.label} style={{ flex:1, padding:'8px 6px', borderRadius:12,
                background:`${m.color}12`, textAlign:'center' }}>
                <p style={{ fontSize:14, fontWeight:900, color:m.color, margin:0 }}>{m.value}</p>
                <p style={{ fontSize:10, color:theme.textMuted, margin:0, fontWeight:600 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', padding:'12px 20px 0', gap:8 }}>
          {['ingredientes','pasos'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex:1, padding:'9px', borderRadius:12, border:'none', cursor:'pointer',
                fontWeight:700, fontSize:13, transition:'all 0.2s',
                background: tab === t ? theme.primary : theme.surface,
                color: tab === t ? 'white' : theme.textMuted }}>
              {t === 'ingredientes' ? '🥗 Ingredientes' : '👨‍🍳 Pasos'}
            </button>
          ))}
        </div>

        <div style={{ padding:'16px 20px' }}>
          <AnimatePresence mode="wait">
            {tab === 'ingredientes' && (
              <motion.div key="ing" initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {(receta.ingredients || []).map((ing, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                    padding:'10px 12px', borderRadius:12, background:theme.surface,
                    border:`1px solid ${theme.border}` }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{ing.emoji || '🥄'}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:theme.text, margin:0 }}>{ing.name}</p>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:theme.primary }}>
                      {ing.amount}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
            {tab === 'pasos' && (
              <motion.div key="pasos" initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {(receta.steps || []).map((step, i) => (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                      background:`linear-gradient(135deg, ${theme.primary}, ${theme.primary}99)`,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:12, fontWeight:900, color:'white' }}>{i+1}</span>
                    </div>
                    <p style={{ fontSize:13, color:theme.text, lineHeight:1.6, margin:'4px 0 0' }}>
                      {typeof step === 'string' ? step : step.description || step.text || ''}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div style={{ padding:'0 20px' }}>
          <motion.button whileTap={{ scale:0.97 }} onClick={() => { onCooked(receta.id); onClose() }}
            style={{ width:'100%', padding:'14px', borderRadius:16, border:'none', cursor:'pointer',
              fontWeight:800, fontSize:15, color:'white',
              background:`linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)`,
              boxShadow:`0 6px 20px ${theme.primary}44` }}>
            ✅ Marcar como cocinada
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── MODAL AÑADIR RECETA PROPIA ───────────────────────────────────────────────
function AddRecetaModal({ onClose, onSaved }) {
  const { theme } = useTheme()
  const { user } = useStore()
  const [form, setForm] = useState({
    name:'', emoji:'🍽️', description:'',
    calories:'', protein_g:'', carbs_g:'', fat_g:'',
    ingredients:'', steps:'',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)
  const set = (k, v) => setForm(f => ({...f, [k]:v}))

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError(null)
    try {
      // Insertar en recipe_library como receta de usuario
      const { data: receta, error: err } = await supabase
        .from('recipe_library')
        .insert({
          name:        form.name.trim(),
          emoji:       form.emoji,
          description: form.description,
          calories:    parseFloat(form.calories) || 0,
          protein_g:   parseFloat(form.protein_g) || 0,
          carbs_g:     parseFloat(form.carbs_g) || 0,
          fat_g:       parseFloat(form.fat_g) || 0,
          ingredients: form.ingredients
            ? form.ingredients.split('\n').filter(Boolean).map(l => ({ name: l.trim() }))
            : [],
          steps: form.steps
            ? form.steps.split('\n').filter(Boolean)
            : [],
          tags:       ['usuario'],
          unlock_xp:  0,
        })
        .select().single()

      if (err) throw err

      // Guardar en user_recipes
      await supabase.from('user_recipes').insert({
        user_id:   user.id,
        recipe_id: receta.id,
        saved_at:  new Date().toISOString(),
      })

      onSaved?.(); onClose()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:80,
        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'flex-end' }}>
      <motion.div
        initial={{ translateY:'100%' }} animate={{ translateY:0 }} exit={{ translateY:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        onClick={e => e.stopPropagation()}
        style={{ width:'100%', maxHeight:'90vh', overflowY:'auto',
          background:'white', borderRadius:'24px 24px 0 0', padding:'24px 20px 48px' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:18, fontWeight:900, color:theme.text, margin:0 }}>
            ✍️ Nueva receta
          </h2>
          <button onClick={onClose}
            style={{ border:'none', background:theme.surface, borderRadius:10,
              width:32, height:32, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={16} color={theme.textMuted} />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Emoji + Nombre */}
          <div style={{ display:'flex', gap:10 }}>
            <input value={form.emoji} onChange={e => set('emoji', e.target.value)}
              style={{ width:52, padding:'10px', borderRadius:12, border:`1px solid ${theme.border}`,
                fontSize:22, textAlign:'center', background:'white', color:theme.text }} />
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Nombre de la receta *"
              style={{ flex:1, padding:'10px 14px', borderRadius:12, border:`1px solid ${theme.border}`,
                fontSize:14, fontWeight:700, background:'white', color:theme.text, outline:'none' }} />
          </div>

          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Descripción breve..."
            rows={2}
            style={{ padding:'10px 14px', borderRadius:12, border:`1px solid ${theme.border}`,
              fontSize:13, background:'white', color:theme.text, resize:'none', outline:'none' }} />

          {/* Macros */}
          <p style={{ fontSize:11, fontWeight:700, color:theme.textMuted, margin:0,
            textTransform:'uppercase', letterSpacing:'.06em' }}>Valores por ración</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { k:'calories',  label:'Calorías (kcal)' },
              { k:'protein_g', label:'Proteína (g)' },
              { k:'carbs_g',   label:'Carbohidratos (g)' },
              { k:'fat_g',     label:'Grasa (g)' },
            ].map(f => (
              <div key={f.k}>
                <p style={{ fontSize:11, color:theme.textMuted, margin:'0 0 4px', fontWeight:600 }}>{f.label}</p>
                <input type="number" value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:10,
                    border:`1px solid ${theme.border}`, fontSize:13,
                    background:'white', color:theme.text, boxSizing:'border-box', outline:'none' }} />
              </div>
            ))}
          </div>

          {/* Ingredientes */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:theme.textMuted, margin:'0 0 4px',
              textTransform:'uppercase', letterSpacing:'.06em' }}>Ingredientes (uno por línea)</p>
            <textarea value={form.ingredients} onChange={e => set('ingredients', e.target.value)}
              placeholder={'200g pechuga de pollo\n100g arroz\n1 cebolla'}
              rows={4}
              style={{ width:'100%', padding:'10px 14px', borderRadius:12,
                border:`1px solid ${theme.border}`, fontSize:13,
                background:'white', color:theme.text, resize:'none', outline:'none',
                boxSizing:'border-box' }} />
          </div>

          {/* Pasos */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:theme.textMuted, margin:'0 0 4px',
              textTransform:'uppercase', letterSpacing:'.06em' }}>Pasos (uno por línea)</p>
            <textarea value={form.steps} onChange={e => set('steps', e.target.value)}
              placeholder={'Cocinar el arroz 18 minutos\nSaltear el pollo con especias\nServir caliente'}
              rows={4}
              style={{ width:'100%', padding:'10px 14px', borderRadius:12,
                border:`1px solid ${theme.border}`, fontSize:13,
                background:'white', color:theme.text, resize:'none', outline:'none',
                boxSizing:'border-box' }} />
          </div>

          {error && <p style={{ fontSize:12, color:'#EF4444', margin:0, textAlign:'center' }}>{error}</p>}

          <motion.button whileTap={{ scale:0.97 }} onClick={handleSave} disabled={saving}
            style={{ width:'100%', padding:'14px', borderRadius:16, border:'none', cursor:'pointer',
              fontWeight:800, fontSize:15, color:'white',
              background: saving ? '#F3F4F6' : `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)`,
              color: saving ? '#9CA3AF' : 'white' }}>
            {saving ? 'Guardando...' : '✅ Guardar receta'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MisRecetas() {
  const { theme } = useTheme()
  const { user, profile } = useStore()
  const navigate = useNavigate()

  const [recetas,      setRecetas]      = useState([])
  const [biblioteca,   setBiblioteca]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filtro,       setFiltro]       = useState('guardadas') // guardadas | disponibles
  const [selected,     setSelected]     = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const userLevel = profile?.level || 1

  async function fetchData() {
    setLoading(true)
    try {
      // Recetas guardadas del usuario
      const { data: saved } = await supabase
        .from('user_recipes')
        .select('*, recipe:recipe_id(*)')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false })

      // Biblioteca completa (desbloqueadas por nivel)
      const { data: library } = await supabase
        .from('recipe_library')
        .select('*')
        .order('unlock_xp', { ascending: true })

      setRecetas(saved || [])
      setBiblioteca(library || [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { if (user?.id) fetchData() }, [user?.id])

  async function handleCooked(recipeId) {
    await supabase.from('user_recipes')
      .upsert({ user_id: user.id, recipe_id: recipeId,
        cooked_count: 1, last_cooked: new Date().toISOString() },
        { onConflict: 'user_id,recipe_id' })
    fetchData()
  }

  async function handleSave(recipeId) {
    await supabase.from('user_recipes').upsert(
      { user_id: user.id, recipe_id: recipeId, saved_at: new Date().toISOString() },
      { onConflict: 'user_id,recipe_id' }
    )
    fetchData()
  }

  const savedIds = new Set(recetas.map(r => r.recipe_id))

  const listaMostrada = filtro === 'guardadas'
    ? recetas.map(r => r.recipe).filter(Boolean)
    : biblioteca.filter(r => userLevel * 10 >= (r.unlock_xp || 0) && !savedIds.has(r.id))

  const bloqueadas = biblioteca.filter(r => userLevel * 10 < (r.unlock_xp || 0))

  return (
    <div style={{ minHeight:'100vh', paddingBottom:100, background: theme.bg }}>

      {/* Header */}
      <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 16px) 16px 16px',
        background:`linear-gradient(135deg, ${theme.primary}18, transparent)`,
        borderBottom:`1px solid ${theme.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <motion.button whileTap={{ scale:0.95 }} onClick={() => navigate(-1)}
            style={{ width:36, height:36, borderRadius:12, border:`1px solid ${theme.border}`,
              background:'white', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChevronLeft size={18} color={theme.text} />
          </motion.button>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:20, fontWeight:900, color:theme.text, margin:0 }}>
              Mis Recetas 🍳
            </h1>
            <p style={{ fontSize:12, color:theme.textMuted, margin:0 }}>
              {recetas.length} guardadas · {bloqueadas.length} por desbloquear
            </p>
          </div>
          <motion.button whileTap={{ scale:0.95 }} onClick={() => setShowAddModal(true)}
            style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
              background: theme.primary,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 4px 12px ${theme.primary}44` }}>
            <Plus size={18} color="white" />
          </motion.button>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:8 }}>
          {[
            { id:'guardadas',   label:`⭐ Guardadas (${recetas.length})` },
            { id:'disponibles', label:`🔓 Disponibles` },
          ].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              style={{ flex:1, padding:'9px', borderRadius:12, border:'none', cursor:'pointer',
                fontWeight:700, fontSize:13, transition:'all 0.2s',
                background: filtro === f.id ? theme.primary : theme.surface,
                color: filtro === f.id ? 'white' : theme.textMuted,
                boxShadow: filtro === f.id ? `0 4px 12px ${theme.primary}44` : 'none' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding:'16px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', margin:'0 auto',
              border:`3px solid ${theme.primary}30`, borderTopColor:theme.primary,
              animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : listaMostrada.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 20px' }}>
            <p style={{ fontSize:48, margin:'0 0 12px' }}>
              {filtro === 'guardadas' ? '📭' : '🎉'}
            </p>
            <p style={{ fontSize:16, fontWeight:700, color:theme.text, margin:'0 0 6px' }}>
              {filtro === 'guardadas'
                ? 'Aún no tienes recetas guardadas'
                : '¡Ya tienes todas disponibles!'}
            </p>
            <p style={{ fontSize:13, color:theme.textMuted, margin:'0 0 20px' }}>
              {filtro === 'guardadas'
                ? 'Explora las disponibles o añade la tuya'
                : 'Sigue subiendo de nivel para más'}
            </p>
            {filtro === 'guardadas' && (
              <motion.button whileTap={{ scale:0.97 }}
                onClick={() => setFiltro('disponibles')}
                style={{ padding:'12px 24px', borderRadius:14, border:'none', cursor:'pointer',
                  fontWeight:700, fontSize:14, color:'white',
                  background:`linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)` }}>
                Ver disponibles
              </motion.button>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {listaMostrada.map(receta => (
              <motion.div key={receta.id} whileTap={{ scale:0.98 }}
                onClick={() => setSelected(receta)}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px',
                  borderRadius:18, background:'white', border:`1px solid ${theme.border}`,
                  cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ width:48, height:48, borderRadius:14, flexShrink:0,
                  background:`${theme.primary}15`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
                  {receta.emoji || '🍽️'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:800, color:theme.text,
                    margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {receta.name}
                  </p>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:11, color:'#F97316', fontWeight:700 }}>
                      🔥 {Math.round(receta.calories || 0)} kcal
                    </span>
                    <span style={{ fontSize:11, color:theme.textMuted }}>·</span>
                    <span style={{ fontSize:11, color:'#3B82F6', fontWeight:600 }}>
                      P {receta.protein_g || 0}g
                    </span>
                  </div>
                  {receta.tags?.includes('usuario') && (
                    <span style={{ fontSize:10, fontWeight:700, color:theme.primary,
                      background:`${theme.primary}15`, padding:'2px 7px', borderRadius:8,
                      display:'inline-block', marginTop:4 }}>
                      Tuya
                    </span>
                  )}
                </div>
                {filtro === 'disponibles' && !savedIds.has(receta.id) && (
                  <motion.button whileTap={{ scale:0.95 }}
                    onClick={e => { e.stopPropagation(); handleSave(receta.id) }}
                    style={{ padding:'7px 12px', borderRadius:10, border:'none', cursor:'pointer',
                      fontWeight:700, fontSize:12, color:'white', flexShrink:0,
                      background:`linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)` }}>
                    Guardar
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Bloqueadas */}
        {filtro === 'disponibles' && bloqueadas.length > 0 && (
          <div style={{ marginTop:24 }}>
            <p style={{ fontSize:11, fontWeight:700, color:theme.textMuted, margin:'0 0 10px',
              textTransform:'uppercase', letterSpacing:'.06em' }}>
              🔒 Por desbloquear ({bloqueadas.length})
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {bloqueadas.map(receta => (
                <div key={receta.id}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'14px',
                    borderRadius:18, background:theme.surface, border:`1px solid ${theme.border}`,
                    opacity:0.7 }}>
                  <div style={{ width:48, height:48, borderRadius:14, flexShrink:0,
                    background:'rgba(0,0,0,0.06)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Lock size={20} color={theme.textMuted} />
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:800, color:theme.textMuted, margin:'0 0 3px' }}>
                      {receta.name}
                    </p>
                    <p style={{ fontSize:11, color:theme.textMuted, margin:0 }}>
                      Necesitas {receta.unlock_xp} XP · Nivel {Math.ceil(receta.unlock_xp / 10)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <AnimatePresence>
        {selected && (
          <RecetaModal receta={selected}
            onClose={() => setSelected(null)}
            onCooked={handleCooked} />
        )}
        {showAddModal && (
          <AddRecetaModal
            onClose={() => setShowAddModal(false)}
            onSaved={() => { setShowAddModal(false); fetchData() }} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
