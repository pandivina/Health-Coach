// ─── components/mood/PandiPulse.jsx ──────────────────────────────────────────
// "El Pulso de Pandi" — minijuego de biofeedback respiratorio táctil
// Joystick vertical lateral, Pandi centro-izquierda, 3 fases con asset propio

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { speak, stopSpeech, sayAsync, PANDI_VOICE } from '../../lib/tts'
import { TutorialOverlay, TutorialHelpButton, useTutorial } from '../shared/TutorialOverlay'

// ─── TÉCNICAS DE RESPIRACIÓN ──────────────────────────────────────────────────
const TECHNIQUES = {
  '478': { name: '4-7-8', inhale: 4, hold: 7, exhale: 8, totalCycle: 19, targetSpeed: 1/19 },
  'night': { name: '4-6', inhale: 4, hold: 0, exhale: 6, totalCycle: 10, targetSpeed: 1/10 },
  'box': { name: 'Box', inhale: 4, hold: 4, exhale: 4, holdOut: 4, totalCycle: 16, targetSpeed: 1/16 },
}

export function pickTechnique(situation) {
  if (situation === 'low_mood' || situation === 'great_anxiety') return '478'
  if (situation === 'deep_night_calm' || situation === 'night') return 'night'
  return 'box'
}

export function calcCyclesNeeded(score = 0.5) {
  const n = Math.round(3 + (1 - score) * 5)
  return Math.min(Math.max(n, 3), 8)
}

// ─── AUDIO ────────────────────────────────────────────────────────────────────
const AMBIENT_SOUND = '/audio/ambient-rain.mp3'

function playBreakSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
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
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq; osc.type = 'sine'
      const t = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0.2, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4)
      osc.start(t); osc.stop(t + 0.4)
    })
  } catch {}
}

function vibrateBreak()   { if ('vibrate' in navigator) { try { navigator.vibrate([60,40,60,40,100]) } catch {} } }
function vibrateSuccess() { if ('vibrate' in navigator) { try { navigator.vibrate([40,30,40,30,80,30,120]) } catch {} } }

// ─── ASSETS DE MASCOTA POR FASE — placeholders, sustituibles sin tocar código ─
function getPetAssets(petId = 'pandi') {
  const base = petId === 'pandi' ? '/panda' : `/${petId}`
  return {
    scared:  `${base}/thinking_1.png`,    // intro modo libre
    inhale:  `${base}/breath_2.png`,      // fase inhalando
    hold:    `${base}/breath_3.png`,      // fase manteniendo
    exhale:  `${base}/breath_4.png`,      // fase exhalando
    calm:    `${base}/avatar_happy.png`,  // estado final de calma
  }
}

// ─── JOYSTICK VERTICAL LATERAL ─────────────────────────────────────────────────
function VerticalJoystick({ position, sync, onDrag, onDragEnd, disabled }) {
  const trackRef = useRef(null)
  const draggingRef = useRef(false)

  const handleStart = useCallback(() => { if (!disabled) draggingRef.current = true }, [disabled])

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
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      style={{
        position: 'relative', width: 56, height: '100%', minHeight: 200, maxHeight: 260,
        borderRadius: 28, background: 'rgba(255,255,255,0.08)',
        border: '1.5px solid rgba(255,255,255,0.15)',
        touchAction: 'none', cursor: disabled ? 'default' : 'grab',
      }}>

      <div style={{ position:'absolute', top:10, left:0, right:0, textAlign:'center',
        fontSize:8, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'.05em' }}>IN</div>
      <div style={{ position:'absolute', bottom:10, left:0, right:0, textAlign:'center',
        fontSize:8, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'.05em' }}>OUT</div>

      <div style={{ position:'absolute', top:'50%', left:8, right:8, height:1,
        background:'rgba(255,255,255,0.15)' }} />

      <motion.div
        animate={{ top: `${(1 - position) * 100}%` }}
        transition={{ type: 'tween', duration: 0.05 }}
        style={{
          position:'absolute', left:'50%', width:42, height:42,
          marginLeft:-21, marginTop:-21,
          borderRadius:'50%', background:knobColor,
          boxShadow:`0 0 18px 5px ${knobGlow}, 0 4px 10px rgba(0,0,0,0.3)`,
          transition:'background 0.15s, box-shadow 0.15s',
        }} />
    </div>
  )
}

// ─── BARRA DE VELOCIDAD ─────────────────────────────────────────────────────────
function SpeedBar({ userSpeed, targetSpeed, inZone }) {
  const ratio = targetSpeed > 0 ? Math.min(userSpeed / targetSpeed, 2) : 0
  const pct = Math.min(ratio * 50, 100)

  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 6, borderRadius: 5, background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden', position: 'relative' }}>
        <div style={{ position:'absolute', left:'40%', width:'20%', top:0, bottom:0,
          background:'rgba(46,196,182,0.25)' }} />
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.1 }}
          style={{ height: '100%', borderRadius: 5, background: inZone ? '#2EC4B6' : '#F59E0B' }} />
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function PandiPulse({
  mode = 'free', situation = null, score = 0.5, petId = 'pandi',
  onClose, onComplete,
}) {
  const { addXP } = useStore()
  const assets = getPetAssets(petId)
  const tutorial = useTutorial('pandi_pulse')

  const techKey = mode === 'guided' ? pickTechnique(situation) : 'box'
  const tech = TECHNIQUES[techKey]
  const cyclesNeeded = mode === 'guided' ? calcCyclesNeeded(score) : 4

  const [phase, setPhase]             = useState('intro') // intro | scared | ready | playing | break | success
  const [position, setPosition]       = useState(0) // arranca exhalado, sincronizado con inicio de ciclo
  const [cleanCycles, setCleanCycles] = useState(0)
  const [calmLevel, setCalmLevel]     = useState(0)
  const [sync, setSync]               = useState('neutral')
  const [userSpeed, setUserSpeed]     = useState(0)
  const [muted, setMuted]             = useState(false)
  const [cycleDir, setCycleDir]       = useState('inhale') // inhale | hold | exhale
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [subtitle, setSubtitle]       = useState('')

  const ambientRef       = useRef(null)
  const lastPosRef        = useRef(0.5)
  const lastTimeRef       = useRef(Date.now())
  const cycleProgressRef  = useRef(0)
  const lastDirRef        = useRef(null) // para detectar cambio de fase y disparar TTS

  useEffect(() => {
    if (tutorial.show) return
    if (mode === 'free') {
      setPhase('scared')
      setTimeout(() => setPhase('ready'), 2200)
    } else {
      setPhase('ready')
    }
  }, [mode, tutorial.show])

  function startPlaying() {
    setPosition(0)
    lastPosRef.current = 0
    setPhase('playing')
  }

  useEffect(() => {
    if (phase === 'playing') {
      lastDirRef.current = null // forzar disparo del subtítulo (inicio o tras un break)
      cycleProgressRef.current = 0
      lastTimeRef.current = Date.now()
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing' || muted) return
    const audio = new Audio(AMBIENT_SOUND)
    audio.loop = true; audio.volume = 0.25
    audio.play().catch(() => {})
    ambientRef.current = audio
    return () => { audio.pause(); ambientRef.current = null }
  }, [phase, muted])

  useEffect(() => {
    return () => stopSpeech()
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return

    const interval = setInterval(() => {
      const now = Date.now()
      const dt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      const cycleSpeed = 1 / tech.totalCycle
      cycleProgressRef.current += cycleSpeed * dt

      const inhaleFrac = tech.inhale / tech.totalCycle
      const holdFrac   = (tech.hold || 0) / tech.totalCycle
      const exhaleFrac = tech.exhale / tech.totalCycle

      let expectedPos, dir, secsLeftInPhase
      const p = cycleProgressRef.current

      if (p <= inhaleFrac) {
        expectedPos = p / inhaleFrac
        dir = 'inhale'
        secsLeftInPhase = Math.ceil((inhaleFrac - p) * tech.totalCycle)
      } else if (p <= inhaleFrac + holdFrac) {
        expectedPos = 1
        dir = 'hold'
        secsLeftInPhase = Math.ceil((inhaleFrac + holdFrac - p) * tech.totalCycle)
      } else if (p <= 1) {
        const exhaleP = (p - inhaleFrac - holdFrac) / exhaleFrac
        expectedPos = 1 - exhaleP
        dir = 'exhale'
        secsLeftInPhase = Math.ceil((1 - p) * tech.totalCycle)
      } else {
        cycleProgressRef.current = 0
        handleCycleComplete()
        return
      }

      setCycleDir(dir)
      setSecondsLeft(Math.max(secsLeftInPhase, 0))

      // Disparar subtítulo + TTS solo al ENTRAR en una fase nueva
      if (lastDirRef.current !== dir) {
        lastDirRef.current = dir
        const subtitleText = dir === 'inhale' ? 'Inhala lentamente por la nariz'
                            : dir === 'hold'   ? 'Mantén el aire, sin tensión'
                            : 'Exhala despacio por la boca'
        setSubtitle(subtitleText)
        if (!muted) sayAsync(
          dir === 'inhale' ? 'Inhala' : dir === 'hold' ? 'Mantén' : 'Exhala',
          { rate: 0.85, volume: 0.7 }
        )
      }

      const userDelta = Math.abs(position - lastPosRef.current)
      const speed = userDelta / dt
      lastPosRef.current = position
      setUserSpeed(speed)

      const diff = Math.abs(position - expectedPos)
      const inSync = diff < 0.22

      if (dir === 'hold') {
        // En la fase de mantener, toleramos más — solo penalizamos si suelta del todo
        setSync(position > 0.7 ? 'good' : 'neutral')
      } else if (inSync) {
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
      if (next >= cyclesNeeded) completeSession()
      return next
    })
  }

  function triggerBreak() {
    if (phase !== 'playing') return // ya está roto o en otra fase — no duplicar
    setPhase('break')
    if (!muted) { vibrateBreak(); playBreakSound() }
    cycleProgressRef.current = 0
    lastDirRef.current = null
    setPosition(0)
    lastPosRef.current = 0
    setCalmLevel(c => Math.max(c - (1 / cyclesNeeded) * 0.5, 0))
    setCleanCycles(c => Math.max(c - 1, 0))
    setTimeout(() => setPhase('playing'), 1100)
  }

  function completeSession() {
    setPhase('success')
    stopAmbient()
    if (!muted) {
      vibrateSuccess(); playSuccessChime()
      setTimeout(() => sayAsync('Lo has hecho muy bien. Lleva esta calma contigo.'), 400)
    }
    addXP?.(cyclesNeeded * 8)
    onComplete?.({ cyclesCompleted: cyclesNeeded, technique: tech.name })
  }

  function stopAmbient() {
    if (ambientRef.current) { ambientRef.current.pause(); ambientRef.current = null }
  }

  function handleDrag(rel) { setPosition(rel) }

  function handleClose() {
    stopAmbient(); stopSpeech()
    onClose?.()
  }

  const petFrame = phase === 'scared' ? assets.scared
    : phase === 'success' ? assets.calm
    : cycleDir === 'inhale' ? assets.inhale
    : cycleDir === 'hold'   ? assets.hold
    : assets.exhale

  const inhaleScale = 1 + position * 0.15

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:80, background:'#0f1420',
        display:'flex', flexDirection:'column', overflow:'hidden' }}>

      <motion.div
        animate={{
          background: `radial-gradient(circle at 35% 40%,
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
        <div style={{ display:'flex', gap:8 }}>
          <TutorialHelpButton onClick={tutorial.reopen} />
          <button onClick={() => setMuted(m => !m)}
            style={{ width:36, height:36, borderRadius:12, border:'none', cursor:'pointer',
              background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center',
              justifyContent:'center', color:'white' }}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
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

        {phase === 'ready' && (
          <motion.div key="ready" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:24 }}>
            <motion.img src={assets.calm} alt="Pandi lista"
              animate={{ y:[0,-6,0] }} transition={{ duration:2.5, repeat:Infinity }}
              style={{ width:140, height:140, objectFit:'contain' }}
              onError={e => e.target.style.display='none'} />
            <p style={{ color:'white', fontSize:15, fontWeight:700, marginTop:16, textAlign:'center' }}>
              ¿Lista para respirar juntos?
            </p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:4, textAlign:'center', maxWidth:240 }}>
              Sigue el control con el dedo al ritmo de Pandi
            </p>
            <motion.button whileTap={{ scale:0.95 }} onClick={startPlaying}
              style={{ marginTop:24, padding:'14px 40px', borderRadius:20, border:'none',
                cursor:'pointer', background:'linear-gradient(135deg,#2EC4B6,#86EFAC)',
                color:'white', fontWeight:800, fontSize:15 }}>
              Empezar
            </motion.button>
          </motion.div>
        )}

        {(phase === 'playing' || phase === 'break') && (
          <motion.div key="playing" initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ flex:1, display:'flex', padding:'12px 20px 28px', gap:16 }}>

            {/* Columna izquierda — Pandi + progreso */}
            <div style={{ flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center' }}>

              <div style={{ position:'relative', display:'flex', alignItems:'center',
                justifyContent:'center', flex:1 }}>
                <motion.div
                  animate={{ scale: inhaleScale }}
                  transition={{ type:'tween', duration:0.08 }}
                  style={{ position:'relative' }}>
                  <div style={{ position:'absolute', inset:-30, borderRadius:'50%',
                    background:`radial-gradient(circle, rgba(46,196,182,${calmLevel*0.4}) 0%, transparent 70%)`,
                    filter:'blur(20px)' }} />
                  <AnimatePresence mode="wait">
                    <motion.img key={petFrame} src={petFrame} alt="Pandi"
                      initial={{ opacity:0.5 }} animate={{ opacity:1 }} transition={{ duration:0.25 }}
                      style={{ width:150, height:150, objectFit:'contain', position:'relative' }}
                      onError={e => e.target.style.display='none'} />
                  </AnimatePresence>
                </motion.div>

                <AnimatePresence>
                  {phase === 'break' && (
                    <motion.div
                      initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                      style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                        background:'rgba(239,68,68,0.92)', borderRadius:18, padding:'8px 16px' }}>
                      <p style={{ color:'white', fontWeight:800, fontSize:12 }}>Demasiado rápido 💨</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Indicador de fase actual + contador + subtítulo */}
              <div style={{ marginBottom:14, textAlign:'center', minHeight:62 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <p style={{ fontSize:14, fontWeight:800, color:'white', margin:0 }}>
                    {cycleDir === 'inhale' ? '↑ Inhala' : cycleDir === 'hold' ? '✋ Mantén' : '↓ Exhala'}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.span key={secondsLeft}
                      initial={{ opacity:0, scale:0.7 }} animate={{ opacity:1, scale:1 }}
                      exit={{ opacity:0 }} transition={{ duration:0.15 }}
                      style={{ fontSize:18, fontWeight:900, color:'#2EC4B6', minWidth:20 }}>
                      {secondsLeft}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p key={subtitle}
                    initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    transition={{ duration:0.2 }}
                    style={{ fontSize:11, color:'rgba(255,255,255,0.55)', margin:'4px 0 0' }}>
                    {subtitle}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Progreso de calma */}
              <div style={{ width:'100%', maxWidth:240 }}>
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
            </div>

            {/* Columna derecha — Joystick lateral + barra velocidad */}
            <div style={{ width:80, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:14 }}>
              <VerticalJoystick position={position} sync={sync}
                onDrag={handleDrag} disabled={phase === 'break'} />
              <SpeedBar userSpeed={userSpeed} targetSpeed={tech.targetSpeed} inZone={sync === 'good'} />
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

      {/* Tutorial explicativo — primera vez automático, luego con botón ? */}
      <TutorialOverlay
        show={tutorial.show}
        onClose={tutorial.close}
        title="El Pulso de Pandi"
        subtitle="Ayuda a Pandi a calmarse siguiendo su respiración"
        steps={[
          { icon: '👆', text: 'Arrastra el control hacia arriba mientras Pandi inhala' },
          { icon: '✋', text: 'Mantenlo arriba durante la pausa, si la técnica lo requiere' },
          { icon: '👇', text: 'Arrastra hacia abajo mientras Pandi exhala' },
          { icon: '⚡', text: 'Si vas muy rápido o muy lento, Pandi se agita — sigue su ritmo con calma' },
        ]}
      />
    </motion.div>
  )
}
