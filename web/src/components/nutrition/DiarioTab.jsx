import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Hash, Plus, Trash2, ChefHat, Flame } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'

const MEAL_TYPES = ['breakfast','lunch','dinner','snack']
const MEAL_LABELS = { breakfast:'🌅 Desayuno', lunch:'☀️ Comida', dinner:'🌙 Cena', snack:'🍎 Snack' }

function MacroBar({ label, value, max, color }) {
  const pct = Math.min((value/max)*100, 100)
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

function AddMealForm({ onAdd, onCancel }) {
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
  const { theme } = useTheme()
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
    addXP(10); setAddingTo(null); load()
  }

  async function deleteMeal(id) {
    await supabase.from('meal_logs').delete().eq('id', id); load()
  }

  const totalCals    = meals.reduce((s, m) => s + (m.calories || 0), 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const totalCarbs   = meals.reduce((s, m) => s + (m.carbs_g || 0), 0)
  const totalFat     = meals.reduce((s, m) => s + (m.fat_g || 0), 0)
  const remaining    = Math.max(goals.calories - totalCals, 0)
  const calPct       = Math.min((totalCals / goals.calories) * 100, 100)

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Calorías hoy</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold" style={{ color: theme.text }}>{Math.round(totalCals)}</span>
              <span className="text-sm" style={{ color: theme.textMuted }}>/ {goals.calories} kcal</span>
            </div>
            <p className="text-sm mt-1 font-medium" style={{ color: remaining > 0 ? theme.success : theme.error }}>
              {remaining > 0 ? `${remaining} kcal restantes` : `${Math.abs(Math.round(totalCals - goals.calories))} kcal superadas`}
            </p>
          </div>
          <div className="w-14 h-14 relative">
            <svg viewBox="0 0 56 56" className="-rotate-90 w-full h-full">
              <circle cx="28" cy="28" r="22" fill="none" stroke={`${theme.primary}20`} strokeWidth="5" />
              <motion.circle cx="28" cy="28" r="22" fill="none" stroke={theme.primary} strokeWidth="5"
                strokeDasharray={2*Math.PI*22} strokeDashoffset={2*Math.PI*22*(1-calPct/100)}
                strokeLinecap="round" initial={{ strokeDashoffset: 2*Math.PI*22 }}
                animate={{ strokeDashoffset: 2*Math.PI*22*(1-calPct/100) }} />
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
          { icon: Camera, label: 'Foto', action: onAnalyze },
          { icon: Hash, label: 'Código', action: onScan },
          { icon: Plus, label: 'Manual', action: () => setAddingTo('snack') },
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

      {/* Meals by type */}
      {MEAL_TYPES.map(type => {
        const typeMeals = meals.filter(m => m.meal_type === type)
        const typeCals = typeMeals.reduce((s, m) => s + m.calories, 0)
        return (
          <div key={type} className="card">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm" style={{ color: theme.text }}>{MEAL_LABELS[type]}</p>
                {typeCals > 0 && <p className="text-xs" style={{ color: theme.textMuted }}>{Math.round(typeCals)} kcal</p>}
              </div>
              <button onClick={() => setAddingTo(addingTo === type ? null : type)}
                className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                style={{ background: `${theme.primary}20` }}>
                <Plus size={14} style={{ color: theme.primary }} />
              </button>
            </div>

            {typeMeals.map(m => (
              <div key={m.id} className="flex items-center justify-between py-1.5" style={{ borderTop: `1px solid ${theme.border}` }}>
                <div>
                  <p className="text-sm" style={{ color: theme.text }}>{m.food_name}</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>{m.calories} kcal · P:{m.protein_g}g</p>
                </div>
                <button onClick={() => deleteMeal(m.id)} className="p-1 transition-all" style={{ color: theme.textLight }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {typeMeals.length === 0 && (
              <p className="text-xs py-1" style={{ color: theme.textLight }}>Sin registros</p>
            )}

            {addingTo === type && (
              <AddMealForm onAdd={(form) => addMeal(type, form)} onCancel={() => setAddingTo(null)} />
            )}
          </div>
        )
      })}
    </div>
  )
}
