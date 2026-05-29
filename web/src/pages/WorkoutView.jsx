import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ChevronRight, Sparkles, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'
import { useWorkoutStore } from '../store/useWorkoutStore'
import ActiveWorkoutView from './ActiveWorkoutView'
import { getGuidedSession } from '../data/exerciseLibrary'
import PandiContextualBubble from '../components/PandiContextualBubble'
import PandiTips from '../components/PandiTips'
import SeasonalEventCard from '../components/SeasonalEventCard'
import ExerciseAnimation from '../components/ExerciseAnimation'

// ─── DATOS ───────────────────────────────────────────────────────────────────

const PATHS = {
  titan: {
    id: 'titan', emoji: '🦍', name: 'Titán', subtitle: 'Fuerza · Gimnasio · Calistenia',
    pandi: '¡A machacar hierro! El músculo se forja hoy 💪🔥',
    gradient: 'linear-gradient(135deg, #1F2937, #F97316)',
    gradientSoft: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(31,41,55,0.08))',
    accent: '#F97316',
    warmup: [
      { name: 'Rotación de hombros', duration: '30s', emoji: '🔄' },
      { name: 'Movilidad de cadera', duration: '30s', emoji: '🦵' },
      { name: 'Puente de glúteos', duration: '45s', emoji: '🌉' },
      { name: 'Cat-Cow (columna)', duration: '30s', emoji: '🐈' },
      { name: 'Sentadilla con peso corporal', duration: '60s', emoji: '🏋️' },
    ],
    stretching: [
      { name: 'Estiramiento de pectoral', duration: '40s', emoji: '🫁' },
      { name: 'Flexión de cuádriceps', duration: '30s c/pierna', emoji: '🦵' },
      { name: 'Estiramiento de espalda baja', duration: '45s', emoji: '🔙' },
      { name: 'Cruce de brazos (trapecios)', duration: '30s', emoji: '💪' },
    ],
    stats: [
      { emoji: '📦', label: 'Volumen',  key: 'total_volume_kg', format: v => `${((v||0)/1000).toFixed(1)}t` },
      { emoji: '⚡', label: 'Sesiones', key: 'total_sessions',  format: v => v || 0 },
      { emoji: '🏆', label: 'Récords',  key: 'prs',             format: () => 0 },
    ],
    programs: [
      { id: 'hyper',   name: 'Hipertrofia Básica',  emoji: '💪', tier: 1, level: 1,   duration: '45 min', desc: 'Volumen progresivo para ganar masa muscular sólida',        locked: false, mythic: false },
      { id: 'ppl',     name: 'Push Pull Legs',       emoji: '🏋️', tier: 2, level: 15,  duration: '60 min', desc: 'División muscular clásica para intermedios',                locked: false, mythic: false },
      { id: 'heavy',   name: 'Heavy Duty',           emoji: '⛓️', tier: 3, level: 30,  duration: '50 min', desc: 'Alta intensidad, bajo volumen. Método Mentzer',             locked: false, mythic: false },
      { id: 'arnold',  name: 'Arnold Split',         emoji: '👑', tier: 4, level: 50,  duration: '75 min', desc: 'El programa del mismísimo Arnold Schwarzenegger',           locked: false, mythic: false },
      { id: 'saitama', name: 'Reto Saitama',         emoji: '🦸', tier: 5, level: 100, duration: '∞',      desc: '100 flexiones · 100 abdominales · 10 km. Cada. Día.',       locked: true,  mythic: true  },
    ],
  },
  warrior: {
    id: 'warrior', emoji: '⚡', name: 'Guerrero', subtitle: 'HIIT · Cardio · Agilidad',
    pandi: '¡Sin excusas! Tu corazón es tu motor 🔥⚡',
    gradient: 'linear-gradient(135deg, #0EA5E9, #2EC4B6)',
    gradientSoft: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(46,196,182,0.08))',
    accent: '#0EA5E9',
    warmup: [
      { name: 'Saltos de tijera',         duration: '45s', emoji: '✂️' },
      { name: 'Rodillas al pecho (trot)', duration: '30s', emoji: '🦵' },
      { name: 'Burpees suaves',           duration: '45s', emoji: '💥' },
      { name: 'Escaladores lentos',       duration: '30s', emoji: '🧗' },
      { name: 'Skipping lateral',         duration: '60s', emoji: '↔️' },
    ],
    stretching: [
      { name: 'Estiramiento de isquios',    duration: '40s', emoji: '🦵' },
      { name: 'Flexión de cadera en fondo', duration: '30s c/lado', emoji: '🧎' },
      { name: 'Giro de columna tumbado',    duration: '30s c/lado', emoji: '🔄' },
      { name: 'Estiramiento de gemelos',    duration: '40s', emoji: '🦶' },
    ],
    stats: [
      { emoji: '🔥', label: 'Kcal',         key: 'total_calories',      format: v => v || 0 },
      { emoji: '⏱',  label: 'Tiempo activo', key: 'total_time_minutes',  format: v => `${Math.round((v||0)/60)}h` },
      { emoji: '💨', label: 'Sesiones',      key: 'total_sessions',      format: v => v || 0 },
    ],
    programs: [
      { id: 'circuit',  name: 'Circuitos Quema-Grasa',   emoji: '🏃', tier: 1, level: 1,   duration: '20 min', desc: 'Estaciones de cardio y fuerza. Máxima quema calórica',     locked: false, mythic: false },
      { id: 'tabata',   name: 'Tabata Infernal',          emoji: '⏱️', tier: 2, level: 15,  duration: '15 min', desc: '20s trabajo / 10s descanso. Corto pero brutal',           locked: false, mythic: false },
      { id: 'agility',  name: 'Desafío de Agilidad',      emoji: '⚡', tier: 3, level: 30,  duration: '30 min', desc: 'Coordinación, velocidad y reacción al límite',            locked: false, mythic: false },
      { id: 'military', name: 'Cardio HIIT Militar',      emoji: '🪖', tier: 4, level: 50,  duration: '40 min', desc: 'Entrenamiento funcional de élite inspirado en las fuerzas especiales', locked: false, mythic: false },
      { id: 'marathon', name: 'Reto Maratón de Pandi',    emoji: '🏆', tier: 5, level: 100, duration: '∞',      desc: '42 km. Un pie delante del otro. Eso es todo.',            locked: true,  mythic: true  },
    ],
  },
  zen: {
    id: 'zen', emoji: '🧘', name: 'Zen', subtitle: 'Yoga · Pilates · Flexibilidad',
    pandi: 'Respira hondo... El equilibrio es tu fuerza 🌿✨',
    gradient: 'linear-gradient(135deg, #6EE7B7, #818CF8)',
    gradientSoft: 'linear-gradient(135deg, rgba(110,231,183,0.08), rgba(129,140,248,0.08))',
    accent: '#6EE7B7',
    warmup: [
      { name: 'Respiración Pranayama',    duration: '1 min',  emoji: '🌬️' },
      { name: 'Saludo al sol suave',       duration: '2 min',  emoji: '☀️' },
      { name: 'Torsión espinal sentada',   duration: '30s c/lado', emoji: '🔄' },
      { name: 'Postura del niño (Balasana)', duration: '45s', emoji: '🌱' },
      { name: 'Aperturas de cadera',       duration: '1 min',  emoji: '🦋' },
    ],
    stretching: [
      { name: 'Paloma (apertura cadera)', duration: '60s c/lado', emoji: '🕊️' },
      { name: 'Estiramiento de columna',  duration: '45s',         emoji: '🌿' },
      { name: 'Mariposa sentada',         duration: '60s',         emoji: '🦋' },
      { name: 'Savasana (relajación)',    duration: '2 min',       emoji: '💆' },
    ],
    stats: [
      { emoji: '🌊', label: 'Min Flujo',    key: 'total_time_minutes', format: v => `${v||0}m` },
      { emoji: '🎯', label: 'Control',      key: 'total_sessions',     format: v => v || 0 },
      { emoji: '🌸', label: 'Sesiones',     key: 'total_sessions',     format: v => v || 0 },
    ],
    programs: [
      { id: 'hatha',   name: 'Iniciación Yoga Hatha',      emoji: '🧘', tier: 1, level: 1,   duration: '30 min', desc: 'Posturas básicas para conectar cuerpo y mente',               locked: false, mythic: false },
      { id: 'pilates', name: 'Pilates: Power Core',         emoji: '🌀', tier: 2, level: 15,  duration: '25 min', desc: 'Fortalecimiento profundo del core y control postural',        locked: false, mythic: false },
      { id: 'vinyasa', name: 'Vinyasa Flow Avanzado',       emoji: '🌊', tier: 3, level: 30,  duration: '45 min', desc: 'Secuencia dinámica que une respiración y movimiento fluido',  locked: false, mythic: false },
      { id: 'contors', name: 'Flexibilidad Contorsionista', emoji: '🤸', tier: 4, level: 50,  duration: '35 min', desc: 'Apertura profunda de cadenas musculares. Nivel avanzado',     locked: false, mythic: false },
      { id: 'monk',    name: 'El Desafío del Monje',        emoji: '⛩️', tier: 5, level: 100, duration: '∞',      desc: '1 hora de meditación en movimiento. Mente completamente vacía.', locked: true, mythic: true },
    ],
  },
}

// ─── PARSEAR DURACIÓN ────────────────────────────────────────────────────────

function parseDuration(str) {
  if (!str) return 30
  const minMatch = str.match(/(\d+)\s*min/)
  if (minMatch) return parseInt(minMatch[1]) * 60
  const secMatch = str.match(/(\d+)s/)
  if (secMatch) return parseInt(secMatch[1])
  return 30
}

// ─── GUIDED SUPPORT SESSION ───────────────────────────────────────────────────

function GuidedSupportSession({ type, path, onClose, theme }) {
  const items    = type === 'warmup' ? path.warmup : path.stretching
  const title    = type === 'warmup' ? '🔋 Calentamiento' : '🌿 Estiramientos'
  const [phase,  setPhase]  = useState('preview') // 'preview' | 'active' | 'done'
  const [idx,    setIdx]    = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [paused, setPaused] = useState(false)

  const current  = items[idx]
  const duration = parseDuration(current?.duration)
  const progress = items.length > 0 ? (idx / items.length) * 100 : 0
  const circ     = 2 * Math.PI * 48

  // Arrancar cronómetro al entrar en 'active'
  useEffect(() => {
    if (phase !== 'active') return
    setTimeLeft(parseDuration(items[idx]?.duration))
  }, [idx, phase])

  useEffect(() => {
    if (phase !== 'active' || paused || timeLeft <= 0) return
    if (timeLeft === 0) { handleNext(); return }
    const t = setTimeout(() => setTimeLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, paused, timeLeft])

  function handleNext() {
    if (idx < items.length - 1) {
      setIdx(i => i + 1)
    } else {
      setPhase('done')
    }
  }

  function handlePrev() {
    if (idx > 0) setIdx(i => i - 1)
  }

  const pct = duration > 0 ? ((duration - timeLeft) / duration) : 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col"
      style={{ background: theme.bg, zIndex: 9999 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4"
        style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div>
          <p className="font-extrabold text-base" style={{ color: theme.text }}>{title}</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Senda {path.name} · {idx + 1}/{items.length}
          </p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: theme.surface2 }}>
          <X size={16} style={{ color: theme.textMuted }} />
        </button>
      </div>

      {/* Barra progreso global */}
      <div className="h-1" style={{ background: theme.surface2 }}>
        <motion.div className="h-full" animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          style={{ background: path.gradient }} />
      </div>

      {/* FASE PREVIEW */}
      {phase === 'preview' && (
        <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: theme.textMuted }}>
            {items.length} ejercicios · {items.reduce((s, i) => s + parseDuration(i.duration), 0)}s total
          </p>
          <div className="space-y-2 mb-6">
            {items.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${path.accent}15` }}>
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: theme.text }}>{item.name}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: `${path.accent}20`, color: path.accent }}>
                  {item.duration}
                </span>
              </motion.div>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => { setPhase('active'); setIdx(0) }}
            className="w-full py-4 rounded-2xl font-extrabold text-white text-base"
            style={{ background: path.gradient, boxShadow: `0 6px 20px ${path.accent}30` }}>
            ▶ Empezar ahora
          </motion.button>
        </div>
      )}

      {/* FASE ACTIVE */}
      {phase === 'active' && current && (
        <div className="flex-1 flex flex-col items-center justify-between px-4 py-6">

          {/* Miniaturas */}
          <div className="flex gap-2 w-full overflow-x-auto pb-2">
            {items.map((item, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{
                    background: i < idx ? `${path.accent}30` : i === idx ? path.accent : theme.surface2,
                    opacity: i > idx ? 0.4 : 1,
                  }}>
                  {i < idx ? '✓' : item.emoji}
                </div>
                <div className="w-1 h-1 rounded-full"
                  style={{ background: i === idx ? path.accent : 'transparent' }} />
              </div>
            ))}
          </div>

          {/* Ejercicio actual */}
          <div className="flex flex-col items-center text-center">
            <ExerciseAnimation
              exerciseName={current.name}
              size={180}
              accent={path.accent} />
            <motion.h2 key={idx + '_name'}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="font-extrabold text-2xl mb-2" style={{ color: theme.text }}>
              {current.name}
            </motion.h2>
            <p className="text-sm" style={{ color: theme.textMuted }}>{current.duration}</p>
          </div>

          {/* Cronómetro circular */}
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="48" fill="none"
                stroke={theme.surface2} strokeWidth="8" />
              <motion.circle cx="60" cy="60" r="48" fill="none"
                stroke={path.accent} strokeWidth="8"
                strokeDasharray={circ}
                animate={{ strokeDashoffset: circ * (1 - pct) }}
                transition={{ duration: 0.5 }}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-black text-4xl" style={{ color: theme.text }}>{timeLeft}</span>
              <span className="text-xs" style={{ color: theme.textMuted }}>seg</span>
            </div>
          </div>

          {/* Controles */}
          <div className="flex gap-3 w-full">
            <button onClick={handlePrev} disabled={idx === 0}
              className="flex-1 py-3 rounded-2xl font-bold text-sm disabled:opacity-30"
              style={{ background: theme.surface2, color: theme.textMuted }}>
              ← Anterior
            </button>
            <button onClick={() => setPaused(p => !p)}
              className="w-14 rounded-2xl font-bold text-sm"
              style={{ background: `${path.accent}20`, color: path.accent }}>
              {paused ? '▶' : '⏸'}
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white"
              style={{ background: path.gradient }}>
              {idx < items.length - 1 ? 'Siguiente →' : '¡Listo! ✓'}
            </motion.button>
          </div>
        </div>
      )}

      {/* FASE DONE */}
      {phase === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-4">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            style={{ fontSize: 80 }}>🎉</motion.span>
          <h2 className="font-extrabold text-2xl" style={{ color: theme.text }}>
            {type === 'warmup' ? '¡Calentamiento completo!' : '¡Estiramientos completados!'}
          </h2>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            {type === 'warmup'
              ? 'Tu cuerpo está listo. Ahora a por el entrenamiento 💪'
              : 'Recuperación iniciada. Tu cuerpo te lo agradece 🌿'}
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full py-4 rounded-2xl font-extrabold text-white mt-4"
            style={{ background: path.gradient }}>
            Continuar
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

// ─── PROGRAM CARD ─────────────────────────────────────────────────────────────

function ProgramCard({ program, accent, userLevel, theme, onStart }) {
  const isLocked = program.locked || (userLevel || 1) < program.level

  return (
    <motion.div whileTap={!isLocked ? { scale: 0.97 } : {}}
      onClick={() => !isLocked && onStart(program)}
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: program.mythic
          ? 'linear-gradient(135deg, #1F2937, #374151)'
          : isLocked ? theme.surface2 : theme.surface,
        border: `1.5px solid ${program.mythic ? '#F59E0B40' : isLocked ? theme.border : accent + '40'}`,
        cursor: isLocked ? 'default' : 'pointer',
        opacity: isLocked && !program.mythic ? 0.55 : 1,
      }}>

      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: program.mythic ? '#F59E0B15' : isLocked ? theme.surface : `${accent}15` }}>
        {isLocked ? '🔒' : program.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="font-bold text-sm"
            style={{ color: program.mythic ? '#F59E0B' : isLocked ? theme.textMuted : theme.text }}>
            {program.name}
          </p>
          {program.mythic && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: '#F59E0B20', color: '#F59E0B' }}>MÍTICO</span>
          )}
          {!program.mythic && !isLocked && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${accent}20`, color: accent }}>T{program.tier}</span>
          )}
        </div>
        <p className="text-[11px] leading-tight"
          style={{ color: theme.textMuted }}>
          {isLocked && !program.mythic
            ? `🔐 Desbloquea en nivel ${program.level}`
            : program.mythic
              ? `🔐 Requiere nivel ${program.level}`
              : program.desc}
        </p>
        {!isLocked && (
          <p className="text-[10px] mt-1 font-semibold" style={{ color: accent }}>⏱ {program.duration}</p>
        )}
      </div>

      {!isLocked && !program.mythic && (
        <ChevronRight size={16} style={{ color: accent, flexShrink: 0 }} />
      )}
    </motion.div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function WorkoutView() {
  const { theme }         = useTheme()
  const { profile, user } = useStore()
  const { startWorkout, activeWorkout, endWorkout } = useWorkoutStore()
  const [activePath,   setActivePath]   = useState('titan')
  const [stats,        setStats]        = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [supportModal, setSupportModal] = useState(null)

  const path      = PATHS[activePath]
  const userLevel = profile?.level || 1

  useEffect(() => {
    api.workouts.stats().then(setStats).catch(() => {})
  }, [user])

  async function startFreeWorkout() {
    setLoading(true)
    try {
      const defaultPrograms = { titan: 'hyper', warrior: 'circuit', zen: 'hatha' }
      const guided   = getGuidedSession(defaultPrograms[activePath])
      const exercises = guided?.exerciseList || []
      const result   = await api.workouts.start({
        name: guided?.name || `Entreno ${path.name}`,
        exercises: exercises.map(ex => ({ exercise_name: ex.name })),
      })
      startWorkout({
        name:      guided?.name || `Entreno ${path.name}`,
        senda:     activePath,
        exercises: exercises.map((ex, i) => ({
          ...ex,
          backendId: result.exercises?.[i]?.id,
        })),
        sessionId: result.session?.id,
      })
    } catch (err) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function startProgram(program) {
    setLoading(true)
    try {
      const guided   = getGuidedSession(program.id)
      const exercises = guided?.exerciseList || []
      const result   = await api.workouts.start({
        name: program.name,
        exercises: exercises.map(ex => ({ exercise_name: ex.name })),
      })
      startWorkout({
        name:      program.name,
        senda:     activePath,
        exercises: exercises.map((ex, i) => ({
          ...ex,
          backendId: result.exercises?.[i]?.id,
        })),
        sessionId: result.session?.id,
      })
    } catch (err) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  // Si hay sesión activa → modo entrenador
  if (activeWorkout) {
    return <ActiveWorkoutView onFinish={() => endWorkout()} />
  }

  return (
    <div className="page pb-32" style={{ background: theme.bg }}>

      {/* Pandi */}
      <AnimatePresence mode="wait">
        <motion.div key={activePath + '_pandi'}
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <PandiContextualBubble section="workout"
            data={{ hasWorkout: false, streak: profile?.streak || 0 }}
            dismissKey={`pandi_workout_${activePath}`} />
        </motion.div>
      </AnimatePresence>

      {/* Header */}
      <h1 className="text-2xl font-extrabold mb-4" style={{ color: theme.text }}>
        Entreno 💪
      </h1>

      {/* Selector Sendas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.values(PATHS).map(p => {
          const active = activePath === p.id
          return (
            <motion.button key={p.id} whileTap={{ scale: 0.94 }}
              onClick={() => setActivePath(p.id)}
              className="rounded-2xl py-3 px-2 flex flex-col items-center gap-1 transition-all"
              style={{
                background: active ? p.gradient : theme.surface2,
                border:     `2px solid ${active ? p.accent : 'transparent'}`,
                boxShadow:  active ? `0 4px 16px ${p.accent}30` : 'none',
              }}>
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <p className="font-extrabold text-xs"
                style={{ color: active ? '#fff' : theme.textMuted }}>{p.name}</p>
              <p className="text-[9px] text-center leading-tight"
                style={{ color: active ? 'rgba(255,255,255,0.7)' : theme.textLight }}>
                {p.subtitle}
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* Contenido dinámico por senda */}
      <AnimatePresence mode="wait">
        <motion.div key={activePath}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-3">

          {/* Action Card */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={startFreeWorkout} disabled={loading}
            className="w-full rounded-2xl p-4 flex items-center justify-between"
            style={{ background: path.gradient, boxShadow: `0 6px 20px ${path.accent}30` }}>
            <div className="text-left">
              <p className="font-extrabold text-lg text-white">Empezar {path.name}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{path.subtitle}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Play size={22} color="#fff" />
            </div>
          </motion.button>

          {/* Stats Bento */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="grid grid-cols-3">
              {path.stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center py-3 px-1"
                  style={{ borderRight: i < 2 ? `1px solid ${theme.border}` : 'none' }}>
                  <span className="text-lg mb-0.5">{s.emoji}</span>
                  <p className="font-extrabold text-sm" style={{ color: theme.text }}>
                    {stats ? s.format(stats[s.key]) : '–'}
                  </p>
                  <p className="text-[10px] font-medium text-center leading-tight mt-0.5"
                    style={{ color: theme.textMuted }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Support Bar */}
          <div className="grid grid-cols-2 gap-2">
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setSupportModal('warmup')}
              className="rounded-2xl py-3 flex items-center justify-center gap-2"
              style={{ background: `${path.accent}12`, border: `1px solid ${path.accent}30` }}>
              <span style={{ fontSize: 16 }}>🔋</span>
              <p className="text-xs font-bold" style={{ color: theme.text }}>Calentamiento</p>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setSupportModal('stretching')}
              className="rounded-2xl py-3 flex items-center justify-center gap-2"
              style={{ background: `${path.accent}12`, border: `1px solid ${path.accent}30` }}>
              <span style={{ fontSize: 16 }}>🌿</span>
              <p className="text-xs font-bold" style={{ color: theme.text }}>Estiramientos</p>
            </motion.button>
          </div>

          {/* Programas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-wider"
                style={{ color: theme.textMuted }}>Programas · Senda {path.name}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${path.accent}20`, color: path.accent }}>
                Nivel {userLevel}
              </span>
            </div>
            <div className="space-y-2">
              {path.programs.map((program, i) => (
                <motion.div key={program.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}>
                  <ProgramCard
                    program={program} accent={path.accent}
                    userLevel={userLevel} theme={theme}
                    onStart={startProgram} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Generar rutina IA */}
          <motion.div whileTap={{ scale: 0.97 }}
            className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
            style={{ background: `${path.accent}10`, border: `1px dashed ${path.accent}50` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${path.accent}20` }}>
              <Sparkles size={18} style={{ color: path.accent }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: theme.text }}>Generar rutina con IA</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                Personalizada para tu Senda {path.name}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: path.accent }} />
          </motion.div>

        </motion.div>
      </AnimatePresence>

      {/* Guided Support Session */}
      <AnimatePresence>
        {supportModal && (
          <GuidedSupportSession
            type={supportModal}
            path={path}
            theme={theme}
            onClose={() => setSupportModal(null)} />
        )}
      </AnimatePresence>

      <PandiTips section="workout" />
    </div>
  )
}
