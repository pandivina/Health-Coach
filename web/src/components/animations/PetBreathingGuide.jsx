import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeProvider'
import { useTourContext } from '../../contexts/GuidedTourProvider'
import FrameAnimator, { generateFrames, PET_ANIMATIONS } from './FrameAnimator'

const PET_EMOJI = { panda:'🐼', cat:'🐱', dog:'🐶', fox:'🦊', rabbit:'🐰' }

const BREATHING_PROGRAMS = [
  {
    id: 'box',
    name: 'Respiración cuadrada',
    desc: 'Técnica 4-4-4-4 para reducir el estrés',
    phases: [
      { label: 'Inhala', duration: 4, instruction: 'Respira lento y profundo', color: '#2EC4B6' },
      { label: 'Mantén', duration: 4, instruction: 'Retén el aire suavemente',  color: '#6366f1' },
      { label: 'Exhala', duration: 4, instruction: 'Suelta el aire poco a poco', color: '#FF8FA3' },
      { label: 'Mantén', duration: 4, instruction: 'Pausa antes de inhalar',    color: '#F59E0B' },
    ],
  },
  {
    id: '478',
    name: 'Técnica 4-7-8',
    desc: 'Reduce la ansiedad rápidamente',
    phases: [
      { label: 'Inhala',  duration: 4, instruction: 'Inhala por la nariz',       color: '#2EC4B6' },
      { label: 'Mantén',  duration: 7, instruction: 'Retén la respiración',      color: '#6366f1' },
      { label: 'Exhala',  duration: 8, instruction: 'Exhala por la boca',        color: '#FF8FA3' },
    ],
  },
  {
    id: 'calm',
    name: 'Respiración calmante',
    desc: 'Activa el sistema nervioso parasimpático',
    phases: [
      { label: 'Inhala', duration: 5, instruction: 'Infla el abdomen',     color: '#2EC4B6' },
      { label: 'Exhala', duration: 7, instruction: 'Vacía el abdomen',     color: '#FF8FA3' },
    ],
  },
]

export default function PetBreathingGuide({ onClose }) {
  const { theme } = useTheme()
  const { userInfo } = useTourContext()
  const petType  = userInfo?.petType  || 'panda'
  const petName  = userInfo?.petName  || 'Pandi'
  const petEmoji = PET_EMOJI[petType] || '🐼'

  const [program, setProgram]     = useState(null)
  const [phase, setPhase]         = useState(0)
  const [progress, setProgress]   = useState(0)
  const [cycles, setCycles]       = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const timerRef = useRef(null)
  const phaseRef = useRef(0)

  const breatheAnim = PET_ANIMATIONS[petType]?.breathe
  const breatheFrames = breatheAnim
    ? generateFrames(breatheAnim.path, breatheAnim.frames)
    : null
  const idleAnim = PET_ANIMATIONS[petType]?.idle
  const idleFrames = idleAnim
    ? generateFrames(idleAnim.path, idleAnim.frames)
    : null

  useEffect(() => {
    if (!isRunning || !program) return
    const phases = program.phases
    let elapsed = 0
    const phaseDuration = phases[phaseRef.current].duration

    timerRef.current = setInterval(() => {
      elapsed++
      setTotalSeconds(s => s + 1)
      setProgress(elapsed / phaseDuration)

      if (elapsed >= phaseDuration) {
        elapsed = 0
        phaseRef.current = (phaseRef.current + 1) % phases.length
        setPhase(phaseRef.current)
        if (phaseRef.current === 0) setCycles(c => c + 1)
      }
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [isRunning, program, phase])

  function start(prog) {
    setProgram(prog)
    setPhase(0)
    setProgress(0)
    setCycles(0)
    setTotalSeconds(0)
    phaseRef.current = 0
    setIsRunning(true)
  }

  function stop() {
    clearInterval(timerRef.current)
    setIsRunning(false)
    setProgram(null)
    setPhase(0)
    setProgress(0)
  }

  const currentPhase = program?.phases[phase]
  const circumference = 2 * Math.PI * 54

  if (!isRunning) {
    return (
      <div className="page pb-32">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold" style={{ color: theme.text }}>Respiración guiada 🫁</h1>
            <p className="text-sm" style={{ color: theme.textMuted }}>con {petName} {petEmoji}</p>
          </div>
          {onClose && <button onClick={onClose} style={{ color: theme.textMuted }}>✕</button>}
        </div>

        {/* Mascota idle */}
        <div className="flex justify-center mb-6">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            {idleFrames ? (
              <FrameAnimator frames={idleFrames} fps={idleAnim.fps} width={120} height={120}
                fallback={<span style={{ fontSize: 80 }}>{petEmoji}</span>} />
            ) : (
              <span style={{ fontSize: 80 }}>{petEmoji}</span>
            )}
          </motion.div>
        </div>

        <p className="text-center text-sm mb-6" style={{ color: theme.textMuted }}>
          Elige una técnica de respiración y {petName} te guiará
        </p>

        <div className="space-y-3">
          {BREATHING_PROGRAMS.map(prog => (
            <motion.button key={prog.id} whileTap={{ scale: 0.97 }}
              onClick={() => start(prog)}
              className="w-full card flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${theme.primary}15` }}>
                🫁
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: theme.text }}>{prog.name}</p>
                <p className="text-xs" style={{ color: theme.textMuted }}>{prog.desc}</p>
                <p className="text-xs mt-1" style={{ color: theme.primary }}>
                  {prog.phases.map(p => p.duration).join('-')} · {prog.phases.length} fases
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: theme.bg }}>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-10">
        <div>
          <p className="font-bold" style={{ color: theme.text }}>{program.name}</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>Ciclos: {cycles} · {Math.floor(totalSeconds/60)}:{String(totalSeconds%60).padStart(2,'0')}</p>
        </div>
        <button onClick={stop}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}>
          Pausar
        </button>
      </div>

      {/* Anillo + mascota */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        {/* Anillo de progreso */}
        <svg width="240" height="240" className="-rotate-90 absolute inset-0">
          <circle cx="120" cy="120" r="54" fill="none"
            stroke={`${currentPhase?.color}20`} strokeWidth="12" />
          <motion.circle cx="120" cy="120" r="54" fill="none"
            stroke={currentPhase?.color} strokeWidth="12"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 0.3 }}
            strokeLinecap="round" />
        </svg>

        {/* Mascota animada */}
        <motion.div
          animate={{
            scale: currentPhase?.label === 'Inhala' ? [1, 1.15] :
                   currentPhase?.label === 'Exhala' ? [1.15, 1] : 1,
          }}
          transition={{ duration: currentPhase?.duration || 4, ease: 'easeInOut' }}
          className="relative z-10"
        >
          {breatheFrames ? (
            <FrameAnimator frames={breatheFrames} fps={breatheAnim.fps} width={100} height={100}
              fallback={<span style={{ fontSize: 70 }}>{petEmoji}</span>} />
          ) : (
            <span style={{ fontSize: 70 }}>{petEmoji}</span>
          )}
        </motion.div>
      </div>

      {/* Fase actual */}
      <AnimatePresence mode="wait">
        <motion.div key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center mt-6">
          <p className="text-4xl font-extrabold mb-2" style={{ color: currentPhase?.color }}>
            {currentPhase?.label}
          </p>
          <p className="text-sm" style={{ color: theme.textMuted }}>{currentPhase?.instruction}</p>
          <p className="text-2xl font-bold mt-3" style={{ color: theme.text }}>
            {currentPhase?.duration - Math.floor(progress * currentPhase?.duration)}s
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Fases */}
      <div className="flex gap-2 mt-8">
        {program.phases.map((p, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: i === phase ? p.color : `${p.color}40` }} />
            <span className="text-[10px]" style={{ color: i === phase ? p.color : theme.textMuted }}>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Mensaje de la mascota */}
      <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
        className="absolute bottom-20 px-5">
        <p className="text-center text-sm" style={{ color: theme.textMuted }}>
          {petName} respira contigo 💙
        </p>
      </motion.div>
    </div>
  )
}
