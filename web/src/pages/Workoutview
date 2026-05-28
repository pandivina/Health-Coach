import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Lock, Flame, Zap, Wind, Clock, TrendingUp, Dumbbell, ChevronRight, Sparkles } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import LiveWorkoutScreen from '../components/workout/LiveWorkoutScreen'
import PandiContextualBubble from '../components/PandiContextualBubble'
import PandiTips from '../components/PandiTips'

// ─── SENDAS DE PODER ─────────────────────────────────────────────────────────

const PATHS = {
  titan: {
    id:       'titan',
    emoji:    '🦍',
    name:     'Titán',
    subtitle: 'Fuerza · Gimnasio · Calistenia',
    pandi:    '¡A machacar hierro! El músculo se forja hoy 💪🔥',
    gradient: 'linear-gradient(135deg, #1F2937, #F97316)',
    gradientSoft: 'linear-gradient(135deg, #F9731610, #1F293710)',
    accent:   '#F97316',
    bg:       '#1F2937',
    stats: [
      { emoji: '📦', label: 'Volumen',   key: 'total_volume_kg', format: v => `${((v||0)/1000).toFixed(1)}t` },
      { emoji: '⚡', label: 'Sesiones',  key: 'total_sessions',  format: v => v || 0 },
      { emoji: '🏆', label: 'Récords',   key: 'prs',             format: v => v || 0 },
    ],
    programs: [
      { id: 'hyper',    name: 'Hipertrofia Básica',     emoji: '💪', tier: 1, level: 1,   duration: '45 min', desc: 'Volumen progresivo para ganar masa muscular',        locked: false },
      { id: 'ppl',      name: 'Push Pull Legs',         emoji: '🔄', tier: 2, level: 15,  duration: '60 min', desc: 'Divide muscular clásico para intermedios',           locked: false },
      { id: 'heavy',    name: 'Heavy Duty',             emoji: '🏋️', tier: 3, level: 30,  duration: '50 min', desc: 'Alta intensidad, bajo volumen. Método Mentzer',      locked: false },
      { id: 'arnold',   name: 'Arnold Split',           emoji: '👑', tier: 4, level: 50,  duration: '75 min', desc: 'El programa del mismísimo Arnold Schwarzenegger',    locked: false },
      { id: 'saitama',  name: 'Reto Saitama',           emoji: '🔒', tier: 5, level: 100, duration: '∞',      desc: '100 flexiones, 100 abdominales, 10km. Cada. Día.',   locked: true  },
    ],
  },
  warrior: {
    id:       'warrior',
    emoji:    '⚡',
    name:     'Guerrero',
    subtitle: 'HIIT · Cardio · Agilidad',
    pandi:    '¡Sin excusas! Tu corazón es tu motor 🔥⚡',
    gradient: 'linear-gradient(135deg, #0EA5E9, #2EC4B6)',
    gradientSoft: 'linear-gradient(135deg, #0EA5E910, #2EC4B610)',
    accent:   '#0EA5E9',
    bg:       '#0C4A6E',
    stats: [
      { emoji: '🔥', label: 'Kcal',        key: 'total_calories',      format: v => v || 0 },
      { emoji: '⏱',  label: 'Tiempo activo', key: 'total_time_minutes', format: v => `${Math.round((v||0)/60)}h` },
      { emoji: '💨', label: 'Sesiones',    key: 'total_sessions',      format: v => v || 0 },
    ],
    programs: [
      { id: 'tabata',   name: 'Tabata Quemagrasa',      emoji: '🔥', tier: 1, level: 1,  duration: '20 min', desc: '20s trabajo / 10s descanso. Quema máxima',           locked: false },
      { id: 'circuit',  name: 'Circuito Metabólico',    emoji: '⚡', tier: 2, level: 10, duration: '35 min', desc: 'Estaciones de fuerza y cardio combinados',           locked: false },
      { id: 'amrap',    name: 'AMRAP Challenge',         emoji: '💥', tier: 3, level: 25, duration: '30 min', desc: 'El mayor número de rondas posible en tiempo fijo',   locked: false },
      { id: 'hiit45',   name: 'HIIT 45 Élite',          emoji: '🏆', tier: 4, level: 40, duration: '45 min', desc: 'Intervalos explosivos de alta intensidad avanzados', locked: false },
      { id: 'naruto',   name: 'Reto Naruto Run',         emoji: '🔒', tier: 5, level: 100,duration: '∞',     desc: '10km sin parar. Con los brazos hacia atrás.',        locked: true  },
    ],
  },
  zen: {
    id:       'zen',
    emoji:    '🧘',
    name:     'Zen',
    subtitle: 'Yoga · Pilates · Flexibilidad',
    pandi:    'Respira hondo... El equilibrio es tu fuerza 🌿✨',
    gradient: 'linear-gradient(135deg, #6EE7B7, #818CF8)',
    gradientSoft: 'linear-gradient(135deg, #6EE7B710, #818CF810)',
    accent:   '#6EE7B7',
    bg:       '#064E3B',
    stats: [
      { emoji: '🌊', label: 'Min Flujo',    key: 'total_time_minutes', format: v => `${v||0}min` },
      { emoji: '🎯', label: 'Control',      key: 'total_sessions',     format: v => v || 0 },
      { emoji: '🌸', label: 'Sesiones',     key: 'total_sessions',     format: v => v || 0 },
    ],
    programs: [
      { id: 'vinyasa',  name: 'Flujo Vinyasa',          emoji: '🌊', tier: 1, level: 1,  duration: '30 min', desc: 'Secuencia dinámica que conecta respiración y movimiento', locked: false },
      { id: 'pilates',  name: 'Core Pilates',            emoji: '🎯', tier: 2, level: 10, duration: '40 min', desc: 'Control postural y fortalecimiento profundo del core',   locked: false },
      { id: 'yin',      name: 'Yoga Yin',                emoji: '🌙', tier: 3, level: 20, duration: '45 min', desc: 'Posturas pasivas de larga duración para soltar tensión', locked: false },
      { id: 'ashtanga', name: 'Ashtanga Avanzado',       emoji: '🌟', tier: 4, level: 40, duration: '75 min', desc: 'La serie primaria completa de Ashtanga Yoga',           locked: false },
      { id: 'monk',     name: 'Desafío del Monje',       emoji: '🔒', tier: 5, level: 100,duration: '∞',     desc: '1 hora de meditación en movimiento. Mente vacía.',      locked: true  },
    ],
  },
}

// ─── PROGRAMA CARD ────────────────────────────────────────────────────────────

function ProgramCard({ program, accent, userLevel, theme, onStart }) {
  const isLocked   = program.locked || (userLevel || 1) < program.level
  const isLegendary = program.tier === 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={!isLocked ? { scale: 0.97 } : {}}
      onClick={() => !isLocked && onStart(program)}
      className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
      style={{
        background:  isLegendary ? 'linear-gradient(135deg, #1F2937, #374151)' : theme.surface,
        border:      `1.5px solid ${isLocked ? theme.border : accent + '40'}`,
        opacity:     isLocked && !isLegendary ? 0.6 : 1,
      }}>

      {/* Emoji / Lock */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: isLegendary ? '#F59E0B20' : `${accent}15` }}>
        {isLocked ? '🔒' : program.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-sm truncate"
            style={{ color: isLegendary ? '#F59E0B' : isLocked ? theme.textMuted : theme.text }}>
            {program.name}
          </p>
          {isLegendary && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: '#F59E0B20', color: '#F59E0B' }}>LEGENDARIO</span>
          )}
          {!isLegendary && !isLocked && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `${accent}20`, color: accent }}>T{program.tier}</span>
          )}
        </div>
        <p className="text-[11px] leading-tight" style={{ color: theme.textMuted }}>
          {isLocked && !isLegendary
            ? `🔐 Desbloquea en nivel ${program.level}`
            : isLegendary
              ? `🔐 Requiere nivel ${program.level}`
              : program.desc}
        </p>
        {!isLocked && (
          <p className="text-[10px] mt-1 font-semibold" style={{ color: accent }}>
            ⏱ {program.duration}
          </p>
        )}
      </div>

      {!isLocked && !isLegendary && (
        <ChevronRight size={16} style={{ color: accent, flexShrink: 0 }} />
      )}
    </motion.div>
  )
}

// ─── MAIN VIEW ────────────────────────────────────────────────────────────────

export default function WorkoutView() {
  const { theme }          = useTheme()
  const { profile, user }  = useStore()
  const [activePath,  setActivePath]  = useState('titan')
  const [stats,       setStats]       = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [loading,     setLoading]     = useState(false)

  const path      = PATHS[activePath]
  const userLevel = profile?.level || 1

  useEffect(() => {
    api.workouts.stats().then(setStats).catch(() => {})
  }, [user])

  async function startFreeWorkout() {
    setLoading(true)
    try {
      const result = await api.workouts.start({
        name: `Entreno ${path.name}`,
        exercises: [],
      })
      setActiveSession(result)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function startProgram(program) {
    setLoading(true)
    try {
      const result = await api.workouts.start({
        name: program.name,
        exercises: [],
      })
      setActiveSession(result)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  if (activeSession) {
    return <LiveWorkoutScreen session={activeSession} onFinish={() => setActiveSession(null)} />
  }

  return (
    <div className="page pb-32" style={{ background: theme.bg }}>

      {/* 1 — Pandi contextual */}
      <motion.div key={activePath + '_pandi'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}>
        <PandiContextualBubble section="workout"
          data={{ hasWorkout: false, streak: profile?.streak || 0 }}
          dismissKey={`pandi_workout_${activePath}`} />
      </motion.div>

      {/* 2 — Header */}
      <h1 className="text-2xl font-extrabold mb-4" style={{ color: theme.text }}>
        Entreno 💪
      </h1>

      {/* 3 — Selector de Sendas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.values(PATHS).map(p => {
          const active = activePath === p.id
          return (
            <motion.button key={p.id} whileTap={{ scale: 0.95 }}
              onClick={() => setActivePath(p.id)}
              className="rounded-2xl py-3 px-2 flex flex-col items-center gap-1 transition-all"
              style={{
                background:  active ? p.gradient : theme.surface2,
                border:      `2px solid ${active ? p.accent : 'transparent'}`,
                boxShadow:   active ? `0 4px 16px ${p.accent}30` : 'none',
              }}>
              <span style={{ fontSize: 24 }}>{p.emoji}</span>
              <p className="font-extrabold text-xs"
                style={{ color: active ? '#fff' : theme.textMuted }}>
                {p.name}
              </p>
              <p className="text-[9px] text-center leading-tight"
                style={{ color: active ? 'rgba(255,255,255,0.75)' : theme.textLight }}>
                {p.subtitle}
              </p>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activePath}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
          className="space-y-3">

          {/* 4 — Action Card */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={startFreeWorkout} disabled={loading}
            className="w-full rounded-2xl p-4 flex items-center justify-between"
            style={{ background: path.gradient, boxShadow: `0 6px 20px ${path.accent}30` }}>
            <div className="text-left">
              <p className="font-extrabold text-lg text-white">
                Empezar {path.name}
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {path.subtitle}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Play size={22} color="#fff" />
            </div>
          </motion.button>

          {/* 5 — Stats Bento */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="grid grid-cols-3 divide-x" style={{ borderColor: theme.border }}>
              {path.stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center py-3 px-1"
                  style={{ borderColor: theme.border }}>
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

          {/* 6 — Support Bar */}
          <div className="grid grid-cols-2 gap-2">
            <motion.button whileTap={{ scale: 0.95 }}
              className="rounded-2xl py-3 flex items-center justify-center gap-2"
              style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: 16 }}>🔋</span>
              <p className="text-xs font-bold" style={{ color: theme.text }}>
                Calentamiento
              </p>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              className="rounded-2xl py-3 flex items-center justify-center gap-2"
              style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: 16 }}>🌿</span>
              <p className="text-xs font-bold" style={{ color: theme.text }}>
                Estiramientos
              </p>
            </motion.button>
          </div>

          {/* 7 — Programas y Retos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-wider"
                style={{ color: theme.textMuted }}>
                Programas · Senda {path.name}
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${path.accent}20`, color: path.accent }}>
                Nivel {userLevel}
              </span>
            </div>
            <div className="space-y-2">
              {path.programs.map((program, i) => (
                <motion.div key={program.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}>
                  <ProgramCard
                    program={program}
                    accent={path.accent}
                    userLevel={userLevel}
                    theme={theme}
                    onStart={startProgram}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Botón generar rutina IA */}
          <motion.div whileTap={{ scale: 0.97 }}
            className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
            style={{ background: `${path.accent}10`, border: `1px dashed ${path.accent}50` }}
            onClick={() => {}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${path.accent}20` }}>
              <Sparkles size={18} style={{ color: path.accent }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: theme.text }}>
                Generar rutina con IA
              </p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                Personalizada para tu Senda {path.name}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: path.accent }} />
          </motion.div>

        </motion.div>
      </AnimatePresence>

      <PandiTips section="workout" />
    </div>
  )
}
