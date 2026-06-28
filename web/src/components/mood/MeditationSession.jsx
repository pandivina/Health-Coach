// web/src/components/mood/MeditationSession.jsx
// Sesión de meditación guiada con frases de audio + ambiente

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../contexts/ThemeProvider'
import { useSessionAudio, AMBIENT_OPTIONS, MED_DURATIONS } from '../../hooks/useSessionAudio'

export default function MeditationSession({ onClose }) {
  const { theme } = useTheme()
  const { startMeditation, stopAll, playUI } = useSessionAudio()

  const [step,      setStep]      = useState('config') // config | active | done
  const [duration,  setDuration]  = useState(60)
  const [ambient,   setAmbient]   = useState('bowls')
  const [elapsed,   setElapsed]   = useState(0)
  const [paused,    setPaused]    = useState(false)
  const timerRef = { current: null }

  // Cronómetro de la sesión
  useEffect(() => {
    if (step !== 'active' || paused) return
    const t = setInterval(() => {
      setElapsed(s => {
        if (s + 1 >= duration) {
          clearInterval(t)
          return duration
        }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [step, paused, duration])

  // Cuando llega al tiempo — terminar
  useEffect(() => {
    if (elapsed >= duration && step === 'active') {
      playUI('brillo.wav', 0.5)
      stopAll()
      setStep('done')
    }
  }, [elapsed, duration, step])

  function handleStart() {
    playUI('apertura.wav', 0.5)
    setElapsed(0)
    setPaused(false)

    startMeditation(duration, ambient, () => {
      // onEnd del audio — puede terminar antes del timer si no hay más tracks
    })
    setStep('active')
  }

  function handleStop() {
    stopAll()
    setStep('done')
  }

  const pct      = elapsed / duration
  const remaining = duration - elapsed
  const mins     = Math.floor(remaining / 60)
  const secs     = remaining % 60

  // Fase visual según progreso
  const visualPhase = pct < 0.15 ? 'intro'
                    : pct < 0.85 ? 'main'
                    : 'closing'

  const PHASE_LABELS = { intro:'Preparando tu espacio...', main:'Meditando', closing:'Cerrando la sesión...' }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:400 }}>

      {/* CONFIG */}
      {step === 'config' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <p style={{ fontSize:15, fontWeight:800, color:theme.text, margin:0 }}>
            Sesión de meditación
          </p>

          {/* Duración */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:theme.textMuted,
              textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 8px' }}>
              Duración
            </p>
            <div style={{ display:'flex', gap:8 }}>
              {MED_DURATIONS.map(d => (
                <button key={d.secs} onClick={() => setDuration(d.secs)}
                  style={{ flex:1, padding:'12px 6px', borderRadius:14, border:'none', cursor:'pointer',
                    background: duration===d.secs ? theme.primary : theme.surface2,
                    color: duration===d.secs ? 'white' : theme.textMuted,
                    fontSize:13, fontWeight:700 }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ambiente */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:theme.textMuted,
              textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 8px' }}>
              Ambiente sonoro
            </p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {AMBIENT_OPTIONS.map(a => (
                <button key={a.id} onClick={() => setAmbient(a.id)}
                  style={{ padding:'8px 12px', borderRadius:12, border:'none', cursor:'pointer',
                    fontSize:12, fontWeight:600,
                    background: ambient===a.id ? theme.primary : theme.surface2,
                    color: ambient===a.id ? 'white' : theme.textMuted }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <motion.button whileTap={{ scale:0.97 }} onClick={handleStart}
            style={{ padding:'14px', borderRadius:16, border:'none', cursor:'pointer',
              background:`linear-gradient(135deg, #818CF8, ${theme.primary})`,
              color:'white', fontSize:15, fontWeight:800, marginTop:4 }}>
            ▶ Comenzar meditación
          </motion.button>
        </motion.div>
      )}

      {/* ACTIVE */}
      {step === 'active' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'space-between', flex:1, paddingTop:8, paddingBottom:16 }}>

          {/* Fase */}
          <p style={{ fontSize:12, color:theme.textMuted, margin:0, fontWeight:600 }}>
            {PHASE_LABELS[visualPhase]}
          </p>

          {/* Orbe de meditación */}
          <div style={{ position:'relative', width:200, height:200,
            display:'flex', alignItems:'center', justifyContent:'center' }}>

            {/* Anillo progreso */}
            <svg width={200} height={200} style={{ position:'absolute', transform:'rotate(-90deg)' }}>
              <circle cx={100} cy={100} r={80} fill="none"
                stroke="#818CF820" strokeWidth={8} />
              <motion.circle cx={100} cy={100} r={80} fill="none"
                stroke="#818CF8" strokeWidth={8}
                strokeDasharray={2*Math.PI*80}
                animate={{ strokeDashoffset: 2*Math.PI*80*(1-pct) }}
                transition={{ duration:1 }}
                strokeLinecap="round" />
            </svg>

            {/* Orbe pulsante */}
            <motion.div
              animate={{ scale:[1,1.06,1], opacity:[0.6,1,0.6] }}
              transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:130, height:130, borderRadius:'50%',
                background:'linear-gradient(135deg,#818CF820,#6EE7B720)',
                display:'flex', flexDirection:'column', alignItems:'center',
                justifyContent:'center', boxShadow:'0 0 50px #818CF840' }}>
              <span style={{ fontSize:42 }}>🧘</span>
            </motion.div>

            {/* Tiempo restante */}
            <div style={{ position:'absolute', bottom:-32, textAlign:'center' }}>
              <span style={{ fontSize:28, fontWeight:900, color:'#818CF8' }}>
                {mins > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : `${secs}s`}
              </span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div style={{ width:'100%', marginTop:16 }}>
            <div style={{ height:4, borderRadius:2, background:theme.surface2, overflow:'hidden' }}>
              <motion.div animate={{ width:`${pct*100}%` }} transition={{ duration:1 }}
                style={{ height:'100%', borderRadius:2,
                  background:'linear-gradient(90deg,#818CF8,#6EE7B7)' }} />
            </div>
          </div>

          {/* Controles */}
          <div style={{ display:'flex', gap:10, width:'100%', marginTop:24 }}>
            <button onClick={() => {
                setPaused(p => !p)
                playUI('boton.wav', 0.3)
              }}
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
          <motion.span
            animate={{ scale:[1,1.15,1] }} transition={{ duration:2, repeat:3 }}
            style={{ fontSize:60 }}>✨</motion.span>
          <p style={{ fontSize:18, fontWeight:900, color:theme.text, margin:0 }}>
            Sesión completada
          </p>
          <p style={{ fontSize:13, color:theme.textMuted, margin:0 }}>
            {Math.floor(elapsed/60) > 0 ? `${Math.floor(elapsed/60)} min` : `${elapsed}s`} de meditación
          </p>
          <motion.button whileTap={{ scale:0.97 }} onClick={onClose}
            style={{ padding:'13px 32px', borderRadius:16, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#818CF8,#6EE7B7)',
              color:'white', fontSize:14, fontWeight:800, marginTop:8 }}>
            Cerrar
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
