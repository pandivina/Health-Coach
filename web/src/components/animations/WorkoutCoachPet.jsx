import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeProvider'
import { useTourContext } from '../../contexts/GuidedTourProvider'
import FrameAnimator, { generateFrames, PET_ANIMATIONS } from './FrameAnimator'

const PET_EMOJI = { panda:'🐼', cat:'🐱', dog:'🐶', fox:'🦊', rabbit:'🐰' }

// Frases motivacionales por contexto
const COACH_MESSAGES = {
  start:    (pet, name) => [`¡Vamos ${name}! 💪`, `Yo, ${pet}, creo en ti`, `¡Tú puedes con esto!`, `¡A por todas, ${name}!`],
  during:   (pet, name) => [`¡Eso es, ${name}! 🔥`, `¡Sigue así!`, `¡No pares ahora!`, `¡Qué bestia, ${name}!`, `¡${pet} está orgulloso!`],
  rest:     (pet, name) => [`Descansa, ${name} 🫁`, `Respira profundo`, `Recupera energías`, `Casi acabamos, ánimo`],
  pr:       (pet, name) => [`¡NUEVO RÉCORD, ${name}! 🏆`, `¡${pet} está bailando de alegría!`, `¡INCREÍBLE!`],
  finish:   (pet, name) => [`¡Lo has conseguido, ${name}! 🎉`, `¡Eres una máquina!`, `${pet} está súper orgulloso`],
  warmup:   (pet, name) => [`Calienta bien, ${name}`, `El calentamiento es clave`, `Sin prisa, con calidad`],
}

function getRandomMessage(context, petName, userName) {
  const msgs = COACH_MESSAGES[context]?.(petName, userName) || ['¡Ánimo!']
  return msgs[Math.floor(Math.random() * msgs.length)]
}

// Estados de la mascota durante el workout
const PET_STATE = {
  IDLE:      'idle',
  CHEERING:  'happy',
  RESTING:   'sleep',
  RUNNING:   'run',
  CELEBRATE: 'celebrate',
}

export default function WorkoutCoachPet({
  isResting = false,
  isFinished = false,
  isPR = false,
  exerciseName = '',
  restSeconds = 0,
  onRestEnd,
  minimized = false,
  onToggleMinimize,
}) {
  const { theme } = useTheme()
  const { userInfo } = useTourContext()
  const petType  = userInfo?.petType  || 'panda'
  const petName  = userInfo?.petName  || 'Pandi'
  const userName = userInfo?.userName || 'campeón'
  const petEmoji = PET_EMOJI[petType] || '🐼'

  const [message, setMessage]         = useState('')
  const [petState, setPetState]       = useState(PET_STATE.IDLE)
  const [restRemaining, setRestRemaining] = useState(restSeconds)
  const [showMessage, setShowMessage] = useState(true)
  const timerRef = useRef(null)
  const messageTimerRef = useRef(null)

  // Actualizar estado y mensaje según contexto
  useEffect(() => {
    clearInterval(timerRef.current)
    clearTimeout(messageTimerRef.current)

    if (isPR) {
      setPetState(PET_STATE.CELEBRATE)
      setMessage(getRandomMessage('pr', petName, userName))
    } else if (isFinished) {
      setPetState(PET_STATE.CELEBRATE)
      setMessage(getRandomMessage('finish', petName, userName))
    } else if (isResting) {
      setPetState(PET_STATE.RESTING)
      setMessage(getRandomMessage('rest', petName, userName))
      setRestRemaining(restSeconds)
      timerRef.current = setInterval(() => {
        setRestRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            onRestEnd?.()
            setPetState(PET_STATE.CHEERING)
            setMessage(getRandomMessage('during', petName, userName))
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setPetState(PET_STATE.CHEERING)
      setMessage(getRandomMessage('during', petName, userName))
    }

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(messageTimerRef.current)
    }
  }, [isResting, isFinished, isPR, restSeconds])

  // Cambiar mensaje motivacional cada 15s durante ejercicio
  useEffect(() => {
    if (isResting || isFinished || isPR) return
    const interval = setInterval(() => {
      setMessage(getRandomMessage('during', petName, userName))
      setShowMessage(false)
      setTimeout(() => setShowMessage(true), 200)
    }, 15000)
    return () => clearInterval(interval)
  }, [isResting, isFinished, isPR, petName, userName])

  const animDef = PET_ANIMATIONS[petType]?.[petState] || PET_ANIMATIONS[petType]?.idle
  const frames  = animDef ? generateFrames(animDef.path, animDef.frames) : null

  if (minimized) {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggleMinimize}
        className="fixed bottom-24 right-4 z-40 flex flex-col items-center"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ fontSize: 44 }}>
          {petEmoji}
        </motion.div>
        {isResting && (
          <div className="px-2 py-0.5 rounded-full text-xs font-bold text-white -mt-1"
            style={{ background: theme.primary }}>
            {restRemaining}s
          </div>
        )}
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: isResting ? `${theme.primary}10` : isPR ? `${theme.warning}10` : theme.surface,
        border: `1px solid ${isResting ? theme.primary+'30' : isPR ? theme.warning+'30' : theme.border}`,
      }}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Mascota animada */}
        <motion.div
          animate={isPR || isFinished
            ? { rotate: [-10, 10, -10], scale: [1, 1.15, 1] }
            : isResting
            ? { scale: [1, 0.97, 1] }
            : { y: [0, -4, 0] }}
          transition={{ duration: isPR ? 0.5 : 2, repeat: Infinity }}
          className="flex-shrink-0"
        >
          {frames ? (
            <FrameAnimator frames={frames} fps={animDef.fps} loop width={72} height={72}
              fallback={<span style={{ fontSize: 50 }}>{petEmoji}</span>} />
          ) : (
            <span style={{ fontSize: 50 }}>{petEmoji}</span>
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Mensaje */}
          <AnimatePresence mode="wait">
            {showMessage && (
              <motion.p
                key={message}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="font-bold text-sm mb-1" style={{ color: theme.text }}>
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Estado */}
          {isResting ? (
            <div>
              <p className="text-xs mb-1.5" style={{ color: theme.textMuted }}>
                Próximo: {exerciseName}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: theme.surface2 }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: theme.primary }}
                    animate={{ width: `${(restRemaining / restSeconds) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-sm font-bold flex-shrink-0" style={{ color: theme.primary }}>
                  {restRemaining}s
                </span>
              </div>
            </div>
          ) : isPR ? (
            <p className="text-xs font-bold" style={{ color: theme.warning }}>
              ⭐ NUEVO RÉCORD PERSONAL
            </p>
          ) : (
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {petName} te está mirando 👀
            </p>
          )}
        </div>

        {/* Minimizar */}
        {onToggleMinimize && (
          <button onClick={onToggleMinimize}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: theme.surface2 }}>
            <span style={{ fontSize: 10, color: theme.textMuted }}>↙</span>
          </button>
        )}
      </div>
    </motion.div>
  )
}
