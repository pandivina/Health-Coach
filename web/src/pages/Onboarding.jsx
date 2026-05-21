import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { MedicalDisclaimerText } from '../components/legal/MedicalDisclaimer'

const GOALS = [
  { value: 'lose_fat',    emoji: '🔥', label: 'Perder grasa',   desc: 'Reducir % de grasa corporal'     },
  { value: 'gain_muscle', emoji: '💪', label: 'Ganar músculo',  desc: 'Aumentar masa muscular'           },
  { value: 'define',      emoji: '✂️', label: 'Definición',     desc: 'Marcar músculo con bajo % grasa' },
  { value: 'recomp',      emoji: '🔄', label: 'Recomposición',  desc: 'Perder grasa y ganar músculo'    },
  { value: 'maintain',    emoji: '⚖️', label: 'Mantener peso',  desc: 'Conservar el estado actual'      },
  { value: 'health',      emoji: '❤️', label: 'Salud general',  desc: 'Mejorar hábitos y bienestar'     },
]
const ACTIVITY = [
  { value: 'sedentary', emoji: '🛋️', label: 'Sedentario',   desc: 'Trabajo de oficina, poco movimiento' },
  { value: 'light',     emoji: '🚶', label: 'Ligero',        desc: '1-2 días de ejercicio/semana'        },
  { value: 'moderate',  emoji: '🏃', label: 'Moderado',      desc: '3-4 días de ejercicio/semana'        },
  { value: 'intense',   emoji: '⚡', label: 'Intenso',       desc: '5-6 días de ejercicio/semana'        },
  { value: 'athlete',   emoji: '🏆', label: 'Atleta',        desc: 'Entrenamiento diario o dobles'       },
]
const WORK_SCHEDULES = [
  { value: 'day',      label: '☀️ Diurno'   },
  { value: 'night',    label: '🌙 Nocturno' },
  { value: 'rotating', label: '🔄 Rotativo' },
  { value: 'remote',   label: '🏠 Remoto'   },
  { value: 'other',    label: '📋 Otro'     },
]
const DIET_TYPES = [
  { value: 'omnivore',    label: '🍗 Omnívoro'    },
  { value: 'vegetarian',  label: '🥗 Vegetariano' },
  { value: 'vegan',       label: '🌱 Vegano'       },
  { value: 'pescatarian', label: '🐟 Pescetariano' },
  { value: 'keto',        label: '🥑 Keto'         },
  { value: 'paleo',       label: '🍖 Paleo'        },
]
const TREATMENTS = [
  { value: 'glp1',           label: '💉 Agonista GLP-1 (Ozempic, Wegovy…)'  },
  { value: 'thyroid',        label: '🦋 Tiroides (Levotiroxina…)'            },
  { value: 'insulin',        label: '💊 Insulina'                            },
  { value: 'contraceptive',  label: '💊 Anticonceptivos hormonales'          },
  { value: 'antidepressant', label: '💊 Antidepresivos / ansiolíticos'       },
  { value: 'corticoid',      label: '💊 Corticoides'                         },
  { value: 'other',          label: '💊 Otro tratamiento'                    },
]
const WHY_OPTIONS = [
  { value: 'family',    emoji: '👨‍👩‍👧', label: 'Tener energía para mi familia'       },
  { value: 'body',      emoji: '💪',    label: 'Sentirme bien en mi propio cuerpo' },
  { value: 'health',    emoji: '🏥',    label: 'Controlar una condición de salud'  },
  { value: 'energy',    emoji: '⚡',    label: 'Tener más energía y foco'          },
  { value: 'habits',    emoji: '🌱',    label: 'Recuperar hábitos que perdí'       },
  { value: 'wellbeing', emoji: '🧘',    label: 'Sentirme bien, no solo verme bien' },
]

function SelectCard({ selected, onSelect, theme, children }) {
  return (
    <button onClick={onSelect}
      className="w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left"
      style={{
        borderColor: selected ? theme.primary : theme.border,
        background:  selected ? `${theme.primary}15` : theme.surface2,
      }}>
      {children}
    </button>
  )
}

export default function Onboarding() {
  const { theme }  = useTheme()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', birth_date: '', sex: 'male',
    height_cm: '', weight_kg: '', target_weight_kg: '',
    goal: '', goal_intensity: 'moderate',
    activity_level: '', training_days_per_week: '3',
    profession: '', work_schedule: 'day',
    sleep_hours: '7', wake_time: '07:00', sleep_time: '23:00',
    diet_type: 'omnivore', allergies: '', food_intolerances: '',
    is_smoker: false, alcohol_frequency: 'never',
    treatments: [], treatment_name: '', treatment_type: '',
    motivation_why: '',
  })
  const [loading, setLoading] = useState(false)
  const { user, fetchProfile } = useStore()
  const navigate = useNavigate()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const heightM    = parseFloat(form.height_cm) / 100
  const currentBMI = heightM > 0 && form.weight_kg
    ? (parseFloat(form.weight_kg) / (heightM * heightM)).toFixed(1) : null
  const healthyMin = heightM > 0 ? Math.round(18.5 * heightM * heightM * 10) / 10 : null
  const healthyMax = heightM > 0 ? Math.round(24.9 * heightM * heightM * 10) / 10 : null
  const bmiColor   = !currentBMI ? theme.text
    : parseFloat(currentBMI) < 18.5 ? '#60A5FA'
    : parseFloat(currentBMI) < 25   ? theme.success
    : parseFloat(currentBMI) < 30   ? '#FBBF24'
    : theme.error
  const bmiLabel   = !currentBMI ? '' : parseFloat(currentBMI) < 18.5 ? 'Bajo peso'
    : parseFloat(currentBMI) < 25 ? 'Peso normal'
    : parseFloat(currentBMI) < 30 ? 'Sobrepeso' : 'Obesidad'

  const WHY_PRESETS = WHY_OPTIONS.map(o => o.value)
  const motivationIsCustom = form.motivation_why && !WHY_PRESETS.includes(form.motivation_why)

  const steps = [
    // 0 — Bienvenida
    <div key={0} className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🐼</div>
        <h2 className="text-2xl font-bold" style={{ color: theme.text }}>¡Bienvenido a Health Coach!</h2>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Cuéntanos sobre ti para personalizar tu experiencia</p>
      </div>
      <div>
        <label className="label">Tu nombre</label>
        <input className="input" placeholder="¿Cómo te llamamos?" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label">Fecha de nacimiento</label>
          <input className="input" type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label">Sexo</label>
          <select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}>
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>
    </div>,

    // 1 — Medidas
    <div key={1} className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Tus medidas 📏</h2>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label">Altura (cm)</label>
          <input className="input" type="number" placeholder="175" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label">Peso actual (kg)</label>
          <input className="input" type="number" step="0.1" placeholder="70" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
        </div>
      </div>
      {currentBMI && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: theme.textMuted }}>Tu IMC</p>
              <p className="text-2xl font-bold" style={{ color: theme.text }}>{currentBMI}</p>
              <p className="text-sm font-medium" style={{ color: bmiColor }}>{bmiLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: theme.textMuted }}>Rango saludable</p>
              <p className="font-semibold" style={{ color: theme.text }}>{healthyMin} – {healthyMax} kg</p>
              <p className="text-xs" style={{ color: theme.textLight }}>Para tu altura</p>
            </div>
          </div>
        </motion.div>
      )}
      <div>
        <label className="label">Peso objetivo (kg)</label>
        <input className="input" type="number" step="0.1"
          placeholder={healthyMax ? `Sugerido: ${Math.round((healthyMin + healthyMax) / 2)}` : 'Ej: 65'}
          value={form.target_weight_kg} onChange={e => set('target_weight_kg', e.target.value)} />
        {healthyMin && <p className="text-xs mt-1" style={{ color: theme.textLight }}>Rango saludable: {healthyMin}–{healthyMax} kg</p>}
      </div>
    </div>,

    // 2 — Objetivo
    <div key={2} className="space-y-3">
      <h2 className="text-2xl font-bold" style={{ color: theme.text }}>¿Cuál es tu objetivo? 🎯</h2>
      {GOALS.map(g => (
        <SelectCard key={g.value} selected={form.goal === g.value} onSelect={() => set('goal', g.value)} theme={theme}>
          <span className="text-2xl">{g.emoji}</span>
          <div>
            <p className="font-semibold" style={{ color: theme.text }}>{g.label}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{g.desc}</p>
          </div>
        </SelectCard>
      ))}
      {(form.goal === 'lose_fat' || form.goal === 'define') && (
        <div>
          <label className="label">Velocidad del progreso</label>
          <div className="flex gap-2">
            {[['slow','🐢 Suave'],['moderate','⚡ Moderado'],['aggressive','🚀 Agresivo']].map(([v,l]) => (
              <button key={v} onClick={() => set('goal_intensity', v)}
                className="flex-1 py-2 rounded-xl border text-xs font-medium transition-all"
                style={{
                  borderColor: form.goal_intensity === v ? theme.primary : theme.border,
                  background:  form.goal_intensity === v ? `${theme.primary}20` : 'transparent',
                  color:       form.goal_intensity === v ? theme.primary : theme.textMuted,
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,

    // 3 — Por qué (opcional)
    <div key={3} className="space-y-4">
      <div className="text-center mb-4">
        <motion.div animate={{ rotate: [0,10,-10,10,0] }}
          transition={{ duration:1.5, repeat:Infinity, repeatDelay:3 }}
          className="text-5xl mb-3">🐼</motion.div>
        <h2 className="text-2xl font-bold" style={{ color: theme.text }}>¿Por qué quieres mejorar tu salud?</h2>
        <p className="text-sm mt-2" style={{ color: theme.textMuted }}>
          Pandi lo guardará para recordártelo cuando lo necesites
        </p>
      </div>
      <div className="space-y-2">
        {WHY_OPTIONS.map(opt => (
          <SelectCard key={opt.value}
            selected={form.motivation_why === opt.value}
            onSelect={() => set('motivation_why', form.motivation_why === opt.value ? '' : opt.value)}
            theme={theme}>
            <span className="text-2xl">{opt.emoji}</span>
            <span className="font-medium" style={{ color: theme.text }}>{opt.label}</span>
          </SelectCard>
        ))}
      </div>
      <div>
        <label className="label">O escríbelo tú mismo (opcional)</label>
        <input className="input" placeholder="Mi razón personal…"
          value={motivationIsCustom ? form.motivation_why : ''}
          onChange={e => set('motivation_why', e.target.value)} />
      </div>
      <p className="text-xs text-center" style={{ color: theme.textLight }}>
        Paso opcional — puedes continuar sin rellenar
      </p>
    </div>,

    // 4 — Actividad
    <div key={4} className="space-y-3">
      <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Actividad física 🏋️</h2>
      {ACTIVITY.map(a => (
        <SelectCard key={a.value} selected={form.activity_level === a.value} onSelect={() => set('activity_level', a.value)} theme={theme}>
          <span className="text-2xl">{a.emoji}</span>
          <div>
            <p className="font-semibold" style={{ color: theme.text }}>{a.label}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{a.desc}</p>
          </div>
        </SelectCard>
      ))}
      <div>
        <label className="label">Días de entrenamiento por semana</label>
        <div className="flex gap-2">
          {['0','1','2','3','4','5','6','7'].map(d => (
            <button key={d} onClick={() => set('training_days_per_week', d)}
              className="flex-1 py-2 rounded-xl border text-sm font-bold transition-all"
              style={{
                borderColor: form.training_days_per_week === d ? theme.primary : theme.border,
                background:  form.training_days_per_week === d ? `${theme.primary}20` : 'transparent',
                color:       form.training_days_per_week === d ? theme.primary : theme.textMuted,
              }}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // 5 — Día a día
    <div key={5} className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Tu día a día 📅</h2>
      <div>
        <label className="label">Profesión</label>
        <input className="input" placeholder="Ej: Enfermera, Informático, Autónomo…" value={form.profession} onChange={e => set('profession', e.target.value)} />
      </div>
      <div>
        <label className="label">Horario de trabajo</label>
        <div className="grid grid-cols-3 gap-2">
          {WORK_SCHEDULES.map(s => (
            <button key={s.value} onClick={() => set('work_schedule', s.value)}
              className="py-2 rounded-xl border text-xs font-medium transition-all"
              style={{
                borderColor: form.work_schedule === s.value ? theme.primary : theme.border,
                background:  form.work_schedule === s.value ? `${theme.primary}20` : 'transparent',
                color:       form.work_schedule === s.value ? theme.primary : theme.textMuted,
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Horas de sueño habituales</label>
        <input className="input" type="number" step="0.5" min="3" max="12" value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label">Me despierto</label>
          <input className="input" type="time" value={form.wake_time} onChange={e => set('wake_time', e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label">Me acuesto</label>
          <input className="input" type="time" value={form.sleep_time} onChange={e => set('sleep_time', e.target.value)} />
        </div>
      </div>
    </div>,

    // 6 — Alimentación
    <div key={6} className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Alimentación y hábitos 🥗</h2>
      <div>
        <label className="label">Tipo de dieta</label>
        <div className="grid grid-cols-2 gap-2">
          {DIET_TYPES.map(d => (
            <button key={d.value} onClick={() => set('diet_type', d.value)}
              className="py-2.5 rounded-xl border text-sm font-medium transition-all"
              style={{
                borderColor: form.diet_type === d.value ? theme.primary : theme.border,
                background:  form.diet_type === d.value ? `${theme.primary}20` : 'transparent',
                color:       form.diet_type === d.value ? theme.primary : theme.textMuted,
              }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Alergias alimentarias</label>
        <input className="input" placeholder="frutos secos, gluten, marisco…" value={form.allergies} onChange={e => set('allergies', e.target.value)} />
      </div>
      <div>
        <label className="label">Intolerancias</label>
        <input className="input" placeholder="lactosa, fructosa…" value={form.food_intolerances} onChange={e => set('food_intolerances', e.target.value)} />
      </div>
      <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
        style={{
          borderColor: form.is_smoker ? theme.primary : theme.border,
          background:  form.is_smoker ? `${theme.primary}10` : theme.surface2,
        }}>
        <input type="checkbox" checked={form.is_smoker} onChange={e => set('is_smoker', e.target.checked)} className="w-4 h-4" />
        <span className="text-sm" style={{ color: theme.text }}>Soy fumador/a 🚬</span>
      </label>
      <div>
        <label className="label">Alcohol</label>
        <div className="flex gap-2">
          {[['never','Nunca'],['occasional','Ocasional'],['weekly','Semanal'],['daily','Diario']].map(([v,l]) => (
            <button key={v} onClick={() => set('alcohol_frequency', v)}
              className="flex-1 py-2 rounded-xl border text-xs font-medium transition-all"
              style={{
                borderColor: form.alcohol_frequency === v ? theme.primary : theme.border,
                background:  form.alcohol_frequency === v ? `${theme.primary}20` : 'transparent',
                color:       form.alcohol_frequency === v ? theme.primary : theme.textMuted,
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // 7 — Tratamientos
    <div key={7} className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Tratamientos médicos 💊</h2>
      <p className="text-sm" style={{ color: theme.textMuted }}>
        Información confidencial. Ayuda al Coach a personalizar tus recomendaciones. Completamente opcional.
      </p>
      <div className="space-y-2">
        {TREATMENTS.map(t => {
          const selected = form.treatments.some(tr => tr.type === t.value)
          return (
            <label key={t.value}
              className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
              style={{
                borderColor: selected ? theme.primary : theme.border,
                background:  selected ? `${theme.primary}10` : theme.surface2,
              }}>
              <input type="checkbox" checked={selected}
                onChange={e => {
                  if (e.target.checked)
                    set('treatments', [...form.treatments, { type: t.value, name: t.label.replace(/^[^\s]+ /, ''), active: true }])
                  else
                    set('treatments', form.treatments.filter(tr => tr.type !== t.value))
                }}
                className="w-4 h-4" />
              <span className="text-sm" style={{ color: theme.text }}>{t.label}</span>
            </label>
          )
        })}
      </div>
      <p className="text-xs text-center" style={{ color: theme.textLight }}>
        Puedes añadir más desde tu perfil más adelante
      </p>
    </div>,
  ]

  async function finish() {
    setLoading(true)
    try {
      const userId = user.id
      await supabase.from('user_profiles').update({
        name: form.name, onboarding_done: true,
        motivation_why: form.motivation_why || null,
      }).eq('id', userId)

      const age = form.birth_date
        ? Math.floor((new Date() - new Date(form.birth_date)) / (365.25 * 24 * 3600 * 1000)) : null
      const w   = parseFloat(form.weight_kg) || 70
      const h   = parseFloat(form.height_cm) || 170
      const bmr = form.sex === 'female'
        ? 10*w + 6.25*h - 5*(age||25) - 161
        : 10*w + 6.25*h - 5*(age||25) + 5
      const actMult     = { sedentary:1.2, light:1.375, moderate:1.55, intense:1.725, athlete:1.9 }[form.activity_level] || 1.375
      const tdee        = Math.round(bmr * actMult)
      const deficit     = { slow:250, moderate:500, aggressive:750 }[form.goal_intensity] || 500
      const targetCals  = form.goal === 'lose_fat' || form.goal === 'define'
        ? tdee - deficit : form.goal === 'gain_muscle' ? tdee + 300 : tdee
      const targetProtein = Math.round(w * 2.0)
      const targetFat     = Math.round(targetCals * 0.25 / 9)
      const targetCarbs   = Math.round((targetCals - targetProtein * 4 - targetFat * 9) / 4)
      const bmi           = h > 0 ? Math.round((w / ((h/100) ** 2)) * 10) / 10 : null

      await supabase.from('health_profiles').upsert({
        user_id: userId,
        height_cm: parseFloat(form.height_cm)||null, weight_kg: parseFloat(form.weight_kg)||null,
        target_weight_kg: parseFloat(form.target_weight_kg)||null,
        sex: form.sex, birth_date: form.birth_date||null,
        goal: form.goal, goal_intensity: form.goal_intensity,
        activity_level: form.activity_level,
        training_days_per_week: parseInt(form.training_days_per_week)||3,
        profession: form.profession, work_schedule: form.work_schedule,
        sleep_hours: parseFloat(form.sleep_hours)||7,
        wake_time: form.wake_time, sleep_time: form.sleep_time,
        diet_type: form.diet_type,
        allergies: form.allergies ? form.allergies.split(',').map(s=>s.trim()).filter(Boolean) : [],
        food_intolerances: form.food_intolerances ? form.food_intolerances.split(',').map(s=>s.trim()).filter(Boolean) : [],
        is_smoker: form.is_smoker, alcohol_frequency: form.alcohol_frequency,
        bmi, bmr: Math.round(bmr), tdee,
        target_calories: targetCals, target_protein_g: targetProtein,
        target_carbs_g: targetCarbs, target_fat_g: targetFat,
        onboarding_done: true, onboarding_version: 2,
      }, { onConflict: 'user_id' })

      await supabase.from('nutrition_goals').upsert({
        user_id: userId, calories: targetCals,
        protein_g: targetProtein, carbs_g: targetCarbs, fat_g: targetFat,
      }, { onConflict: 'user_id' })

      if (form.treatments.length > 0) {
        await supabase.from('medical_treatments').insert(
          form.treatments.map(t => ({
            ...t, user_id: userId,
            affects_weight:   ['glp1','thyroid','insulin','corticoid','contraceptive'].includes(t.type),
            affects_appetite: ['glp1','antidepressant'].includes(t.type),
          }))
        )
      }
      if (form.weight_kg) {
        await supabase.from('weight_logs').insert({
          user_id: userId, weight_kg: parseFloat(form.weight_kg), notes: 'Peso inicial',
        })
      }
      await fetchProfile(userId)
      try { await api.email.welcome() } catch {}
      navigate('/')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false) }
  }

  const canNext = () => {
    if (step === 0) return form.name && form.birth_date
    if (step === 1) return form.height_cm && form.weight_kg
    if (step === 2) return form.goal
    if (step === 3) return true                // por qué — opcional
    if (step === 4) return form.activity_level
    return true
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-8 max-w-lg mx-auto"
      style={{ background: theme.bg }}>

      {/* Barra de progreso */}
      <div className="flex gap-1.5 mb-6">
        {steps.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= step
              ? `linear-gradient(90deg, ${theme.primary}, ${theme.accent || '#FF8FA3'})`
              : theme.surface2 }} />
        ))}
      </div>

      <p className="text-xs mb-4" style={{ color: theme.textLight }}>
        Paso {step + 1} de {steps.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
          className="flex-1">
          {steps[step]}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-3 mt-6">
        {step < steps.length - 1 ? (
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary w-auto px-6">
                ← Atrás
              </button>
            )}
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="btn-primary disabled:opacity-40">
              Siguiente →
            </button>
          </div>
        ) : (
          <>
            <MedicalDisclaimerText />
            <div className="flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="btn-secondary w-auto px-6">
                  ← Atrás
                </button>
              )}
              <button onClick={finish} disabled={loading} className="btn-primary">
                {loading ? 'Guardando…' : '🚀 ¡Empezar!'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
