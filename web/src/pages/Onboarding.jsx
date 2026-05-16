import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

const GOALS = [
  { value: 'lose_fat',   emoji: '🔥', label: 'Perder grasa' },
  { value: 'gain_muscle',emoji: '💪', label: 'Ganar músculo' },
  { value: 'maintain',   emoji: '⚖️', label: 'Mantener peso' },
  { value: 'recomp',     emoji: '🔄', label: 'Recomposición' },
  { value: 'health',     emoji: '❤️', label: 'Salud general' },
]
const ACTIVITY = [
  { value: 'sedentary', emoji: '🛋️', label: 'Sedentario' },
  { value: 'light',     emoji: '🚶', label: 'Ligero' },
  { value: 'moderate',  emoji: '🏃', label: 'Moderado' },
  { value: 'intense',   emoji: '⚡', label: 'Intenso' },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', age: '', sex: 'male', height_cm: '', weight_kg: '',
    goal: '', activity_level: '', sleep_hours: '7',
    allergies: '', is_smoker: false, wants_quit_smoking: false,
  })
  const [loading, setLoading] = useState(false)
  const { user, fetchProfile } = useStore()
  const navigate = useNavigate()

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  const steps = [
    // 0 — Datos básicos
    <div key={0} className="space-y-4">
      <h2 className="text-2xl font-bold">¡Hola! 👋<br />Cuéntame sobre ti</h2>
      <div><label className="label">Tu nombre</label>
        <input className="input" placeholder="Nombre" value={form.name} onChange={e => set('name', e.target.value)} /></div>
      <div className="flex gap-3">
        <div className="flex-1"><label className="label">Edad</label>
          <input className="input" type="number" placeholder="25" value={form.age} onChange={e => set('age', e.target.value)} /></div>
        <div className="flex-1"><label className="label">Sexo</label>
          <select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}>
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
            <option value="other">Otro</option>
          </select></div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1"><label className="label">Altura (cm)</label>
          <input className="input" type="number" placeholder="175" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} /></div>
        <div className="flex-1"><label className="label">Peso (kg)</label>
          <input className="input" type="number" placeholder="70" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} /></div>
      </div>
    </div>,

    // 1 — Objetivo
    <div key={1} className="space-y-4">
      <h2 className="text-2xl font-bold">¿Cuál es tu objetivo? 🎯</h2>
      <div className="grid grid-cols-1 gap-3">
        {GOALS.map(g => (
          <button key={g.value} onClick={() => set('goal', g.value)}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
              form.goal === g.value ? 'border-accent bg-accent/10' : 'border-white/10 bg-surface-2'
            }`}>
            <span className="text-2xl">{g.emoji}</span>
            <span className="font-semibold">{g.label}</span>
          </button>
        ))}
      </div>
    </div>,

    // 2 — Actividad
    <div key={2} className="space-y-4">
      <h2 className="text-2xl font-bold">¿Cómo es tu actividad? 🏋️</h2>
      <div className="grid grid-cols-2 gap-3">
        {ACTIVITY.map(a => (
          <button key={a.value} onClick={() => set('activity_level', a.value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
              form.activity_level === a.value ? 'border-accent bg-accent/10' : 'border-white/10 bg-surface-2'
            }`}>
            <span className="text-3xl">{a.emoji}</span>
            <span className="font-medium text-sm">{a.label}</span>
          </button>
        ))}
      </div>
      <div><label className="label">Horas de sueño habituales</label>
        <input className="input" type="number" step="0.5" min="3" max="12" value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)} /></div>
    </div>,

    // 3 — Restricciones + tabaco
    <div key={3} className="space-y-4">
      <h2 className="text-2xl font-bold">Últimas preguntas 🌿</h2>
      <div><label className="label">Alergias o restricciones alimentarias</label>
        <input className="input" placeholder="gluten, lactosa, frutos secos…" value={form.allergies} onChange={e => set('allergies', e.target.value)} /></div>
      <label className="flex items-center gap-3 p-4 bg-surface-2 rounded-xl border border-white/10 cursor-pointer">
        <input type="checkbox" checked={form.is_smoker} onChange={e => set('is_smoker', e.target.checked)} className="w-5 h-5 accent-indigo-500" />
        <span>Soy fumador/a 🚬</span>
      </label>
      {form.is_smoker && (
        <label className="flex items-center gap-3 p-4 bg-surface-2 rounded-xl border border-white/10 cursor-pointer">
          <input type="checkbox" checked={form.wants_quit_smoking} onChange={e => set('wants_quit_smoking', e.target.checked)} className="w-5 h-5 accent-indigo-500" />
          <span>Quiero dejar de fumar 💪</span>
        </label>
      )}
    </div>,
  ]

  async function finish() {
    setLoading(true)
    const updates = {
      ...form,
      age: parseInt(form.age) || null,
      height_cm: parseFloat(form.height_cm) || null,
      weight_kg: parseFloat(form.weight_kg) || null,
      sleep_hours: parseFloat(form.sleep_hours) || 7,
      allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()) : [],
      onboarding_done: true,
    }
    await supabase.from('user_profiles').update(updates).eq('id', user.id)

    // Calcular objetivos nutricionales aproximados (Mifflin-St Jeor)
    const w = updates.weight_kg || 70, h = updates.height_cm || 170, a = updates.age || 25
    const bmr = form.sex === 'female' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5
    const actMult = { sedentary:1.2, light:1.375, moderate:1.55, intense:1.725 }[form.activity_level] || 1.375
    const tdee = Math.round(bmr * actMult)
    const calGoal = form.goal === 'lose_fat' ? tdee - 400 : form.goal === 'gain_muscle' ? tdee + 300 : tdee
    const protein = Math.round(w * (form.goal === 'gain_muscle' ? 2.2 : 1.8))
    const fat = Math.round(calGoal * 0.25 / 9)
    const carbs = Math.round((calGoal - protein*4 - fat*9) / 4)
    await supabase.from('nutrition_goals').upsert({ user_id: user.id, calories: calGoal, protein_g: protein, carbs_g: carbs, fat_g: fat })

    await fetchProfile(user.id)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] flex flex-col px-6 py-10 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-gradient-brand' : 'bg-surface-3'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }} className="flex-1">
          {steps[step]}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-secondary w-auto px-6">Atrás</button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="btn-primary">Siguiente</button>
        ) : (
          <button onClick={finish} disabled={loading} className="btn-primary">
            {loading ? 'Guardando…' : '¡Empezar! 🚀'}
          </button>
        )}
      </div>
    </div>
  )
}
