import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { MedicalDisclaimerText } from '../components/legal/MedicalDisclaimer'
import LanguagePicker from '../components/LanguagePicker'

// ─── DATOS ────────────────────────────────────────────────────────────────────
const GOALS = [
  { value: 'lose_fat',    emoji: '🔥', label: 'Perder grasa',   desc: 'Reducir % de grasa corporal'     },
  { value: 'gain_muscle', emoji: '💪', label: 'Ganar músculo',  desc: 'Aumentar masa muscular'           },
  { value: 'define',      emoji: '✂️', label: 'Definición',     desc: 'Marcar músculo con bajo % grasa' },
  { value: 'recomp',      emoji: '🔄', label: 'Recomposición',  desc: 'Perder grasa y ganar músculo'    },
  { value: 'maintain',    emoji: '⚖️', label: 'Mantener peso',  desc: 'Conservar el estado actual'      },
  { value: 'health',      emoji: '❤️', label: 'Salud general',  desc: 'Mejorar hábitos y bienestar'     },
]
const ACTIVITY = [
  { value: 'sedentary', emoji: '🛋️', label: 'Sedentario',   desc: 'Poco o ningún ejercicio'       },
  { value: 'light',     emoji: '🚶', label: 'Ligero',        desc: '1-2 días de ejercicio/semana'  },
  { value: 'moderate',  emoji: '🏃', label: 'Moderado',      desc: '3-4 días de ejercicio/semana'  },
  { value: 'intense',   emoji: '⚡', label: 'Intenso',       desc: '5-6 días de ejercicio/semana'  },
  { value: 'athlete',   emoji: '🏆', label: 'Atleta',        desc: 'Entrenamiento diario o dobles' },
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

// ─── ENERGÍAS POR PASO ────────────────────────────────────────────────────────
const STEP_ENERGIES = [
  null,                                    // 0: bienvenida
  { color: 'rgba(255,255,255,0.9)', label: 'Energía vital',      emoji: '✨' },
  { color: 'rgba(249,115,22,0.85)', label: 'Energía de fuego',   emoji: '🔥' },
  { color: 'rgba(168,85,247,0.85)', label: 'Energía interior',   emoji: '💜' },
  { color: 'rgba(249,115,22,0.85)', label: 'Energía de fuerza',  emoji: '⚡' },
  { color: 'rgba(129,140,248,0.85)',label: 'Energía de descanso',emoji: '😴' },
  { color: 'rgba(34,197,94,0.85)',  label: 'Energía nutritiva',  emoji: '🥗' },
  { color: 'rgba(236,72,153,0.85)', label: 'Energía sanadora',   emoji: '💊' },
]

// ─── INCUBADORA ───────────────────────────────────────────────────────────────
function Incubadora({ step, born, form }) {
  const filledSteps = Math.max(0, step - 1)
  const totalEnergy = 6
  const fillPct     = Math.min(filledSteps / totalEnergy, 1)

  // Colores activos
  const activeColors = STEP_ENERGIES
    .slice(1, step + 1)
    .filter(Boolean)
    .map(e => e.color)

  return (
    <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
      {/* Glow exterior */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: -20,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${activeColors[activeColors.length-1] || 'rgba(255,255,255,0.2)'} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Esfera principal */}
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
        {/* Esfera base */}
        <defs>
          <radialGradient id="sphereGrad" cx="35%" cy="30%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </radialGradient>
          <radialGradient id="energyGrad" cx="50%" cy="50%">
            {activeColors.map((c, i) => (
              <stop key={i} offset={`${(i / Math.max(activeColors.length-1, 1)) * 100}%`} stopColor={c} />
            ))}
            {activeColors.length === 0 && <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />}
          </radialGradient>
          <clipPath id="sphereClip">
            <circle cx="100" cy="100" r="80" />
          </clipPath>
        </defs>

        {/* Sombra */}
        <ellipse cx="100" cy="188" rx="60" ry="10" fill="rgba(0,0,0,0.15)" />

        {/* Borde esfera */}
        <circle cx="100" cy="100" r="82" fill="none"
          stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

        {/* Energía interior — nivel de llenado */}
        <motion.ellipse
          cx="100" cy="100"
          rx="79"
          animate={{ ry: 79 * fillPct, cy: 100 + 79 * (1 - fillPct) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          fill="url(#energyGrad)"
          clipPath="url(#sphereClip)"
          opacity="0.7"
        />

        {/* Cristal/brillo */}
        <ellipse cx="76" cy="70" rx="22" ry="14"
          fill="rgba(255,255,255,0.25)" style={{ filter: 'blur(2px)' }} />
        <ellipse cx="72" cy="66" rx="10" ry="6"
          fill="rgba(255,255,255,0.4)" />

        {/* Esfera overlay */}
        <circle cx="100" cy="100" r="80" fill="url(#sphereGrad)" />

        {/* Borde final */}
        <circle cx="100" cy="100" r="80" fill="none"
          stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      </svg>

      {/* Partículas de energía flotando */}
      {activeColors.map((color, i) => (
        <motion.div key={i}
          animate={{
            y: [0, -30 - i * 10, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 2 + i * 0.5,
            delay: i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            top: '40%',
            left: `${30 + i * 12}%`,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            filter: 'blur(1px)',
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ))}

      {/* Semilla en el centro si está vacía */}
      {fillPct === 0 && (
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 32,
          }}>
          ✨
        </motion.div>
      )}

      {/* Label de energía activa */}
      {step > 0 && step < 8 && STEP_ENERGIES[step] && (
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute', bottom: -36, left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: 20,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: '#1A2332',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          }}>
          {STEP_ENERGIES[step].emoji} {STEP_ENERGIES[step].label}
        </motion.div>
      )}
    </div>
  )
}

// ─── ESCENA DE NACIMIENTO ─────────────────────────────────────────────────────
function BirthScene({ name, onContinue, theme }) {
  const [phase, setPhase] = useState('explode') // explode → appear → stable
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('appear'),  800)
    const t2 = setTimeout(() => setPhase('stable'), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 40%, #fff8e7 0%, #e8f4fd 50%, #f0fff4 100%)',
        padding: 32,
      }}>

      {/* Explosión de luz */}
      <AnimatePresence>
        {phase === 'explode' && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 100, height: 100,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,220,100,0.9) 0%, rgba(255,150,50,0.5) 50%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Partículas */}
      {phase !== 'explode' && [...Array(12)].map((_, i) => (
        <motion.div key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(i * 30 * Math.PI / 180) * 120,
            y: Math.sin(i * 30 * Math.PI / 180) * 120,
            opacity: 0, scale: 0,
          }}
          transition={{ duration: 1, delay: i * 0.03 }}
          style={{
            position: 'absolute',
            width: 8, height: 8,
            borderRadius: '50%',
            background: ['#2EC4B6','#FF8FA3','#F59E0B','#6366F1'][i % 4],
          }}
        />
      ))}

      {/* Baby Pandi */}
      <AnimatePresence>
        {phase !== 'explode' && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            style={{ marginBottom: 32, position: 'relative' }}>

            {/* Glow */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 200, height: 200, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(46,196,182,0.4) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {imgErr
              ? <span style={{ fontSize: 120, display: 'block' }}>🐾</span>
              : <motion.img
                  src="/panda/panda_baby.png"
                  alt="Pandi baby"
                  animate={phase === 'stable' ? { y: [0, -6, 0] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 180, height: 180, objectFit: 'contain', position: 'relative', zIndex: 1 }}
                  onError={() => setImgErr(true)}
                />
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Texto */}
      {phase === 'stable' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1A2332', margin: '0 0 8px' }}>
            ¡Ha nacido! 🐾
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 8px', lineHeight: 1.5 }}>
            {name ? `${name}, esta es tu Pandi.` : 'Esta es tu Pandi.'}
          </p>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, lineHeight: 1.6, maxWidth: 280 }}>
            Ahora crecéis juntos. Cada hábito que cuides la hará más fuerte, más expresiva, más tuya.
          </p>
        </motion.div>
      )}

      {phase === 'stable' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          style={{
            padding: '16px 40px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
            border: 'none',
            color: 'white',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(46,196,182,0.4)',
          }}>
          Empezar juntos 🐾
        </motion.button>
      )}
    </motion.div>
  )
}

// ─── SELECT CARD ──────────────────────────────────────────────────────────────
function SelectCard({ selected, onSelect, children, theme }) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        borderRadius: 16,
        border: `1.5px solid ${selected ? theme.primary : theme.border}`,
        background: selected ? `${theme.primary}18` : 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(8px)',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}>
      {children}
    </motion.button>
  )
}

// ─── BARRA DE PROGRESO ────────────────────────────────────────────────────────
function ProgressBar({ step, total, theme }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
      {[...Array(total)].map((_, i) => (
        <div key={i} style={{
          flex: i === step ? 2 : 1,
          height: 3, borderRadius: 3,
          background: i < step
            ? theme.primary
            : i === step
            ? `linear-gradient(90deg, ${theme.primary}, #FF8FA3)`
            : 'rgba(0,0,0,0.1)',
          transition: 'all 0.4s ease',
        }} />
      ))}
    </div>
  )
}

// ─── FONDO DINÁMICO ───────────────────────────────────────────────────────────
function OnboardingBackground({ step }) {
  const colors = [
    'linear-gradient(135deg, #f0fffe 0%, #e8f4fd 50%, #f5f0ff 100%)',
    'linear-gradient(135deg, #f0fffe 0%, #fff8f0 50%, #f0fff4 100%)',
    'linear-gradient(135deg, #fff8f0 0%, #fff0e8 50%, #fff4e8 100%)',
    'linear-gradient(135deg, #f5f0ff 0%, #ede8ff 50%, #f0e8ff 100%)',
    'linear-gradient(135deg, #fff8f0 0%, #fff0e8 100%)',
    'linear-gradient(135deg, #f0f0ff 0%, #e8e8ff 100%)',
    'linear-gradient(135deg, #f0fff4 0%, #e8fff0 100%)',
    'linear-gradient(135deg, #fff0f5 0%, #ffe8f0 100%)',
  ]
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, background: colors[step] || colors[0] }}
    />
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const { theme }          = useTheme()
  const [step, setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [showBirth, setShowBirth] = useState(false)
  const { user, fetchProfile } = useStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', birth_date: '', sex: 'male',
    height_cm: '', weight_kg: '', target_weight_kg: '',
    goal: '', goal_intensity: 'moderate',
    activity_level: '', training_days_per_week: '3',
    profession: '', work_schedule: 'day',
    sleep_hours: '7', wake_time: '07:00', sleep_time: '23:00',
    diet_type: 'omnivore', allergies: '', food_intolerances: '',
    is_smoker: false, alcohol_frequency: 'never',
    treatments: [], motivation_why: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const heightM    = parseFloat(form.height_cm) / 100
  const currentBMI = heightM > 0 && form.weight_kg
    ? (parseFloat(form.weight_kg) / (heightM * heightM)).toFixed(1) : null
  const healthyMin = heightM > 0 ? Math.round(18.5 * heightM * heightM * 10) / 10 : null
  const healthyMax = heightM > 0 ? Math.round(24.9 * heightM * heightM * 10) / 10 : null
  const bmiColor   = !currentBMI ? theme.text
    : parseFloat(currentBMI) < 18.5 ? '#60A5FA'
    : parseFloat(currentBMI) < 25   ? theme.success
    : parseFloat(currentBMI) < 30   ? '#FBBF24' : theme.error
  const bmiLabel   = !currentBMI ? ''
    : parseFloat(currentBMI) < 18.5 ? 'Bajo peso'
    : parseFloat(currentBMI) < 25   ? 'Peso normal'
    : parseFloat(currentBMI) < 30   ? 'Sobrepeso' : 'Obesidad'

  const WHY_PRESETS        = WHY_OPTIONS.map(o => o.value)
  const motivationIsCustom = form.motivation_why && !WHY_PRESETS.includes(form.motivation_why)

  const TOTAL_STEPS = 8

  const canNext = () => {
    if (step === 0) return form.name && form.birth_date
    if (step === 1) return form.height_cm && form.weight_kg
    if (step === 2) return form.goal
    if (step === 4) return form.activity_level
    return true
  }

  async function finish() {
    setLoading(true)
    try {
      const userId = user.id
      await supabase.from('user_profiles').update({
        name: form.name,
        onboarding_done: true,
        motivation_why: form.motivation_why || null,
      }).eq('id', userId)

      const age = form.birth_date
        ? Math.floor((new Date() - new Date(form.birth_date)) / (365.25 * 24 * 3600 * 1000))
        : null
      const w   = parseFloat(form.weight_kg) || 70
      const h   = parseFloat(form.height_cm) || 170
      const bmr = form.sex === 'female'
        ? 10 * w + 6.25 * h - 5 * (age || 25) - 161
        : 10 * w + 6.25 * h - 5 * (age || 25) + 5
      const actMult = { sedentary:1.2, light:1.375, moderate:1.55, intense:1.725, athlete:1.9 }[form.activity_level] || 1.375
      const tdee       = Math.round(bmr * actMult)
      const deficit    = { slow:250, moderate:500, aggressive:750 }[form.goal_intensity] || 500
      const targetCals = form.goal === 'lose_fat' || form.goal === 'define'
        ? tdee - deficit : form.goal === 'gain_muscle' ? tdee + 300 : tdee
      const targetProtein = Math.round(w * 2.0)
      const targetFat     = Math.round(targetCals * 0.25 / 9)
      const targetCarbs   = Math.round((targetCals - targetProtein * 4 - targetFat * 9) / 4)
      const bmi           = h > 0 ? Math.round((w / ((h/100)**2)) * 10) / 10 : null

      await supabase.from('health_profiles').upsert({
        user_id: userId,
        height_cm: parseFloat(form.height_cm) || null,
        weight_kg: parseFloat(form.weight_kg) || null,
        target_weight_kg: parseFloat(form.target_weight_kg) || null,
        sex: form.sex, birth_date: form.birth_date || null,
        goal: form.goal, goal_intensity: form.goal_intensity,
        activity_level: form.activity_level,
        training_days_per_week: parseInt(form.training_days_per_week) || 3,
        profession: form.profession, work_schedule: form.work_schedule,
        sleep_hours: parseFloat(form.sleep_hours) || 7,
        wake_time: form.wake_time, sleep_time: form.sleep_time,
        diet_type: form.diet_type,
        allergies: form.allergies ? form.allergies.split(',').map(s=>s.trim()).filter(Boolean) : [],
        food_intolerances: form.food_intolerances ? form.food_intolerances.split(',').map(s=>s.trim()).filter(Boolean) : [],
        is_smoker: form.is_smoker, alcohol_frequency: form.alcohol_frequency,
        bmi, bmr: Math.round(bmr), tdee,
        target_calories: targetCals, target_protein_g: targetProtein,
        target_carbs_g: targetCarbs, target_fat_g: targetFat,
        onboarding_done: true, onboarding_version: 2,
        initial_weight_kg: parseFloat(form.weight_kg) || null,
        initial_bmi: bmi, initial_goal: form.goal,
        initial_activity: form.activity_level,
        initial_calories: targetCals, initial_protein_g: targetProtein,
        initial_carbs_g: targetCarbs, initial_fat_g: targetFat,
        onboarding_date: new Date().toISOString(),
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

      // Mostrar escena de nacimiento
      setShowBirth(true)

    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (showBirth) {
    return <BirthScene name={form.name} onContinue={() => navigate('/')} theme={theme} />
  }

  const stepContent = [

    // 0 — Bienvenida + nombre
    <div key={0} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ textAlign:'center', marginBottom:28, padding:'0 8px' }}>
        <h1 style={{ fontSize:26, fontWeight:900, color:theme.text, margin:'0 0 10px', lineHeight:1.2 }}>
          Algo está a punto<br/>de despertar ✨
        </h1>
        <p style={{ fontSize:13, color:theme.textMuted, margin:0, lineHeight:1.6 }}>
          Tu cuerpo y esta criatura compartirán la misma energía.<br/>
          Cada hábito que cuides la hará más fuerte.
        </p>
      </motion.div>

      {/* Incubadora vacía en bienvenida */}
      <div style={{ marginBottom:32 }}>
        <Incubadora step={0} born={false} form={form} />
      </div>

      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:12, marginTop:16 }}>
        <div>
          <label className="label">Tu nombre</label>
          <input className="input" placeholder="¿Cómo te llamamos?"
            value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Idioma / Language</label>
          <LanguagePicker inline />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1 }}>
            <label className="label">Fecha de nacimiento</label>
            <input className="input" type="date"
              value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
          </div>
          <div style={{ flex:1 }}>
            <label className="label">Sexo</label>
            <select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}>
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
      </div>
    </div>,

    // 1 — Medidas
    <div key={1} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ marginBottom:4 }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:theme.text, margin:'0 0 4px' }}>Tus medidas 📏</h2>
        <p style={{ fontSize:12, color:theme.textMuted, margin:0 }}>La energía vital toma forma</p>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <div style={{ flex:1 }}>
          <label className="label">Altura (cm)</label>
          <input className="input" type="number" placeholder="175"
            value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
        </div>
        <div style={{ flex:1 }}>
          <label className="label">Peso actual (kg)</label>
          <input className="input" type="number" step="0.1" placeholder="70"
            value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
        </div>
      </div>
      {currentBMI && (
        <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
          className="card" style={{ background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:11, color:theme.textMuted, margin:'0 0 2px' }}>Tu IMC</p>
              <p style={{ fontSize:26, fontWeight:700, color:theme.text, margin:0 }}>{currentBMI}</p>
              <p style={{ fontSize:13, fontWeight:600, color:bmiColor, margin:0 }}>{bmiLabel}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:11, color:theme.textMuted, margin:'0 0 2px' }}>Rango saludable</p>
              <p style={{ fontSize:14, fontWeight:600, color:theme.text, margin:0 }}>{healthyMin} – {healthyMax} kg</p>
            </div>
          </div>
        </motion.div>
      )}
      <div>
        <label className="label">Peso objetivo (kg)</label>
        <input className="input" type="number" step="0.1"
          placeholder={healthyMax ? `Sugerido: ${Math.round((healthyMin+healthyMax)/2)}` : 'Ej: 65'}
          value={form.target_weight_kg} onChange={e => set('target_weight_kg', e.target.value)} />
      </div>
    </div>,

    // 2 — Objetivo
    <div key={2} style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:theme.text, margin:'0 0 4px' }}>¿Cuál es tu objetivo? 🎯</h2>
      {GOALS.map(g => (
        <SelectCard key={g.value} selected={form.goal===g.value}
          onSelect={() => set('goal', g.value)} theme={theme}>
          <span style={{ fontSize:22 }}>{g.emoji}</span>
          <div>
            <p style={{ fontWeight:600, color:theme.text, margin:0, fontSize:14 }}>{g.label}</p>
            <p style={{ fontSize:11, color:theme.textMuted, margin:0 }}>{g.desc}</p>
          </div>
        </SelectCard>
      ))}
      {(form.goal==='lose_fat'||form.goal==='define') && (
        <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}>
          <label className="label">Velocidad del progreso</label>
          <div style={{ display:'flex', gap:8 }}>
            {[['slow','🐢 Suave'],['moderate','⚡ Moderado'],['aggressive','🚀 Agresivo']].map(([v,l]) => (
              <button key={v} onClick={() => set('goal_intensity', v)}
                style={{ flex:1, padding:'8px 0', borderRadius:12,
                  border:`1.5px solid ${form.goal_intensity===v ? theme.primary : theme.border}`,
                  background: form.goal_intensity===v ? `${theme.primary}20` : 'transparent',
                  color: form.goal_intensity===v ? theme.primary : theme.textMuted,
                  fontSize:11, fontWeight:600, cursor:'pointer' }}>
                {l}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>,

    // 3 — Por qué
    <div key={3} style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ textAlign:'center', marginBottom:8 }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:theme.text, margin:'0 0 6px' }}>¿Por qué quieres mejorar?</h2>
        <p style={{ fontSize:12, color:theme.textMuted, margin:0 }}>
          Pandi lo recordará cuando lo necesites
        </p>
      </div>
      {WHY_OPTIONS.map(opt => (
        <SelectCard key={opt.value}
          selected={form.motivation_why===opt.value}
          onSelect={() => set('motivation_why', form.motivation_why===opt.value ? '' : opt.value)}
          theme={theme}>
          <span style={{ fontSize:22 }}>{opt.emoji}</span>
          <span style={{ fontWeight:500, color:theme.text, fontSize:14 }}>{opt.label}</span>
        </SelectCard>
      ))}
      <div>
        <label className="label">O escríbelo tú mismo (opcional)</label>
        <input className="input" placeholder="Mi razón personal…"
          value={motivationIsCustom ? form.motivation_why : ''}
          onChange={e => set('motivation_why', e.target.value)} />
      </div>
    </div>,

    // 4 — Actividad
    <div key={4} style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:theme.text, margin:'0 0 4px' }}>Actividad física ⚡</h2>
      {ACTIVITY.map(a => (
        <SelectCard key={a.value} selected={form.activity_level===a.value}
          onSelect={() => set('activity_level', a.value)} theme={theme}>
          <span style={{ fontSize:22 }}>{a.emoji}</span>
          <div>
            <p style={{ fontWeight:600, color:theme.text, margin:0, fontSize:14 }}>{a.label}</p>
            <p style={{ fontSize:11, color:theme.textMuted, margin:0 }}>{a.desc}</p>
          </div>
        </SelectCard>
      ))}
      <div>
        <label className="label">Días de entrenamiento por semana</label>
        <div style={{ display:'flex', gap:6 }}>
          {['0','1','2','3','4','5','6','7'].map(d => (
            <button key={d} onClick={() => set('training_days_per_week', d)}
              style={{ flex:1, padding:'8px 0', borderRadius:10,
                border:`1.5px solid ${form.training_days_per_week===d ? theme.primary : theme.border}`,
                background: form.training_days_per_week===d ? `${theme.primary}20` : 'transparent',
                color: form.training_days_per_week===d ? theme.primary : theme.textMuted,
                fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // 5 — Día a día
    <div key={5} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:theme.text, margin:'0 0 4px' }}>Tu día a día 😴</h2>
      <div>
        <label className="label">Profesión</label>
        <input className="input" placeholder="Ej: Enfermera, Informático, Autónomo…"
          value={form.profession} onChange={e => set('profession', e.target.value)} />
      </div>
      <div>
        <label className="label">Horario de trabajo</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
          {WORK_SCHEDULES.map(s => (
            <button key={s.value} onClick={() => set('work_schedule', s.value)}
              style={{ padding:'8px 0', borderRadius:12, fontSize:12, fontWeight:500,
                border:`1.5px solid ${form.work_schedule===s.value ? theme.primary : theme.border}`,
                background: form.work_schedule===s.value ? `${theme.primary}20` : 'transparent',
                color: form.work_schedule===s.value ? theme.primary : theme.textMuted,
                cursor:'pointer' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Horas de sueño habituales</label>
        <input className="input" type="number" step="0.5" min="3" max="12"
          value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)} />
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <div style={{ flex:1 }}>
          <label className="label">Me despierto</label>
          <input className="input" type="time"
            value={form.wake_time} onChange={e => set('wake_time', e.target.value)} />
        </div>
        <div style={{ flex:1 }}>
          <label className="label">Me acuesto</label>
          <input className="input" type="time"
            value={form.sleep_time} onChange={e => set('sleep_time', e.target.value)} />
        </div>
      </div>
    </div>,

    // 6 — Alimentación
    <div key={6} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:theme.text, margin:'0 0 4px' }}>Alimentación 🥗</h2>
      <div>
        <label className="label">Tipo de dieta</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
          {DIET_TYPES.map(d => (
            <button key={d.value} onClick={() => set('diet_type', d.value)}
              style={{ padding:'10px 0', borderRadius:12, fontSize:13, fontWeight:500,
                border:`1.5px solid ${form.diet_type===d.value ? theme.primary : theme.border}`,
                background: form.diet_type===d.value ? `${theme.primary}20` : 'rgba(255,255,255,0.6)',
                color: form.diet_type===d.value ? theme.primary : theme.textMuted,
                cursor:'pointer' }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Alergias alimentarias</label>
        <input className="input" placeholder="frutos secos, gluten, marisco…"
          value={form.allergies} onChange={e => set('allergies', e.target.value)} />
      </div>
      <div>
        <label className="label">Intolerancias</label>
        <input className="input" placeholder="lactosa, fructosa…"
          value={form.food_intolerances} onChange={e => set('food_intolerances', e.target.value)} />
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
        borderRadius:14, cursor:'pointer',
        border:`1.5px solid ${form.is_smoker ? theme.primary : theme.border}`,
        background: form.is_smoker ? `${theme.primary}10` : 'rgba(255,255,255,0.6)' }}>
        <input type="checkbox" checked={form.is_smoker}
          onChange={e => set('is_smoker', e.target.checked)} style={{ width:16, height:16 }} />
        <span style={{ fontSize:14, color:theme.text }}>Soy fumador/a 🚬</span>
      </label>
      <div>
        <label className="label">Alcohol</label>
        <div style={{ display:'flex', gap:8 }}>
          {[['never','Nunca'],['occasional','Ocasional'],['weekly','Semanal'],['daily','Diario']].map(([v,l]) => (
            <button key={v} onClick={() => set('alcohol_frequency', v)}
              style={{ flex:1, padding:'8px 0', borderRadius:10, fontSize:11, fontWeight:600,
                border:`1.5px solid ${form.alcohol_frequency===v ? theme.primary : theme.border}`,
                background: form.alcohol_frequency===v ? `${theme.primary}20` : 'transparent',
                color: form.alcohol_frequency===v ? theme.primary : theme.textMuted,
                cursor:'pointer' }}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // 7 — Tratamientos
    <div key={7} style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:theme.text, margin:'0 0 2px' }}>Tratamientos 💊</h2>
      <p style={{ fontSize:12, color:theme.textMuted, margin:'0 0 4px' }}>
        Información confidencial. Ayuda a Pandi a cuidarte mejor. Completamente opcional.
      </p>
      {TREATMENTS.map(t => {
        const selected = form.treatments.some(tr => tr.type===t.value)
        return (
          <label key={t.value} style={{ display:'flex', alignItems:'center', gap:12,
            padding:'12px 16px', borderRadius:14, cursor:'pointer',
            border:`1.5px solid ${selected ? theme.primary : theme.border}`,
            background: selected ? `${theme.primary}10` : 'rgba(255,255,255,0.6)' }}>
            <input type="checkbox" checked={selected}
              onChange={e => {
                if (e.target.checked)
                  set('treatments', [...form.treatments, { type:t.value, name:t.label.replace(/^[^\s]+ /,''), active:true }])
                else
                  set('treatments', form.treatments.filter(tr => tr.type!==t.value))
              }}
              style={{ width:16, height:16 }} />
            <span style={{ fontSize:13, color:theme.text }}>{t.label}</span>
          </label>
        )
      })}
    </div>,
  ]

  return (
    <div style={{ minHeight:'100vh', position:'relative', display:'flex', flexDirection:'column' }}>

      <OnboardingBackground step={step} />

      <div style={{
        position:'relative', zIndex:1,
        display:'flex', flexDirection:'column',
        minHeight:'100vh',
        padding:'20px 20px 32px',
        maxWidth:460, margin:'0 auto', width:'100%',
      }}>

        {/* Header — Incubadora + progreso (steps 1-7) */}
        {step > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ marginBottom:40 }}>
              <Incubadora step={step} born={false} form={form} />
            </div>
            <ProgressBar step={step} total={TOTAL_STEPS} theme={theme} />
            <p style={{ fontSize:11, color:'rgba(0,0,0,0.45)', margin:'4px 0 0' }}>
              Paso {step+1} de {TOTAL_STEPS}
            </p>
          </div>
        )}

        {/* Progreso en step 0 */}
        {step === 0 && (
          <div style={{ marginBottom:8 }}>
            <ProgressBar step={0} total={TOTAL_STEPS} theme={theme} />
          </div>
        )}

        {/* Contenido */}
        <div style={{ flex:1 }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity:0, x:24 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-24 }}
              transition={{ duration:0.22 }}>
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navegación */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:24 }}>
          {step === TOTAL_STEPS - 1 && <MedicalDisclaimerText />}
          <div style={{ display:'flex', gap:10 }}>
            {step > 0 && (
              <motion.button whileTap={{ scale:0.97 }}
                onClick={() => setStep(s => s-1)}
                className="btn-secondary"
                style={{ width:'auto', paddingLeft:20, paddingRight:20 }}>
                ← Atrás
              </motion.button>
            )}
            {step < TOTAL_STEPS - 1 ? (
              <motion.button whileTap={{ scale: canNext() ? 0.97 : 1 }}
                onClick={() => { if (canNext()) setStep(s => s+1) }}
                disabled={!canNext()}
                className="btn-primary"
                style={{ opacity: canNext() ? 1 : 0.4, flex:1 }}>
                Siguiente →
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale:0.97 }}
                onClick={finish} disabled={loading}
                className="btn-primary" style={{ flex:1 }}>
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                      <motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                        style={{ display:'inline-block' }}>⟳</motion.span>
                      Dando vida a Pandi…
                    </span>
                  : '✨ Despertar a Pandi'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
