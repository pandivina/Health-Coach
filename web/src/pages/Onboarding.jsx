import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

// ─── AUDIO ────────────────────────────────────────────────────────────────────
function useAudio() {
  const ambientRef = useRef(null)
  const ctxRef     = useRef(null)

  function getCtx() {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctxRef.current
  }

  function startAmbient() {
    try {
      if (ambientRef.current) return
      const audio = new Audio('/audio/ambient-bowls.mp3')
      audio.loop = true; audio.volume = 0
      audio.play().catch(() => {})
      ambientRef.current = audio
      let v = 0
      const id = setInterval(() => { v = Math.min(v+0.015, 0.25); audio.volume = v; if(v>=0.25) clearInterval(id) }, 100)
    } catch {}
  }

  function stopAmbient() {
    const a = ambientRef.current; if (!a) return
    let v = a.volume
    const id = setInterval(() => { v = Math.max(v-0.03,0); a.volume=v; if(v<=0){clearInterval(id);a.pause();ambientRef.current=null} }, 80)
  }

  function playHeartbeat() {
    try {
      const ctx = getCtx()
      const beat = (t) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = 60
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.25, t+0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, t+0.25)
        osc.start(t); osc.stop(t+0.25)
      }
      beat(ctx.currentTime); beat(ctx.currentTime+0.22)
    } catch {}
  }

  function playTone(freq=528) {
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime+0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.9)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.9)
    } catch {}
  }

  function playDoor() {
    // SUSTITUIR: cargar '/audio/door_open.mp3' cuando esté disponible
    try {
      const ctx = getCtx()
      // Crujido de puerta — ruido + tono descendente
      const bufferSize = ctx.sampleRate * 0.8
      const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data       = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2) * 0.3
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.4, ctx.currentTime)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      noise.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.start(ctx.currentTime)

      // Tono bajo — resonancia de la puerta
      ;[120, 90, 60].forEach((freq, i) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.1
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.15, t + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2)
        osc.start(t); osc.stop(t + 1.2)
      })

      // Whoosh — aire saliendo
      const osc2  = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2); gain2.connect(ctx.destination)
      osc2.type = 'sawtooth'
      osc2.frequency.setValueAtTime(300, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.6)
      gain2.gain.setValueAtTime(0.08, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.6)
    } catch {}
  }

  function playFlash() {
    try {
      const ctx = getCtx()
      ;[528,639,741,852,963].forEach((f,i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = f
        const t = ctx.currentTime + i*0.1
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.12, t+0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, t+1.2)
        osc.start(t); osc.stop(t+1.2)
      })
    } catch {}
  }

  useEffect(() => {
    function handleVisibility() {
      const a = ambientRef.current; if (!a) return
      if (document.hidden) { a.pause() } else { a.play().catch(()=>{}) }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => () => stopAmbient(), [])
  return { startAmbient, stopAmbient, playHeartbeat, playTone, playFlash, playDoor }
}

// ─── PREGUNTAS ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: 'mind',
    bold: '¿Tu mente está lista\npara esta aventura?',
    sub: 'La mente debe dar lugar a este nacimiento...',
    feedback: '"La mente abre el primer espacio."',
    options: [
      { v:'yes',    emoji:'🔥', label:'Sí, llevo tiempo esperando este momento' },
      { v:'unsure', emoji:'🌿', label:'No lo sé, pero aquí estoy' },
      { v:'scared', emoji:'🌊', label:'Tengo miedo, pero quiero intentarlo' },
    ],
  },
  {
    key: 'water',
    bold: 'El agua es el canal.',
    sub: 'El agua no me llena — me conecta.',
    feedback: '"Este canal será nuestro punto de encuentro."',
    options: [
      { v:'none',    emoji:'🏜️', label:'Casi nada — menos de 1 litro' },
      { v:'little',  emoji:'💧', label:'Lo justo — 1 a 1.5 litros' },
      { v:'enough',  emoji:'🌊', label:'Bien — 1.5 a 2 litros' },
      { v:'flowing', emoji:'🌀', label:'Fluyo — más de 2 litros' },
    ],
  },
  {
    key: 'sleep',
    bold: 'El silencio es donde integramos.',
    sub: 'El cuerpo reconstruye lo que el día deshizo.',
    feedback: '"Siento tu ritmo nocturno. Aprenderé a respirar con él."',
    options: [
      { v:'low',       emoji:'🌑', label:'Poco — menos de 5 horas' },
      { v:'irregular', emoji:'🌓', label:'Irregular — 5 a 6 horas' },
      { v:'enough',    emoji:'🌕', label:'Suficiente — 6 a 7 horas' },
      { v:'deep',      emoji:'✨', label:'Profundo — más de 7 horas' },
    ],
  },
  {
    key: 'movement',
    bold: 'El movimiento es el fuego\nque transforma.',
    sub: 'El movimiento no desgasta. Transforma.',
    feedback: '"Tu fuego dará forma a lo que soy."',
    options: [
      { v:'never',     emoji:'🪨', label:'Casi nunca' },
      { v:'sometimes', emoji:'🌿', label:'Una o dos veces por semana' },
      { v:'regular',   emoji:'🔥', label:'Tres o cuatro veces' },
      { v:'daily',     emoji:'⚡', label:'Cada día es una oportunidad' },
    ],
  },
  {
    key: 'food',
    bold: 'Somos lo que elegimos nutrir.',
    sub: '¿De qué tierra vienes?',
    feedback: '"Esta es la base. Desde aquí construimos."',
    options: [
      { v:'omnivore',    emoji:'🍽️', label:'De todo un poco' },
      { v:'vegetarian',  emoji:'🥗', label:'Sin carne' },
      { v:'vegan',       emoji:'🌱', label:'Solo plantas' },
      { v:'pescatarian', emoji:'🐟', label:'Del mar' },
      { v:'keto',        emoji:'🥑', label:'Bajo en carbohidratos' },
      { v:'paleo',       emoji:'🍖', label:'Sin procesar' },
    ],
  },
  {
    key: 'intention',
    bold: 'La intención es el alma.',
    sub: '¿Qué te trajo hasta aquí?',
    feedback: '"Esa es la razón por la que latiré."',
    options: [
      { v:'family',    emoji:'👨‍👩‍👧', label:'Estar presente para quienes amo' },
      { v:'body',      emoji:'💪',    label:'Reconocerme cuando me miro' },
      { v:'health',    emoji:'🏥',    label:'Controlar algo que me preocupa' },
      { v:'energy',    emoji:'⚡',    label:'Tener más energía para lo que importa' },
      { v:'habits',    emoji:'🌱',    label:'Recuperar algo que perdí' },
      { v:'wellbeing', emoji:'🧘',    label:'Cuidarme por primera vez de verdad' },
    ],
  },
]

// ─── CARRUSEL VERTICAL DE OPCIONES ───────────────────────────────────────────
function OptionCarousel({ options, value, onChange, energyColor }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', gap:8,
      maxHeight:'38vh', overflowY:'auto',
      WebkitOverflowScrolling:'touch',
      paddingRight:4,
    }}>
      {options.map((o) => (
        <motion.button
          key={o.v}
          whileTap={{ scale:0.97 }}
          onClick={() => onChange(o.v)}
          style={{
            width:'100%', padding:'12px 16px',
            borderRadius:14, flexShrink:0,
            display:'flex', alignItems:'center', gap:12,
            border:`1.5px solid ${value===o.v ? energyColor+'80' : 'rgba(255,255,255,0.25)'}`,
            background: value===o.v ? `${energyColor}22` : 'rgba(255,255,255,0.12)',
            backdropFilter:'blur(16px)',
            cursor:'pointer', textAlign:'left',
            transition:'all 0.2s',
          }}>
          <span style={{ fontSize:22, flexShrink:0 }}>{o.emoji}</span>
          <span style={{
            fontSize:13, flex:1,
            fontWeight: value===o.v ? 700 : 400,
            color: value===o.v ? energyColor : 'rgba(255,255,255,0.85)',
          }}>
            {o.label}
          </span>
          {value===o.v && (
            <motion.span
              initial={{ scale:0 }} animate={{ scale:1 }}
              style={{ fontSize:16, color:energyColor, flexShrink:0 }}>✓</motion.span>
          )}
        </motion.button>
      ))}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  // Fases:
  // 0 = blur solo
  // 1 = blur + sanctuary_open (intro texto 1)
  // 2 = clouds + sanctuary_open fade out (intro texto 2)
  // 3 = nombre
  // 4-9 = orbe con frames (fase 4 = frame 0 vacío, incrementando)
  // 10 = nacimiento

  const [phase,      setPhase]      = useState(0)
  const [flash,      setFlash]      = useState(false)
  const [openFading, setOpenFading] = useState(false)
  const [qStep,      setQStep]      = useState(0) // pregunta actual dentro de fases 4-9
  const [loading,    setLoading]    = useState(false)
  const [started,    setStarted]    = useState(false)
  const [imgErrs,    setImgErrs]    = useState({})

  const { user, fetchProfile } = useStore()
  const navigate = useNavigate()
  const audio    = useAudio()

  const [form, setForm] = useState({
    name:'', birth_date:'', sex:'other',
    mind:'', water:'', sleep:'', movement:'', food:'', intention:'',
  })
  const set = (k, v) => setForm(f => ({...f, [k]:v}))

  const [orbActivated, setOrbActivated] = useState(false) // true cuando el usuario toca el orbe
  const [smoke,        setSmoke]        = useState(false)  // humo saliendo del orbe
  const [fillLevel,    setFillLevel]    = useState(0)      // 0-6 nivel de llenado del contenedor

  // Fase de orbe: 4 = frame_0 (vacío), 5..9 = frames 1-5 según respuestas
  const orbFrame = phase >= 4 && phase <= 9 ? phase - 4 : -1

  const showBlur   = phase <= 2
  const showOpen   = phase === 1 || (phase === 2 && !openFading)
  const showClouds = phase >= 4
  const showOrb    = phase >= 4 && phase <= 9
  const showBorn   = phase === 10

  // Secuencia automática inicial
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => setPhase(2), 5000)
    const t3 = setTimeout(() => {
      setOpenFading(true)
      setTimeout(() => { setOpenFading(false); setPhase(3) }, 1200)
    }, 9000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  function handleFirstInteraction() {
    if (!started) { setStarted(true); audio.startAmbient() }
  }

  function proceedFromName() {
    handleFirstInteraction()
    if (!form.name.trim()) return
    setPhase(4) // orbe vacío
    setQStep(0)
  }

  function handleAnswer(key, value) {
    handleFirstInteraction()
    set(key, value)
    audio.playTone(440 + qStep * 80)
  }

  function activateOrb() {
    if (orbActivated) return
    handleFirstInteraction()

    // Vibración del móvil
    try { navigator.vibrate?.([40, 30, 60]) } catch {}

    // Sonido de puerta
    audio.playDoor()

    // Humo
    setSmoke(true)
    setTimeout(() => setSmoke(false), 2000)

    // Activar orbe — mostrar preguntas
    setOrbActivated(true)
    setTimeout(() => setPhase(p => p), 300) // trigger re-render
  }

  function nextQuestion() {
    handleFirstInteraction()
    const currentQ = QUESTIONS[qStep]
    if (!form[currentQ.key]) return

    audio.playHeartbeat()
    setFillLevel(f => f + 1)

    if (qStep < QUESTIONS.length - 1) {
      setQStep(q => q + 1)
      setPhase(p => Math.min(p + 1, 9))
    } else {
      setPhase(9)
      setFillLevel(6)
      setTimeout(() => {
        audio.playFlash()
        setFlash(true)
        setTimeout(() => { setFlash(false); setPhase(10) }, 700)
      }, 600)
    }
  }

  async function finish() {
    setLoading(true)
    try {
      const userId = user.id
      const sleepHours   = { low:4, irregular:5.5, enough:7, deep:8 }[form.sleep] || 7
      const trainingDays = { never:0, sometimes:1, regular:3, daily:5 }[form.movement] || 2

      await supabase.from('user_profiles').update({
        name: form.name,
        onboarding_done: true,
        motivation_why: form.intention || null,
      }).eq('id', userId)

      await supabase.from('health_profiles').upsert({
        user_id: userId,
        diet_type: form.food || 'omnivore',
        sleep_hours: sleepHours,
        training_days_per_week: trainingDays,
        onboarding_done: true,
        onboarding_version: 3,
        onboarding_date: new Date().toISOString(),
      }, { onConflict:'user_id' })

      await fetchProfile(userId)
      try { await api.email.welcome() } catch {}
      audio.stopAmbient()
      navigate('/')
    } catch(err) {
      console.error('Onboarding error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const currentQ    = QUESTIONS[qStep]
  const energyColors = ['#A78BFA','#3B82F6','#8B5CF6','#F97316','#22C55E','#EC4899']
  const energyColor  = energyColors[qStep] || '#D4A847'

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', background:'#f5f0e8' }}
      onClick={handleFirstInteraction}>

      {/* ── FONDOS ── */}
      <motion.img src="/panda/onboarding_orb_baby_blur.png" alt=""
        animate={{ opacity: showBlur ? 1 : 0 }}
        transition={{ duration:1.5 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:1 }}
        onError={()=>setImgErrs(e=>({...e,blur:true}))}
      />
      <motion.img src="/panda/onboarding_sanctuary_open.png" alt=""
        animate={{ opacity: showOpen ? 1 : 0 }}
        transition={{ duration: openFading ? 1.2 : 1.8 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:2 }}
        onError={()=>setImgErrs(e=>({...e,open:true}))}
      />
      <motion.img src="/panda/onboarding_clouds.png" alt=""
        animate={{ opacity: showClouds ? 1 : 0 }}
        transition={{ duration:1.8, delay: showClouds ? 0.5 : 0 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:3 }}
        onError={()=>setImgErrs(e=>({...e,clouds:true}))}
      />

      {/* ── ORB ── */}
      <AnimatePresence>
        {showOrb && (
          <motion.div key="orb"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:1.2 }}
            style={{ position:'fixed', inset:0, zIndex:15,
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents: orbActivated ? 'none' : 'all' }}>

            {/* COLUMNA DE LUZ desde arriba */}
            <motion.div
              initial={{ opacity:0, scaleY:0 }}
              animate={{ opacity:[0,0.6,0.4], scaleY:1 }}
              transition={{ duration:2, ease:'easeOut' }}
              style={{
                position:'absolute',
                top:0, left:'50%',
                transform:'translateX(-50%)',
                width:'45vw', maxWidth:200,
                height:'60%',
                background:'linear-gradient(to bottom, rgba(255,240,180,0.5) 0%, rgba(255,220,140,0.2) 60%, transparent 100%)',
                filter:'blur(18px)',
                transformOrigin:'top center',
                pointerEvents:'none',
              }}
            />

            {/* HALO exterior pulsante */}
            <motion.div
              animate={{ scale:[1,1.15,1], opacity:[0.15,0.35,0.15] }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              style={{
                position:'absolute',
                width:'80vw', maxWidth:340,
                height:'80vw', maxWidth2:340,
                borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,220,140,0.4) 0%, rgba(255,180,80,0.1) 50%, transparent 70%)',
                filter:'blur(20px)',
                pointerEvents:'none',
              }}
            />

            {/* PARTÍCULAS flotantes */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                initial={{
                  x: (Math.random() - 0.5) * 160,
                  y: (Math.random() - 0.5) * 200,
                  opacity: 0, scale: 0,
                }}
                animate={{
                  y: [(Math.random()-0.5)*200, (Math.random()-0.5)*200 - 40],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: 'easeInOut',
                }}
                style={{
                  position:'absolute',
                  width: 3 + Math.random() * 4,
                  height: 3 + Math.random() * 4,
                  borderRadius:'50%',
                  background: i % 3 === 0 ? '#FFD97D' : i % 3 === 1 ? '#FFB347' : '#FFF5CC',
                  boxShadow: `0 0 6px 2px ${i % 2 === 0 ? 'rgba(255,220,140,0.8)' : 'rgba(255,180,80,0.6)'}`,
                  pointerEvents:'none',
                }}
              />
            ))}

            <motion.div
              initial={{ scale:0.7, y:40 }}
              animate={{ scale:1, y:0 }}
              transition={{ duration:1.4, type:'spring', damping:18 }}
              style={{ position:'relative', flexShrink:0 }}>

              {/* Glow */}
              <motion.div
                animate={{ scale:[1,1.08,1], opacity:[0.3,0.6,0.3] }}
                transition={{ duration:3.5, repeat:Infinity }}
                style={{
                  position:'absolute', inset:-30, borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(255,220,140,0.65) 0%, transparent 65%)',
                  filter:'blur(32px)',
                }}
              />

              {/* HUMO saliendo — SUSTITUIR por partículas reales si se tiene asset */}
              <AnimatePresence>
                {smoke && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <motion.div key={`smoke-${i}`}
                        initial={{ opacity:0.7, scale:0.3, x:(Math.random()-0.5)*40, y:0 }}
                        animate={{ opacity:0, scale:2+Math.random(), x:(Math.random()-0.5)*80, y:-60-Math.random()*60 }}
                        exit={{ opacity:0 }}
                        transition={{ duration:1.2+Math.random()*0.8, delay:i*0.08, ease:'easeOut' }}
                        style={{
                          position:'absolute',
                          top:'30%', left:'50%',
                          width:20+Math.random()*20, height:20+Math.random()*20,
                          borderRadius:'50%',
                          background:'rgba(255,250,240,0.6)',
                          filter:'blur(8px)',
                          pointerEvents:'none',
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* CONTENEDOR que se llena — visible tras activar */}
              <AnimatePresence>
                {orbActivated && (
                  <motion.div
                    initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{
                      position:'absolute',
                      bottom:'15%', left:'22%',
                      width:'56%', height:'45%',
                      borderRadius:16,
                      overflow:'hidden',
                      border:'1px solid rgba(255,220,140,0.3)',
                      zIndex:2,
                    }}>
                    {/* Fondo del contenedor */}
                    <div style={{
                      position:'absolute', inset:0,
                      background:'rgba(255,240,200,0.08)',
                    }} />
                    {/* Líquido que sube */}
                    <motion.div
                      animate={{ height:`${(fillLevel/6)*100}%` }}
                      transition={{ duration:0.8, type:'spring', damping:20 }}
                      style={{
                        position:'absolute', bottom:0, left:0, right:0,
                        background:'linear-gradient(to top, rgba(255,200,80,0.6), rgba(255,230,140,0.3))',
                        boxShadow:'0 -4px 12px rgba(255,200,80,0.4)',
                      }}
                    />
                    {/* Brillo superior del líquido */}
                    {fillLevel > 0 && (
                      <motion.div
                        animate={{ opacity:[0.4,0.8,0.4] }}
                        transition={{ duration:2, repeat:Infinity }}
                        style={{
                          position:'absolute',
                          bottom:`${(fillLevel/6)*100}%`,
                          left:0, right:0, height:3,
                          background:'rgba(255,240,180,0.9)',
                          filter:'blur(2px)',
                        }}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Frames del orbe — solo se renderizan cuando el orbe está visible */}
              {showOrb && [
                '/panda/orb_frame_0.png',
                '/panda/orb_frame_1.png',
                '/panda/orb_frame_2.png',
                '/panda/orb_frame_3.png',
                '/panda/orb_frame_4.png',
              ].map((frameSrc, i) => (
                <motion.img
                  key={frameSrc}
                  src={frameSrc}
                  alt=""
                  animate={{ opacity: orbFrame === i ? 1 : 0 }}
                  transition={{ duration:0.9 }}
                  style={{
                    position:'fixed', inset:0, zIndex:15,
                    width:'100vw', height:'150vw',
                    marginTop:'32%',
                    pointerEvents:'none',
                  }}
                  onError={()=>setImgErrs(e=>({...e,[`f${i}`]:true}))}
                />
              ))}

              {/* BOTÓN DE TOQUE — solo antes de activar */}
              {!orbActivated && (
                <motion.button
                  animate={{ scale:[1,1.05,1], opacity:[0.7,1,0.7] }}
                  transition={{ duration:2, repeat:Infinity }}
                  onClick={activateOrb}
                  style={{
                    position:'absolute', inset:0,
                    background:'transparent', border:'none',
                    cursor:'pointer', zIndex:20,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    pointerEvents:'all',
                  }}>
                  <motion.div
                    animate={{ scale:[1,1.2,1], opacity:[0.5,1,0.5] }}
                    transition={{ duration:1.5, repeat:Infinity }}
                    style={{
                      width:44, height:44, borderRadius:'50%',
                      background:'rgba(255,220,140,0.3)',
                      border:'2px solid rgba(255,220,140,0.6)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:20,
                    }}>
                    ✨
                  </motion.div>
                </motion.button>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANDA BABY LIBRE ── */}
      <AnimatePresence>
        {showBorn && (
          <motion.div key="born"
            initial={{ opacity:0, scale:0.7, y:30 }}
            animate={{ opacity:1, scale:1, y:0 }}
            transition={{ type:'spring', damping:14, delay:0.2 }}
            style={{ position:'fixed', inset:0, zIndex:15,
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents:'none' }}>
            <motion.div style={{ position:'relative', width:220 }}>
              <motion.div
                animate={{ scale:[1,1.1,1], opacity:[0.3,0.55,0.3] }}
                transition={{ duration:3, repeat:Infinity }}
                style={{
                  position:'absolute', inset:-30, borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(255,180,100,0.6) 0%, transparent 70%)',
                  filter:'blur(24px)',
                }}
              />
              <motion.img src="/panda/panda_baby.png" alt="Pandi"
                animate={{ y:[0,-10,0] }}
                transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
                style={{ width:'100%', objectFit:'contain', position:'relative', zIndex:1 }}
                onError={()=>setImgErrs(e=>({...e,baby:true}))}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESTELLO ── */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:[0,1,0] }}
            transition={{ duration:0.6, times:[0,0.25,1] }}
            style={{ position:'fixed', inset:0, zIndex:50, background:'white', pointerEvents:'none' }}
          />
        )}
      </AnimatePresence>

      {/* ── INTRO 1 ── */}
      <AnimatePresence>
        {phase === 1 && (
          <motion.div key="i1"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:1 }}
            style={{ position:'absolute', inset:0, zIndex:20,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'rgba(255,252,245,0.55)', backdropFilter:'blur(12px)',
              borderRadius:24, padding:'20px 32px', textAlign:'center', margin:'0 32px' }}>
              <p style={{ fontSize:22, fontWeight:900, color:'#1A2332', margin:0, lineHeight:1.3 }}>
                Toda vida comienza<br/>con energía.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTRO 2 ── */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div key="i2"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:1 }}
            style={{ position:'absolute', inset:0, zIndex:20,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'rgba(255,252,245,0.45)', backdropFilter:'blur(12px)',
              borderRadius:24, padding:'20px 32px', textAlign:'center', margin:'0 32px' }}>
              <p style={{ fontSize:16, color:'#374151', margin:0, lineHeight:1.8, fontStyle:'italic' }}>
                Antes de que existiera cualquier forma,<br/>había una intención.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOMBRE ── */}
      <AnimatePresence>
        {phase === 3 && (
          <motion.div key="name"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            transition={{ duration:0.8 }}
            style={{ position:'absolute', inset:0, zIndex:20,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', padding:'0 28px' }}>
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.85)', margin:'0 0 16px',
              fontStyle:'italic', textAlign:'center',
              textShadow:'0 2px 12px rgba(0,0,0,0.4)' }}>
              Dime cómo llamarte
            </p>
            <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:12 }}>
              <input
                value={form.name}
                onChange={e => { handleFirstInteraction(); set('name', e.target.value) }}
                placeholder="Mi nombre es…"
                autoFocus
                style={{
                  width:'100%', padding:'14px 18px', borderRadius:16,
                  border:'1.5px solid rgba(255,255,255,0.5)',
                  background:'rgba(255,255,255,0.18)',
                  backdropFilter:'blur(20px)',
                  fontSize:16, fontWeight:600, color:'white',
                  outline:'none', boxSizing:'border-box',
                }}
              />
              <AnimatePresence>
                {form.name && (
                  <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ fontSize:12, color:'rgba(255,255,255,0.75)', fontStyle:'italic',
                      textAlign:'center', margin:0, textShadow:'0 1px 8px rgba(0,0,0,0.4)' }}>
                    "{form.name}". Ese nombre será el primer latido. ✨
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.button whileTap={{ scale:0.97 }}
                onClick={proceedFromName}
                disabled={!form.name.trim()}
                style={{
                  width:'100%', padding:'14px 20px', borderRadius:16,
                  border:`1.5px solid ${form.name.trim() ? '#D4A84760' : 'rgba(255,255,255,0.2)'}`,
                  background: form.name.trim() ? 'rgba(212,168,71,0.25)' : 'rgba(255,255,255,0.08)',
                  backdropFilter:'blur(20px)',
                  color: form.name.trim() ? '#D4A847' : 'rgba(255,255,255,0.3)',
                  fontSize:15, fontWeight:700, cursor: form.name.trim() ? 'pointer' : 'default',
                }}>
                Continuar →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INVITACIÓN A TOCAR — antes de activar ── */}
      <AnimatePresence>
        {phase >= 4 && !orbActivated && (
          <motion.div
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            transition={{ duration:0.8, delay:1 }}
            style={{
              position:'fixed', bottom:80, left:0, right:0, zIndex:20,
              display:'flex', justifyContent:'center', pointerEvents:'none',
            }}>
            <div style={{
              background:'rgba(255,252,245,0.5)', backdropFilter:'blur(12px)',
              borderRadius:20, padding:'10px 24px', textAlign:'center',
            }}>
              <p style={{ fontSize:13, color:'#1A2332', margin:0, fontStyle:'italic' }}>
                Toca el orbe para despertarlo ✨
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {phase >= 4 && phase <= 9 && orbActivated && (
          <motion.div key="questions"
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ position:'absolute', inset:0, zIndex:20,
              display:'flex', flexDirection:'column',
              justifyContent:'space-between', padding:'0 0 44px' }}>

            {/* Texto arriba */}
            <div style={{ padding:'10% 28px 0', textAlign:'center' }}>
              <AnimatePresence mode="wait">
                <motion.div key={`qt-${qStep}`}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-8 }} transition={{ duration:0.35 }}
                  style={{ display:'inline-block',
                    background:'rgba(255,252,245,0.55)', backdropFilter:'blur(12px)',
                    borderRadius:20, padding:'12px 20px' }}>
                  <p style={{ fontSize:19, fontWeight:900, color:'#1A2332',
                    margin:'0 0 4px', lineHeight:1.3, whiteSpace:'pre-line' }}>
                    {currentQ.bold}
                  </p>
                  <p style={{ fontSize:13, color:'#4B5563', margin:0, fontStyle:'italic' }}>
                    {currentQ.sub}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Selector + feedback + botón */}
            <div style={{ padding:'0 20px', display:'flex', flexDirection:'column',
              gap:10, maxWidth:440, margin:'0 auto', width:'100%' }}>

              <AnimatePresence mode="wait">
                <motion.div key={`qs-${qStep}`}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0 }} transition={{ duration:0.25 }}>
                  <OptionCarousel
                    options={currentQ.options}
                    value={form[currentQ.key]}
                    onChange={v => handleAnswer(currentQ.key, v)}
                    energyColor={energyColor}
                  />
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {form[currentQ.key] && (
                  <motion.p initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    style={{ fontSize:12, color:'#4B5563', fontStyle:'italic', textAlign:'center', margin:0,
                      background:'rgba(255,252,245,0.5)', backdropFilter:'blur(8px)',
                      borderRadius:12, padding:'6px 14px' }}>
                    {currentQ.feedback}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Progreso */}
              <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                {QUESTIONS.map((_, i) => (
                  <motion.div key={i}
                    animate={{
                      width: i===qStep ? 22 : 6,
                      background: i<qStep ? '#2EC4B6' : i===qStep ? energyColor : 'rgba(255,255,255,0.25)',
                    }}
                    style={{ height:3, borderRadius:2 }}
                    transition={{ duration:0.3 }}
                  />
                ))}
              </div>

              <motion.button whileTap={{ scale: form[currentQ.key] ? 0.97 : 1 }}
                onClick={nextQuestion}
                disabled={!form[currentQ.key]}
                style={{
                  width:'100%', padding:'14px 20px', borderRadius:16,
                  border:`1.5px solid ${form[currentQ.key] ? energyColor+'60' : 'rgba(255,255,255,0.2)'}`,
                  background: form[currentQ.key] ? `${energyColor}25` : 'rgba(255,255,255,0.08)',
                  backdropFilter:'blur(20px)',
                  color: form[currentQ.key] ? energyColor : 'rgba(255,255,255,0.3)',
                  fontSize:15, fontWeight:700,
                  cursor: form[currentQ.key] ? 'pointer' : 'default',
                  boxShadow: form[currentQ.key] ? `0 4px 20px ${energyColor}30` : 'none',
                  transition:'all 0.3s',
                }}>
                {qStep === QUESTIONS.length - 1 ? '✨ Despertar a Pandi' : 'Continuar →'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NACIMIENTO ── */}
      <AnimatePresence>
        {phase === 10 && (
          <motion.div key="born-text"
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ duration:0.8, delay:0.5 }}
            style={{ position:'absolute', inset:0, zIndex:20,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'flex-end',
              padding:'0 28px 56px' }}>
            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:1 }}
              style={{ textAlign:'center', maxWidth:300 }}>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.55)',
                letterSpacing:'.12em', textTransform:'uppercase',
                margin:'0 0 12px', fontWeight:700 }}>
                ya estoy aquí
              </p>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.88)',
                lineHeight:2, margin:'0 0 28px', fontStyle:'italic',
                textShadow:'0 2px 16px rgba(0,0,0,0.4)' }}>
                "No soy una recompensa.<br/>
                Soy tu reflejo.<br/>
                Lo que ocurra conmigo<br/>
                dependerá de cómo<br/>
                te cuides a partir de hoy."
              </p>
              <motion.button
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.6 }}
                whileTap={{ scale:0.97 }}
                onClick={finish}
                disabled={loading}
                style={{
                  padding:'16px 44px', borderRadius:22,
                  background:'white', border:'none',
                  color:'#1A2332', fontSize:16, fontWeight:800,
                  cursor:'pointer', boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
                }}>
                {loading ? 'Un momento…' : 'Empezar a crecer juntos 🐾'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug */}
      {Object.keys(imgErrs).length > 0 && (
        <div style={{ position:'fixed', top:8, left:8, zIndex:100,
          background:'rgba(0,0,0,0.75)', borderRadius:8, padding:'5px 10px',
          fontSize:10, color:'#ff6b6b' }}>
          ❌ {Object.keys(imgErrs).join(', ')}
        </div>
      )}
    </div>
  )
}
