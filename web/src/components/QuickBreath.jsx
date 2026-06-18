// ─── components/QuickBreath.jsx ──────────────────────────────────────────────
// Respiración express de 1 minuto — acceso directo sin abrir Mood completo

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { sayAsync, stopSpeech } from '../lib/tts'

const CYCLE_SECONDS = { inhale: 4, exhale: 4 } // box simple, 8s por ciclo
const TOTAL_SECONDS = 60

export function QuickBreathButton({ onActivate }) {
  return (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onActivate}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px',
        borderRadius:16, border:'none', cursor:'pointer',
        background:'rgba(255,255,255,0.95)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
      <span style={{ fontSize:16 }}>🫁</span>
      <span style={{ fontSize:12, fontWeight:700, color:'#1A2332' }}>Respira 1 min</span>
    </motion.button>
  )
}

export default function QuickBreathModal({ onClose }) {
  const [phase, setPhase] = useState('inhale')
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)
  const phaseRef = useRef('inhale')
  const phaseTimeRef = useRef(0)

  useEffect(() => {
    sayAsync('Un minuto para ti. Inhala.', { rate: 0.85, volume: 0.7 })

    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setDone(true)
          return 0
        }
        return s - 1
      })

      phaseTimeRef.current += 1
      const cycleLen = CYCLE_SECONDS.inhale + CYCLE_SECONDS.exhale
      const posInCycle = phaseTimeRef.current % cycleLen
      const newPhase = posInCycle < CYCLE_SECONDS.inhale ? 'inhale' : 'exhale'

      if (newPhase !== phaseRef.current) {
        phaseRef.current = newPhase
        setPhase(newPhase)
        sayAsync(newPhase === 'inhale' ? 'Inhala' : 'Exhala', { rate: 0.85, volume: 0.6 })
      }
    }, 1000)

    return () => { clearInterval(intervalRef.current); stopSpeech() }
  }, [])

  function handleClose() {
    clearInterval(intervalRef.current)
    stopSpeech()
    onClose?.()
  }

  const scale = phase === 'inhale' ? 1.25 : 0.9

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:9999,
        background:'linear-gradient(180deg, #0f1f2e 0%, #15293b 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>

      <button onClick={handleClose}
        style={{ position:'absolute', top:20, left:20, width:36, height:36, borderRadius:12,
          border:'none', cursor:'pointer', background:'rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
        <X size={16} />
      </button>

      {!done ? (
        <>
          <div style={{ position:'relative', width:160, height:160,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <motion.div
              animate={{ scale, opacity: phase === 'inhale' ? 0.5 : 0.25 }}
              transition={{ duration: CYCLE_SECONDS.inhale, ease:'easeInOut' }}
              style={{ position:'absolute', width:160, height:160, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(96,165,250,0.6) 0%, transparent 70%)',
                filter:'blur(8px)' }} />
            <motion.div
              animate={{ scale: scale * 0.6 }}
              transition={{ duration: CYCLE_SECONDS.inhale, ease:'easeInOut' }}
              style={{ width:70, height:70, borderRadius:'50%', background:'white',
                position:'relative', zIndex:2, boxShadow:'0 4px 24px rgba(96,165,250,0.4)' }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.p key={phase} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              style={{ color:'white', fontSize:18, fontWeight:700, marginTop:28, margin:'28px 0 0' }}>
              {phase === 'inhale' ? 'Inhala' : 'Exhala'}
            </motion.p>
          </AnimatePresence>

          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:24, fontWeight:800, marginTop:12 }}>
            {secondsLeft}s
          </p>
        </>
      ) : (
        <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
          style={{ textAlign:'center' }}>
          <p style={{ fontSize:40, margin:'0 0 12px' }}>✨</p>
          <p style={{ color:'white', fontSize:17, fontWeight:800, margin:0 }}>Minuto completado</p>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, margin:'6px 0 20px' }}>
            Pequeñas pausas, gran diferencia
          </p>
          <button onClick={handleClose}
            style={{ padding:'12px 32px', borderRadius:18, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#60A5FA,#3B82F6)', color:'white',
              fontWeight:700, fontSize:14 }}>
            Continuar
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
