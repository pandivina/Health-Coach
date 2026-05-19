import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Volume2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeProvider'
import { useTourContext } from '../../contexts/GuidedTourProvider'
import FrameAnimator, { generateFrames, PET_ANIMATIONS } from './FrameAnimator'

const PET_EMOJI = { panda:'🐼', cat:'🐱', dog:'🐶', fox:'🦊', rabbit:'🐰' }

const SESSIONS = [
  {
    id: 'morning',
    title: 'Meditación matutina',
    duration: 300, // 5 min
    emoji: '☀️',
    color: '#F59E0B',
    steps: [
      { at: 0,   text: 'Cierra los ojos y respira profundo. Estás en un lugar seguro.' },
      { at: 30,  text: 'Siente cómo tu cuerpo se relaja con cada exhalación.' },
      { at: 60,  text: 'Lleva tu atención al presente. Solo este momento importa.' },
      { at: 120, text: 'Visualiza tu día con calma y confianza.' },
      { at: 180, text: 'Establece una intención positiva para hoy.' },
      { at: 240, text: 'Comienza a tomar conciencia de tu entorno. Casi hemos terminado.' },
      { at: 280, text: 'Abre los ojos poco a poco. ¡Listo para un gran día!' },
    ],
  },
  {
    id: 'stress',
    title: 'Alivio del estrés',
    duration: 240,
    emoji: '🌊',
    color: '#2EC4B6',
    steps: [
      { at: 0,   text: 'Deja ir las tensiones del día. Tú tienes el control.' },
      { at: 40,  text: 'Con cada respiración, el estrés se disuelve.' },
      { at: 80,  text: 'Imagina una ola de calma recorriendo tu cuerpo.' },
      { at: 140, text: 'Tu mente está clara. Tu cuerpo está en paz.' },
      { at: 200, text: 'Lleva esta calma contigo el resto del día.' },
    ],
  },
  {
    id: 'sleep',
    title: 'Meditación para dormir',
    duration: 600, // 10 min
    emoji: '🌙',
    color: '#6366f1',
    steps: [
      { at: 0,   text: 'Es momento de descansar. Tu cuerpo lo merece.' },
      { at: 60,  text: 'Relaja los músculos de los pies hacia arriba.' },
      { at: 120, text: 'Tu respiración se hace más lenta y profunda.' },
      { at: 200, text: 'Deja ir los pensamientos como nubes en el cielo.' },
      { at: 300, text: 'Estás profundamente relajado/a y seguro/a.' },
      { at: 450, text: 'El sueño llega suavemente a ti...' },
    ],
  },
]

export default function MeditationSession({ onClose }) {
  const { theme } = useTheme()
  const { userInfo } = useTourContext()
  const petType  = userInfo?.petType  || 'panda'
  const petName  = userInfo?.petName  || 'Pandi'
  const petEmoji = PET_EMOJI[petType] || '🐼'

  const [session, setSession]       = useState(null)
  const [elapsed, setElapsed]       = useState(0)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [currentMsg, setCurrentMsg] = useState('')
  const [finished, setFinished]     = useState(false)
  const timerRef = useRef(null)

  const sleepAnim = PET_ANIMATIONS[petType]?.sleep
  const sleepFrames = sleepAnim ? generateFrames(sleepAnim.path, sleepAnim.frames) : null
  const idleAnim  = PET_ANIMATIONS[petType]?.idle
  const idleFrames = idleAnim ? generateFrames(idleAnim.path, idleAnim.frames) : null

  useEffect(() => {
    if (!isPlaying || !session) return
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= session.duration) {
          clearInterval(timerRef.current)
          setIsPlaying(false)
          setFinished(true)
          return session.duration
        }
        // Actualizar mensaje si hay uno para este segundo
        const step = [...session.steps].reverse().find(s => s.at <= next)
        if (step) setCurrentMsg(step.text)
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [isPlaying, session])

  function startSession(s) {
    setSession(s)
    setElapsed(0)
    setFinished(false)
    setCurrentMsg(s.steps[0].text)
    setIsPlaying(true)
  }

  function togglePlay() {
    setIsPlaying(p => !p)
  }

  function stopSession() {
    clearInterval(timerRef.current)
    setIsPlaying(false)
    setSession(null)
    setElapsed(0)
    setFinished(false)
  }

  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
  const remaining  = session ? session.duration - elapsed : 0

  // Selección de sesión
  if (!session) {
    return (
      <div className="page pb-32">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold" style={{ color: theme.text }}>Meditación 🧘</h1>
            <p className="text-sm" style={{ color: theme.textMuted }}>con {petName} {petEmoji}</p>
          </div>
          {onClose && <button onClick={onClose} style={{ color: theme.textMuted }}>✕</button>}
        </div>

        <div className="flex justify-center mb-6">
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
            {idleFrames ? (
              <FrameAnimator frames={idleFrames} fps={idleAnim.fps} width={110} height={110}
                fallback={<span style={{ fontSize: 80 }}>{petEmoji}</span>} />
            ) : (
              <span style={{ fontSize: 80 }}>{petEmoji}</span>
            )}
          </motion.div>
        </div>

        <p className="text-center text-sm mb-6" style={{ color: theme.textMuted }}>
          {petName} te acompañará durante la sesión 🌿
        </p>

        <div className="space-y-3">
          {SESSIONS.map(s => (
            <motion.button key={s.id} whileTap={{ scale: 0.97 }}
              onClick={() => startSession(s)}
              className="w-full card flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `${s.color}15` }}>
                {s.emoji}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: theme.text }}>{s.title}</p>
                <p className="text-xs" style={{ color: theme.textMuted }}>{formatTime(s.duration)} min</p>
              </div>
              <Play size={16} style={{ color: s.color }} />
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  // Sesión finalizada
  if (finished) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
        style={{ background: theme.bg }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{ fontSize: 80 }}>
          {petEmoji}
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-2xl font-extrabold mt-4 mb-2" style={{ color: theme.text }}>
          ¡Sesión completada!
        </motion.h2>
        <p className="text-center" style={{ color: theme.textMuted }}>
          {petName} y tú habéis pasado {formatTime(session.duration)} de bienestar 💙
        </p>
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          onClick={stopSession}
          className="btn-primary mt-8 w-auto px-8">
          Cerrar
        </motion.button>
      </div>
    )
  }

  const progress = elapsed / session.duration

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-16 px-6"
      style={{ background: theme.bg }}>

      {/* Info */}
      <div className="text-center">
        <p className="font-bold" style={{ color: theme.text }}>{session.title}</p>
        <p className="text-sm" style={{ color: theme.textMuted }}>Tiempo restante: {formatTime(remaining)}</p>
      </div>

      {/* Mascota + anillo */}
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        <svg width="220" height="220" className="-rotate-90 absolute inset-0">
          <circle cx="110" cy="110" r="96" fill="none" stroke={`${session.color}15`} strokeWidth="4" />
          <motion.circle cx="110" cy="110" r="96" fill="none" stroke={session.color} strokeWidth="4"
            strokeDasharray={2 * Math.PI * 96}
            animate={{ strokeDashoffset: 2 * Math.PI * 96 * (1 - progress) }}
            transition={{ duration: 0.5 }}
            strokeLinecap="round" />
        </svg>
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {sleepFrames ? (
            <FrameAnimator frames={sleepFrames} fps={sleepAnim.fps} width={130} height={130}
              fallback={<span style={{ fontSize: 90 }}>{petEmoji}</span>} />
          ) : (
            <span style={{ fontSize: 90 }}>{petEmoji}</span>
          )}
        </motion.div>
      </div>

      {/* Mensaje */}
      <AnimatePresence mode="wait">
        <motion.p key={currentMsg}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
          className="text-center text-base max-w-xs" style={{ color: theme.text, lineHeight: 1.6 }}>
          {currentMsg}
        </motion.p>
      </AnimatePresence>

      {/* Controles */}
      <div className="flex items-center gap-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: session.color }}>
          {isPlaying
            ? <Pause size={22} color="#fff" />
            : <Play size={22} color="#fff" />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={stopSession}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <Square size={16} style={{ color: theme.textMuted }} />
        </motion.button>
      </div>
    </div>
  )
}
