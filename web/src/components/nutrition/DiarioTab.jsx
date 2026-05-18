import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Hash, Plus, Trash2, ChefHat, Flame } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = { breakfast: '🌅 Desayuno', lunch: '☀️ Comida', dinner: '🌙 Cena', snack: '🍎 Snack' }

function MacroRing({ value, max, color, label, unit = 'g' }) {
  const r = 28, circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          <motion.circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
            initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 0.8, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{Math.round(value)}</span>
        </div>
      </div>
      <p className="text-white/40 text-[10px]">{label}</p>
      <p className="text-white/20 text-[9px]">/ {max}{unit}</p>
    </div>
  )
}

function AddMealForm({ mealType, onAdd, onCancel }) {
  const [form, setForm] = useState({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card mt-3 space-y-3">
      <input className="input text-sm" placeholder="Nombre del alimento" value={form.food_name} onChange={e => set('food_name', e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-2">
        {[['calories','Calorías (kcal)'],['protein_g','Proteína (g)'],['carbs_g','Carbos (g)'],['fat_g','Grasa (g)']].map(([k, p]) => (
          <input key={k} className="input text-sm" type="number" placeholder={p} value={form[k]} onChange={e => set(k, e.target.value)} />
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary text-sm py-2">Cancelar</button>
        <button onClick={() => { if (form.food_name) onAdd(form) }} className="btn-primary text-sm py-2">Añadir</button>
      </div>
    </motion.div>
  )
}

export default function DiarioTab({ onAnalyze, onScan, onRecipes }) {
  const { user, addXP } = useStore()
  const [meals, setMeals] = useState([])
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 })
  const [addingTo, setAddingTo] = useState(null)
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

  async function addMeal(mealType, form) {
    await supabase.from('meal_logs').insert({
      user_id: user.id, date: today, meal_type: mealType,
      food_name: form.food_name,
      calories: parseFloat(form.calories) || 0,
      protein_g: parseFloat(form.protein_g) || 0,
      carbs_g: parseFloat(form.carbs_g) || 0,
      fat_g: parseFloat(form.fat_g) || 0,
    })
    addXP(10)
    setAddingTo(null)
    load()
  }

  async function deleteMeal(id) {
    await supabase.from('meal_logs').delete().eq('id', id)
    load()
  }

  const totalCals = meals.reduce((s, m) => s + (m.calories || 0), 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs_g || 0), 0)
  const totalFat = meals.reduce((s, m) => s + (m.fat_g || 0), 0)
  const remaining = Math.max(goals.calories - totalCals, 0)
  const calPct = Math.min((totalCals / goals.calories) * 100, 100)

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 bg-gradient-to-br from-emerald-500/20 via-surface-2 to-surface-2 border border-emerald-500/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Calorías hoy</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold">{Math.round(totalCals)}</span>
              <span className="text-white/40 text-sm">/ {goals.calories} kcal</span>
            </div>
            <p className="text-emerald-400 text-sm mt-1 font-medium">
              {remaining > 0 ? `${remaining} kcal restantes` : `${Math.abs(Math.round(totalCals - goals.calories))} kcal superadas`}
            </p>
          </div>
          <div className="text-right">
            <div className="w-14 h-14 relative">
              <svg viewBox="0 0 56 56" className="-rotate-90 w-full h-full">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <motion.circle cx="28" cy="28" r="22" fill="none" stroke="#10b981" strokeWidth="5"
                  strokeDasharray={2*Math.PI*22}
                  strokeDashoffset={2*Math.PI*22*(1-calPct/100)}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2*Math.PI*22 }}
                  animate={{ strokeDashoffset: 2*Math.PI*22*(1-calPct/100) }}
                  transition={{ duration: 0.8 }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame size={16} className="text-emerald-400" />
              </div>
            </div>
            <p className="text-white/30 text-[10px] mt-1">{Math.round(calPct)}%</p>
          </div>
        </div>

        {/* Macro rings */}
        <div className="flex justify-around pt-3 border-t border-white/5">
          <MacroRing value={totalProtein} max={goals.protein_g} color="#6366f1" label="Proteína" />
          <MacroRing value={totalCarbs}   max={goals.carbs_g}   color="#f97316" label="Carbos" />
          <MacroRing value={totalFat}     max={goals.fat_g}     color="#22c55e" label="Grasa" />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Camera, label: 'Foto', color: 'from-violet-500/20', action: onAnalyze },
          { icon: Hash, label: 'Código', color: 'from-blue-500/20', action: onScan },
          { icon: Plus, label: 'Manual', color: 'from-emerald-500/20', action: () => setAddingTo('snack') },
          { icon: ChefHat, label: 'Recetas', color: 'from-orange-500/20', action: onRecipes },
        ].map(({ icon: Icon, label, color, action }) => (
          <button key={label} onClick={action}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b ${color} to-surface-2 border border-white/5 active:scale-95 transition-all`}>
            <Icon size={18} className="text-white/70" />
            <span className="text-[10px] text-white/50 font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Meals by type */}
      {MEAL_TYPES.map(type => {
        const typeMeals = meals.filter(m => m.meal_type === type)
        const typeCals = typeMeals.reduce((s, m) => s + m.calories, 0)
        return (
          <div key={type} className="card">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{MEAL_LABELS[type]}</p>
                {typeCals > 0 && <p className="text-white/30 text-xs">{Math.round(typeCals)} kcal</p>}
              </div>
              <button onClick={() => setAddingTo(addingTo === type ? null : type)}
                className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center active:scale-90 transition-all">
                <Plus size={14} className="text-accent" />
              </button>
            </div>

            {typeMeals.map(m => (
              <div key={m.id} className="flex items-center justify-between py-1.5 border-t border-white/5">
                <div>
                  <p className="text-sm">{m.food_name}</p>
                  <p className="text-white/30 text-xs">{m.calories} kcal · P:{m.protein_g}g · C:{m.carbs_g}g · G:{m.fat_g}g</p>
                </div>
                <button onClick={() => deleteMeal(m.id)} className="text-white/20 hover:text-accent-red p-1 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {typeMeals.length === 0 && (
              <p className="text-white/20 text-xs py-1">Sin registros</p>
            )}

            {addingTo === type && (
              <AddMealForm mealType={type} onAdd={(form) => addMeal(type, form)} onCancel={() => setAddingTo(null)} />
            )}
          </div>
        )
      })}
    </div>
  )
}
