import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Hash, Plus, Trash2, ChefHat, Flame, Search, X, Clock, Star, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'

// ─── SUPABASE: crear tabla food_history ──────────────────────────────────────
// Ejecuta este SQL en el editor de Supabase una sola vez:
//
// create table food_history (
//   id uuid default gen_random_uuid() primary key,
//   user_id uuid references auth.users(id) on delete cascade not null,
//   food_name text not null,
//   calories_per_100g float default 0,
//   protein_per_100g  float default 0,
//   carbs_per_100g    float default 0,
//   fat_per_100g      float default 0,
//   off_id text,
//   is_custom boolean default false,
//   use_count int default 1,
//   last_used_at timestamptz default now(),
//   created_at   timestamptz default now()
// );
// alter table food_history enable row level security;
// create policy "own" on food_history for all using (auth.uid() = user_id);
// ─────────────────────────────────────────────────────────────────────────────

const MEAL_TYPES  = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = { breakfast: '🌅 Desayuno', lunch: '☀️ Comida', dinner: '🌙 Cena', snack: '🍎 Snack' }

// ─── OPEN FOOD FACTS ─────────────────────────────────────────────────────────

async function searchOFF(query) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?` +
      `search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1` +
      `&lc=es&cc=es&page_size=20&fields=product_name,nutriments,brands,code,image_small_url`
    const res  = await fetch(url)
    const data = await res.json()
    return (data.products || [])
      .filter(p => p.product_name && p.product_name.trim())
      .slice(0, 15)
  } catch { return [] }
}

function parseOFF(product) {
  const n = product.nutriments || {}
  return {
    food_name:         (product.product_name || product.brands || 'Producto').trim(),
    calories_per_100g: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
    protein_per_100g:  n.proteins_100g    ?? 0,
    carbs_per_100g:    n.carbohydrates_100g ?? 0,
    fat_per_100g:      n.fat_100g         ?? 0,
    off_id:            product.code       ?? null,
    image:             product.image_small_url ?? null,
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

// ─── MACROBAR ────────────────────────────────────────────────────────────────

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

// ─── SELECTOR DE CANTIDAD ─────────────────────────────────────────────────────

function PortionPicker({ food, onConfirm, onBack, theme }) {
  const [grams, setGrams] = useState('100')
  const g     = Math.max(parseFloat(grams) || 0, 0)
  const entry = calcEntry(food, g)
  const QUICK = [50, 100, 150, 200, 250]

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {/* Food header */}
      <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: theme.surface2 }}>
        <span style={{ fontSize: 28 }}>🍽️</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>{food.food_name}</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {Math.round(food.calories_per_100g)} kcal / 100g
          </p>
        </div>
      </div>

      {/* Cantidad */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: theme.textMuted }}>CANTIDAD (gramos)</p>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="number" value={grams} onChange={e => setGrams(e.target.value)}
            className="input text-center font-bold text-lg flex-1"
            style={{ maxWidth: 110 }}
          />
          <span className="text-sm font-medium" style={{ color: theme.textMuted }}>g</span>
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
          { l: 'Kcal',    v: entry.calories,  unit: '' },
          { l: 'Prot',    v: entry.protein_g, unit: 'g' },
          { l: 'Carbos',  v: entry.carbs_g,   unit: 'g' },
          { l: 'Grasa',   v: entry.fat_g,     unit: 'g' },
        ].map(({ l, v, unit }) => (
          <div key={l} className="text-center">
            <p className="font-extrabold text-sm" style={{ color: theme.primary }}>{v}{unit}</p>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button onClick={onBack}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold"
          style={{ background: theme.surface2, color: theme.textMuted }}>
          ← Volver
        </button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => onConfirm(entry)}
          disabled={g === 0}
          className="flex-2 px-8 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)', flex: 2 }}>
          Añadir a {MEAL_LABELS[food._mealType]?.split(' ')[1] || 'diario'}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── ENTRADA MANUAL ───────────────────────────────────────────────────────────

function ManualForm({ onAdd, theme }) {
  const [form, setForm] = useState({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <input className="input text-sm" placeholder="Nombre del alimento"
        value={form.food_name} onChange={e => set('food_name', e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-2">
        {[['calories','Calorías (kcal)'],['protein_g','Proteína (g)'],['carbs_g','Carbos (g)'],['fat_g','Grasa (g)']].map(([k, p]) => (
          <input key={k} className="input text-sm" type="number" placeholder={p}
            value={form[k]} onChange={e => set(k, e.target.value)} />
        ))}
      </div>
      <motion.button whileTap={{ scale: 0.96 }}
        onClick={() => { if (form.food_name) onAdd(form) }}
        disabled={!form.food_name}
        className="w-full py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg,#2EC4B6,#FF8FA3)' }}>
        Añadir al diario
      </motion.button>
    </motion.div>
  )
}

// ─── MODAL BIBLIOTECA ─────────────────────────────────────────────────────────

function FoodModal({ mealType, userId, theme, onAdd, onClose }) {
  const [tab,       setTab]       = useState('search')  // 'search' | 'manual'
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState([])
  const [recent,    setRecent]    = useState([])
  const [loading,   setLoading]   = useState(false)
  const [selected,  setSelected]  = useState(null)
  const debounceRef = useRef(null)
  const inputRef    = useRef(null)

  // Cargar recientes
  useEffect(() => {
    if (!userId) return
    supabase.from('food_history').select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setRecent(data || []))
  }, [userId])

  // Foco automático
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200) }, [])

  // Búsqueda con debounce
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const res = await searchOFF(query)
      setResults(res)
      setLoading(false)
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function saveToHistory(food) {
    if (!userId) return
    const { data } = await supabase.from('food_history').select('id, use_count')
      .eq('user_id', userId).eq('food_name', food.food_name).maybeSingle()
    if (data) {
      await supabase.from('food_history').update({
        use_count: (data.use_count || 1) + 1,
        last_used_at: new Date().toISOString(),
      }).eq('id', data.id)
    } else {
      await supabase.from('food_history').insert({
        user_id: userId, ...food,
        use_count: 1, last_used_at: new Date().toISOString(),
      })
    }
  }

  function selectFood(food) {
    setSelected({ ...food, _mealType: mealType })
  }

  async function handleConfirm(entry) {
    await saveToHistory(selected)
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

  const showRecent  = query.length < 2 && recent.length > 0
  const showResults = query.length >= 2

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: theme.bg }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: `1px solid ${theme.border}` }}>
        <button onClick={selected ? () => setSelected(null) : onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: theme.surface2 }}>
          {selected ? '←' : <X size={16} color={theme.textMuted} />}
        </button>
        <div className="flex-1">
          <p className="font-extrabold text-base" style={{ color: theme.text }}>
            {selected ? 'Cantidad' : `Añadir a ${MEAL_LABELS[mealType]}`}
          </p>
          {!selected && (
            <p className="text-xs" style={{ color: theme.textMuted }}>
              Busca en millones de alimentos
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {selected ? (
          <PortionPicker food={selected} onConfirm={handleConfirm} onBack={() => setSelected(null)} theme={theme} />
        ) : (
          <div className="space-y-4">
            {/* Tabs */}
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
                {/* Search input */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: theme.textMuted }} />
                  <input
                    ref={inputRef}
                    className="input pl-9 pr-9"
                    placeholder="Ej: pollo a la plancha, manzana…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  {query && (
                    <button onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X size={14} style={{ color: theme.textMuted }} />
                    </button>
                  )}
                </div>

                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 size={18} className="animate-spin" style={{ color: theme.primary }} />
                    <span className="text-sm" style={{ color: theme.textMuted }}>Buscando…</span>
                  </div>
                )}

                {/* Recientes */}
                {showRecent && !loading && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={13} style={{ color: theme.textMuted }} />
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.textMuted }}>
                        Recientes
                      </p>
                    </div>
                    <div className="space-y-1">
                      {recent.map((food, i) => (
                        <FoodRow key={i} food={food} theme={theme} onSelect={() => selectFood(food)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Resultados OFF */}
                {showResults && !loading && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Search size={13} style={{ color: theme.textMuted }} />
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.textMuted }}>
                        Resultados ({results.length})
                      </p>
                    </div>
                    {results.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm" style={{ color: theme.textMuted }}>Sin resultados para «{query}»</p>
                        <button onClick={() => setTab('manual')}
                          className="mt-3 text-sm font-semibold" style={{ color: theme.primary }}>
                          Añadir manualmente →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {results.map((product, i) => {
                          const food = parseOFF(product)
                          return <FoodRow key={i} food={food} theme={theme} onSelect={() => selectFood(food)} />
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state inicial */}
                {!showRecent && !showResults && !loading && (
                  <div className="text-center py-12">
                    <p style={{ fontSize: 48 }}>🔍</p>
                    <p className="mt-3 font-semibold text-sm" style={{ color: theme.text }}>
                      Busca cualquier alimento
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                      Base de datos con más de 3 millones de productos
                    </p>
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

function FoodRow({ food, theme, onSelect }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: theme.surface2 }}>
        🍽️
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{food.food_name}</p>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          {Math.round(food.calories_per_100g || 0)} kcal · P {Math.round(food.protein_per_100g || 0)}g
          · C {Math.round(food.carbs_per_100g || 0)}g · G {Math.round(food.fat_per_100g || 0)}g
          <span style={{ color: theme.textLight }}> / 100g</span>
        </p>
      </div>
      <ChevronRight size={14} style={{ color: theme.textLight, flexShrink: 0 }} />
    </motion.button>
  )
}

// ─── DIARIO TAB (PRINCIPAL) ───────────────────────────────────────────────────

export default function DiarioTab({ onAnalyze, onScan, onRecipes }) {
  const { user, addXP } = useStore()
  const { theme }       = useTheme()
  const [meals,    setMeals]    = useState([])
  const [goals,    setGoals]    = useState({ calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 })
  const [modal,    setModal]    = useState(null)   // mealType o null
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    if (!user) return
    const [mealsRes, goalsRes] = await Promise.all([
      supabase.from('meal_logs').select('*').eq('user_id', user.id).eq('date', today).order('created_at'),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
    ])
    setMeals(mealsRes.data || [])
    if (goalsRes.data) setGoals(goalsRes.data)
  }
  useEffect(() => { load() }, [user])

  async function addMeal(mealType, entry) {
    await supabase.from('meal_logs').insert({
      user_id:   user.id,
      date:      today,
      meal_type: mealType,
      food_name: entry.food_name,
      calories:  entry.calories  || 0,
      protein_g: entry.protein_g || 0,
      carbs_g:   entry.carbs_g   || 0,
      fat_g:     entry.fat_g     || 0,
    })
    await addXP(10)
    setModal(null)
    load()
  }

  async function deleteMeal(id) {
    await supabase.from('meal_logs').delete().eq('id', id); load()
  }

  const totalCals    = meals.reduce((s, m) => s + (m.calories   || 0), 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g  || 0), 0)
  const totalCarbs   = meals.reduce((s, m) => s + (m.carbs_g    || 0), 0)
  const totalFat     = meals.reduce((s, m) => s + (m.fat_g      || 0), 0)
  const remaining    = Math.max(goals.calories - totalCals, 0)
  const calPct       = Math.min((totalCals / goals.calories) * 100, 100)

  return (
    <>
      <div className="space-y-4">
        {/* Hero card calorías */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Calorías hoy</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold" style={{ color: theme.text }}>{Math.round(totalCals)}</span>
                <span className="text-sm" style={{ color: theme.textMuted }}>/ {goals.calories} kcal</span>
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
                <circle cx="28" cy="28" r="22" fill="none" stroke={`${theme.primary}20`} strokeWidth="5" />
                <motion.circle cx="28" cy="28" r="22" fill="none" stroke={theme.primary} strokeWidth="5"
                  strokeDasharray={2*Math.PI*22} strokeLinecap="round"
                  initial={{ strokeDashoffset: 2*Math.PI*22 }}
                  animate={{ strokeDashoffset: 2*Math.PI*22*(1 - calPct/100) }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame size={14} style={{ color: theme.primary }} />
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
            <MacroBar label="Proteína" value={totalProtein} max={goals.protein_g} color={theme.primary} />
            <MacroBar label="Carbos"   value={totalCarbs}   max={goals.carbs_g}   color={theme.warning} />
            <MacroBar label="Grasa"    value={totalFat}     max={goals.fat_g}     color={theme.success} />
          </div>
        </motion.div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Camera,  label: 'Foto',    action: onAnalyze },
            { icon: Hash,    label: 'Código',  action: onScan    },
            { icon: Plus,    label: 'Añadir',  action: () => setModal('snack') },
            { icon: ChefHat, label: 'Recetas', action: onRecipes },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl active:scale-95 transition-all"
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              <Icon size={18} style={{ color: theme.primary }} />
              <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Comidas por tipo */}
        {MEAL_TYPES.map(type => {
          const typeMeals = meals.filter(m => m.meal_type === type)
          const typeCals  = typeMeals.reduce((s, m) => s + m.calories, 0)
          return (
            <div key={type} className="card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm" style={{ color: theme.text }}>{MEAL_LABELS[type]}</p>
                  {typeCals > 0 && (
                    <p className="text-xs" style={{ color: theme.textMuted }}>{Math.round(typeCals)} kcal</p>
                  )}
                </div>
                <button onClick={() => setModal(type)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                  style={{ background: `${theme.primary}20` }}>
                  <Plus size={14} style={{ color: theme.primary }} />
                </button>
              </div>

              {typeMeals.map(m => (
                <div key={m.id} className="flex items-center justify-between py-1.5"
                  style={{ borderTop: `1px solid ${theme.border}` }}>
                  <div>
                    <p className="text-sm" style={{ color: theme.text }}>{m.food_name}</p>
                    <p className="text-xs" style={{ color: theme.textMuted }}>
                      {m.calories} kcal · P:{m.protein_g}g · C:{m.carbs_g}g · G:{m.fat_g}g
                    </p>
                  </div>
                  <button onClick={() => deleteMeal(m.id)} className="p-1" style={{ color: theme.textLight }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {typeMeals.length === 0 && (
                <p className="text-xs py-1" style={{ color: theme.textLight }}>Sin registros</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal biblioteca de alimentos */}
      <AnimatePresence>
        {modal && (
          <FoodModal
            mealType={modal}
            userId={user?.id}
            theme={theme}
            onAdd={(entry) => addMeal(modal, entry)}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
