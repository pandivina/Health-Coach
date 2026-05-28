import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Plus, Trophy, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeProvider'
import { useStore } from '../store/useStore'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { api } from '../lib/api'
import ExerciseSelectorModal from '../components/ExerciseSelectorModal'

// ─── COLORES POR SENDA ────────────────────────────────────────────────────────
const PATH_STYLE = {
  titan:   { gradient: 'linear-gradient(135deg, #1F2937, #F97316)', accent: '#F97316', label: '🦍 Titán'   },
  warrior: { gradient: 'linear-gradient(135deg, #0EA5E9, #2EC4B6)', accent: '#0EA5E9', label: '⚡ Guerrero' },
  zen:     { gradient: 'linear-gradient(135deg, #6EE7B7, #818CF8)', accent: '#6EE7B7', label: '🧘 Zen'      },
}

// ─── CRONÓMETRO DE DESCANSO ───────────────────────────────────────────────────
function RestCountdown({ seconds, onDone, accent }) {
  const [left, setLeft] = useState(seconds)
  const pct = ((seconds - left) / seconds) * 100
  const circ = 2 * Math.PI * 52

  useEffect(() => {
    if (left <= 0) { onDone(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}>

      <p className="text-white/60 text-sm mb-6 font-semibold tracking-wider uppercase">
        Descansando
      </p>

      <div className="relative w-40 h-40 mb-6">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <motion.circle cx="60" cy="60" r="52" fill="none" stroke={accent} strokeWidth="8"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
            transition={{ duration: 0.5 }}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white">{left}</span>
          <span className="text-white/40 text-xs">seg</span>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.95 }} onClick={onDone}
        className="px-8 py-3 rounded-2xl font-bold text-white text-sm"
        style={{ background: accent + '30', border: `1px solid ${accent}60` }}>
        Saltar descanso →
      </motion.button>
    </motion.div>
  )
}

// ─── INDICADOR DE SERIE ───────────────────────────────────────────────────────
function SetDots({ total, current, accent }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <motion.div key={i}
          animate={{ scale: i + 1 === current ? 1.3 : 1 }}
          className="rounded-full"
          style={{
            width:      i + 1 < current ? 10 : i + 1 === current ? 14 : 10,
            height:     i + 1 < current ? 10 : i + 1 === current ? 14 : 10,
            background: i + 1 < current ? accent : i + 1 === current ? accent : 'rgba(255,255,255,0.15)',
            opacity:    i + 1 < current ? 0.5 : 1,
          }} />
      ))}
    </div>
  )
}

// ─── VISTA PRINCIPAL ──────────────────────────────────────────────────────────
export default function ActiveWorkoutView({ onFinish }) {
  const { theme }    = useTheme()
  const { addXP }    = useStore()
  const {
    activeWorkout, logSerie, advanceExercise,
    goToExercise, endWorkout, updateElapsed,
  } = useWorkoutStore()

  const [peso,        setPeso]        = useState('')
  const [reps,        setReps]        = useState('')
  const [showRest,    setShowRest]    = useState(false)
  const [showModal,   setShowModal]   = useState(false)
  const [showPR,      setShowPR]      = useState(false)
  const [finishing,   setFinishing]   = useState(false)
  const startRef = useRef(Date.now())

  // Cronómetro global
  useEffect(() => {
    const t = setInterval(() => {
      updateElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  if (!activeWorkout) return null

  const sStyle   = PATH_STYLE[activeWorkout.senda] || PATH_STYLE.titan
  const exercises = activeWorkout.exercises
  const exIndex  = activeWorkout.currentExerciseIndex
  const current  = exercises[exIndex]
  const setIndex = activeWorkout.currentSetIndex
  const totalSets = current?.sets || 3
  const restSecs  = current?.rest ?? (activeWorkout.senda === 'zen' ? 20 : activeWorkout.senda === 'warrior' ? 15 : 90)

  const isLastSet      = setIndex > totalSets
  const isLastExercise = exIndex >= exercises.length - 1
  const elapsed        = activeWorkout.elapsed || 0

  function formatTime(s) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  async function handleCheck() {
    if (!peso && !reps) return
    // Registrar serie en el store
    logSerie({ exerciseId: current.id, peso: parseFloat(peso) || 0, reps: parseInt(reps) || 0 })

    // Registrar en backend
    try {
      const result = await api.workouts.completeSet({
        workout_exercise_id: current.backendId || current.id,
        set_number: setIndex,
        weight_kg:  parseFloat(peso) || 0,
        reps:       parseInt(reps) || 0,
        is_warmup:  false,
      })
      if (result?.is_pr) { setShowPR(true); setTimeout(() => setShowPR(false), 2500) }
    } catch {}

    setPeso(''); setReps('')

    // Si quedan más series → descanso
    if (setIndex < totalSets) {
      setShowRest(true)
    } else {
      // Última serie del ejercicio → avanzar al siguiente
      if (!isLastExercise) {
        setTimeout(() => { advanceExercise(); setShowRest(false) }, 300)
      }
    }
  }

  async function handleFinish() {
    setFinishing(true)
    try {
      await api.workouts.finish({
        session_id:       activeWorkout.sessionId,
        duration_seconds: elapsed,
        notes:            '',
      })
      addXP(50)
      endWorkout()
      onFinish?.()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setFinishing(false) }
  }

  async function addExerciseFromLibrary(ex) {
    try {
      const result = await api.workouts.addExercise({
        session_id:    activeWorkout.sessionId,
        exercise_name: ex.name,
        order_index:   exercises.length,
      })
      useWorkoutStore.setState(s => ({
        activeWorkout: {
          ...s.activeWorkout,
          exercises: [...s.activeWorkout.exercises, { ...ex, backendId: result?.id }],
        }
      }))
    } catch {}
    setShowModal(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bg }}>

      {/* ── HEADER ── */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div>
          <p className="font-extrabold text-sm" style={{ color: theme.text }}>
            {activeWorkout.name}
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
            <span style={{ color: sStyle.accent }}>{sStyle.label}</span>
            <span>·</span>
            <span>⏱ {formatTime(elapsed)}</span>
            <span>·</span>
            <span>{exIndex + 1}/{exercises.length}</span>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleFinish} disabled={finishing}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: theme.success }}>
          {finishing ? '…' : 'Terminar'}
        </motion.button>
      </div>

      {/* ── MINIATURAS EJERCICIOS ── */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto">
        {exercises.map((ex, i) => {
          const done = i < exIndex
          const active = i === exIndex
          return (
            <motion.button key={i} whileTap={{ scale: 0.93 }}
              onClick={() => goToExercise(i)}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
              style={{
                background: active ? sStyle.accent + '25' : done ? theme.surface2 : theme.surface,
                border: `1.5px solid ${active ? sStyle.accent : 'transparent'}`,
                opacity: done ? 0.5 : 1,
              }}>
              <span style={{ fontSize: 18 }}>{ex.emoji || '💪'}</span>
              <p className="text-[9px] font-semibold text-center max-w-[48px] leading-tight truncate"
                style={{ color: active ? sStyle.accent : theme.textMuted }}>
                {ex.name.split(' ')[0]}
              </p>
              {done && <span style={{ fontSize: 8, color: theme.success }}>✓</span>}
            </motion.button>
          )
        })}
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowModal(true)}
          className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
          style={{ background: theme.surface2, border: `1.5px dashed ${theme.border}` }}>
          <Plus size={18} style={{ color: theme.textMuted }} />
          <p className="text-[9px] font-semibold" style={{ color: theme.textMuted }}>Añadir</p>
        </motion.button>
      </div>

      {/* ── EJERCICIO ACTUAL ── */}
      <div className="flex-1 flex flex-col px-4 py-2">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div key={current.id + exIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col">

              {/* Tarjeta ejercicio */}
              <div className="rounded-3xl p-5 mb-4 flex flex-col items-center text-center"
                style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }}>
                  {current.emoji || '💪'}
                </motion.span>
                <h2 className="font-extrabold text-xl mb-1" style={{ color: theme.text }}>
                  {current.name}
                </h2>
                <p className="text-xs mb-3" style={{ color: theme.textMuted }}>
                  {current.category} · {current.equipment}
                </p>
                {current.desc && (
                  <p className="text-xs leading-relaxed px-2"
                    style={{ color: theme.textMuted }}>
                    {current.desc}
                  </p>
                )}
              </div>

              {/* Info series */}
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-bold" style={{ color: theme.textMuted }}>
                  Serie {Math.min(setIndex, totalSets)} de {totalSets}
                </p>
                <p className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: sStyle.accent + '20', color: sStyle.accent }}>
                  {current.reps} reps · {restSecs}s descanso
                </p>
              </div>

              {/* Dots de series */}
              <div className="mb-4">
                <SetDots total={totalSets} current={setIndex} accent={sStyle.accent} />
              </div>

              {/* Input peso + reps */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <p className="text-[10px] font-bold mb-1 text-center" style={{ color: theme.textMuted }}>
                    Peso (kg)
                  </p>
                  <input type="number" placeholder="0" value={peso}
                    onChange={e => setPeso(e.target.value)}
                    className="w-full rounded-2xl text-center text-2xl font-extrabold py-4 outline-none"
                    style={{
                      background: theme.surface2,
                      color:      theme.text,
                      border:     `2px solid ${peso ? sStyle.accent + '60' : theme.border}`,
                    }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold mb-1 text-center" style={{ color: theme.textMuted }}>
                    Reps
                  </p>
                  <input type="number" placeholder="0" value={reps}
                    onChange={e => setReps(e.target.value)}
                    className="w-full rounded-2xl text-center text-2xl font-extrabold py-4 outline-none"
                    style={{
                      background: theme.surface2,
                      color:      theme.text,
                      border:     `2px solid ${reps ? sStyle.accent + '60' : theme.border}`,
                    }} />
                </div>
              </div>

              {/* Botón check */}
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleCheck}
                disabled={!peso && !reps}
                className="w-full py-4 rounded-2xl font-extrabold text-white text-base disabled:opacity-30 flex items-center justify-center gap-2"
                style={{ background: sStyle.gradient, boxShadow: `0 6px 20px ${sStyle.accent}30` }}>
                <Check size={20} />
                {setIndex < totalSets ? `Serie ${setIndex} completada` : isLastExercise ? 'Último ejercicio ✓' : 'Siguiente ejercicio →'}
              </motion.button>

              {/* Navegación */}
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => exIndex > 0 && goToExercise(exIndex - 1)}
                  disabled={exIndex === 0}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-30"
                  style={{ color: theme.textMuted, background: theme.surface2 }}>
                  <ChevronLeft size={14} /> Anterior
                </button>
                <p className="text-xs" style={{ color: theme.textLight }}>
                  {exIndex + 1} / {exercises.length}
                </p>
                <button onClick={() => !isLastExercise && advanceExercise()}
                  disabled={isLastExercise}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-30"
                  style={{ color: theme.textMuted, background: theme.surface2 }}>
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── DESCANSO ── */}
      <AnimatePresence>
        {showRest && (
          <RestCountdown
            seconds={restSecs}
            accent={sStyle.accent}
            onDone={() => setShowRest(false)} />
        )}
      </AnimatePresence>

      {/* ── PR Banner ── */}
      <AnimatePresence>
        {showPR && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 left-4 right-4 rounded-2xl p-3 flex items-center gap-3 z-50"
            style={{ background: '#EAB308' }}>
            <Trophy size={22} style={{ color: '#713F12' }} />
            <p className="font-bold text-sm" style={{ color: '#713F12' }}>¡Nuevo récord personal! 🎉</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal añadir ejercicio ── */}
      <ExerciseSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentPath={activeWorkout.senda}
        onSelectExercise={addExerciseFromLibrary} />
    </div>
  )
}
