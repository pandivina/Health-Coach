// web/src/components/nutrition/RecipeUnlockBanner.jsx
// Banner de recetas desbloqueables — aparece en la parte superior del DiarioTab

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeProvider'
import { useStore } from '../../store/useStore'
import { supabase } from '../../lib/supabase'
import { Wheat, Lock, ChevronRight, Star, BookOpen, X, Check } from 'lucide-react'

// ─── MODAL DE DETALLE DE RECETA ───────────────────────────────────────────────
function RecipeModal({ recipe, saved, onSave, onAddToDiary, onClose }) {
  const { theme } = useTheme()
  const [savingDiary, setSavingDiary] = useState(null)

  const MEAL_TYPES = [
    { id:'breakfast', label:'🌅 Desayuno' },
    { id:'lunch',     label:'☀️ Comida'   },
    { id:'snack',     label:'🍎 Merienda' },
    { id:'dinner',    label:'🌙 Cena'     },
  ]

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(0,0,0,0.5)',
        display:'flex', alignItems:'flex-end' }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
        onClick={e => e.stopPropagation()}
        style={{ width:'100%', background:'white', borderRadius:'24px 24px 0 0',
          padding:'24px 20px 40px', maxHeight:'88vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <span style={{ fontSize:36 }}>{recipe.emoji}</span>
            <h2 style={{ fontSize:18, fontWeight:900, color:theme.text, margin:'4px 0 2px' }}>{recipe.name}</h2>
            <p style={{ fontSize:12, color:theme.textMuted, margin:0 }}>{recipe.description}</p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'none', cursor:'pointer', padding:4, flexShrink:0 }}>
            <X size={20} style={{ color:theme.textMuted }} />
          </button>
        </div>

        {/* Macros */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
          {[
            { label:'Kcal', value:Math.round(recipe.calories||0), color:'#F97316' },
            { label:'Prot', value:`${recipe.protein_g||0}g`,   color:theme.primary },
            { label:'Carbs',value:`${recipe.carbs_g||0}g`,     color:'#8B5CF6' },
            { label:'Gras', value:`${recipe.fat_g||0}g`,       color:'#F59E0B' },
          ].map(m => (
            <div key={m.label} style={{ textAlign:'center', padding:'8px 4px', borderRadius:12,
              background:m.color+'10', border:`1px solid ${m.color}20` }}>
              <p style={{ fontSize:14, fontWeight:800, color:m.color, margin:0 }}>{m.value}</p>
              <p style={{ fontSize:10, color:theme.textMuted, margin:0 }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:16 }}>
            {recipe.tags.map(t => (
              <span key={t} style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:8,
                background:theme.surface2, color:theme.textMuted }}>#{t}</span>
            ))}
          </div>
        )}

        {/* Ingredientes */}
        {recipe.ingredients?.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:12, fontWeight:800, color:theme.text, margin:'0 0 8px',
              textTransform:'uppercase', letterSpacing:'.06em' }}>Ingredientes</p>
            {recipe.ingredients.map((ing, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between',
                padding:'7px 0', borderBottom:`1px solid ${theme.border}` }}>
                <span style={{ fontSize:13, color:theme.text }}>{ing.name}</span>
                <span style={{ fontSize:13, color:theme.textMuted, fontWeight:600 }}>{ing.grams}g</span>
              </div>
            ))}
          </div>
        )}

        {/* Pasos */}
        {recipe.steps?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <p style={{ fontSize:12, fontWeight:800, color:theme.text, margin:'0 0 8px',
              textTransform:'uppercase', letterSpacing:'.06em' }}>Preparación</p>
            {recipe.steps.map((step, i) => (
              <div key={i} style={{ display:'flex', gap:10, marginBottom:8 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:theme.primary,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'white' }}>{i+1}</span>
                </div>
                <p style={{ fontSize:13, color:theme.text, margin:'2px 0 0', lineHeight:1.5 }}>{step}</p>
              </div>
            ))}
          </div>
        )}

        {/* Añadir al diario */}
        <div style={{ marginBottom:12 }}>
          <p style={{ fontSize:12, fontWeight:700, color:theme.textMuted, margin:'0 0 8px' }}>
            Añadir al diario
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {MEAL_TYPES.map(mt => (
              <motion.button key={mt.id} whileTap={{ scale:0.97 }}
                onClick={() => onAddToDiary(recipe, mt.id)}
                style={{ padding:'10px', borderRadius:12, border:`1px solid ${theme.border}`,
                  background:'white', cursor:'pointer', fontSize:12, fontWeight:600, color:theme.text }}>
                {mt.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Guardar */}
        <motion.button whileTap={{ scale:0.97 }} onClick={() => onSave(recipe)}
          style={{ width:'100%', padding:'13px', borderRadius:16, border:'none', cursor:'pointer',
            background: saved ? '#D1FAE5' : `linear-gradient(135deg,${theme.primary},#6EE7B7)`,
            color: saved ? '#059669' : 'white', fontSize:14, fontWeight:800,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          {saved ? <><Check size={16} /> Guardada en tus recetas</> : <><BookOpen size={16} /> Guardar receta</>}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─── BANNER PRINCIPAL ─────────────────────────────────────────────────────────
export default function RecipeUnlockBanner({ userId, userXP = 0, userLevel = 1, onAddToDiary }) {
  const { theme } = useTheme()
  const { addXP } = useStore()

  const [recipes,       setRecipes]       = useState([])
  const [savedIds,      setSavedIds]      = useState(new Set())
  const [loading,       setLoading]       = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [toast,         setToast]         = useState(null)
  const [filter,        setFilter]        = useState('all')

  useEffect(() => {
    if (!userId) return
    loadRecipes()
  }, [userId, userXP])

  async function loadRecipes() {
    setLoading(true)
    try {
      // Cargar todas las recetas
      const { data: library } = await supabase
        .from('recipe_library')
        .select('*')
        .order('unlock_xp', { ascending: true })

      // Cargar las que el usuario ha guardado
      const { data: saved } = await supabase
        .from('user_recipes')
        .select('recipe_id')
        .eq('user_id', userId)

      setRecipes(library || [])
      setSavedIds(new Set((saved || []).map(s => s.recipe_id)))
    } catch { setRecipes([]) }
    finally { setLoading(false) }
  }

  async function handleSave(recipe) {
    if (savedIds.has(recipe.id)) return
    try {
      await supabase.from('user_recipes').upsert({
        user_id: userId, recipe_id: recipe.id,
      }, { onConflict: 'user_id,recipe_id' })
      setSavedIds(prev => new Set([...prev, recipe.id]))
      showToast(`✅ "${recipe.name}" guardada`)
      addXP?.(5)
    } catch {}
  }

  async function handleAddToDiary(recipe, mealType) {
    const today = new Date().toISOString().split('T')[0]
    try {
      await supabase.from('meal_logs').insert({
        user_id:   userId,
        date:      today,
        meal_type: mealType,
        food_name: recipe.name,
        calories:  recipe.calories || 0,
        protein_g: recipe.protein_g || 0,
        carbs_g:   recipe.carbs_g || 0,
        fat_g:     recipe.fat_g || 0,
      })
      // Incrementar veces cocinada
      await supabase.from('user_recipes')
        .update({ cooked_count: (savedIds.has(recipe.id) ? 1 : 0) + 1, last_cooked: new Date().toISOString() })
        .eq('user_id', userId).eq('recipe_id', recipe.id)

      showToast(`🍽️ "${recipe.name}" añadida al diario`)
      onAddToDiary?.()
      setSelectedRecipe(null)
    } catch {}
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const isUnlocked = (r) => userXP >= (r.unlock_xp || 0) && userLevel >= (r.unlock_level || 1)

  const FILTERS = [
    { id:'all',       label:'Todas' },
    { id:'saved',     label:'💾 Guardadas' },
    { id:'desayuno',  label:'🌅 Desayuno' },
    { id:'almuerzo',  label:'☀️ Comida' },
    { id:'cena',      label:'🌙 Cena' },
    { id:'merienda',  label:'🍎 Merienda' },
  ]

  const filtered = recipes.filter(r => {
    if (filter === 'saved')   return savedIds.has(r.id)
    if (filter === 'all')     return true
    return r.tags?.includes(filter) || r.category === filter
  })

  if (loading) return null

  return (
    <>
      <div style={{ marginBottom:12 }}>
        {/* Header del banner */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:10, padding:'0 2px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:10,
              background:`linear-gradient(135deg,${theme.primary},#6EE7B7)`,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Wheat size={16} style={{ color:'white' }} />
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:theme.text, margin:0 }}>Mis Recetas</p>
              <p style={{ fontSize:10, color:theme.textMuted, margin:0 }}>
                {savedIds.size} guardadas · {recipes.filter(isUnlocked).length} desbloqueadas
              </p>
            </div>
          </div>
          <span style={{ fontSize:11, color:theme.primary, fontWeight:700 }}>
            {userXP} XP
          </span>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:5, overflowX:'auto', marginBottom:10, paddingBottom:2 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ flexShrink:0, padding:'5px 10px', borderRadius:10, border:'none',
                cursor:'pointer', fontSize:11, fontWeight:700, whiteSpace:'nowrap',
                background: filter===f.id ? theme.primary : theme.surface2,
                color: filter===f.id ? 'white' : theme.textMuted }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Cards horizontales */}
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8 }}>
          {filtered.map(recipe => {
            const unlocked = isUnlocked(recipe)
            const saved    = savedIds.has(recipe.id)
            return (
              <motion.div key={recipe.id} whileTap={{ scale: unlocked ? 0.97 : 1 }}
                onClick={() => unlocked && setSelectedRecipe(recipe)}
                style={{ flexShrink:0, width:140, borderRadius:16,
                  background: unlocked ? 'white' : '#F9FAFB',
                  border:`1px solid ${saved ? theme.primary+'40' : theme.border}`,
                  padding:'12px', cursor: unlocked ? 'pointer' : 'default',
                  position:'relative', opacity: unlocked ? 1 : 0.65,
                  boxShadow: saved ? `0 2px 12px ${theme.primary}20` : '0 1px 4px rgba(0,0,0,0.05)' }}>

                {/* Emoji */}
                <div style={{ fontSize:28, marginBottom:6, textAlign:'center' }}>{recipe.emoji}</div>

                {/* Nombre */}
                <p style={{ fontSize:12, fontWeight:800, color:theme.text, margin:'0 0 3px',
                  overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                  {recipe.name}
                </p>

                {/* Calorías */}
                <p style={{ fontSize:10, color:theme.primary, fontWeight:700, margin:'0 0 6px' }}>
                  {Math.round(recipe.calories||0)} kcal
                </p>

                {/* Unlock info o guardada */}
                {saved ? (
                  <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                    <Check size={10} style={{ color:'#059669' }} />
                    <span style={{ fontSize:9, color:'#059669', fontWeight:700 }}>Guardada</span>
                  </div>
                ) : !unlocked ? (
                  <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                    <Lock size={10} style={{ color:'#9CA3AF' }} />
                    <span style={{ fontSize:9, color:'#9CA3AF', fontWeight:600 }}>
                      {recipe.unlock_xp} XP
                    </span>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                    <Star size={10} style={{ color:theme.primary }} />
                    <span style={{ fontSize:9, color:theme.primary, fontWeight:600 }}>Disponible</span>
                  </div>
                )}

                {/* Badge bloqueado overlay */}
                {!unlocked && (
                  <div style={{ position:'absolute', inset:0, borderRadius:16,
                    background:'rgba(255,255,255,0.4)', display:'flex',
                    alignItems:'center', justifyContent:'center' }}>
                    <div style={{ textAlign:'center', padding:'4px 8px', borderRadius:8,
                      background:'rgba(0,0,0,0.08)' }}>
                      <Lock size={16} style={{ color:'#9CA3AF' }} />
                      <p style={{ fontSize:9, color:'#6B7280', margin:'2px 0 0', fontWeight:700 }}>
                        Nivel {recipe.unlock_level}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}

          {/* Card vacía si no hay en el filtro */}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', width:'100%', padding:'20px 0',
              color:theme.textMuted, fontSize:13 }}>
              {filter === 'saved' ? 'Aún no has guardado recetas' : 'Sin recetas en esta categoría'}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      <AnimatePresence>
        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            saved={savedIds.has(selectedRecipe.id)}
            onSave={handleSave}
            onAddToDiary={handleAddToDiary}
            onClose={() => setSelectedRecipe(null)} />
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
            <p style={{ fontSize:13, fontWeight:700, color:'#1A2332', margin:0 }}>{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
