import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, ChevronDown, ChevronUp, Trophy, Timer, TrendingUp } from 'lucide-react'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'
import ExerciseSelectorModal from '../ExerciseSelectorModal'
import RestTimer from './RestTimer'
import { ExerciseProgressModal } from './ExerciseProgressChart'
import { SaveRoutineButton } from './FavoriteRoutines'

// ─── PR BANNER ────────────────────────────────────────────────────────────────

function PRBanner() {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="fixed top-20 left-4 right-4 rounded-2xl p-3 flex items-center gap-3 z-50"
      style={{ background: '#EAB308' }}>
      <Trophy size={24} style={{ color: '#713F12' }} />
      <div>
        <p className="font-bold" style={{ color: '#713F12' }}>¡Nuevo récord personal! 🎉</p>
        <p className="text-xs" style={{ color: '#92400E' }}>Has superado tu mejor marca</p>
      </div>
    </motion.div>
  )
}

// ─── EXERCISE BLOCK ───────────────────────────────────────────────────────────

function ExerciseBlock({ workoutExercise, onSetComplete, onShowProgress }) {
  const { theme }  = useTheme()
  const [sets,     setSets]     = useState([])
  const [weight,   setWeight]   = useState('')
  const [reps,     setReps]     = useState('')
  const [expanded, setExpanded] = useState(true)

  const info = workoutExercise.libraryData

  async function logSet(isWarmup = false) {
    if (!weight && !reps) return
    const result = await onSetComplete({
      workout_exercise_id: workoutExercise.id,
      set_number: sets.length + 1,
      weight_kg:  parseFloat(weight) || 0,
      reps:       parseInt(reps)     || 0,
      is_warmup:  isWarmup,
    }, workoutExercise.exercise_name)
    setSets(s => [...s, {
      weight_kg: parseFloat(weight) || 0,
      reps:      parseInt(reps)     || 0,
      is_pr:     result?.is_pr,
      is_warmup: isWarmup,
    }])
    if (!isWarmup) { setWeight(''); setReps('') }
  }

  const workingSets = sets.filter(s => !s.is_warmup)

  return (
    <div className="card mb-3" style={{ border: `1px solid ${theme.border}` }}>
      <div className="flex items-start justify-between mb-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2.5">
          {info?.emoji && (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: theme.surface2 }}>
              {info.emoji}
            </div>
          )}
          <div>
            <p className="font-bold text-sm" style={{ color: theme.text }}>
              {workoutExercise.exercise_name}
            </p>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>
              {info
                ? `${info.sets} series × ${info.reps} · ${info.rest}s descanso`
                : `${workingSets.length} series completadas`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={e => { e.stopPropagation(); onShowProgress(workoutExercise.exercise_name) }}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${theme.primary}15` }}>
            <TrendingUp size={13} style={{ color: theme.primary }} />
          </button>
          {expanded
            ? <ChevronUp size={16} style={{ color: theme.textMuted }} />
            : <ChevronDown size={16} style={{ color: theme.textMuted }} />}
        </div>
      </div>

      {expanded && (
        <>
          {info?.desc && (
            <p className="text-[11px] mb-3 leading-relaxed p-2 rounded-xl"
              style={{ color: theme.textMuted, background: theme.surface2 }}>
              {info.desc}
            </p>
          )}

          {sets.length > 0 && (
            <div className="space-y-1 mb-3">
              {sets.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg"
                  style={{
                    background: s.is_warmup ? theme.surface2 : `${theme.primary}10`,
                    color:      s.is_warmup ? theme.textMuted : theme.text,
                  }}>
                  <span className="text-xs" style={{ color: theme.textMuted }}>
                    {s.is_warmup ? 'C' : i + 1 - sets.filter((x,j) => j<i && x.is_warmup).length}
                  </span>
                  <span>{s.weight_kg} kg × {s.reps}</span>
                  <span>
                    {s.is_pr
                      ? <Trophy size={12} style={{ color: '#EAB308' }} />
                      : <Check size={12} style={{ color: theme.success }} />}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <p className="text-[10px] mb-1" style={{ color: theme.textMuted }}>Peso (kg)</p>
              <input className="input text-center py-2 text-sm" type="number" placeholder="0"
                value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] mb-1" style={{ color: theme.textMuted }}>Reps</p>
              <input className="input text-center py-2 text-sm" type="number" placeholder="0"
                value={reps} onChange={e => setReps(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <button onClick={() => logSet(false)}
                className="w-11 h-10 rounded-xl flex items-center justify-center"
                style={{ background: theme.primary }}>
                <Check size={16} color="#fff" />
              </button>
              <button onClick={() => logSet(true)}
                className="w-11 h-10 rounded-xl flex items-center justify-center text-[9px] font-bold"
                style={{ background: theme.surface2, color: theme.textMuted }}>
                C
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── LIVE WORKOUT SCREEN ──────────────────────────────────────────────────────

export default function LiveWorkoutScreen({ session, onFinish, workoutPath = 'titan' }) {
  const { addXP }   = useStore()
  const { theme }   = useTheme()
  const [exercises,    setExercises]    = useState(Array.isArray(session.exercises) ? session.exercises : [])
  const [elapsed,      setElapsed]      = useState(0)
  const [showRest,     setShowRest]     = useState(false)
  const [restExercise, setRestExercise] = useState(null)
  const [showPR,       setShowPR]       = useState(false)
  const [finishing,    setFinishing]    = useState(false)
  const [showModal,    setShowModal]    = useState(false)
  const [restSeconds,  setRestSeconds]  = useState(90)
  const [progressFor,  setProgressFor]  = useState(null)
  const startTime = useRef(Date.now())

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const formatTime = s =>
    `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  async function handleSetComplete(data, exerciseName) {
    const result = await api.workouts.completeSet(data)
    if (result?.is_pr) {
      setShowPR(true)
      setTimeout(() => setShowPR(false), 3000)
      addXP(75)
    }
    // Descanso según el ejercicio — arranca automáticamente
    const ex = exercises.find(e => e.id === data.workout_exercise_id)
    setRestSeconds(ex?.libraryData?.rest || 90)
    setRestExercise(exerciseName)
    setShowRest(true)
    return result
  }

  async function addExerciseFromLibrary(libraryEx) {
    try {
      const result = await api.workouts.addExercise({
        session_id:    session.session.id,
        exercise_name: libraryEx.name,
        order_index:   exercises.length,
      })
      setExercises(e => [...e, { ...result, libraryData: libraryEx }])
    } catch (err) { alert('Error añadiendo ejercicio: ' + err.message) }
  }

  async function finish() {
    setFinishing(true)
    try {
      await api.workouts.finish({ session_id: session.session.id, duration_seconds: elapsed, notes: '' })
      addXP(50)
      onFinish()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setFinishing(false) }
  }

  const isEmpty = exercises.length === 0

  return (
    <div className="min-h-screen pb-32" style={{ background: theme.bg }}>

      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3"
        style={{ background: `${theme.bg}f5`, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold" style={{ color: theme.text }}>{session.session?.name}</p>
            <div className="flex items-center gap-1 text-xs" style={{ color: theme.textMuted }}>
              <Timer size={10} />
              <span>{formatTime(elapsed)}</span>
              <span>· {exercises.length} ejercicios</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEmpty && <SaveRoutineButton exercises={exercises} sessionName={session.session?.name} />}
            <button onClick={finish} disabled={finishing}
              className="text-sm font-bold px-4 py-2 rounded-xl text-white disabled:opacity-50"
              style={{ background: theme.success }}>
              {finishing ? 'Guardando…' : 'Terminar'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* Estado vacío — animar a añadir */}
        {isEmpty && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-10 mb-4 rounded-2xl"
            style={{ background: theme.surface2 }}>
            <p className="text-3xl mb-3">💪</p>
            <p className="font-bold text-sm mb-1" style={{ color: theme.text }}>
              ¡Empieza tu sesión!
            </p>
            <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
              Añade ejercicios de la biblioteca para empezar
            </p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
              className="px-6 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, #FF8FA3)` }}>
              + Añadir primer ejercicio
            </motion.button>
          </motion.div>
        )}

        {/* Ejercicios */}
        {exercises.map(ex => (
          <ExerciseBlock key={ex.id} workoutExercise={ex} onSetComplete={handleSetComplete}
            onShowProgress={setProgressFor} />
        ))}

        {/* Botón añadir más */}
        {!isEmpty && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 transition-all"
            style={{ border: `2px dashed ${theme.border}`, color: theme.textMuted }}>
            <Plus size={16} /> Añadir ejercicio de la biblioteca
          </motion.button>
        )}
      </div>

      {/* Modal selector */}
      <ExerciseSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentPath={workoutPath}
        onSelectExercise={addExerciseFromLibrary} />

      <AnimatePresence>{showPR && <PRBanner />}</AnimatePresence>

      {showRest && (
        <RestTimer seconds={restSeconds} exerciseName={restExercise}
          onDone={() => setShowRest(false)} />
      )}

      <AnimatePresence>
        {progressFor && (
          <ExerciseProgressModal exerciseName={progressFor} onClose={() => setProgressFor(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
