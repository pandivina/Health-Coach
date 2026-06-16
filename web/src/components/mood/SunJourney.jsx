// ─── components/mood/SunJourney.jsx ──────────────────────────────────────────
// "El Viaje del Sol" — respiración 4-7-8 guiada por un astro que recorre
// una parábola día/noche. Convertido de HTML/CSS/JS vanilla a React nativo.

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { sayAsync, stopSpeech } from '../../lib/tts'
import { TutorialOverlay, TutorialHelpButton, useTutorial } from '../shared/TutorialOverlay'

// ─── TIEMPOS 4-7-8 (en ms) ────────────────────────────────────────────────────
const DURATION_INHALE = 4000
const DURATION_HOLD   = 7000
const DURATION_EXHALE = 8000
const TOTAL_DURATION  = DURATION_INHALE + DURATION_HOLD + DURATION_EXHALE
const PEAK_PROGRESS    = DURATION_INHALE / TOTAL_DURATION
const EXHALE_PROGRESS  = (DURATION_INHALE + DURATION_HOLD) / TOTAL_DURATION

// ─── HELPERS DE COLOR ──────────────────────────────────────────────────────────
function parseHex(hex) {
  let c = hex.substring(1)
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
  return {
    r: parseInt(c.substring(0,2),16),
    g: parseInt(c.substring(2,4),16),
    b: parseInt(c.substring(4,6),16),
  }
}
function mixColors(c1hex, c2hex, weight) {
  const c1 = parseHex(c1hex), c2 = parseHex(c2hex)
  const r = Math.round(c1.r + (c2.r-c1.r)*weight)
  const g = Math.round(c1.g + (c2.g-c1.g)*weight)
  const b = Math.round(c1.b + (c2.b-c1.b)*weight)
  return `rgb(${r}, ${g}, ${b})`
}
function getParabolaY(x, minY, maxY) {
  const heightFactor = 4 * x * (1 - x)
  return maxY - (maxY - minY) * heightFactor
}

// ─── CICLOS NECESARIOS SEGÚN GRAVEDAD (mismo criterio que PandiPulse) ────────
export function calcCyclesNeeded(score = 0.5) {
  const n = Math.round(3 + (1 - score) * 5)
  return Math.min(Math.max(n, 3), 8)
}

// ─── SONIDOS ──────────────────────────────────────────────────────────────────
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
function vibrateSuccess() {
  if ('vibrate' in navigator) { try { navigator.vibrate([40,30,40,30,80,30,120]) } catch {} }
}

// ─── ASSETS DE MASCOTA — Pandi en el horizonte, complementa la escena ────────
function getPetAssets(petId = 'pandi') {
  const base = petId === 'pandi' ? '/panda' : `/${petId}`
  return {
    sit:     `${base}/avatar_neutro.png`,  // sentada tranquila — inhala/mantén
    relax:   `${base}/avatar_happy.png`,   // relajándose — exhala
    calm:    `${base}/avatar_celebrate.png`,
  }
}

// ─── DETECCIÓN DE ORIENTACIÓN ─────────────────────────────────────────────────
function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true
  )
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    check()
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])
  return isLandscape
}

// ─── AVISO DE GIRAR EL MÓVIL ──────────────────────────────────────────────────
function RotateDeviceNotice() {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:90, background:'#0f1420',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:32, textAlign:'center' }}>
      <motion.div
        animate={{ rotate:[0,90,90,0] }}
        transition={{ duration:2.2, repeat:Infinity, times:[0,0.4,0.85,1] }}
        style={{ fontSize:56, marginBottom:20 }}>
        📱
      </motion.div>
      <p style={{ color:'white', fontSize:17, fontWeight:800, margin:'0 0 8px' }}>
        Gira tu móvil
      </p>
      <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13, maxWidth:260, lineHeight:1.5 }}>
        El Viaje del Sol necesita la pantalla apaisada para que puedas seguir todo el recorrido
      </p>
    </motion.div>
  )
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function SunJourney({
  mode = 'free', score = 0.5, petId = 'pandi',
  onClose, onComplete,
}) {
  const { addXP } = useStore()
  const assets = getPetAssets(petId)
  const tutorial = useTutorial('sun_journey')
  const isLandscape = useIsLandscape()

  const cyclesNeeded = mode === 'guided' ? calcCyclesNeeded(score) : 3

  const [phase, setPhase]         = useState('ready') // ready | counting | running | success
  const [breathState, setBreathState] = useState('inhale') // inhale | hold | exhale
  const [countdownText, setCountdownText] = useState('')
  const [cyclesDone, setCyclesDone] = useState(0)
  const [isNight, setIsNight]     = useState(false)
  const [muted, setMuted]         = useState(false)

  // Posición visual del astro (en %)
  const [astroPos, setAstroPos]   = useState({ x: -10, y: 90 })
  const [skyColors, setSkyColors] = useState({
    top: '#ff7043', mid: '#ffb74d', bottom: '#ffe082',
    horizon: '#7cb342', mountain1: '#9ccc65', mountain2: '#8bc34a',
    text: '#263238', cloudBg: 'rgba(255,255,255,0.85)',
  })
  const [peakCloudOpacity, setPeakCloudOpacity]     = useState(0)
  const [exhaleCloudOpacity, setExhaleCloudOpacity] = useState(0)

  const startTimeRef = useRef(null)
  const rafRef        = useRef(null)
  const stateRef       = useRef('inhale')
  const isNightRef     = useRef(false)
  const containerRef   = useRef(null)

  const minY = 12, maxY = 90 // % de la pantalla

  function updateEnvironment(progress, heightPercent, night) {
    if (!night) {
      let top, mid, bottom
      if (progress < PEAK_PROGRESS) {
        const p = progress / PEAK_PROGRESS
        top = mixColors('#ff7043', '#29b6f6', p)
        mid = mixColors('#ffb74d', '#e1f5fe', p)
        bottom = mixColors('#ffe082', '#b3e5fc', p)
      } else if (progress < EXHALE_PROGRESS) {
        top = '#29b6f6'; mid = '#e1f5fe'; bottom = '#b3e5fc'
      } else {
        const p = (progress - EXHALE_PROGRESS) / (1 - EXHALE_PROGRESS)
        top    = p < 0.5 ? mixColors('#29b6f6','#4a148c', p*2) : mixColors('#4a148c','#030712', (p-0.5)*2)
        mid    = p < 0.5 ? mixColors('#e1f5fe','#ff5722', p*2) : mixColors('#ff5722','#0b132b', (p-0.5)*2)
        bottom = p < 0.5 ? mixColors('#b3e5fc','#311b92', p*2) : mixColors('#311b92','#1c2541', (p-0.5)*2)
      }
      const groundP = progress > EXHALE_PROGRESS ? (progress-EXHALE_PROGRESS)/(1-EXHALE_PROGRESS) : 0
      setSkyColors({
        top, mid, bottom,
        horizon:   mixColors('#7cb342','#050814', groundP),
        mountain1: mixColors('#9ccc65','#080d1a', groundP),
        mountain2: mixColors('#8bc34a','#0c1326', groundP),
        text:      mixColors('#263238','#f1f5f9', progress),
        cloudBg:   mixColors('rgba(255,255,255,0.85)','rgba(30,41,59,0.85)', progress),
      })
    } else {
      let top, mid, bottom, m1, m2, hor
      if (progress < EXHALE_PROGRESS) {
        top = '#030712'; mid = '#0b132b'; bottom = '#1c2541'
        m1  = mixColors('#080d1a','#223344', heightPercent)
        m2  = mixColors('#0c1326','#2e445c', heightPercent)
        hor = mixColors('#050814','#1f3047', heightPercent)
      } else {
        const p = (progress - EXHALE_PROGRESS) / (1 - EXHALE_PROGRESS)
        top = mixColors('#030712','#ff7043', p)
        mid = mixColors('#0b132b','#ffb74d', p)
        bottom = mixColors('#1c2541','#ffe082', p)
        const cm1 = mixColors('#080d1a','#223344', heightPercent)
        const cm2 = mixColors('#0c1326','#2e445c', heightPercent)
        const chor = mixColors('#050814','#1f3047', heightPercent)
        m1  = mixColors(cm1,'#7cb342', p)
        m2  = mixColors(cm2,'#689f38', p)
        hor = mixColors(chor,'#558b2f', p)
      }
      setSkyColors({
        top, mid, bottom, horizon: hor, mountain1: m1, mountain2: m2,
        text:    mixColors('#f1f5f9','#263238', progress),
        cloudBg: mixColors('rgba(30,41,59,0.85)','rgba(255,255,255,0.85)', progress),
      })
    }
  }

  function animate(timestamp) {
    if (!startTimeRef.current) startTimeRef.current = timestamp
    const elapsed = timestamp - startTimeRef.current

    let st
    if (elapsed < DURATION_INHALE) st = 'inhale'
    else if (elapsed < DURATION_INHALE + DURATION_HOLD) st = 'hold'
    else if (elapsed < TOTAL_DURATION) st = 'exhale'
    else { handleCycleEnd(); return }

    if (st !== stateRef.current) {
      stateRef.current = st
      setBreathState(st)
      if (st === 'hold')   { setPeakCloudOpacity(1); if (!muted) sayAsync('Mantén', { rate:0.85, volume:0.7 }) }
      if (st === 'exhale')  { setPeakCloudOpacity(0); setExhaleCloudOpacity(1); if (!muted) sayAsync('Exhala', { rate:0.85, volume:0.7 }) }
    }

    const progress = elapsed / TOTAL_DURATION
    const x = -10 + 120 * progress // % desde -10% a 110%
    const y = getParabolaY(progress, minY, maxY)
    const heightPercent = (maxY - y) / (maxY - minY)

    updateEnvironment(progress, heightPercent, isNightRef.current)
    setAstroPos({ x, y })

    rafRef.current = requestAnimationFrame(animate)
  }

  function handleCycleEnd() {
    cancelAnimationFrame(rafRef.current)
    isNightRef.current = !isNightRef.current
    setIsNight(isNightRef.current)
    setPeakCloudOpacity(0); setExhaleCloudOpacity(0)

    setCyclesDone(c => {
      const next = c + 1
      if (next >= cyclesNeeded) {
        completeSession()
        return next
      }
      runCountdown()
      return next
    })
  }

  function runCountdown() {
    setPhase('counting')
    setCountdownText('¿Preparado?')
    const t1 = setTimeout(() => setCountdownText('3'), 1500)
    const t2 = setTimeout(() => setCountdownText('2'), 2300)
    const t3 = setTimeout(() => setCountdownText('1'), 3100)
    const t4 = setTimeout(() => {
      setCountdownText('¡Inhala!')
      if (!muted) sayAsync('Inhala', { rate:0.85, volume:0.7 })
      setTimeout(() => {
        setPhase('running')
        startTimeRef.current = null
        stateRef.current = 'inhale'
        setBreathState('inhale')
        rafRef.current = requestAnimationFrame(animate)
      }, 600)
    }, 3900)
    return () => [t1,t2,t3,t4].forEach(clearTimeout)
  }

  function startJourney() {
    setAstroPos({ x: -10, y: maxY })
    runCountdown()
  }

  function completeSession() {
    cancelAnimationFrame(rafRef.current)
    setPhase('success')
    if (!muted) {
      vibrateSuccess(); playSuccessChime()
      setTimeout(() => sayAsync('Has completado el viaje. Lleva esta calma contigo.'), 400)
    }
    addXP?.(cyclesNeeded * 10)
    onComplete?.({ cyclesCompleted: cyclesNeeded })
  }

  function handleClose() {
    cancelAnimationFrame(rafRef.current)
    stopSpeech()
    onClose?.()
  }

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); stopSpeech() }, [])

  const astroEmoji = isNight ? '🌙' : '☀️'
  const astroGlow  = isNight ? '0 0 40px #f5f5f5, 0 0 15px #b0bec5' : '0 0 60px #ffb300, 0 0 20px #fff9c4'

  // Posición de las nubes guía (fijas en el recorrido)
  const peakCloudPos   = { x: -10 + 120*PEAK_PROGRESS,   y: getParabolaY(PEAK_PROGRESS, minY, maxY) }
  const exhaleCloudPos = { x: -10 + 120*EXHALE_PROGRESS, y: getParabolaY(EXHALE_PROGRESS, minY, maxY) }

  if (!isLandscape) {
    return (
      <AnimatePresence>
        <RotateDeviceNotice />
      </AnimatePresence>
    )
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      ref={containerRef}
      style={{
        position:'fixed', inset:0, zIndex:80, overflow:'hidden',
        background: `linear-gradient(to bottom, ${skyColors.top}, ${skyColors.mid}, ${skyColors.bottom})`,
        transition: 'background 0.3s linear',
      }}>

      {/* Header */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:20,
        display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px' }}>
        <button onClick={handleClose}
          style={{ width:34, height:34, borderRadius:11, border:'none', cursor:'pointer',
            background:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={15} color={skyColors.text} />
        </button>
        <p style={{ color:skyColors.text, fontSize:11, fontWeight:700,
          textTransform:'uppercase', letterSpacing:'.05em', opacity:0.7 }}>
          El Viaje del Sol
        </p>
        <div style={{ display:'flex', gap:6 }}>
          <TutorialHelpButton onClick={tutorial.reopen} dark={false} />
          <button onClick={() => setMuted(m => !m)}
            style={{ width:34, height:34, borderRadius:11, border:'none', cursor:'pointer',
              background:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            {muted ? <VolumeX size={15} color={skyColors.text} /> : <Volume2 size={15} color={skyColors.text} />}
          </button>
        </div>
      </div>

      {/* Astro (sol/luna) */}
      {(phase === 'running' || phase === 'counting') && (
        <div style={{
          position:'absolute', left:`${astroPos.x}%`, top:`${astroPos.y}%`,
          transform:'translate(-50%,-50%)', width:60, height:60, borderRadius:'50%',
          background: isNight ? '#eceff1' : '#ffca28',
          boxShadow: astroGlow, zIndex:5, display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, transition:'background 0.3s',
        }}>
          {astroEmoji}
        </div>
      )}

      {/* Nubes guía */}
      {phase === 'running' && (
        <>
          <motion.div animate={{ opacity: peakCloudOpacity }}
            style={{ position:'absolute', left:`${peakCloudPos.x}%`, top:`${peakCloudPos.y}%`,
              transform:'translate(-50%,-50%)', background:skyColors.cloudBg, borderRadius:30,
              padding:'10px 18px', zIndex:4, fontSize:12, fontWeight:800, color:skyColors.text,
              boxShadow:'0 8px 20px rgba(0,0,0,0.1)' }}>
            RETÉN
          </motion.div>
          <motion.div animate={{ opacity: exhaleCloudOpacity }}
            style={{ position:'absolute', left:`${exhaleCloudPos.x}%`, top:`${exhaleCloudPos.y}%`,
              transform:'translate(-50%,-50%)', background:skyColors.cloudBg, borderRadius:30,
              padding:'10px 18px', zIndex:4, fontSize:12, fontWeight:800, color:skyColors.text,
              boxShadow:'0 8px 20px rgba(0,0,0,0.1)' }}>
            EXHALA
          </motion.div>
        </>
      )}

      {/* Montañas + horizonte */}
      <div style={{ position:'absolute', bottom:40, left:'10%', zIndex:2,
        width:0, height:0, borderLeft:'80px solid transparent', borderRight:'80px solid transparent',
        borderBottom:`70px solid ${skyColors.mountain1}`, transition:'border-color 0.3s' }} />
      <div style={{ position:'absolute', bottom:40, right:'15%', zIndex:2,
        width:0, height:0, borderLeft:'100px solid transparent', borderRight:'100px solid transparent',
        borderBottom:`95px solid ${skyColors.mountain2}`, transition:'border-color 0.3s' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:40,
        background:skyColors.horizon, zIndex:6, transition:'background-color 0.3s',
        boxShadow:'0 -4px 16px rgba(0,0,0,0.08)' }} />

      {/* Pandi en el horizonte — complementa la escena */}
      {(phase === 'running' || phase === 'counting') && (
        <motion.img
          src={breathState === 'exhale' ? assets.relax : assets.sit}
          alt="Pandi"
          animate={{ scale: breathState === 'inhale' ? [1, 1.04] : 1 }}
          transition={{ duration: DURATION_INHALE/1000, ease:'easeInOut' }}
          style={{ position:'absolute', bottom:32, left:'8%', width:54, height:54,
            objectFit:'contain', zIndex:7 }}
          onError={e => e.target.style.display='none'} />
      )}

      {/* Pantalla ready / counting / success — nube central */}
      <AnimatePresence>
        {(phase === 'ready' || phase === 'counting') && (
          <motion.div
            initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.85 }}
            style={{ position:'absolute', top:'42%', left:'50%', transform:'translate(-50%,-50%)',
              zIndex:25, background:skyColors.cloudBg, borderRadius:36,
              padding:'34px 36px', textAlign:'center', minWidth:220,
              boxShadow:'0 16px 40px rgba(0,0,0,0.15)', pointerEvents: phase==='counting' ? 'none' : 'auto' }}>
            <p style={{ color:skyColors.text, fontSize:phase==='counting' ? 26 : 18,
              fontWeight:800, margin:0 }}>
              {phase === 'ready' ? 'Iniciar viaje' : countdownText}
            </p>
            {phase === 'ready' && (
              <>
                <p style={{ color:skyColors.text, opacity:0.6, fontSize:12, margin:'8px 0 18px' }}>
                  Respiración 4-7-8 · {cyclesNeeded} ciclos
                </p>
                <motion.button whileTap={{ scale:0.95 }} onClick={startJourney}
                  style={{ padding:'12px 32px', borderRadius:18, border:'none', cursor:'pointer',
                    background:'linear-gradient(135deg,#FF9800,#FFC107)', color:'white',
                    fontWeight:800, fontSize:14 }}>
                  Empezar
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {phase === 'success' && (
          <motion.div
            initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
            style={{ position:'absolute', top:'42%', left:'50%', transform:'translate(-50%,-50%)',
              zIndex:25, background:skyColors.cloudBg, borderRadius:36,
              padding:'34px 36px', textAlign:'center', minWidth:240,
              boxShadow:'0 16px 40px rgba(0,0,0,0.15)' }}>
            <p style={{ fontSize:36, margin:'0 0 8px' }}>🌅</p>
            <p style={{ color:skyColors.text, fontSize:17, fontWeight:800, margin:0 }}>
              Viaje completado
            </p>
            <p style={{ color:skyColors.text, opacity:0.6, fontSize:12, margin:'6px 0 18px' }}>
              +{cyclesNeeded * 10} XP de calma
            </p>
            <motion.button whileTap={{ scale:0.95 }} onClick={handleClose}
              style={{ padding:'12px 32px', borderRadius:18, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#FF9800,#FFC107)', color:'white',
                fontWeight:800, fontSize:14 }}>
              Continuar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progreso de ciclos */}
      {(phase === 'running' || phase === 'counting') && (
        <div style={{ position:'absolute', bottom:50, left:'50%', transform:'translateX(-50%)',
          zIndex:10, display:'flex', gap:6 }}>
          {Array.from({ length: cyclesNeeded }).map((_, i) => (
            <div key={i} style={{ width: i < cyclesDone ? 18 : 7, height:7, borderRadius:4,
              background: i < cyclesDone ? '#FF9800' : 'rgba(255,255,255,0.4)',
              transition:'all 0.3s' }} />
          ))}
        </div>
      )}

      {/* Tutorial */}
      <TutorialOverlay
        show={tutorial.show}
        onClose={tutorial.close}
        title="El Viaje del Sol"
        subtitle="Sigue al sol y a la luna en su recorrido respirando con calma"
        steps={[
          { icon: '☀️', text: 'Inhala mientras el sol sube — 4 segundos' },
          { icon: '☁️', text: 'Mantén el aire cuando llegue a la nube «RETÉN» — 7 segundos' },
          { icon: '🌙', text: 'Exhala mientras desciende hacia la nube «EXHALA» — 8 segundos' },
          { icon: '🔄', text: 'Cada viaje completo alterna entre sol y luna, día y noche' },
        ]}
      />
    </motion.div>
  )
}
