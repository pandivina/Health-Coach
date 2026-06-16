// ─── components/mood/PandiPulse.jsx ──────────────────────────────────────────
// "El Pulso de Pandi" — minijuego de biofeedback respiratorio táctil
// Joystick vertical de 3 posiciones sincronizado con la respiración de la mascota

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { speak, stopSpeech, sayAsync, PANDI_VOICE } from '../../lib/tts'

// ─── TÉCNICAS DE RESPIRACIÓN — velocidad objetivo única por ciclo completo ──
const TECHNIQUES = {
  '478': {
    name: '4-7-8',
    inhale: 4, hold: 7, exhale: 8,
    totalCycle: 19,
    targetSpeed: 1 / 19, // posición del joystick (0-1) por segundo, aprox
  },
  'night': {
    name: '4-6',
    inhale: 4, hold: 0, exhale: 6,
    totalCycle: 10,
    targetSpeed: 1 / 10,
  },
  'box': {
    name: 'Box',
    inhale: 4, hold: 4, exhale: 4, holdOut: 4,
    totalCycle: 16,
    targetSpeed: 1 / 16,
  },
}

// Determina técnica según contexto — se llama desde fuera y se pasa como prop
export function pickTechnique(situation) {
  if (situation === 'low_mood' || situation === 'great_anxiety') return '478'
  if (situation === 'deep_night_calm' || situation === 'night') return 'night'
  return 'box'
}

// Ciclos necesarios según score real (no tramos fijos)
export function calcCyclesNeeded(score = 0.5) {
  const n = Math.round(3 + (1 - score) * 5)
  return Math.min(Math.max(n, 3), 8)
}

// ─── AUDIO ────────────────────────────────────────────────────────────────────
const AMBIENT_SOUND = '/audio/ambient-rain.mp3'

function playBreakSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
    osc.start(); osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

function playSuccessChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      const t = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0.2, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4)
      osc.start(t); osc.stop(t + 0.4)
    })
  } catch {}
}

function vibrateBreak() {
  if ('vibrate' in navigator) { try { navigator.vibrate([60, 40, 60, 40, 100]) } catch {} }
}
function vibrateSuccess() {
  if ('vibrate' in navigator) { try { navigator.vibrate([40, 30, 40, 30, 80, 30, 120]) } catch {} }
}

// ─── ASSETS DE MASCOTA — por convención, sustituible sin tocar código ───────
// Cuando haya más mascotas: petId viene de localStorage('pandi_active_pet')
// y los paths cambian de /panda/ a /{petId}/ automáticamente
function getPetAssets(petId = 'pandi') {
  const base = petId === 'pandi' ? '/panda' : `/${petId}`
  return {
    agitated:  `${base}/avatar_neutro.png`,   // placeholder hasta tener frames de susto
    calming:   `${base}/panda_base.png`,
    calm:      `${base}/avatar_happy.png`,
    scared:    `${base}/thinking_1.png`,      // placeholder para modo libre (susto inicial)
  }
}

// ─── JOYSTICK VERTICAL ────────────────────────────────────────────────────────
function VerticalJoystick({ position, sync, onDrag, onDragEnd, disabled }) {
  const trackRef = useRef(null)
  const draggingRef = useRef(false)

  const handleStart = useCallback((clientY) => {
    if (disabled) return
    draggingRef.current = true
  }, [disabled])

  const handleMove = useCallback((clientY) => {
    if (!draggingRef.current || !trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const rel = 1 - Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1)
    onDrag(rel)
  }, [onDrag])

  const handleEnd = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    onDragEnd?.()
  }, [onDragEnd])

  useEffect(() => {
    const move = e => handleMove(e.touches ? e.touches[0].clientY : e.clientY)
    const end  = () => handleEnd()
    window.addEventListener('mousemove', move)
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('mouseup', end)
    window.addEventListener('touchend', end)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('mouseup', end)
      window.removeEventListener('touchend', end)
    }
  }, [handleMove, handleEnd])

  const knobColor = sync === 'good' ? '#2EC4B6' : sync === 'bad' ? '#EF4444' : '#FFFFFF'
  const knobGlow  = sync === 'good' ? 'rgba(46,196,182,0.5)' : sync === 'bad' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.3)'

  return (
    <div
      ref={trackRef}
      onMouseDown={e => handleStart(e.clientY)}
      onTouchStart={e => handleStart(e.touches[0].clientY)}
      style={{
        position: 'relative', width: 64, height: 280,
        borderRadius: 32, background: 'rgba(255,255,255,0.08)',
        border: '1.5px solid rgba(255,255,255,0.15)',
        touchAction: 'none', cursor: disabled ? 'default' : 'grab',
        margin: '0 auto',
      }}>

      {/* Etiquetas */}
      <div style={{ position:'absolute', top:8, left:0, right:0, textAlign:'center',
        fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>INHALA</div>
      <div style={{ position:'absolute', bottom:8, left:0, right:0, textAlign:'center',
        fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>EXHALA</div>

      {/* Línea central (neutro) */}
      <div style={{ position:'absolute', top:'50%', left:8, right:8, height:1,
        background:'rgba(255,255,255,0.15)' }} />

      {/* Knob */}
      <motion.div
        animate={{ top: `${(1 - position) * 100}%` }}
        transition={{ type: 'tween', duration: 0.05 }}
        style={{
          position:'absolute', left:'50%', width:48, height:48,
          marginLeft:-24, marginTop:-24,
          borderRadius:'50%', background:knobColor,
          boxShadow:`0 0 20px 6px ${knobGlow}, 0 4px 12px rgba(0,0,0,0.3)`,
          transition:'background 0.15s, box-shadow 0.15s',
        }} />
    </div>
  )
}

// ─── BARRA DE VELOCIDAD OBJETIVO ──────────────────────────────────────────────
function SpeedBar({ userSpeed, targetSpeed, inZone }) {
  // Normalizar velocidad para visualización (0-100%)
  const ratio = targetSpeed > 0 ? Math.min(userSpeed / targetSpeed, 2) : 0
  const pct = Math.min(ratio * 50, 100)

  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden', position: 'relative' }}>
        {/* Zona verde objetivo */}
        <div style={{ position:'absolute', left:'40%', width:'20%', top:0, bottom:0,
          background:'rgba(46,196,182,0.25)' }} />
        {/* Barra actual */}
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.1 }}
          style={{ height: '100%', borderRadius: 6,
            background: inZone ? '#2EC4B6' : '#F59E0B' }} />
      </div>
      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 4 }}>
        Ritmo {inZone ? 'perfecto' : 'ajusta la velocidad'}
      </p>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function PandiPulse({
  mode = 'free',           // 'free' | 'guided'
  situation = null,        // situación detectada (solo en modo guided)
  score = 0.5,             // score del contexto (solo en modo guided)
  petId = 'pandi',
  onClose,
  onComplete,
}) {
  const { addXP } = useStore()
  const assets = getPetAssets(petId)

  const techKey = mode === 'guided' ? pickTechnique(situation) : 'box'
  const tech = TECHNIQUES[techKey]
  const cyclesNeeded = mode === 'guided' ? calcCyclesNeeded(score) : 4

  const [phase, setPhase]         = useState('intro') // intro | scared | playing | break | success
  const [position, setPosition]   = useState(0.5)     // 0 = exhalado, 1 = inhalado
  const [cleanCycles, setCleanCycles] = useState(0)
  const [calmLevel, setCalmLevel] = useState(0)        // 0-1, progreso visual de calma
  const [sync, setSync]           = useState('neutral')// 'good' | 'bad' | 'neutral'
  const [userSpeed, setUserSpeed] = useState(0)
  const [muted, setMuted]         = useState(false)
  const [cycleDir, setCycleDir]   = useState('inhale') // dirección esperada del ciclo

  const ambientRef   = useRef(null)
  const lastPosRef    = useRef(0.5)
  const lastTimeRef   = useRef(Date.now())
  const phaseStartRef = useRef(Date.now())
  const cycleProgressRef = useRef(0) // 0-1 dentro del ciclo actual esperado

  // ── Intro: modo libre tiene susto inicial, modo guiado va directo ──────────
  useEffect(() => {
    if (mode === 'free') {
      setPhase('scared')
      setTimeout(() => setPhase('playing'), 2200)
    } else {
      setPhase('playing')
    }
  }, [mode])

  // ── Audio ambiente ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || muted) return
    const audio = new Audio(AMBIENT_SOUND)
    audio.loop = true; audio.volume = 0.25
    audio.play().catch(() => {})
    ambientRef.current = audio
    return () => { audio.pause(); ambientRef.current = null }
  }, [phase, muted])

  // ── TTS de fase inicial ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'playing' && !muted) {
      sayAsync('Sigue mi ritmo con el dedo. Inhala...', { rate: 0.85 })
    }
    return () => stopSpeech()
  }, [phase])

  // ── Loop principal: avanza el ciclo esperado y compara con el usuario ──────
  useEffect(() => {
    if (phase !== 'playing') return

    const interval = setInterval(() => {
      const now = Date.now()
      const dt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      // Avanzar progreso del ciclo esperado (0→1→0 en totalCycle segundos)
      const cycleSpeed = 1 / tech.totalCycle
      cycleProgressRef.current += cycleSpeed * dt

      let expectedPos
      if (cycleProgressRef.current <= 0.5) {
        // Mitad inhalación: 0→1
        expectedPos = cycleProgressRef.current * 2
        setCycleDir('inhale')
      } else if (cycleProgressRef.current <= 1) {
        // Mitad exhalación: 1→0
        expectedPos = 1 - (cycleProgressRef.current - 0.5) * 2
        setCycleDir('exhale')
      } else {
        // Ciclo completo
        cycleProgressRef.current = 0
        handleCycleComplete()
        return
      }

      // Calcular velocidad real del usuario (derivada de su posición)
      const userDelta = Math.abs(position - lastPosRef.current)
      const speed = userDelta / dt
      lastPosRef.current = position
      setUserSpeed(speed)

      // ¿Está sincronizado? — comparar posición real vs esperada
      const diff = Math.abs(position - expectedPos)
      const inSync = diff < 0.22 // margen de tolerancia

      if (inSync) {
        setSync('good')
      } else if (diff > 0.45) {
        setSync('bad')
        triggerBreak()
      } else {
        setSync('neutral')
      }
    }, 80)

    return () => clearInterval(interval)
  }, [phase, position, tech])

  function handleCycleComplete() {
    setCleanCycles(c => {
      const next = c + 1
      setCalmLevel(Math.min(next / cyclesNeeded, 1))
      if (next >= cyclesNeeded) {
        completeSession()
      }
      return next
    })
  }

  function triggerBreak() {
    if (phase !== 'playing') return
    setPhase('break')
    if (!muted) { vibrateBreak(); playBreakSound() }
    cycleProgressRef.current = 0
    setCalmLevel(c => Math.max(c - (1 / cyclesNeeded) * 0.5, 0))
    setCleanCycles(c => Math.max(c - 1, 0))
    setTimeout(() => setPhase('playing'), 1100)
  }

  function completeSession() {
    setPhase('success')
    stopAmbient()
    if (!muted) {
      vibrateSuccess(); playSuccessChime()
      setTimeout(() => sayAsync(PANDI_VOICE.meditationEnd?.('') || 'Lo has hecho muy bien.'), 400)
    }
    addXP?.(cyclesNeeded * 8)
    onComplete?.({ cyclesCompleted: cyclesNeeded, technique: tech.name })
  }

  function stopAmbient() {
    if (ambientRef.current) { ambientRef.current.pause(); ambientRef.current = null }
  }

  function handleDrag(rel) {
    setPosition(rel)
  }

  function handleClose() {
    stopAmbient(); stopSpeech()
    onClose?.()
  }

  // Frame de mascota según fase
  const petFrame = phase === 'scared' ? assets.scared
    : phase === 'success' ? assets.calm
    : calmLevel > 0.6 ? assets.calm
    : assets.calming

  const inhaleScale = 1 + position * 0.18

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:80, background:'#0f1420',
        display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Fondo degradado que se serena con el progreso */}
      <motion.div
        animate={{
          background: `radial-gradient(circle at 50% 35%, 
            rgba(${100-calmLevel*60},${130+calmLevel*60},${200+calmLevel*30},0.35) 0%, 
            #0f1420 70%)`
        }}
        style={{ position:'absolute', inset:0 }} />

      {/* Header */}
      <div style={{ position:'relative', zIndex:10, display:'flex',
        justifyContent:'space-between', alignItems:'center', padding:'16px 16px 0' }}>
        <button onClick={handleClose}
          style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
            background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center',
            justifyContent:'center', color:'white' }}>
          <X size={16} />
        </button>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700,
          textTransform:'uppercase', letterSpacing:'.05em' }}>
          El Pulso de Pandi
        </p>
        <button onClick={() => setMuted(m => !m)}
          style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
            background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center',
            justifyContent:'center', color:'white' }}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'scared' && (
          <motion.div key="scared" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:24 }}>
            <motion.img src={assets.scared} alt="Pandi asustada"
              animate={{ x:[0,-8,8,-8,8,0], scale:[1,1.05,1] }}
              transition={{ duration:1.8, repeat:Infinity }}
              style={{ width:140, height:140, objectFit:'contain' }}
              onError={e => e.target.style.display='none'} />
            <p style={{ color:'white', fontSize:15, fontWeight:700, marginTop:16, textAlign:'center' }}>
              Algo ha puesto nerviosa a Pandi...
            </p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:4 }}>
              Ayúdala a calmarse
            </p>
          </motion.div>
        )}

        {(phase === 'playing' || phase === 'break') && (
          <motion.div key="playing" initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'space-between', padding:'12px 24px 32px' }}>

            {/* Mascota respirando */}
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
              position:'relative' }}>
              <motion.div
                animate={{ scale: inhaleScale }}
                transition={{ type:'tween', duration:0.08 }}
                style={{ position:'relative' }}>
                {/* Glow de calma */}
                <div style={{ position:'absolute', inset:-30, borderRadius:'50%',
                  background:`radial-gradient(circle, rgba(46,196,182,${calmLevel*0.4}) 0%, transparent 70%)`,
                  filter:'blur(20px)' }} />
                <img src={petFrame} alt="Pandi"
                  style={{ width:160, height:160, objectFit:'contain', position:'relative' }}
                  onError={e => e.target.style.display='none'} />
              </motion.div>

              {/* Aviso de rotura */}
              <AnimatePresence>
                {phase === 'break' && (
                  <motion.div
                    initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                    style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                      background:'rgba(239,68,68,0.92)', borderRadius:20, padding:'10px 20px' }}>
                    <p style={{ color:'white', fontWeight:800, fontSize:13 }}>Demasiado rápido 💨</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progreso de calma */}
            <div style={{ width:'100%', maxWidth:260, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700 }}>Calma</span>
                <span style={{ fontSize:11, color:'#2EC4B6', fontWeight:700 }}>
                  {cleanCycles}/{cyclesNeeded} ciclos
                </span>
              </div>
              <div style={{ height:6, borderRadius:4, background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
                <motion.div animate={{ width:`${calmLevel*100}%` }} transition={{ duration:0.4 }}
                  style={{ height:'100%', borderRadius:4,
                    background:'linear-gradient(90deg,#2EC4B6,#86EFAC)' }} />
              </div>
            </div>

            {/* Joystick + barra velocidad */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
              <VerticalJoystick position={position} sync={sync}
                onDrag={handleDrag} disabled={phase === 'break'} />
              <SpeedBar userSpeed={userSpeed} targetSpeed={tech.targetSpeed}
                inZone={sync === 'good'} />
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600 }}>
                {cycleDir === 'inhale' ? '↑ Arrastra hacia arriba' : '↓ Arrastra hacia abajo'}
              </p>
            </div>
          </motion.div>
        )}

        {phase === 'success' && (
          <motion.div key="success" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:24 }}>
            <motion.img src={assets.calm} alt="Pandi calmada"
              animate={{ y:[0,-6,0] }} transition={{ duration:2.5, repeat:Infinity }}
              style={{ width:160, height:160, objectFit:'contain' }}
              onError={e => e.target.style.display='none'} />
            <motion.p initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
              style={{ color:'white', fontSize:18, fontWeight:800, marginTop:16, textAlign:'center' }}>
              Pandi está en calma 🌿
            </motion.p>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
              style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:6 }}>
              +{cyclesNeeded * 8} XP de calma
            </motion.p>
            <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
              whileTap={{ scale:0.95 }} onClick={handleClose}
              style={{ marginTop:28, padding:'12px 32px', borderRadius:18, border:'none',
                cursor:'pointer', background:'linear-gradient(135deg,#2EC4B6,#86EFAC)',
                color:'white', fontWeight:700, fontSize:14 }}>
              Continuar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
