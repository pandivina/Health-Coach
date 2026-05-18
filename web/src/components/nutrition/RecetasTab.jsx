import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Clock, Flame, CheckCircle, ChefHat } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'

export default function RecetasTab() {
  const { user, addXP } = useStore()
  const [recipes, setRecipes] = useState([])
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(null)

  async function load() {
    const { data } = await supabase.from('generated_recipes').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    setRecipes(data || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function generate() {
    setGenerating(true)
    try {
      const data = await api.recipes.generate()
      setRecipes(prev => [...data, ...prev])
      addXP(5)
    } catch { alert('Error generando recetas. Añade ingredientes en Despensa primero.') }
    finally { setGenerating(false) }
  }

  async function markCooked(id) {
    await api.recipes.cook(id)
    setRecipes(r => r.map(rec => rec.id === id ? { ...rec, cooked: true } : rec))
    addXP(30)
  }

  return (
    <div className="space-y-4">
      <button onClick={generate} disabled={generating}
        className="btn-primary flex items-center justify-center gap-2">
        <Sparkles size={15} /> {generating ? 'Generando con IA…' : 'Generar recetas del día'}
      </button>

      {generating && (
        <div className="card flex items-center gap-3 text-white/50">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm">Creando recetas con tus ingredientes y objetivos nutricionales…</p>
        </div>
      )}

      <div className="space-y-3">
        {recipes.map(recipe => (
          <motion.div key={recipe.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`card cursor-pointer transition-all ${recipe.cooked ? 'opacity-50' : ''}`}
            onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{recipe.title}</p>
                  {recipe.cooked && <CheckCircle size={13} className="text-accent-green flex-shrink-0" />}
                  {recipe.is_ai_generated !== false && (
                    <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">IA</span>
                  )}
                </div>
                <div className="flex gap-3 mt-1 text-white/40 text-xs">
                  <span className="flex items-center gap-1"><Flame size={10} /> {recipe.calories} kcal</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {recipe.prep_time} min</span>
                  <span>💪 {recipe.protein_g}g</span>
                </div>
              </div>
              <span className="text-white/30 ml-2">{expanded === recipe.id ? '▲' : '▼'}</span>
            </div>

            {expanded === recipe.id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Ingredientes</p>
                  <ul className="space-y-1">
                    {(recipe.ingredients || []).map((ing, i) => (
                      <li key={i} className="text-sm text-white/70 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" /> {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Preparación</p>
                  <p className="text-sm text-white/70 leading-relaxed">{recipe.instructions}</p>
                </div>
                {!recipe.cooked && (
                  <button onClick={(e) => { e.stopPropagation(); markCooked(recipe.id) }}
                    className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                    <CheckCircle size={14} /> Ya la cociné (+30 XP)
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}

        {recipes.length === 0 && !generating && (
          <div className="text-center py-10 text-white/30">
            <ChefHat size={40} className="mx-auto mb-3 opacity-30" />
            <p>Genera recetas basadas en tu despensa y objetivos</p>
          </div>
        )}
      </div>
    </div>
  )
}
