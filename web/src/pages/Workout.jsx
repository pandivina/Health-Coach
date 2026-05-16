import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Dumbbell, Trash2, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

export default function Workout() {
  const { user, addXP } = useStore()
  const [workouts, setWorkouts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', exercises: '', calories_burned: '', duration_minutes: '' })
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    const { data } = await supabase.from('workouts').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    setWorkouts(data || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function add() {
    if (!form.name) return
    const exercisesList = form.exercises.split('\n').filter(Boolean).map(e => ({ name: e.trim() }))
    await supabase.from('workouts').insert({
      user_id: user.id, date: today,
      name: form.name,
      exercises: exercisesList,
      calories_burned: parseFloat(form.calories_burned) || 0,
      duration_minutes: parseInt(form.duration_minutes) || 0,
    })
    await addXP(50)
    setForm({ name: '', exercises: '', calories_burned: '', duration_minutes: '' })
    setShowForm(false)
    load()
  }

  async function remove(id) {
    await supabase.from('workouts').delete().eq('id', id)
    load()
  }

  const todayWorkouts = workouts.filter(w => w.date === today)
  const totalBurned = todayWorkouts.reduce((s, w) => s + w.calories_burned, 0)

  return (
    <div className="page">
      <h1 className="text-2xl font-extrabold mb-2">Entrenamiento 💪</h1>

      {/* Today summary */}
      {todayWorkouts.length > 0 && (
        <div className="card mb-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame className="text-orange-400" size={22} />
          </div>
          <div>
            <p className="font-semibold">Hoy</p>
            <p className="text-white/50 text-sm">{totalBurned} kcal quemadas · {todayWorkouts.length} sesión{todayWorkouts.length > 1 ? 'es' : ''}</p>
          </div>
        </div>
      )}

      <p className="section-title">Mis entrenos</p>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card mb-4 space-y-3">
          <input className="input" placeholder="Nombre del entreno (ej: Pecho + Tríceps)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <textarea className="input resize-none" rows={4} placeholder={"Ejercicios (uno por línea):\nPress banca 4x8\nAperturas 3x12"} value={form.exercises} onChange={e => setForm(f => ({ ...f, exercises: e.target.value }))} />
          <div className="flex gap-2">
            <input className="input flex-1" type="number" placeholder="Calorías quemadas" value={form.calories_burned} onChange={e => setForm(f => ({ ...f, calories_burned: e.target.value }))} />
            <input className="input flex-1" type="number" placeholder="Duración (min)" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancelar</button>
            <button onClick={add} className="btn-primary text-sm py-2">Guardar (+50 XP)</button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3 mb-5">
        {workouts.map(w => (
          <motion.div key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Dumbbell size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold">{w.name}</p>
                  <p className="text-white/40 text-xs">{w.date} · {w.duration_minutes} min · {w.calories_burned} kcal</p>
                </div>
              </div>
              <button onClick={() => remove(w.id)} className="text-white/20 active:text-accent-red p-2"><Trash2 size={14} /></button>
            </div>
            {w.exercises?.length > 0 && (
              <ul className="mt-3 space-y-1 pl-12">
                {w.exercises.map((ex, i) => (
                  <li key={i} className="text-white/50 text-xs">{ex.name}</li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}
        {workouts.length === 0 && <p className="text-white/30 text-center py-8">Sin entrenos registrados</p>}
      </div>

      <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2">
        <Plus size={16} /> Registrar entreno
      </button>
    </div>
  )
}
