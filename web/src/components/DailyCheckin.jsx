// src/components/DailyCheckin.jsx
// Bottom sheet de check-in diario — aparece una vez al día, discreto y rápido

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../contexts/ThemeProvider'

const ENERGY_OPTIONS = [
  { v:1, emoji:'🪨', label:'Sin energía' },
  { v:2, emoji:'😴', label:'Cansado' },
  { v:3, emoji:'😐', label:'Normal' },
  { v:4, emoji:'⚡', label:'Activo' },
  { v:5, emoji:'🔥', label:'Al máximo' },
]

const STRESS_OPTIONS = [
  { v:1, emoji:'😌', label:'Tranquilo' },
  { v:2, emoji:'🙂', label:'Bien' },
  { v:3, emoji:'😐', label:'Regular' },
  { v:4, emoji:'😬', label:'Tenso' },
  { v:5, emoji:'🤯', label:'Muy estresado' },
]

const MOOD_OPTIONS = [
  { v:'great',   emoji:'🤩', label:'Genial' },
  { v:'good',    emoji:'😊', label:'Bien' },
  { v:'neutral', emoji:'😐', label:'Normal' },
  { v:'low',     emoji:'😞', label:'Bajo' },
  { v:'bad',     emoji:'😩', label:'Mal' },
]

export default function DailyCheckin() {
  const { theme } = useTheme()
  const { coachState, saveCheckin, profile } = useStore()

  const [show,    setShow]    = useState(false)
  const [step,    setStep]    = useState(0)  // 0=energy, 1=stress, 2=mood
  const [energy,  setEnergy]  = useState(null)
  const [stress,  setStress]  = useState(null)
  const [mood,    setMood]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)

  useEffect(() => {
    // Solo mostrar si no se ha hecho el check-in hoy
    if (coachState.checkinDone) return

    // Verificar localStorage por si ya se hizo hoy
    try {
      const lastCheckin = localStorage.getItem('pandi_checkin_date')
      const today = new Date().toISOString().split('T')[0]
      if (lastCheckin === today) return
    } catch {}

    const t = setTimeout(() => setShow(true), 4000)
    return () => clearTimeout(t)
  }, [coachState.checkinDone])

  function dismiss() {
    setShow(false)
  }

  async function finish(moodValue) {
    if (!energy || !stress) return
    setSaving(true)
    await saveCheckin({ energy_level: energy, stress_level: stress, mood: moodValue || mood })
    try {
      localStorage.setItem('pandi_checkin_date', new Date().toISOString().split('T')[0])
    } catch {}
    setSaving(false)
    setDone(true)
    setTimeout(() => setShow(false), 1800)
  }

  function selectEnergy(v) {
    setEnergy(v)
    setTimeout(() => setStep(1), 300)
  }

  function selectStress(v) {
    setStress(v)
    setTimeout(() => setStep(2), 300)
  }

  function selectMood(v) {
    setMood(v)
    finish(v)
  }

  const name = profile?.name?.split(' ')[0] || ''

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay semitransparente */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={dismiss}
            style={{
              position:'fixed', inset:0, zIndex:45,
              background:'rgba(0,0,0,0.25)',
              backdropFilter:'blur(2px)',
            }}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
            transition={{ type:'spring', damping:28, stiffness:300 }}
            style={{
              position:'fixed', bottom:0, left:0, right:0, zIndex:46,
              background:theme.bg,
              borderTopLeftRadius:28, borderTopRightRadius:28,
              boxShadow:'0 -8px 40px rgba(0,0,0,0.15)',
              padding:'16px 20px 48px',
            }}>

            {/* Handle */}
            <div style={{
              width:36, height:4, borderRadius:2,
              background:'rgba(0,0,0,0.1)',
              margin:'0 auto 20px',
            }} />

            {/* Estado: completado */}
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done"
                  initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                  style={{ textAlign:'center', padding:'8px 0 16px' }}>
                  <p style={{ fontSize:32, margin:'0 0 8px' }}>🐾</p>
                  <p style={{ fontSize:17, fontWeight:800, color:theme.text, margin:'0 0 4px' }}>
                    ¡Gracias{name ? `, ${name}` : ''}!
                  </p>
                  <p style={{ fontSize:13, color:theme.textMuted, margin:0 }}>
                    Ya sé cómo acompañarte hoy.
                  </p>
                </motion.div>

              ) : (
                <motion.div key={`step-${step}`}
                  initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}>

                  {/* Progreso */}
                  <div style={{ display:'flex', gap:4, marginBottom:16 }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i}
                        animate={{
                          background: i <= step ? theme.primary : theme.surface2,
                          width: i === step ? 24 : 8,
                        }}
                        style={{ height:3, borderRadius:2 }}
                        transition={{ duration:0.3 }}
                      />
                    ))}
                  </div>

                  {/* Pregunta */}
                  {step === 0 && (
                    <>
                      <p style={{ fontSize:16, fontWeight:800, color:theme.text, margin:'0 0 4px' }}>
                        ¿Cómo está tu energía hoy?
                      </p>
                      <p style={{ fontSize:13, color:theme.textMuted, margin:'0 0 16px' }}>
                        Solo un segundo — prometo no ser pesado 😊
                      </p>
                      <div style={{ display:'flex', gap:8 }}>
                        {ENERGY_OPTIONS.map(o => (
                          <motion.button key={o.v} whileTap={{ scale:0.93 }}
                            onClick={() => selectEnergy(o.v)}
                            style={{
                              flex:1, padding:'10px 4px', borderRadius:14,
                              border:`1.5px solid ${energy===o.v ? theme.primary : theme.border}`,
                              background: energy===o.v ? `${theme.primary}15` : theme.surface2,
                              cursor:'pointer', textAlign:'center',
                            }}>
                            <p style={{ fontSize:22, margin:'0 0 2px' }}>{o.emoji}</p>
                            <p style={{ fontSize:9, color:energy===o.v?theme.primary:theme.textMuted, margin:0, fontWeight:600 }}>
                              {o.label}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <p style={{ fontSize:16, fontWeight:800, color:theme.text, margin:'0 0 4px' }}>
                        ¿Cuánto estrés llevas encima?
                      </p>
                      <p style={{ fontSize:13, color:theme.textMuted, margin:'0 0 16px' }}>
                        Sin juicios — solo quiero saber cómo ayudarte.
                      </p>
                      <div style={{ display:'flex', gap:8 }}>
                        {STRESS_OPTIONS.map(o => (
                          <motion.button key={o.v} whileTap={{ scale:0.93 }}
                            onClick={() => selectStress(o.v)}
                            style={{
                              flex:1, padding:'10px 4px', borderRadius:14,
                              border:`1.5px solid ${stress===o.v ? theme.primary : theme.border}`,
                              background: stress===o.v ? `${theme.primary}15` : theme.surface2,
                              cursor:'pointer', textAlign:'center',
                            }}>
                            <p style={{ fontSize:22, margin:'0 0 2px' }}>{o.emoji}</p>
                            <p style={{ fontSize:9, color:stress===o.v?theme.primary:theme.textMuted, margin:0, fontWeight:600 }}>
                              {o.label}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <p style={{ fontSize:16, fontWeight:800, color:theme.text, margin:'0 0 4px' }}>
                        Y en general... ¿cómo estás?
                      </p>
                      <p style={{ fontSize:13, color:theme.textMuted, margin:'0 0 16px' }}>
                        Última pregunta, lo prometo 🐾
                      </p>
                      <div style={{ display:'flex', gap:8 }}>
                        {MOOD_OPTIONS.map(o => (
                          <motion.button key={o.v} whileTap={{ scale:0.93 }}
                            onClick={() => selectMood(o.v)}
                            style={{
                              flex:1, padding:'10px 4px', borderRadius:14,
                              border:`1.5px solid ${mood===o.v ? theme.primary : theme.border}`,
                              background: mood===o.v ? `${theme.primary}15` : theme.surface2,
                              cursor:'pointer', textAlign:'center',
                            }}>
                            <p style={{ fontSize:22, margin:'0 0 2px' }}>{o.emoji}</p>
                            <p style={{ fontSize:9, color:mood===o.v?theme.primary:theme.textMuted, margin:0, fontWeight:600 }}>
                              {o.label}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón saltar — discreto */}
            {!done && (
              <motion.button onClick={dismiss}
                style={{
                  display:'block', margin:'16px auto 0',
                  background:'none', border:'none',
                  fontSize:12, color:theme.textMuted,
                  cursor:'pointer',
                }}>
                Ahora no
              </motion.button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
