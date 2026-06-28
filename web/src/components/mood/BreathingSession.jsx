// web/src/components/mood/BreathingSession.jsx
// Sesión guiada de respiración con audio sincronizado

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeProvider'
import { useSessionAudio, AMBIENT_OPTIONS, BREATH_PATTERNS } from '../../hooks/useSessionAudio'

const PHASE_CONFIG = {
  inhale: { label:'Inhala',  color:'#2EC4B6', scale:1.3 },
  hold:   { label:'Retén',   color:'#818CF8', scale:1.3 },
  exhale: { label:'Exhala',  color:'#FF8FA3', scale:0.85 },
}

export default function BreathingSession({ onClose }) {
  const { theme } = useTheme()
  const { startBreathing, stopAll, playUI } = useSessionAudio()

  const [step,        setStep]        = useState('config') // config | active | done
  const [pattern,     setPattern]     = useState('4-4-4')
  const [ambient,     setAmbient]     = useState('ocean')
  const [phase,       setPhase]       = useState('inhale')
  const [phaseSecs,   setPhaseSecs]   = useState(4)
  const [cycle,       setCycle]       = useState(0)
  const [timeLeft,    setTimeLeft]    = useState(0)
  const [totalCycles, setTotalCycles] = useState(5)
  const [paused,      setPaused]      = useState(false)

  // Countdown del tiempo restante en la fase actual
  useEffect(() => {
    if (step !== 'active' || paused || timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [step, paused, timeLeft])

  function handleStart() {
    const pat = BREATH_PATTERNS[pattern]
    playUI('apertura.wav', 0.5)

    startBreathing(
      pat.phases,
      ambient,
      (ph, secs, phaseIdx, cycleNum) => {
        setPhase(ph)
        setPhaseSecs(secs)
        setTimeLeft(secs)
        setCycle(cycleNum + 1)
      },
      () => setStep('done')
    )
    setStep('active')
    setCycle(1)
    const first = pat.phases[0]
    setPhase(first.phase)
    setPhaseSecs(first.secs)
    setTimeLeft(first.secs)
  }

  function handleStop() {
    stopAll()
    playUI('boton.wav', 0.4)
    setStep('done')
  }

  const pat = BREATH_PATTERNS[pattern]
  const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.inhale
  const pct = phaseSecs > 0 ? (timeLeft / phaseSecs) : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:400 }}>

      {/* CONFIG */}
      {step === 'config' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <p style={{ fontSize:15, fontWeight:800, color:theme.text, margin:0 }}>
            Sesión de respiración
          </p>

          {/* Patrón */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:theme.textMuted,
              textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 8px' }}>
              Patrón
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {Object.entries(BREATH_PATTERNS).map(([key, p]) => (
                <button key={key} onClick={() => setPattern(key)}
                  style={{ padding:'12px 14px', borderRadius:14, border:'none', cursor:'pointer',
                    textAlign:'left', background: pattern===key ? theme.primary+'18' : theme.surface2,
                    outline: pattern===key ? `2px solid ${theme.primary}` : 'none' }}>
                  <p style={{ fontSize:13, fontWeight:700, color:theme.text, margin:0 }}>{p.label}</p>
                  <p style={{ fontSize:11, color:theme.textMuted, margin:'2px 0 0' }}>{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Ambiente */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:theme.textMuted,
              textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 8px' }}>
              Sonido de fondo
            </p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {AMBIENT_OPTIONS.map(a => (
                <button key={a.id} onClick={() => setAmbient(a.id)}
                  style={{ padding:'8px 12px', borderRadius:12, border:'none', cursor:'pointer',
                    fontSize:12, fontWeight:600, background: ambient===a.id ? theme.primary : theme.surface2,
                    color: ambient===a.id ? 'white' : theme.textMuted }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <motion.button whileTap={{ scale:0.97 }} onClick={handleStart}
            style={{ padding:'14px', borderRadius:16, border:'none', cursor:'pointer',
              background:`linear-gradient(135deg, ${theme.primary}, #6EE7B7)`,
              color:'white', fontSize:15, fontWeight:800, marginTop:4 }}>
            ▶ Comenzar
          </motion.button>
        </motion.div>
      )}

      {/* ACTIVE */}
      {step === 'active' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'space-between', flex:1, paddingTop:8, paddingBottom:16 }}>

          {/* Ciclo */}
          <p style={{ fontSize:12, color:theme.textMuted, margin:0, fontWeight:600 }}>
            Ciclo {cycle} · {pat.label}
          </p>

          {/* Círculo animado */}
          <div style={{ position:'relative', display:'flex', alignItems:'center',
            justifyContent:'center', width:200, height:200 }}>

            {/* Anillo de progreso */}
            <svg width={200} height={200} style={{ position:'absolute', transform:'rotate(-90deg)' }}>
              <circle cx={100} cy={100} r={80} fill="none"
                stroke={cfg.color + '20'} strokeWidth={8} />
              <motion.circle cx={100} cy={100} r={80} fill="none"
                stroke={cfg.color} strokeWidth={8}
                strokeDasharray={2*Math.PI*80}
                animate={{ strokeDashoffset: 2*Math.PI*80 * pct }}
                transition={{ duration:0.5 }}
                strokeLinecap="round" />
            </svg>

            {/* Orbe pulsante */}
            <motion.div
              animate={{ scale: cfg.scale, background: cfg.color + '30' }}
              transition={{ duration: phaseSecs * 0.9, ease: phase==='inhale' ? 'easeIn' : phase==='exhale' ? 'easeOut' : 'linear' }}
              style={{ width:120, height:120, borderRadius:'50%',
                display:'flex', flexDirection:'column', alignItems:'center',
                justifyContent:'center', boxShadow:`0 0 40px ${cfg.color}40` }}>
              <span style={{ fontSize:36 }}>
                {phase==='inhale' ? '🌬️' : phase==='hold' ? '⏸️' : '💨'}
              </span>
              <span style={{ fontSize:12, fontWeight:800, color:cfg.color, marginTop:4 }}>
                {cfg.label}
              </span>
              <span style={{ fontSize:22, fontWeight:900, color:cfg.color }}>{timeLeft}</span>
            </motion.div>
          </div>

          {/* Controles */}
          <div style={{ display:'flex', gap:10, width:'100%' }}>
            <button onClick={() => setPaused(p => !p)}
              style={{ flex:1, padding:'12px', borderRadius:14, border:'none', cursor:'pointer',
                background: theme.surface2, color:theme.textMuted, fontWeight:700, fontSize:14 }}>
              {paused ? '▶ Continuar' : '⏸ Pausar'}
            </button>
            <motion.button whileTap={{ scale:0.97 }} onClick={handleStop}
              style={{ flex:1, padding:'12px', borderRadius:14, border:'none', cursor:'pointer',
                background:'#FEE2E2', color:'#EF4444', fontWeight:700, fontSize:14 }}>
              Terminar
            </motion.button>
          </div>
        </div>
      )}

      {/* DONE */}
      {step === 'done' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', flex:1, gap:16, textAlign:'center' }}>
          <span style={{ fontSize:56 }}>🌿</span>
          <p style={{ fontSize:18, fontWeight:900, color:theme.text, margin:0 }}>
            Sesión completada
          </p>
          <p style={{ fontSize:13, color:theme.textMuted, margin:0 }}>
            {cycle} ciclos · {pat.label}
          </p>
          <motion.button whileTap={{ scale:0.97 }} onClick={onClose}
            style={{ padding:'13px 32px', borderRadius:16, border:'none', cursor:'pointer',
              background:`linear-gradient(135deg,${theme.primary},#6EE7B7)`,
              color:'white', fontSize:14, fontWeight:800, marginTop:8 }}>
            Cerrar
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
