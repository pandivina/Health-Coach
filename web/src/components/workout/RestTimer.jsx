// ─── components/workout/RestTimer.jsx ────────────────────────────────────────
// Timer de descanso inteligente — vibra y suena al terminar, Pandi avisa

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const PANDI_REST_MESSAGES = [
  '¡Vamos! Es hora de la siguiente serie 💪',
  'Descanso completo. ¡A darle!',
  'Tu cuerpo está listo. Siguiente serie ya',
  '¡Buen descanso! Ahora a por más',
]

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
    // Segundo beep
    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2); gain2.connect(ctx.destination)
      osc2.frequency.value = 1100
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0.3, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc2.start()
      osc2.stop(ctx.currentTime + 0.4)
    }, 200)
  } catch {}
}

function vibrate() {
  if ('vibrate' in navigator) {
    try { navigator.vibrate([200, 100, 200]) } catch {}
  }
}

export default function RestTimer({ seconds, onDone, exerciseName }) {
  const [left,    setLeft]    = useState(seconds)
  const [paused,  setPaused]  = useState(false)
  const notifiedRef = useRef(false)
  const message = useRef(PANDI_REST_MESSAGES[Math.floor(Math.random()*PANDI_REST_MESSAGES.length)])

  useEffect(() => {
    if (paused) return
    if (left <= 0) {
      if (!notifiedRef.current) {
        notifiedRef.current = true
        vibrate()
        playBeep()
      }
      const t = setTimeout(onDone, 1200) // dar tiempo a ver el mensaje final
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, paused])

  // Vibración suave en los últimos 3 segundos como pre-aviso
  useEffect(() => {
    if (left === 3 && 'vibrate' in navigator) {
      try { navigator.vibrate(80) } catch {}
    }
  }, [left])

  const pct = ((seconds - left) / seconds) * 100
  const isAlmostDone = left <= 3 && left > 0

  function adjustTime(delta) {
    setLeft(l => Math.max(0, l + delta))
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="text-center px-6">

        {exerciseName && (
          <p className="text-white/50 text-xs font-semibold mb-2 uppercase tracking-wide">
            {exerciseName}
          </p>
        )}

        <div className="relative w-36 h-36 mx-auto mb-5">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
            <motion.circle cx="50" cy="50" r="42" fill="none"
              stroke={left <= 0 ? '#22C55E' : isAlmostDone ? '#F59E0B' : '#6366F1'}
              strokeWidth="7"
              strokeDasharray={2*Math.PI*42}
              animate={{ strokeDashoffset: 2*Math.PI*42*(1-pct/100) }}
              transition={{ duration: 0.5 }}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              animate={isAlmostDone ? { scale:[1,1.15,1] } : {}}
              transition={{ duration:0.5, repeat: isAlmostDone ? Infinity : 0 }}
              className="text-4xl font-bold text-white">
              {left <= 0 ? '✓' : left}
            </motion.span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {left <= 0 ? (
            <motion.div key="done" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
              <p className="text-2xl mb-1">🐼</p>
              <p className="text-white font-bold text-sm">{message.current}</p>
            </motion.div>
          ) : (
            <motion.p key="resting" className="text-white/60 mb-1">
              {paused ? 'Pausado' : 'Descansando…'}
            </motion.p>
          )}
        </AnimatePresence>

        {left > 0 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => adjustTime(-15)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Minus size={14} className="text-white" />
            </button>
            <button onClick={() => setPaused(p => !p)}
              className="px-5 py-2 text-sm font-semibold rounded-xl text-white"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              {paused ? '▶ Reanudar' : '⏸ Pausar'}
            </button>
            <button onClick={() => adjustTime(15)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Plus size={14} className="text-white" />
            </button>
          </div>
        )}

        <button onClick={onDone}
          className="mt-4 px-6 py-2 text-sm font-semibold rounded-xl text-white/70">
          Saltar descanso
        </button>
      </div>
    </motion.div>
  )
}
