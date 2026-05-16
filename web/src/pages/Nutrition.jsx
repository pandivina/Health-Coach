import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Camera, Hash, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useStore } from '../store/useStore'

const MEAL_TYPES = ['breakfast','lunch','dinner','snack']
const MEAL_LABELS = { breakfast:'Desayuno', lunch:'Comida', dinner:'Cena', snack:'Snack' }

function MacroBar({ label, value, max, color }) {
  const pct = Math.min((value/max)*100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>{label}</span><span>{Math.round(value)}g / {max}g</span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  )
}

export default function Nutrition() {
  const { user, addXP } = useStore()
  const [meals, setMeals] = useState([])
  const [goals, setGoals] = useState({ calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 })
  const [activeTab, setActiveTab] = useState('breakfast')
  const [showForm, setShowForm] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [form, setForm] = useState({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const fileRef = useRef()
  const today = new Date().toISOString().split('T')[0]

  async function loadData() {
    if (!user) return
    const [mealsRes, goalsRes] = await Promise.all([
      supabase.from('meal_logs').select('*').eq('user_id', user.id).eq('date', today).order('created_at'),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
    ])
    setMeals(mealsRes.data || [])
    if (goalsRes.data) setGoals(goalsRes.data)
  }

  useEffect(() => { loadData() }, [user])

  async function addMeal() {
    if (!form.food_name || !form.calories) return
    const { error } = await supabase.from('meal_logs').insert({
      user_id: user.id, date: today, meal_type: activeTab,
      food_name: form.food_name,
      calories: parseFloat(form.calories) || 0,
      protein_g: parseFloat(form.protein_g) || 0,
      carbs_g: parseFloat(form.carbs_g) || 0,
      fat_g: parseFloat(form.fat_g) || 0,
    })
    if (!error) {
      await addXP(10)
      setForm({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
      setShowForm(false)
      loadData()
    }
  }

  async function analyzePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setAnalyzing(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const data = await api.nutrition.analyzePhoto(base64, file.type)
        setForm({
          food_name: data.food_name || '',
          calories: String(data.calories || ''),
          protein_g: String(data.protein_g || ''),
          carbs_g: String(data.carbs_g || ''),
          fat_g: String(data.fat_g || ''),
        })
        setShowForm(true)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      alert('No se pudo analizar la imagen')
    } finally {
      setAnalyzing(false)
    }
  }

  async function deleteLog(id) {
    await supabase.from('meal_logs').delete().eq('id', id)
    loadData()
  }

  const totalCals = meals.reduce((s, m) => s + m.calories, 0)
  const totalProtein = meals.reduce((s, m) => s + m.protein_g, 0)
  const totalCarbs = meals.reduce((s, m) => s + m.carbs_g, 0)
  const totalFat = meals.reduce((s, m) => s + m.fat_g, 0)
  const filteredMeals = meals.filter(m => m.meal_type === activeTab)

  return (
    <div className="page">
      <h1 className="text-2xl font-extrabold mb-4">Nutrición 🍎</h1>

      {/* Calorías progress */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Calorías</span>
          <span className="text-white/50 text-sm">{Math.round(totalCals)} / {goals.calories} kcal</span>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-4">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalCals/goals.calories)*100,100)}%` }}
            className="h-full rounded-full bg-gradient-brand" />
        </div>
        <div className="space-y-2">
          <MacroBar label="Proteína" value={totalProtein} max={goals.protein_g} color="#6366f1" />
          <MacroBar label="Carbos"   value={totalCarbs}   max={goals.carbs_g}   color="#f97316" />
          <MacroBar label="Grasa"    value={totalFat}     max={goals.fat_g}     color="#22c55e" />
        </div>
      </div>

      {/* Meal type tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {MEAL_TYPES.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === t ? 'bg-accent text-white' : 'bg-surface-2 text-white/50'
            }`}>{MEAL_LABELS[t]}</button>
        ))}
      </div>

      {/* Food list */}
      <div className="space-y-2 mb-4">
        {filteredMeals.map(m => (
          <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{m.food_name}</p>
              <p className="text-white/40 text-xs">{m.calories} kcal · {m.protein_g}g proteína</p>
            </div>
            <button onClick={() => deleteLog(m.id)} className="text-white/20 active:text-accent-red transition-all p-2">
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
        {filteredMeals.length === 0 && <p className="text-white/30 text-sm text-center py-4">Sin registros aún</p>}
      </div>

      {/* Add form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card mb-4 space-y-3">
          <input className="input" placeholder="Nombre del alimento" value={form.food_name} onChange={e => setForm(f => ({ ...f, food_name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            {[['calories','Calorías (kcal)'],['protein_g','Proteína (g)'],['carbs_g','Carbos (g)'],['fat_g','Grasa (g)']].map(([k,p]) => (
              <input key={k} className="input text-sm" type="number" placeholder={p} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancelar</button>
            <button onClick={addMeal} className="btn-primary text-sm py-2">Añadir</button>
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2">
          <Plus size={16} /> Manual
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={analyzePhoto} />
        <button onClick={() => fileRef.current?.click()} disabled={analyzing}
          className="btn-secondary flex items-center justify-center gap-2 flex-1">
          <Camera size={16} /> {analyzing ? 'Analizando…' : 'Foto'}
        </button>
      </div>
    </div>
  )
}
