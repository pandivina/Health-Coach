// ── DESPENSA TAB ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Camera, Trash2, Sparkles, Clock, Flame, CheckCircle, ChefHat, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'

const CATEGORIES = ['lácteos','carnes','verduras','frutas','cereales','bebidas','otros']

export function DespensaTab() {
  const { user } = useStore()
  const { theme } = useTheme()
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [form, setForm] = useState({ ingredient: '', quantity: '1', unit: 'unidad', category: 'otros' })
  const fileRef = useRef()

  async function load() {
    const { data } = await supabase.from('pantry_items').select('*').eq('user_id', user.id).order('category')
    setItems(data || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function add() {
    if (!form.ingredient) return
    await supabase.from('pantry_items').insert({ ...form, user_id: user.id, quantity: parseFloat(form.quantity) || 1 })
    setForm({ ingredient: '', quantity: '1', unit: 'unidad', category: 'otros' })
    setShowForm(false); load()
  }

  async function remove(id) {
    await supabase.from('pantry_items').delete().eq('id', id); load()
  }

  async function scanReceipt(e) {
  const file = e.target.files[0]
  if (!file) return
  setScanning(true)
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = ev => resolve(ev.target.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const result = await api.pantry.uploadReceipt(base64, file.type)
    alert(`✅ Se añadieron ${result.inserted} ingredientes`)
    load()
  } catch (err) {
    console.error('Despensa foto error:', err)
    alert('No se pudo procesar la foto. Inténtalo de nuevo.')
  } finally {
    setScanning(false)
    if (fileRef.current) fileRef.current.value = ''
  }
}

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat)
    if (catItems.length) acc[cat] = catItems
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2 flex-1">
          <Plus size={15} /> Añadir
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={scanReceipt} />
        <button onClick={() => fileRef.current?.click()} disabled={scanning} className="btn-secondary flex items-center justify-center gap-2 flex-1">
          <Camera size={15} /> {scanning ? 'Leyendo…' : 'Ticket'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-3">
          <input className="input" placeholder="Ingrediente" value={form.ingredient} onChange={e => setForm(f => ({ ...f, ingredient: e.target.value }))} autoFocus />
          <div className="flex gap-2">
            <input className="input flex-1" type="number" placeholder="Cantidad" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {['unidad','kg','g','l','ml'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancelar</button>
            <button onClick={add} className="btn-primary text-sm py-2">Añadir</button>
          </div>
        </motion.div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat}>
          <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: theme.textMuted }}>{cat}</p>
          <div className="space-y-2">
            {catItems.map(item => (
              <div key={item.id} className="card flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm" style={{ color: theme.text }}>{item.ingredient}</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>{item.quantity} {item.unit}</p>
                </div>
                <button onClick={() => remove(item.id)} className="p-2 transition-all" style={{ color: theme.textLight }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center py-10" style={{ color: theme.textMuted }}>
          <p className="text-4xl mb-3">🛒</p><p>Tu despensa está vacía</p>
        </div>
      )}
    </div>
  )
}

// ── RECETAS TAB ──────────────────────────────────────────────
export function RecetasTab() {
  const { user, addXP } = useStore()
  const { theme } = useTheme()
  const [recipes, setRecipes] = useState([])
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(null)

  async function load() {
    const { data } = await supabase.from('generated_recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    setRecipes(data || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function generate() {
    setGenerating(true)
    try {
      const data = await api.recipes.generate()
      setRecipes(prev => [...data, ...prev]); addXP(5)
    } catch { alert('Error. Añade ingredientes en Despensa primero.') }
    finally { setGenerating(false) }
  }

  async function markCooked(id) {
    await api.recipes.cook(id)
    setRecipes(r => r.map(rec => rec.id === id ? { ...rec, cooked: true } : rec)); addXP(30)
  }

  return (
    <div className="space-y-4">
      <button onClick={generate} disabled={generating} className="btn-primary flex items-center justify-center gap-2">
        <Sparkles size={15} /> {generating ? 'Generando con IA…' : 'Generar recetas del día'}
      </button>

      {generating && (
        <div className="card flex items-center gap-3" style={{ color: theme.textMuted }}>
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0"
            style={{ borderColor: `${theme.primary}40`, borderTopColor: theme.primary }} />
          <p className="text-sm">Creando recetas con tus ingredientes…</p>
        </div>
      )}

      <div className="space-y-3">
        {recipes.map(recipe => (
          <motion.div key={recipe.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card cursor-pointer" style={{ opacity: recipe.cooked ? 0.5 : 1 }}
            onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold" style={{ color: theme.text }}>{recipe.title}</p>
                  {recipe.cooked && <CheckCircle size={13} style={{ color: theme.success }} />}
                </div>
                <div className="flex gap-3 mt-1 text-xs" style={{ color: theme.textMuted }}>
                  <span className="flex items-center gap-1"><Flame size={10} /> {recipe.calories} kcal</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {recipe.prep_time} min</span>
                </div>
              </div>
              <span style={{ color: theme.textMuted }}>{expanded === recipe.id ? '▲' : '▼'}</span>
            </div>

            {expanded === recipe.id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Ingredientes</p>
                  <ul className="space-y-1">
                    {(recipe.ingredients || []).map((ing, i) => (
                      <li key={i} className="text-sm flex items-center gap-2" style={{ color: theme.textMuted }}>
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: theme.primary }} /> {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>{recipe.instructions}</p>
                {!recipe.cooked && (
                  <button onClick={(e) => { e.stopPropagation(); markCooked(recipe.id) }} className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                    <CheckCircle size={14} /> Ya la cociné (+30 XP)
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
        {recipes.length === 0 && !generating && (
          <div className="text-center py-10" style={{ color: theme.textMuted }}>
            <ChefHat size={40} className="mx-auto mb-3 opacity-30" />
            <p>Genera recetas basadas en tu despensa</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TENDENCIAS TAB ───────────────────────────────────────────
export function TendenciasTab() {
  const { user } = useStore()
  const { theme } = useTheme()
  const [weekData, setWeekData] = useState([])
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const days = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })
      const [mealsRes, goalsRes] = await Promise.all([
        supabase.from('meal_logs').select('date, calories, protein_g').eq('user_id', user.id).in('date', days),
        supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
      ])
      const meals = mealsRes.data || []
      if (goalsRes.data) setGoals(goalsRes.data)
      const data = days.map(date => {
        const dayMeals = meals.filter(m => m.date === date)
        return {
          date, day: new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' }),
          calories: Math.round(dayMeals.reduce((s, m) => s + m.calories, 0)),
          protein: Math.round(dayMeals.reduce((s, m) => s + m.protein_g, 0)),
          hasData: dayMeals.length > 0,
        }
      })
      setWeekData(data); setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Cargando tendencias…</div>

  const daysWithData = weekData.filter(d => d.hasData)
  const avgCals = daysWithData.length ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length) : 0
  const maxCals = Math.max(...weekData.map(d => d.calories), goals.calories)
  const consistency = Math.round((daysWithData.length / 7) * 100)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          ['🔥', 'Media calórica', `${avgCals} kcal`],
          ['✅', 'Consistencia', `${consistency}%`],
          ['💪', 'Proteína media', `${daysWithData.length ? Math.round(daysWithData.reduce((s,d)=>s+d.protein,0)/daysWithData.length) : 0}g`],
          ['📅', 'Días registrados', `${daysWithData.length}/7`],
        ].map(([e, l, v]) => (
          <div key={l} className="card">
            <p className="text-2xl mb-1">{e}</p>
            <p className="font-bold" style={{ color: theme.text }}>{v}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{l}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="font-semibold text-sm mb-4" style={{ color: theme.text }}>Calorías — últimos 7 días</p>
        <div className="flex items-end gap-2 h-32">
          {weekData.map((d, i) => {
            const pct = maxCals > 0 ? (d.calories / maxCals) * 100 : 0
            const isGoal = Math.abs(d.calories - goals.calories) < goals.calories * 0.15
            const isOver = d.calories > goals.calories * 1.15
            const color = !d.hasData ? theme.surface2 : isOver ? theme.error : isGoal ? theme.success : theme.primary
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px]" style={{ color: theme.textMuted }}>{d.hasData ? d.calories : ''}</span>
                <div className="w-full flex items-end" style={{ height: '88px' }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(pct, d.hasData ? 5 : 0)}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="w-full rounded-t-lg" style={{ background: color, minHeight: d.hasData ? '4px' : '0' }} />
                </div>
                <span className="text-[10px] capitalize" style={{ color: theme.textMuted }}>{d.day}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default { DespensaTab, RecetasTab, TendenciasTab }
