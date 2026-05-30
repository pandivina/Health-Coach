import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { MedicalDisclaimerText } from '../components/legal/MedicalDisclaimer'
import LanguagePicker from '../components/LanguagePicker'

// ─── DATOS (idénticos a V1) ────────────────────────────────────────────────

const GOALS = [
  { value: 'lose_fat',    emoji: '🔥', label: 'Perder grasa',   desc: 'Reducir % de grasa corporal'     },
  { value: 'gain_muscle', emoji: '💪', label: 'Ganar músculo',  desc: 'Aumentar masa muscular'           },
  { value: 'define',      emoji: '✂️', label: 'Definición',     desc: 'Marcar músculo con bajo % grasa' },
  { value: 'recomp',      emoji: '🔄', label: 'Recomposición',  desc: 'Perder grasa y ganar músculo'    },
  { value: 'maintain',    emoji: '⚖️', label: 'Mantener peso',  desc: 'Conservar el estado actual'      },
  { value: 'health',      emoji: '❤️', label: 'Salud general',  desc: 'Mejorar hábitos y bienestar'     },
]
const ACTIVITY = [
  { value: 'sedentary', emoji: '🛋️', label: 'Sedentario',   desc: '1-2 días de ejercicio/semana'  },
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

// ─── ESTADO DE PANDI SEGÚN CONTEXTO ────────────────────────────────────────

function getPandiState(step, form) {
  // Fase 0: Huevo / bienvenida
  if (step === 0) return { mood: 'egg', energy: 0.3, label: '' }
  // Fase 1: Medidas — Pandi se "forma"
  if (step === 1) {
    if (!form.weight_kg && !form.height_cm) return { mood: 'curious', energy: 0.5, label: '¿Cómo eres?' }
    return { mood: 'thinking', energy: 0.6, label: 'Calculando…' }
  }
  // Fase 2: Objetivo
  if (step === 2) {
    if (!form.goal) return { mood: 'curious', energy: 0.5, label: '¿Cuál es tu meta?' }
    const goalMoods = { lose_fat: 'focused', gain_muscle: 'pumped', define: 'focused', recomp: 'thinking', maintain: 'happy', health: 'happy' }
    return { mood: goalMoods[form.goal] || 'happy', energy: 0.8, label: '¡Buena elección!' }
  }
  // Fase 3: Por qué
  if (step === 3) {
    if (!form.motivation_why) return { mood: 'curious', energy: 0.6, label: '¿Por qué lo haces?' }
    return { mood: 'touched', energy: 0.9, label: 'Lo recordaré' }
  }
  // Fase 4: Actividad
  if (step === 4) {
    if (!form.activity_level) return { mood: 'curious', energy: 0.5, label: '¿Qué tan activo eres?' }
    const actMoods = { sedentary: 'gentle', light: 'happy', moderate: 'pumped', intense: 'pumped', athlete: 'pumped' }
    return { mood: actMoods[form.activity_level] || 'happy', energy: 0.85, label: '¡Entendido!' }
  }
  // Fase 5: Día a día
  if (step === 5) return { mood: 'thinking', energy: 0.7, label: 'Organizando tu rutina' }
  // Fase 6: Alimentación
  if (step === 6) return { mood: 'happy', energy: 0.8, label: '¡Me encantan las opciones!' }
  // Fase 7: Tratamientos — Pandi serio y cálido
  if (step === 7) return { mood: 'gentle', energy: 0.6, label: 'Aquí en confianza' }

  return { mood: 'happy', energy: 0.8, label: '' }
}

// ─── PANDI PLACEHOLDER SVG ────────────────────────────────────────────────

function PandiAvatar({ mood, energy, size = 80 }) {
  // Colores base según mood
  const palettes = {
    egg:     { body: '#F5F0E8', eye: '#6B5B4E', cheek: '#F9C784', glow: '#FFF3C4' },
    curious: { body: '#A8D8EA', eye: '#3A6B8A', cheek: '#FFB3B3', glow: '#A8D8EA' },
    thinking:{ body: '#C3B4D4', eye: '#5A4A7A', cheek: '#E8C4E8', glow: '#C3B4D4' },
    happy:   { body: '#6DD68D', eye: '#2A6B4A', cheek: '#FFB3B3', glow: '#6DD68D' },
    pumped:  { body: '#FFB347', eye: '#8B4513', cheek: '#FF8C69', glow: '#FFD700' },
    focused: { body: '#4FC3F7', eye: '#1565C0', cheek: '#B3E5FC', glow: '#4FC3F7' },
    touched: { body: '#F48FB1', eye: '#880E4F', cheek: '#FCE4EC', glow: '#F48FB1' },
    gentle:  { body: '#A5D6A7', eye: '#2E7D32', cheek: '#DCEDC8', glow: '#A5D6A7' },
  }
  const p = palettes[mood] || palettes.happy

  // Expresiones según mood
  const eyes = {
    egg:      <ellipse cx="0" cy="0" rx="3" ry="2.5" fill={p.eye} opacity="0.3" />,
    curious:  <><ellipse cx="-1" cy="0" rx="3.5" ry="4" fill={p.eye} /><ellipse cx="1.5" cy="-1" rx="1.5" ry="2" fill="white" opacity="0.8" /></>,
    thinking: <><path d="M-4,0 Q-2,-3 0,0" stroke={p.eye} strokeWidth="2" fill="none" strokeLinecap="round" /><ellipse cx="0" cy="0" rx="3" ry="3.5" fill={p.eye} /></>,
    happy:    <><path d="M-4,-1 Q-2,3 0,-1" stroke={p.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" /><path d="M2,-1 Q4,3 6,-1" stroke={p.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" /></>,
    pumped:   <><ellipse cx="0" cy="0" rx="4" ry="4" fill={p.eye} /><ellipse cx="1.5" cy="-1.5" rx="1.5" ry="1.5" fill="white" opacity="0.9" /></>,
    focused:  <><ellipse cx="0" cy="0" rx="3" ry="4.5" fill={p.eye} /><ellipse cx="1" cy="-1" rx="1.2" ry="1.8" fill="white" opacity="0.9" /></>,
    touched:  <><path d="M-4,0 Q-2,4 0,0" stroke={p.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" /><path d="M2,0 Q4,4 6,0" stroke={p.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" /></>,
    gentle:   <><path d="M-4,1 Q-2,-2 0,1" stroke={p.eye} strokeWidth="2" fill="none" strokeLinecap="round" /><ellipse cx="3" cy="0" rx="3" ry="3" fill={p.eye} /></>,
  }

  const mouthMap = {
    egg:      <ellipse cx="0" cy="3" rx="2" ry="1.5" fill={p.eye} opacity="0.3" />,
    curious:  <path d="M-3,2 Q0,5 3,2" stroke={p.eye} strokeWidth="2" fill="none" strokeLinecap="round" />,
    thinking: <path d="M-3,2 Q0,4 3,3" stroke={p.eye} strokeWidth="2" fill="none" strokeLinecap="round" />,
    happy:    <path d="M-5,0 Q0,7 5,0" stroke={p.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    pumped:   <><path d="M-5,-1 Q0,8 5,-1" stroke={p.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" /><ellipse cx="0" cy="4" rx="3" ry="2" fill={p.eye} opacity="0.15" /></>,
    focused:  <path d="M-3,2 Q0,3 3,2" stroke={p.eye} strokeWidth="1.5" fill="none" strokeLinecap="round" />,
    touched:  <><path d="M-4,0 Q0,6 4,0" stroke={p.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" /><text x="-2" y="-4" fontSize="6" fill={p.eye}>✦</text></>,
    gentle:   <path d="M-3,2 Q0,5 3,2" stroke={p.eye} strokeWidth="2" fill="none" strokeLinecap="round" />,
  }

  const s = size
  const cx = s / 2
  const cy = s / 2

  // Shape del cuerpo según mood
  const isEgg = mood === 'egg'
  const bodyRx = isEgg ? s * 0.35 : s * 0.38
  const bodyRy = isEgg ? s * 0.42 : s * 0.37
  const headRx = isEgg ? 0 : s * 0.30
  const headRy = isEgg ? 0 : s * 0.28
  const headCy = isEgg ? 0 : cy - s * 0.14

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ overflow: 'visible' }}>
      {/* Glow de fondo */}
      <ellipse cx={cx} cy={cy + s * 0.05} rx={s * 0.36} ry={s * 0.12}
        fill={p.glow} opacity={energy * 0.4} />

      {/* Sombra */}
      <ellipse cx={cx} cy={cy + bodyRy * 0.9} rx={bodyRx * 0.75} ry={s * 0.06}
        fill="#000" opacity="0.08" />

      {/* Cuerpo */}
      <ellipse cx={cx} cy={cy} rx={bodyRx} ry={bodyRy}
        fill={p.body} />

      {!isEgg && (
        <>
          {/* Cabeza */}
          <ellipse cx={cx} cy={headCy} rx={headRx} ry={headRy}
            fill={p.body} />

          {/* Orejas */}
          <ellipse cx={cx - headRx * 0.75} cy={headCy - headRy * 0.75}
            rx={headRx * 0.22} ry={headRy * 0.28} fill={p.body} />
          <ellipse cx={cx + headRx * 0.75} cy={headCy - headRy * 0.75}
            rx={headRx * 0.22} ry={headRy * 0.28} fill={p.body} />

          {/* Manchas de panda */}
          <ellipse cx={cx - headRx * 0.38} cy={headCy - headRy * 0.08}
            rx={headRx * 0.28} ry={headRy * 0.28} fill="#2C2C2C" opacity="0.9" />
          <ellipse cx={cx + headRx * 0.38} cy={headCy - headRy * 0.08}
            rx={headRx * 0.28} ry={headRy * 0.28} fill="#2C2C2C" opacity="0.9" />

          {/* Mejillas */}
          <ellipse cx={cx - headRx * 0.55} cy={headCy + headRy * 0.28}
            rx={headRx * 0.18} ry={headRy * 0.12} fill={p.cheek} opacity="0.7" />
          <ellipse cx={cx + headRx * 0.55} cy={headCy + headRy * 0.28}
            rx={headRx * 0.18} ry={headRy * 0.12} fill={p.cheek} opacity="0.7" />

          {/* Ojos izquierdo */}
          <g transform={`translate(${cx - headRx * 0.35}, ${headCy - headRy * 0.1})`}>
            {eyes[mood] || eyes.happy}
          </g>
          {/* Ojos derecho — solo algunos moods tienen ojos separados */}
          {!['happy', 'touched', 'gentle', 'thinking', 'curious'].includes(mood) && (
            <g transform={`translate(${cx + headRx * 0.25}, ${headCy - headRy * 0.1})`}>
              <ellipse cx="0" cy="0" rx="3.5" ry="4" fill={p.eye} />
              <ellipse cx="1.5" cy="-1" rx="1.5" ry="2" fill="white" opacity="0.8" />
            </g>
          )}

          {/* Nariz */}
          <ellipse cx={cx} cy={headCy + headRy * 0.08}
            rx={headRx * 0.12} ry={headRy * 0.07} fill={p.eye} opacity="0.8" />

          {/* Boca */}
          <g transform={`translate(${cx}, ${headCy + headRy * 0.25})`}>
            {mouthMap[mood] || mouthMap.happy}
          </g>

          {/* Brazos */}
          <ellipse cx={cx - bodyRx * 0.85} cy={cy - bodyRy * 0.1}
            rx={s * 0.09} ry={s * 0.17} fill={p.body}
            transform={`rotate(-20, ${cx - bodyRx * 0.85}, ${cy - bodyRy * 0.1})`} />
          <ellipse cx={cx + bodyRx * 0.85} cy={cy - bodyRy * 0.1}
            rx={s * 0.09} ry={s * 0.17} fill={p.body}
            transform={`rotate(20, ${cx + bodyRx * 0.85}, ${cy - bodyRy * 0.1})`} />

          {/* Patas */}
          <ellipse cx={cx - bodyRx * 0.4} cy={cy + bodyRy * 0.82}
            rx={s * 0.12} ry={s * 0.08} fill={p.body} />
          <ellipse cx={cx + bodyRx * 0.4} cy={cy + bodyRy * 0.82}
            rx={s * 0.12} ry={s * 0.08} fill={p.body} />

          {/* Mancha de barriga */}
          <ellipse cx={cx} cy={cy + bodyRy * 0.12}
            rx={bodyRx * 0.5} ry={bodyRy * 0.45} fill="white" opacity="0.35" />
        </>
      )}

      {/* Grietas del huevo (solo en mood egg) */}
      {isEgg && (
        <>
          <path d={`M${cx - 5},${cy - bodyRy * 0.5} l3,-5 l4,3 l3,-6`}
            stroke="#D4C5A9" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d={`M${cx + 8},${cy - bodyRy * 0.3} l-2,-4 l5,2`}
            stroke="#D4C5A9" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
        </>
      )}
    </svg>
  )
}

// ─── ORBE DE PANDI (burbuja flotante con label) ───────────────────────────

function PandiBubble({ mood, energy, label, step }) {
  const isEgg = mood === 'egg'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <motion.div
        animate={isEgg
          ? { scale: [1, 1.04, 1], rotate: [0, 1, -1, 0] }
          : { y: [0, -4, 0], scale: [1, 1.02, 1] }
        }
        transition={{ duration: isEgg ? 3 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PandiAvatar mood={mood} energy={energy} size={72} />
      </motion.div>
      <AnimatePresence mode="wait">
        {label ? (
          <motion.div key={label}
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: '#555',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              whiteSpace: 'nowrap',
            }}>
            {label}
          </motion.div>
        ) : <div key="empty" style={{ height: 22 }} />}
      </AnimatePresence>
    </div>
  )
}

// ─── FONDO DINÁMICO DEL SANTUARIO ─────────────────────────────────────────

function SanctuaryBackground({ step, mood }) {
  const gradients = {
    egg:     'radial-gradient(ellipse at 50% 30%, #FFF8E7 0%, #F5EDD8 60%, #EDE0C4 100%)',
    curious: 'radial-gradient(ellipse at 50% 20%, #E8F4FD 0%, #C5E4F3 60%, #A8D4E8 100%)',
    thinking:'radial-gradient(ellipse at 50% 20%, #EDE8F8 0%, #D4CAF0 60%, #BEB2E4 100%)',
    happy:   'radial-gradient(ellipse at 50% 20%, #E8F8ED 0%, #C5EACF 60%, #A8DEB5 100%)',
    pumped:  'radial-gradient(ellipse at 50% 20%, #FFF4E6 0%, #FFDDB3 60%, #FFCB80 100%)',
    focused: 'radial-gradient(ellipse at 50% 20%, #E6F4FF 0%, #B3D8FF 60%, #80BCFF 100%)',
    touched: 'radial-gradient(ellipse at 50% 20%, #FFF0F5 0%, #FFD0E0 60%, #FFB3C8 100%)',
    gentle:  'radial-gradient(ellipse at 50% 20%, #EDFAF0 0%, #C8EFCE 60%, #A4E4AC 100%)',
  }

  return (
    <motion.div
      key={mood}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: gradients[mood] || gradients.happy,
        transition: 'background 1.5s ease',
      }}
    >
      {/* Partículas ambientales */}
      {[...Array(6)].map((_, i) => (
        <motion.div key={i}
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.35, 0.15], scale: [1, 1.1, 1] }}
          transition={{ duration: 4 + i * 0.7, delay: i * 0.9, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: `${12 + i * 14}%`,
            top: `${60 + (i % 3) * 10}%`,
            width: 6 + (i % 3) * 4,
            height: 6 + (i % 3) * 4,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
          }}
        />
      ))}
    </motion.div>
  )
}

// ─── SELECT CARD (idéntico a V1 en lógica, nuevo look) ───────────────────

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

// ─── BARRA DE PROGRESO CEREMONIAL ─────────────────────────────────────────

function ProgressRitual({ step, total, theme }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
      {[...Array(total)].map((_, i) => (
        <motion.div key={i}
          animate={{ scaleX: i === step ? 1 : 1 }}
          style={{
            flex: i === step ? 2 : 1,
            height: 3,
            borderRadius: 3,
            background: i < step
              ? theme.primary
              : i === step
              ? `linear-gradient(90deg, ${theme.primary}, ${theme.accent || '#FF8FA3'})`
              : 'rgba(0,0,0,0.1)',
            transition: 'all 0.4s ease',
          }}
        />
      ))}
    </div>
  )
}

// ─── ESCENA DEL HUEVO (step 0) ────────────────────────────────────────────

function EggScene({ form, set, theme, onCrack }) {
  const [cracked, setCracked] = useState(false)
  const [typing, setTyping] = useState(false)

  const handleNameFocus = () => setTyping(true)
  const handleNameBlur = () => setTyping(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

      {/* El huevo animado grande */}
      <motion.div
        animate={typing
          ? { scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] }
          : { scale: [1, 1.02, 1] }
        }
        transition={{ duration: typing ? 0.4 : 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginBottom: 8 }}
      >
        <svg width="120" height="140" viewBox="0 0 120 140">
          {/* Sombra */}
          <ellipse cx="60" cy="130" rx="38" ry="8" fill="#000" opacity="0.08" />
          {/* Huevo */}
          <ellipse cx="60" cy="68" rx="46" ry="58" fill="#F5F0E8" />
          <ellipse cx="60" cy="68" rx="46" ry="58"
            fill="none" stroke="#E8DFC8" strokeWidth="1.5" />
          {/* Brillo */}
          <ellipse cx="42" cy="40" rx="10" ry="14" fill="white" opacity="0.4" />
          {/* Grietas animadas si hay nombre */}
          {form.name && (
            <>
              <motion.path
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
                d="M55,25 l4,-7 l5,4 l4,-8" stroke="#D4C5A9" strokeWidth="1.8"
                fill="none" strokeLinecap="round" />
              <motion.path
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                d="M72,38 l-3,-5 l6,2" stroke="#D4C5A9" strokeWidth="1.5"
                fill="none" strokeLinecap="round" />
              {/* Luz interna */}
              <motion.ellipse
                initial={{ opacity: 0 }} animate={{ opacity: [0, 0.3, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                cx="60" cy="68" rx="30" ry="38" fill="#FFF3C4" />
            </>
          )}
          {/* Ojitos si ya tiene nombre */}
          {form.name && (
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}>
              <ellipse cx="50" cy="72" rx="5" ry="5.5" fill="#5C4A3A" opacity="0.7" />
              <ellipse cx="70" cy="72" rx="5" ry="5.5" fill="#5C4A3A" opacity="0.7" />
              <ellipse cx="52" cy="70" rx="2" ry="2" fill="white" opacity="0.8" />
              <ellipse cx="72" cy="70" rx="2" ry="2" fill="white" opacity="0.8" />
              <path d="M53,80 Q60,85 67,80" stroke="#5C4A3A" strokeWidth="2"
                fill="none" strokeLinecap="round" opacity="0.7" />
            </motion.g>
          )}
        </svg>
      </motion.div>

      {/* Texto ceremonial */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: 'center', marginBottom: 24, padding: '0 8px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: theme.text, margin: '0 0 6px' }}>
          Algo está a punto de despertar
        </h2>
        <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>
          Dale un nombre y dará sus primeros pasos
        </p>
      </motion.div>

      {/* Campos */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label className="label">Tu nombre</label>
          <input className="input"
            placeholder="¿Cómo te llamamos?"
            value={form.name}
            onFocus={handleNameFocus}
            onBlur={handleNameBlur}
            onChange={e => set('name', e.target.value)} />
        </div>

        <div>
          <label className="label">Idioma / Language</label>
          <LanguagePicker inline />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Fecha de nacimiento</label>
            <input className="input" type="date"
              value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Sexo</label>
            <select className="input" value={form.sex}
              onChange={e => set('sex', e.target.value)}>
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────

export default function Onboarding() {
  const { theme } = useTheme()
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
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
    treatments: [], treatment_name: '', treatment_type: '',
    motivation_why: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Estado de Pandi derivado del form + step actual
  const pandiState = getPandiState(step, form)

  // Cálculos BMI (idéntico a V1)
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

  const WHY_PRESETS       = WHY_OPTIONS.map(o => o.value)
  const motivationIsCustom = form.motivation_why && !WHY_PRESETS.includes(form.motivation_why)

  // ── CONTENIDO DE CADA PASO ───────────────────────────────────────────────

  const stepContent = [

    // 0 — El Huevo (escena propia)
    <EggScene key={0} form={form} set={set} theme={theme} />,

    // 1 — Medidas
    <div key={1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>
          Tus medidas 📏
        </h2>
        <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>
          Pandi necesita esto para reflejarte con precisión
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Altura (cm)</label>
          <input className="input" type="number" placeholder="175"
            value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">Peso actual (kg)</label>
          <input className="input" type="number" step="0.1" placeholder="70"
            value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
        </div>
      </div>
      {currentBMI && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, color: theme.textMuted, margin: '0 0 2px' }}>Tu IMC</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: theme.text, margin: 0 }}>{currentBMI}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: bmiColor, margin: 0 }}>{bmiLabel}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: theme.textMuted, margin: '0 0 2px' }}>Rango saludable</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: theme.text, margin: 0 }}>
                {healthyMin} – {healthyMax} kg
              </p>
              <p style={{ fontSize: 11, color: theme.textLight, margin: 0 }}>Para tu altura</p>
            </div>
          </div>
        </motion.div>
      )}
      <div>
        <label className="label">Peso objetivo (kg)</label>
        <input className="input" type="number" step="0.1"
          placeholder={healthyMax ? `Sugerido: ${Math.round((healthyMin + healthyMax) / 2)}` : 'Ej: 65'}
          value={form.target_weight_kg} onChange={e => set('target_weight_kg', e.target.value)} />
        {healthyMin && (
          <p style={{ fontSize: 11, marginTop: 4, color: theme.textLight }}>
            Rango saludable: {healthyMin}–{healthyMax} kg
          </p>
        )}
      </div>
    </div>,

    // 2 — Objetivo
    <div key={2} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>
        ¿Cuál es tu objetivo? 🎯
      </h2>
      {GOALS.map(g => (
        <SelectCard key={g.value} selected={form.goal === g.value}
          onSelect={() => set('goal', g.value)} theme={theme}>
          <span style={{ fontSize: 22 }}>{g.emoji}</span>
          <div>
            <p style={{ fontWeight: 600, color: theme.text, margin: 0, fontSize: 14 }}>{g.label}</p>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>{g.desc}</p>
          </div>
        </SelectCard>
      ))}
      {(form.goal === 'lose_fat' || form.goal === 'define') && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <label className="label">Velocidad del progreso</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['slow','🐢 Suave'],['moderate','⚡ Moderado'],['aggressive','🚀 Agresivo']].map(([v, l]) => (
              <button key={v} onClick={() => set('goal_intensity', v)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 12,
                  border: `1.5px solid ${form.goal_intensity === v ? theme.primary : theme.border}`,
                  background: form.goal_intensity === v ? `${theme.primary}20` : 'transparent',
                  color: form.goal_intensity === v ? theme.primary : theme.textMuted,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}>
                {l}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>,

    // 3 — Por qué
    <div key={3} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 6px' }}>
          ¿Por qué quieres mejorar tu salud?
        </h2>
        <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>
          Pandi lo guardará para recordártelo cuando lo necesites
        </p>
      </div>
      {WHY_OPTIONS.map(opt => (
        <SelectCard key={opt.value}
          selected={form.motivation_why === opt.value}
          onSelect={() => set('motivation_why', form.motivation_why === opt.value ? '' : opt.value)}
          theme={theme}>
          <span style={{ fontSize: 22 }}>{opt.emoji}</span>
          <span style={{ fontWeight: 500, color: theme.text, fontSize: 14 }}>{opt.label}</span>
        </SelectCard>
      ))}
      <div>
        <label className="label">O escríbelo tú mismo (opcional)</label>
        <input className="input" placeholder="Mi razón personal…"
          value={motivationIsCustom ? form.motivation_why : ''}
          onChange={e => set('motivation_why', e.target.value)} />
      </div>
      <p style={{ fontSize: 11, textAlign: 'center', color: theme.textLight }}>
        Paso opcional — puedes continuar sin rellenar
      </p>
    </div>,

    // 4 — Actividad
    <div key={4} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>
        Actividad física 🏋️
      </h2>
      {ACTIVITY.map(a => (
        <SelectCard key={a.value} selected={form.activity_level === a.value}
          onSelect={() => set('activity_level', a.value)} theme={theme}>
          <span style={{ fontSize: 22 }}>{a.emoji}</span>
          <div>
            <p style={{ fontWeight: 600, color: theme.text, margin: 0, fontSize: 14 }}>{a.label}</p>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>{a.desc}</p>
          </div>
        </SelectCard>
      ))}
      <div>
        <label className="label">Días de entrenamiento por semana</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {['0','1','2','3','4','5','6','7'].map(d => (
            <button key={d} onClick={() => set('training_days_per_week', d)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10,
                border: `1.5px solid ${form.training_days_per_week === d ? theme.primary : theme.border}`,
                background: form.training_days_per_week === d ? `${theme.primary}20` : 'transparent',
                color: form.training_days_per_week === d ? theme.primary : theme.textMuted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // 5 — Día a día
    <div key={5} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>
        Tu día a día 📅
      </h2>
      <div>
        <label className="label">Profesión</label>
        <input className="input" placeholder="Ej: Enfermera, Informático, Autónomo…"
          value={form.profession} onChange={e => set('profession', e.target.value)} />
      </div>
      <div>
        <label className="label">Horario de trabajo</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {WORK_SCHEDULES.map(s => (
            <button key={s.value} onClick={() => set('work_schedule', s.value)}
              style={{
                padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 500,
                border: `1.5px solid ${form.work_schedule === s.value ? theme.primary : theme.border}`,
                background: form.work_schedule === s.value ? `${theme.primary}20` : 'transparent',
                color: form.work_schedule === s.value ? theme.primary : theme.textMuted,
                cursor: 'pointer',
              }}>
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
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Me despierto</label>
          <input className="input" type="time"
            value={form.wake_time} onChange={e => set('wake_time', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">Me acuesto</label>
          <input className="input" type="time"
            value={form.sleep_time} onChange={e => set('sleep_time', e.target.value)} />
        </div>
      </div>
    </div>,

    // 6 — Alimentación
    <div key={6} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>
        Alimentación y hábitos 🥗
      </h2>
      <div>
        <label className="label">Tipo de dieta</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {DIET_TYPES.map(d => (
            <button key={d.value} onClick={() => set('diet_type', d.value)}
              style={{
                padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 500,
                border: `1.5px solid ${form.diet_type === d.value ? theme.primary : theme.border}`,
                background: form.diet_type === d.value ? `${theme.primary}20` : 'rgba(255,255,255,0.6)',
                color: form.diet_type === d.value ? theme.primary : theme.textMuted,
                cursor: 'pointer',
              }}>
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
      <label style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderRadius: 14, cursor: 'pointer',
        border: `1.5px solid ${form.is_smoker ? theme.primary : theme.border}`,
        background: form.is_smoker ? `${theme.primary}10` : 'rgba(255,255,255,0.6)',
      }}>
        <input type="checkbox" checked={form.is_smoker}
          onChange={e => set('is_smoker', e.target.checked)}
          style={{ width: 16, height: 16 }} />
        <span style={{ fontSize: 14, color: theme.text }}>Soy fumador/a 🚬</span>
      </label>
      <div>
        <label className="label">Alcohol</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['never','Nunca'],['occasional','Ocasional'],['weekly','Semanal'],['daily','Diario']].map(([v, l]) => (
            <button key={v} onClick={() => set('alcohol_frequency', v)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 11, fontWeight: 600,
                border: `1.5px solid ${form.alcohol_frequency === v ? theme.primary : theme.border}`,
                background: form.alcohol_frequency === v ? `${theme.primary}20` : 'transparent',
                color: form.alcohol_frequency === v ? theme.primary : theme.textMuted,
                cursor: 'pointer',
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // 7 — Tratamientos
    <div key={7} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 2px' }}>
        Tratamientos médicos 💊
      </h2>
      <p style={{ fontSize: 12, color: theme.textMuted, margin: '0 0 4px' }}>
        Información confidencial. Ayuda al Coach a personalizar tus recomendaciones.
        Completamente opcional.
      </p>
      {TREATMENTS.map(t => {
        const selected = form.treatments.some(tr => tr.type === t.value)
        return (
          <label key={t.value} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
            border: `1.5px solid ${selected ? theme.primary : theme.border}`,
            background: selected ? `${theme.primary}10` : 'rgba(255,255,255,0.6)',
          }}>
            <input type="checkbox" checked={selected}
              onChange={e => {
                if (e.target.checked)
                  set('treatments', [...form.treatments, {
                    type: t.value,
                    name: t.label.replace(/^[^\s]+ /, ''),
                    active: true,
                  }])
                else
                  set('treatments', form.treatments.filter(tr => tr.type !== t.value))
              }}
              style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: theme.text }}>{t.label}</span>
          </label>
        )
      })}
      <p style={{ fontSize: 11, textAlign: 'center', color: theme.textLight }}>
        Puedes añadir más desde tu perfil más adelante
      </p>
    </div>,
  ]

  const TOTAL_STEPS = stepContent.length

  // ── VALIDACIÓN (idéntica a V1) ────────────────────────────────────────────

  const canNext = () => {
    if (step === 0) return form.name && form.birth_date
    if (step === 1) return form.height_cm && form.weight_kg
    if (step === 2) return form.goal
    if (step === 3) return true
    if (step === 4) return form.activity_level
    return true
  }

  // ── FINISH (idéntico a V1) ─────────────────────────────────────────────────

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
      setLoading(false)
    }
  }

  // ── RENDER PRINCIPAL ───────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Fondo dinámico del Santuario */}
      <SanctuaryBackground step={step} mood={pandiState.mood} />

      {/* Contenido (sobre el fondo) */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh',
        padding: '20px 20px 32px',
        maxWidth: 460, margin: '0 auto', width: '100%',
      }}>

        {/* Header: Pandi + Progreso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <AnimatePresence mode="wait">
            <motion.div key={`${pandiState.mood}-${step}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.35 }}>
              <PandiBubble
                mood={pandiState.mood}
                energy={pandiState.energy}
                label={pandiState.label}
                step={step}
              />
            </motion.div>
          </AnimatePresence>
          <div style={{ flex: 1 }}>
            <ProgressRitual step={step} total={TOTAL_STEPS} theme={theme} />
            <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', margin: '4px 0 0' }}>
              Paso {step + 1} de {TOTAL_STEPS}
            </p>
          </div>
        </div>

        {/* Contenido del paso */}
        <div style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}>
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Botones de navegación */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>

          {step === TOTAL_STEPS - 1 && <MedicalDisclaimerText />}

          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(s => s - 1)}
                className="btn-secondary"
                style={{ width: 'auto', paddingLeft: 20, paddingRight: 20 }}>
                ← Atrás
              </motion.button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <motion.button
                whileTap={{ scale: canNext() ? 0.97 : 1 }}
                onClick={() => { if (canNext()) setStep(s => s + 1) }}
                disabled={!canNext()}
                className="btn-primary"
                style={{ opacity: canNext() ? 1 : 0.4, flex: 1 }}>
                Siguiente →
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={finish}
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-block' }}>⟳</motion.span>
                    Dando vida a Pandi…
                  </span>
                ) : '🐼 ¡Despertar a Pandi!'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
