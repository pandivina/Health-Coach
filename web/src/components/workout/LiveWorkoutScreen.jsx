import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, ChevronDown, ChevronUp, Trophy, Timer } from 'lucide-react'
import { api } from '../../lib/api'
import { useStore } from '../../store/useStore'

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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="8"
              strokeDasharray={2*Math.PI*40} strokeDashoffset={2*Math.PI*40*(1-pct/100)} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{left}</span>
          </div>
        </div>
        <p className="text-white/60 mb-4">Descansando…</p>
        <button onClick={onDone} className="btn-secondary w-auto px-6 py-2 text-sm">Saltar</button>
      </div>
    </motion.div>
  )
}

function PRBanner() {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="fixed top-20 left-4 right-4 bg-yellow-500 rounded-2xl p-3 flex items-center gap-3 z-50">
      <Trophy size={24} className="text-yellow-900" />
      <div>
        <p className="font-bold text-yellow-900">¡Nuevo récord personal! 🎉</p>
        <p className="text-yellow-800 text-xs">Has superado tu mejor marca</p>
      </div>
    </motion.div>
  )
}

function ExerciseBlock({ workoutExercise, onSetComplete }) {
  const [sets, setSets] = useState([])
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [expanded, setExpanded] = useState(true)

  async function logSet(isWarmup = false) {
    if (!weight && !reps) return
    const result = await onSetComplete({
      workout_exercise_id: workoutExercise.id,
      set_number: sets.length + 1,
      weight_kg: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      is_warmup: isWarmup,
    })
    setSets(s => [...s, { weight_kg: parseFloat(weight)||0, reps: parseInt(reps)||0, is_pr: result?.is_pr, is_warmup: isWarmup }])
    if (!isWarmup) {
      setWeight('')
      setReps('')
    }
  }

  const workingSets = sets.filter(s => !s.is_warmup)

  return (
    <div className="card mb-3">
      <div className="flex items-center justify-between mb-3" onClick={() => setExpanded(e => !e)}>
        <div>
          <p className="font-semibold">{workoutExercise.exercise_name}</p>
          <p className="text-white/40 text-xs">{workingSets.length} series completadas</p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
      </div>

      {expanded && (
        <>
          {/* Series completadas */}
          {sets.length > 0 && (
            <div className="space-y-1 mb-3">
              {sets.map((s, i) => (
                <div key={i} className={`flex items-center justify-between text-sm px-3 py-1.5 rounded-lg ${
                  s.is_warmup ? 'bg-surface-3 text-white/40' : 'bg-accent/10'
                }`}>
                  <span className="text-white/50 text-xs">{s.is_warmup ? 'C' : i + 1 - sets.filter((x,j) => j<i && x.is_warmup).length}</span>
                  <span>{s.weight_kg} kg × {s.reps}</span>
                  <span>{s.is_pr ? <Trophy size={12} className="text-yellow-400" /> : <Check size={12} className="text-accent-green" />}</span>
                </div>
              ))}
            </div>
          )}

          {/* Input nueva serie */}
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <p className="text-[10px] text-white/30 mb-1">Peso (kg)</p>
              <input className="input text-center py-2 text-sm" type="number" placeholder="0" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/30 mb-1">Reps</p>
              <input className="input text-center py-2 text-sm" type="number" placeholder="0" value={reps} onChange={e => setReps(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <button onClick={() => logSet(false)}
                className="w-11 h-10 bg-accent rounded-xl flex items-center justify-center active:scale-90 transition-all">
                <Check size={16} className="text-white" />
              </button>
              <button onClick={() => logSet(true)}
                className="w-11 h-10 bg-surface-3 rounded-xl flex items-center justify-center active:scale-90 transition-all text-white/30 text-[9px] font-bold">
                C
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function LiveWorkoutScreen({ session, onFinish }) {
  const { addXP } = useStore()
  const [exercises, setExercises] = useState(Array.isArray(session.exercises) ? session.exercises : [])
  const [elapsed, setElapsed] = useState(0)
  const [showRest, setShowRest] = useState(false)
  const [showPR, setShowPR] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [searchEx, setSearchEx] = useState('')
  const [allExercises, setAllExercises] = useState([])
  const startTime = useRef(Date.now())

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    api.workouts.getExercises().then(setAllExercises).catch(() => {})
  }, [])

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

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
    const result = await api.workouts.addExercise({ session_id: session.session.id, exercise_name: ex.name, exercise_id: ex.id, order_index: exercises.length })
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

  const filtered = allExercises.filter(e => e.name.toLowerCase().includes(searchEx.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#0a0a12] pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a12]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 z-40">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">{session.session?.name}</p>
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Timer size={10} />
              <span>{formatTime(elapsed)}</span>
              <span>· {exercises.length} ejercicios</span>
            </div>
          </div>
          <button onClick={finish} disabled={finishing}
            className="bg-accent-green text-white text-sm font-bold px-4 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-50">
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
            className="w-full border-2 border-dashed border-white/10 rounded-2xl py-4 flex items-center justify-center gap-2 text-white/30 active:border-accent active:text-accent transition-all">
            <Plus size={16} /> Añadir ejercicio
          </button>
        ) : (
          <div className="card">
            <input className="input mb-3 text-sm" placeholder="Buscar ejercicio…" value={searchEx} onChange={e => setSearchEx(e.target.value)} autoFocus />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.slice(0, 20).map(ex => (
                <button key={ex.id} onClick={() => addExercise(ex)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-3 transition-all">
                  <p className="text-sm font-medium">{ex.name}</p>
                  <p className="text-white/30 text-xs">{ex.muscle_group} · {ex.equipment}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddExercise(false)} className="btn-secondary text-sm py-2 mt-2">Cancelar</button>
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
