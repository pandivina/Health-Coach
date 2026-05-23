import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, ChevronDown, ChevronUp, Trophy, Timer } from 'lucide-react'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'
import { useTheme } from '../../contexts/ThemeProvider'

// ─── REST TIMER ───────────────────────────────────────────────

function RestTimer({ seconds, onDone }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) { onDone(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  const pct = ((seconds - left) / seconds) * 100

  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#6366F1" strokeWidth="8"
              strokeDasharray={2*Math.PI*40}
              strokeDashoffset={2*Math.PI*40*(1-pct/100)} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{left}</span>
          </div>
        </div>
        <p className="text-white/60 mb-4">Descansando…</p>
        <button onClick={onDone}
          className="px-6 py-2 text-sm font-semibold rounded-xl text-white"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          Saltar
        </button>
      </div>
    </motion.div>
  )
}

// ─── PR BANNER ────────────────────────────────────────────────

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

// ─── EXERCISE BLOCK ───────────────────────────────────────────

function ExerciseBlock({ workoutExercise, onSetComplete }) {
  const { theme }    = useTheme()
  const [sets,       setSets]     = useState([])
  const [weight,     setWeight]   = useState('')
  const [reps,       setReps]     = useState('')
  const [expanded,   setExpanded] = useState(true)

  async function logSet(isWarmup = false) {
    if (!weight && !reps) return
    const result = await onSetComplete({
      workout_exercise_id: workoutExercise.id,
      set_number: sets.length + 1,
      weight_kg:  parseFloat(weight) || 0,
      reps:       parseInt(reps)     || 0,
      is_warmup:  isWarmup,
    })
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
    <div className="card mb-3">
      <div className="flex items-center justify-between mb-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}>
        <div>
          <p className="font-semibold" style={{ color: theme.text }}>
            {workoutExercise.exercise_name}
          </p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {workingSets.length} series completadas
          </p>
        </div>
        {expanded
          ? <ChevronUp size={16} style={{ color: theme.textMuted }} />
          : <ChevronDown size={16} style={{ color: theme.textMuted }} />
        }
      </div>

      {expanded && (
        <>
          {/* Series completadas */}
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
                      : <Check size={12} style={{ color: theme.success }} />
                    }
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Input nueva serie */}
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
                className="w-11 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                style={{ background: theme.primary }}>
                <Check size={16} color="#fff" />
              </button>
              <button onClick={() => logSet(true)}
                className="w-11 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all text-[9px] font-bold"
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

// ─── LIVE WORKOUT SCREEN ──────────────────────────────────────

export default function LiveWorkoutScreen({ session, onFinish }) {
  const { addXP }    = useStore()
  const { theme }    = useTheme()
  const [exercises,       setExercises]       = useState(Array.isArray(session.exercises) ? session.exercises : [])
  const [elapsed,         setElapsed]         = useState(0)
  const [showRest,        setShowRest]        = useState(false)
  const [showPR,          setShowPR]          = useState(false)
  const [finishing,       setFinishing]       = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [searchEx,        setSearchEx]        = useState('')
  const [allExercises,    setAllExercises]    = useState([])
  const startTime = useRef(Date.now())

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    api.workouts.getExercises()
      .then(data => setAllExercises(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const formatTime = (s) =>
    `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  async function handleSetComplete(data) {
    const result = await api.workouts.completeSet(data)
    if (result?.is_pr) {
      setShowPR(true)
      setTimeout(() => setShowPR(false), 3000)
    }
    setShowRest(true)
    return result
  }

  async function addExercise(ex) {
    const result = await api.workouts.addExercise({
      session_id:    session.session.id,
      exercise_name: ex.name,
      exercise_id:   ex.id,
      order_index:   exercises.length,
    })
    setExercises(e => [...e, result])
    setShowAddExercise(false)
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

  const filtered = allExercises.filter(e =>
    e.name.toLowerCase().includes(searchEx.toLowerCase())
  )

  return (
    <div className="min-h-screen pb-32" style={{ background: theme.bg }}>

      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3"
        style={{
          background: `${theme.bg}f5`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.border}`,
        }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold" style={{ color: theme.text }}>
              {session.session?.name}
            </p>
            <div className="flex items-center gap-1 text-xs" style={{ color: theme.textMuted }}>
              <Timer size={10} />
              <span>{formatTime(elapsed)}</span>
              <span>· {exercises.length} ejercicios</span>
            </div>
          </div>
          <button onClick={finish} disabled={finishing}
            className="text-sm font-bold px-4 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-50 text-white"
            style={{ background: theme.success }}>
            {finishing ? 'Guardando…' : 'Terminar'}
          </button>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-4 pt-4">
        {exercises.map(ex => (
          <ExerciseBlock key={ex.id} workoutExercise={ex} onSetComplete={handleSetComplete} />
        ))}

        {/* Añadir ejercicio */}
        {!showAddExercise ? (
          <button onClick={() => setShowAddExercise(true)}
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 transition-all"
            style={{
              border: `2px dashed ${theme.border}`,
              color: theme.textMuted,
            }}>
            <Plus size={16} /> Añadir ejercicio
          </button>
        ) : (
          <div className="card">
            <input className="input mb-3 text-sm" placeholder="Buscar ejercicio…"
              value={searchEx} onChange={e => setSearchEx(e.target.value)} autoFocus />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.slice(0, 20).map(ex => (
                <button key={ex.id} onClick={() => addExercise(ex)}
                  className="w-full text-left px-3 py-2 rounded-xl transition-all"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <p className="text-sm font-medium" style={{ color: theme.text }}>{ex.name}</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    {ex.muscle_group} · {ex.equipment}
                  </p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddExercise(false)}
              className="btn-secondary text-sm py-2 mt-2">
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* PR Banner */}
      <AnimatePresence>{showPR && <PRBanner />}</AnimatePresence>

      {/* Rest Timer */}
      {showRest && <RestTimer seconds={90} onDone={() => setShowRest(false)} />}
    </div>
  )
}
