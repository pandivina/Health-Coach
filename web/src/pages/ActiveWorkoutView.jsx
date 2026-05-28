import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Plus, Trophy } from 'lucide-react'
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

// ─── CRONÓMETRO DE DESCANSO AUTOMÁTICO ────────────────────────────────────────
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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md"
      style={{ background: 'rgba(15, 12, 27, 0.96)' }}>

      <p className="text-white/40 text-xs mb-2 font-black uppercase tracking-widest animate-pulse">
        ⏳ Recuperación Mitológica
      </p>
      
      <div className="relative w-44 h-44 mb-8">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
          <motion.circle cx="60" cy="60" r="52" fill="none" stroke={accent} strokeWidth="6"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
            transition={{ duration: 0.4 }}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-black text-white tracking-tighter">{left}</span>
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">segundos</span>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.95 }} onClick={onDone}
        className="px-6 py-3 rounded-xl font-extrabold text-white text-xs uppercase tracking-wider transition-colors"
        style={{ background: accent + '15', border: `1px solid ${accent}40` }}>
        Saltar Descanso →
      </motion.button>
    </motion.div>
  )
}

// ─── DOTS DE PROGRESO DE LA TARJETA CENTRAL ───────────────────────────────────
function SetDots({ total, current, completedCount, accent }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = i < completedCount
        const isCurrent = i + 1 === current

        return (
          <motion.div key={i}
            animate={{ scale: isCurrent ? 1.25 : 1 }}
            className="rounded-full"
            style={{
              width:      isCurrent ? 20 : 10,
              height:     6,
              background: isCompleted ? '#10B981' : isCurrent ? accent : 'rgba(255,255,255,0.12)',
              borderRadius: '4px'
            }} />
        )
      })}
    </div>
  )
}

// ─── VISTA PRINCIPAL TOTALMENTE INTERCONECTADA ───────────────────────────────
export default function ActiveWorkoutView({ onFinish }) {
  const { theme } = useTheme()
  const { addXP } = useStore()
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

  // Cronómetro global del tiempo transcurrido
  useEffect(() => {
    const t = setInterval(() => {
      updateElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  if (!activeWorkout) return null

  const sStyle      = PATH_STYLE[activeWorkout.senda] || PATH_STYLE.titan
  const exercises   = activeWorkout.exercises
  const exIndex     = activeWorkout.currentExerciseIndex
  const current     = exercises[exIndex]
  
  // Variables calculadas en base a las colecciones reales de Zustand
  const completedSetsCount = current?.completedSetsList?.length || 0
  const setIndex           = activeWorkout.currentSetIndex
  const totalSets          = current?.sets || 3
  const restSecs           = current?.rest ?? (activeWorkout.senda === 'zen' ? 45 : activeWorkout.senda === 'warrior' ? 60 : 90)
  
  const isLastExercise     = exIndex >= exercises.length - 1
  const elapsed            = activeWorkout.elapsed || 0

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  // Ejecución al acabar el temporizador de descanso
  function handleRestFinished() {
    setShowRest(false)
    // Si ya completamos todas las series requeridas de este ejercicio, saltamos al siguiente automáticamente
    if (completedSetsCount >= totalSets && !isLastExercise) {
      advanceExercise()
    }
  }

  async function handleCheck() {
    if (!peso || !reps) return
    
    const finalPeso = parseFloat(peso) || 0
    const finalReps = parseInt(reps) || 0

    // 1. Guardar localmente de inmediato en Zustand para alimentar al Coach IA
    logSerie({ exerciseId: current.id, peso: finalPeso, reps: finalReps })

    // 2. Enviar datos al Backend de forma asíncrona (background)
    try {
      const result = await api.workouts.completeSet({
        workout_exercise_id: current.backendId || current.id,
        set_number: completedSetsCount + 1, 
        weight_kg:  finalPeso,
        reps:       finalReps,
        is_warmup:  false,
      })
      if (result?.is_pr) { 
        setShowPR(true)
        setTimeout(() => setShowPR(false), 2500) 
      }
    } catch (e) {
      console.error("Error guardando set en backend:", e)
    }

    // Limpiar campos de texto para la siguiente iteración
    setPeso(''); setReps('')

    // 3. Evaluar navegación automática y disparadores de descanso
    if (completedSetsCount + 1 < totalSets) {
      // Quedan más series de este mismo ejercicio -> Arranca descanso obligatorio
      setShowRest(true)
    } else {
      // Era la última serie de este ejercicio
      if (!isLastExercise) {
        // No es el último ejercicio global -> Descanso y al cerrar pasa al siguiente ejercicio
        setShowRest(true)
      } else {
        // Es el último set del ÚLTIMO ejercicio de la rutina entera -> Finalización fluida
        alert("¡Has terminado todas las sendas rúnicas de hoy! Pulsa 'Terminar' arriba para consolidar tus puntos de experiencia.")
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
    } catch (err) { 
      alert('Error al consolidar entreno: ' + err.message) 
    } finally { 
      setFinishing(false) 
    }
  }

  async function addExerciseFromLibrary(ex) {
    try {
      const result = await api.workouts.addExercise({
        session_id:    activeWorkout.sessionId,
        exercise_name: ex.name,
        order_index:   exercises.length,
      })
      
      // Estructuramos el nuevo ejercicio respetando la propiedad 'completedSetsList'
      const preparedNewExercise = {
        ...ex,
        backendId: result?.id,
        sets: ex.sets || 3,
        completedSetsList: []
      }

      useWorkoutStore.setState(s => ({
        activeWorkout: {
          ...s.activeWorkout,
          exercises: [...s.activeWorkout.exercises, preparedNewExercise],
        }
      }))
    } catch {}
    setShowModal(false)
  }

  return (
    <div className="min-h-screen flex flex-col select-none" style={{ background: theme.bg }}>

      {/* ─── HEADER SUPERIOR ─── */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div>
          <p className="font-black text-sm tracking-tight" style={{ color: theme.text }}>
            {activeWorkout.name}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: theme.textMuted }}>
            <span style={{ color: sStyle.accent }}>{sStyle.label}</span>
            <span>·</span>
            <span>⏱ {formatTime(elapsed)}</span>
            <span>·</span>
            <span className="text-white/60">{exIndex + 1}/{exercises.length} Ejercicios</span>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleFinish} disabled={finishing}
          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white disabled:opacity-50 transition-all shadow-md"
          style={{ background: theme.success || '#10B981' }}>
          {finishing ? '…' : 'Terminar'}
        </motion.button>
      </div>

      {/* ─── MINIATURAS ESTILO STORIES (PROGRESO GLOBAL) ─── */}
      <div className="flex gap-2.5 px-4 py-3 overflow-x-auto border-b border-white/[0.03] no-scrollbar">
        {exercises.map((ex, i) => {
          const isSelected = i === exIndex
          const setsHechos = ex.completedSetsList?.length || 0
          const esTotalmenteCompletado = setsHechos >= (ex.sets || 3)
          
          return (
            <motion.button 
              key={i} 
              whileTap={{ scale: 0.93 }}
              onClick={() => goToExercise(i)}
              className="flex-shrink-0 flex flex-col items-center p-2 rounded-2xl min-w-[72px] transition-all border"
              style={{
                background: isSelected ? `${sStyle.accent}15` : esTotalmenteCompletado ? 'rgba(16, 185, 129, 0.04)' : theme.surface,
                borderColor: isSelected ? sStyle.accent : esTotalmenteCompletado ? 'rgba(16, 185, 129, 0.3)' : theme.border,
                opacity: esTotalmenteCompletado && !isSelected ? 0.5 : 1
              }}
            >
              <span className="text-xl mb-0.5">{ex.emoji || '💪'}</span>
              <p className="text-[9px] font-black tracking-tight text-center max-w-[56px] truncate"
                style={{ color: isSelected ? sStyle.accent : theme.textMuted }}>
                {ex.name}
              </p>
              
              {/* Dots minúsculos de series completadas debajo de cada burbuja */}
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: ex.sets || 3 }).map((_, sIdx) => (
                  <div 
                    key={sIdx} 
                    className="w-1 h-1 rounded-full" 
                    style={{ background: sIdx < setsHechos ? '#10B981' : 'rgba(255,255,255,0.15)' }} 
                  />
                ))}
              </div>
            </motion.button>
          )
        })}
        
        {/* Botón rápido Añadir */}
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowModal(true)}
          className="flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl min-w-[72px]"
          style={{ background: theme.surface2, border: `1.5px dashed ${theme.border}` }}>
          <Plus size={16} style={{ color: theme.textMuted }} />
          <p className="text-[9px] font-black uppercase mt-0.5 tracking-wider" style={{ color: theme.textMuted }}>Añadir</p>
        </motion.button>
      </div>

      {/* ─── CENTRAL: MODO ENFOQUE SECUENCIAL ─── */}
      <div className="flex-1 flex flex-col justify-center px-4 py-4 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div 
              key={current.id + exIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22 }}
              className="w-full flex flex-col"
            >
              {/* Tarjeta Gigante */}
              <div className="rounded-[2.5rem] p-6 mb-4 flex flex-col items-center text-center shadow-xl border"
                style={{ background: theme.surface, borderColor: theme.border }}>
                
                <span className="text-6xl mb-4 p-4 bg-white/[0.02] rounded-3xl border border-white/[0.03]">
                  {current.emoji || '💪'}
                </span>
                
                <h2 className="font-black text-xl mb-1 tracking-tight" style={{ color: theme.text }}>
                  {current.name}
                </h2>
                
                <p className="text-[10px] font-black uppercase tracking-wider mb-3 text-purple-400">
                  {current.category} · {current.equipment || 'Manejo Libre'}
                </p>
                
                {current.desc && (
                  <p className="text-xs leading-relaxed px-2 text-gray-400"
                    style={{ color: theme.textMuted }}>
                    {current.desc}
                  </p>
                )}
              </div>

              {/* Título de estado de series e indicadores */}
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: theme.textMuted }}>
                  Serie {Math.min(completedSetsCount + 1, totalSets)} de {totalSets}
                </p>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide"
                  style={{ background: sStyle.accent + '15', color: sStyle.accent }}>
                  Objetivo: {current.reps} Reps
                </span>
              </div>

              {/* Dots horizontales */}
              <div className="mb-5">
                <SetDots 
                  total={totalSets} 
                  current={Math.min(completedSetsCount + 1, totalSets)} 
                  completedCount={completedSetsCount} 
                  accent={sStyle.accent} 
                />
              </div>

              {/* Inputs Formulario */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-wider mb-1 text-center" style={{ color: theme.textMuted }}>
                    Peso (kg)
                  </p>
                  <input type="number" placeholder="0" value={peso} inputMode="decimal"
                    onChange={e => setPeso(e.target.value)}
                    className="w-full rounded-2xl text-center text-2xl font-black py-3.5 outline-none transition-all"
                    style={{
                      background: theme.surface2,
                      color:      theme.text,
                      border:     `2px solid ${peso ? sStyle.accent + '50' : theme.border}`,
                    }} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-wider mb-1 text-center" style={{ color: theme.textMuted }}>
                    Reps
                  </p>
                  <input type="number" placeholder="0" value={reps} inputMode="numeric"
                    onChange={e => setReps(e.target.value)}
                    className="w-full rounded-2xl text-center text-2xl font-black py-3.5 outline-none transition-all"
                    style={{
                      background: theme.surface2,
                      color:      theme.text,
                      border:     `2px solid ${reps ? sStyle.accent + '50' : theme.border}`,
                    }} />
                </div>
              </div>

              {/* Botón Check Verde */}
              <motion.button 
                whileTap={{ scale: 0.97 }} 
                onClick={handleCheck}
                disabled={!peso || !reps}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white disabled:opacity-20 flex items-center justify-center gap-2 transition-all shadow-lg"
                style={{ 
                  background: peso && reps ? 'linear-gradient(135deg, #10B981, #059669)' : sStyle.gradient,
                  boxShadow: peso && reps ? '0 4px 15px rgba(16, 185, 129, 0.2)' : `0 4px 15px ${sStyle.accent}20`
                }}
              >
                <Check size={16} />
                {completedSetsCount + 1 < totalSets 
                  ? `Registrar Serie ${completedSetsCount + 1}` 
                  : isLastExercise ? 'Consolidar Último Ejercicio ✓' : 'Siguiente Ejercicio →'}
              </motion.button>

              {/* Flechas de emergencia / Salto Manual */}
              <div className="flex items-center justify-between mt-4">
                <button onClick={() => exIndex > 0 && goToExercise(exIndex - 1)}
                  disabled={exIndex === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-20"
                  style={{ color: theme.textMuted, background: theme.surface2 }}>
                  <ChevronLeft size={12} /> Ant
                </button>
                <p className="text-xs font-bold" style={{ color: theme.textLight }}>
                  {exIndex + 1} de {exercises.length}
                </p>
                <button onClick={() => !isLastExercise && advanceExercise()}
                  disabled={isLastExercise}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-20"
                  style={{ color: theme.textMuted, background: theme.surface2 }}>
                  Sig <ChevronRight size={12} />
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── CAPA DE DESCANSO COBERTURA COMPLETA ─── */}
      <AnimatePresence>
        {showRest && (
          <RestCountdown
            seconds={restSecs}
            accent={sStyle.accent}
            onDone={handleRestFinished} />
        )}
      </AnimatePresence>

      {/* ─── BANNER RÉCORD PERSONAL (PR) ─── */}
      <AnimatePresence>
        {showPR && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 left-4 right-4 rounded-2xl p-3.5 flex items-center gap-3 z-50 shadow-xl border border-yellow-500/20"
            style={{ background: '#EAB308' }}>
            <Trophy size={20} style={{ color: '#713F12' }} />
            <p className="font-black text-xs uppercase tracking-wide" style={{ color: '#713F12' }}>
              ¡Récord Personal detectado por el Templo! 🎉
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL BIBLIOTECA SELECTOR ─── */}
      <ExerciseSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentPath={activeWorkout.senda}
        onSelectExercise={addExerciseFromLibrary} />
    </div>
  )
}
