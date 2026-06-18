// ─── components/mood/CalmButton.jsx ──────────────────────────────────────────
// Botón de calma rápida — pantalla fullscreen tipo meditación con sonido
// de bosque y respiración visual. Acceso inmediato, sin fricción.

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX } from 'lucide-react'
import { sayAsync, stopSpeech } from '../../lib/tts'

const FOREST_SOUND = '/audio/ambient-forest.mp3'

// Ciclo de respiración simple y suave — 4s inhala, 4s exhala, sin retención
const BREATH_CYCLE = 8000
const INHALE_TIME  = 4000

function getPetAssets(petId = 'pandi') {
  const base = petId === 'pandi' ? '/panda' : `/${petId}`
  return { calm: `${base}/avatar_happy.png` }
}

export function CalmButton({ onActivate }) {
  return (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onActivate}
      style={{ width: 38, height: 38, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
      🆘
    </motion.button>
  )
}

export default function CalmScreen({ petId = 'pandi', onClose }) {
  const assets = getPetAssets(petId)
  const [muted, setMuted] = useState(false)
  const [phase, setPhase] = useState('inhale') // inhale | exhale
  const audioRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (muted) return
    const audio = new Audio(FOREST_SOUND)
    audio.loop = true; audio.volume = 0.35
    audio.play().catch(() => {})
    audioRef.current = audio
    return () => { audio.pause(); audioRef.current = null }
  }, [muted])

  useEffect(() => {
    setPhase('inhale')
    if (!muted) sayAsync('Estoy aquí contigo. Respira conmigo.', { rate: 0.8, volume: 0.7 })

    let toggling = true
    function cycle() {
      setPhase(p => p === 'inhale' ? 'exhale' : 'inhale')
    }
    intervalRef.current = setInterval(cycle, INHALE_TIME)

    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleClose() {
    stopSpeech()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    clearInterval(intervalRef.current)
    onClose?.()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(180deg, #1b2a1f 0%, #16201a 60%, #0f1612 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>

      {/* Partículas de luz tipo luciérnaga */}
      {[
        { top:'18%', left:'20%', delay:0 },
        { top:'30%', left:'78%', delay:0.8 },
        { top:'60%', left:'12%', delay:1.4 },
        { top:'70%', left:'85%', delay:0.4 },
        { top:'45%', left:'50%', delay:1.8 },
      ].map((p, i) => (
        <motion.div key={i}
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: p.delay }}
          style={{ position:'absolute', top:p.top, left:p.left, width:5, height:5,
            borderRadius:'50%', background:'#FFE9A8', boxShadow:'0 0 8px #FFE9A8' }} />
      ))}

      {/* Cerrar */}
      <button onClick={handleClose}
        style={{ position:'absolute', top:20, left:20, width:36, height:36, borderRadius:12,
          border:'none', cursor:'pointer', background:'rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'white', zIndex:10 }}>
        <X size={16} />
      </button>

      {/* Mute */}
      <button onClick={() => setMuted(m => !m)}
        style={{ position:'absolute', top:20, right:20, width:36, height:36, borderRadius:12,
          border:'none', cursor:'pointer', background:'rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'white', zIndex:10 }}>
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Pandi + círculo de respiración */}
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <motion.div
          animate={{ scale: phase === 'inhale' ? 1.25 : 0.9, opacity: phase === 'inhale' ? 0.5 : 0.25 }}
          transition={{ duration: INHALE_TIME/1000, ease:'easeInOut' }}
          style={{ position:'absolute', width:220, height:220, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(134,239,172,0.5) 0%, transparent 70%)',
            filter:'blur(10px)' }} />
        <motion.img src={assets.calm} alt="Pandi"
          animate={{ scale: phase === 'inhale' ? 1.06 : 1 }}
          transition={{ duration: INHALE_TIME/1000, ease:'easeInOut' }}
          style={{ width:150, height:150, objectFit:'contain', position:'relative', zIndex:2 }}
          onError={e => e.target.style.display='none'} />
      </div>

      {/* Texto de fase */}
      <AnimatePresence mode="wait">
        <motion.p key={phase}
          initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
          transition={{ duration:0.3 }}
          style={{ color:'white', fontSize:18, fontWeight:700, marginTop:28 }}>
          {phase === 'inhale' ? 'Inhala' : 'Exhala'}
        </motion.p>
      </AnimatePresence>

      <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12, marginTop:8, maxWidth:240, textAlign:'center' }}>
        No tienes que hacer nada más. Solo respira y quédate aquí el tiempo que necesites.
      </p>
    </motion.div>
  )
}
